"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { revalidatePath } from "next/cache";

/**
 * ===========================
 * Types
 * ===========================
 */

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    job: { include: { supplier: true } };
    items: {
      include: {
        product: true;
        supplier: true;
        variant: true;
      };
    };
  };
}>;

type CreateOrderItemInput = {
  productId: string;
  supplierId: string;
  variantId: string;
  quantity: number; // UI sends number, server converts to Decimal
};

type CreateOrderInput = {
  jobId: string;
  orderNumber: string; // REQUIRED
  items: CreateOrderItemInput[];
};

/**
 * ===========================
 * Helpers
 * ===========================
 */

function assertPositiveNumber(n: unknown, field: string) {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
}

// Decimal helpers
const D = (v: number | string | Decimal) =>
  v instanceof Decimal ? v : new Decimal(v);
const money = (v: Decimal) => v.toDecimalPlaces(2); // keep 2dp

async function ensureSummary(tx: Prisma.TransactionClient, jobId: string) {
  await tx.jobCostSummary.upsert({
    where: { jobId },
    create: { jobId },
    update: {},
  });
}

async function applySummaryDelta(
  tx: Prisma.TransactionClient,
  jobId: string,
  type: "MATERIAL_ACTUAL" | "MATERIAL_ESTIMATE" | "LABOR_ACTUAL" | "ADJUSTMENT",
  delta: Decimal,
) {
  await ensureSummary(tx, jobId);

  if (type === "MATERIAL_ACTUAL") {
    await tx.jobCostSummary.update({
      where: { jobId },
      data: {
        materialsActual: { increment: delta },
        totalActual: { increment: delta },
      },
    });
    return;
  }

  if (type === "LABOR_ACTUAL") {
    await tx.jobCostSummary.update({
      where: { jobId },
      data: {
        laborActual: { increment: delta },
        totalActual: { increment: delta },
      },
    });
    return;
  }

  if (type === "MATERIAL_ESTIMATE") {
    await tx.jobCostSummary.update({
      where: { jobId },
      data: {
        materialsEstimate: { increment: delta },
        totalEstimate: { increment: delta },
      },
    });
    return;
  }

  // ADJUSTMENT default -> affects actual
  await tx.jobCostSummary.update({
    where: { jobId },
    data: { totalActual: { increment: delta } },
  });
}

async function writeCost(
  tx: Prisma.TransactionClient,
  input: {
    jobId: string;
    type:
      | "MATERIAL_ACTUAL"
      | "MATERIAL_ESTIMATE"
      | "LABOR_ACTUAL"
      | "ADJUSTMENT";
    source: "ORDER_ITEM" | "JOB_PRODUCT" | "TIMESHEET" | "MANUAL";
    sourceId?: string | null;
    amount: Decimal; // +/- money
    note?: string | null;
  },
) {
  const amt = money(input.amount);

  await tx.jobCostEntry.create({
    data: {
      jobId: input.jobId,
      type: input.type,
      source: input.source,
      sourceId: input.sourceId ?? null,
      amount: amt,
      note: input.note ?? null,
    },
  });

  await applySummaryDelta(tx, input.jobId, input.type, amt);
}

/**
 * ===========================
 * Create Order (professional)
 * - Server is authoritative on unit prices (reads from ProductVariant.price)
 * - Uses Decimal for all money math
 * - Writes JobCostEntry per OrderItem and increments JobCostSummary
 * ===========================
 */

export async function createOrderForJob(input: CreateOrderInput) {
  const { jobId, orderNumber } = input;

  if (!jobId) return { success: false as const, error: "jobId is required" };
  if (!orderNumber?.trim())
    return { success: false as const, error: "orderNumber is required" };

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { success: false as const, error: "At least 1 item is required" };
  }

  for (const [i, it] of input.items.entries()) {
    if (!it.productId || !it.supplierId || !it.variantId) {
      return {
        success: false as const,
        error: `Item ${i + 1}: productId, supplierId, variantId are required`,
      };
    }
    try {
      assertPositiveNumber(it.quantity, `Item ${i + 1} quantity`);
    } catch (e: any) {
      return { success: false as const, error: e?.message ?? "Bad quantity" };
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // validate job exists
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true },
      });
      if (!job) throw new Error("Job not found");

      // fetch variants (authoritative prices)
      const variantIds = [...new Set(input.items.map((x) => x.variantId))];
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          price: true, // Decimal
          supplierId: true,
          productId: true,
          isActive: true,
        },
      });
      const variantById = new Map(variants.map((v) => [v.id, v]));

      // prepare items w/ server pricing
      const prepared = input.items.map((it, idx) => {
        const v = variantById.get(it.variantId);
        if (!v) throw new Error(`Item ${idx + 1}: variant not found`);
        if (!v.isActive)
          throw new Error(`Item ${idx + 1}: variant is inactive`);
        if (v.supplierId !== it.supplierId)
          throw new Error(`Item ${idx + 1}: supplierId does not match variant`);
        if (v.productId !== it.productId)
          throw new Error(`Item ${idx + 1}: productId does not match variant`);

        const qty = D(it.quantity);
        const unitPrice = v.price;
        const lineTotal = money(qty.mul(unitPrice));

        return {
          productId: it.productId,
          supplierId: it.supplierId,
          variantId: it.variantId,
          quantity: qty,
          unitPrice,
          lineTotal,
        };
      });

      const subtotal = money(
        prepared.reduce((sum, x) => sum.add(x.lineTotal), new Decimal(0)),
      );

      // create order
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber.trim(),
          jobId,
          subtotal,
        },
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          createdAt: true,
        },
      });

      // create items (use createMany for speed)
      await tx.orderItem.createMany({
        data: prepared.map((x) => ({
          orderId: order.id,
          productId: x.productId,
          supplierId: x.supplierId,
          variantId: x.variantId,
          quantity: x.quantity,
          unitPrice: x.unitPrice,
          lineTotal: x.lineTotal,
        })),
      });

      // IMPORTANT: create costing entries per item
      // Since createMany doesn't return IDs, fetch created items IDs once.
      const createdItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
        select: { id: true, lineTotal: true },
      });

      // Ensure summary row exists
      await ensureSummary(tx, jobId);

      // Ledger entries + summary increments
      for (const item of createdItems) {
        await writeCost(tx, {
          jobId,
          type: "MATERIAL_ACTUAL",
          source: "ORDER_ITEM",
          sourceId: item.id,
          amount: item.lineTotal,
          note: `Order ${order.orderNumber} item added`,
        });
      }

      return order;
    });

    revalidatePath("/orders");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/jobs");

    return { success: true as const, order: created };
  } catch (e: any) {
    if (e?.code === "P2002") {
      return {
        success: false as const,
        error: "Order number already exists. Use a different order number.",
      };
    }
    return {
      success: false as const,
      error: e?.message ?? "Failed to create order",
    };
  }
}

/**
 * ===========================
 * Get Orders
 * ===========================
 */

export type GetAllOrdersResult =
  | { success: true; data: OrderWithRelations[]; error: null }
  | { success: false; data: null; error: string };

export async function getAllOrders(): Promise<GetAllOrdersResult> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        job: { include: { supplier: true } },
        items: { include: { product: true, supplier: true, variant: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Recursively convert Decimal.js objects to numbers in subtotal and any other Decimal fields
    function serializeOrder(order: any) {
      return {
        ...order,
        subtotal:
          typeof order.subtotal === "object" &&
          order.subtotal !== null &&
          typeof order.subtotal.toNumber === "function"
            ? order.subtotal.toNumber()
            : order.subtotal,
        items: (order.items || []).map((item: any) => ({
          ...item,
          quantity:
            typeof item.quantity === "object" &&
            item.quantity !== null &&
            typeof item.quantity.toNumber === "function"
              ? item.quantity.toNumber()
              : item.quantity,
          lineTotal:
            typeof item.lineTotal === "object" &&
            item.lineTotal !== null &&
            typeof item.lineTotal.toNumber === "function"
              ? item.lineTotal.toNumber()
              : item.lineTotal,
        })),
      };
    }
    const safeOrders = orders.map(serializeOrder);
    return { success: true, data: safeOrders, error: null };
  } catch (e: any) {
    return {
      success: false,
      data: null,
      error: e?.message ?? "Failed to fetch orders",
    };
  }
}

/**
 * ===========================
 * Delete Order (professional)
 * - Must reverse job costs and summary totals
 * - Must keep audit trail (negative entries)
 * ===========================
 */

export async function deleteOrder(orderId: string) {
  if (!orderId)
    return { success: false as const, error: "orderId is required" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          jobId: true,
          orderNumber: true,
          subtotal: true,
          items: { select: { id: true, lineTotal: true } },
        },
      });
      if (!order) throw new Error("Order not found");

      await ensureSummary(tx, order.jobId);

      // reverse each order item cost with negative ledger entry
      for (const it of order.items) {
        const delta = money(it.lineTotal.mul(new Decimal(-1)));
        await writeCost(tx, {
          jobId: order.jobId,
          type: "MATERIAL_ACTUAL",
          source: "ORDER_ITEM",
          sourceId: it.id,
          amount: delta,
          note: `Order ${order.orderNumber} deleted (reversal)`,
        });
      }

      // delete items + order
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });

      return { jobId: order.jobId };
    });

    revalidatePath("/orders");
    revalidatePath(`/jobs/${result.jobId}`);
    revalidatePath("/jobs");

    return { success: true as const };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message ?? "Failed to delete order",
    };
  }
}
