"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
  quantity: number;
};

type CreateOrderInput = {
  jobId: string;
  orderNumber: string; // ✅ REQUIRED
  items: CreateOrderItemInput[];
};

function assertPositiveNumber(n: unknown, field: string) {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
}

function makeOrderNumber() {
  // simple, unique-enough: ORD-YYYYMMDD-HHMMSS-XYZ
  const d = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  const stamp =
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());

  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ORD-${stamp}-${rnd}`;
}

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
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
    if (!job) return { success: false as const, error: "Job not found" };

    const variantIds = [...new Set(input.items.map((x) => x.variantId))];

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        price: true,
        supplierId: true,
        productId: true,
        isActive: true,
      },
    });

    const variantById = new Map(variants.map((v) => [v.id, v]));

    const prepared = input.items.map((it, idx) => {
      const v = variantById.get(it.variantId);
      if (!v) throw new Error(`Item ${idx + 1}: variant not found`);
      if (!v.isActive) throw new Error(`Item ${idx + 1}: variant is inactive`);
      if (v.supplierId !== it.supplierId)
        throw new Error(`Item ${idx + 1}: supplierId does not match variant`);
      if (v.productId !== it.productId)
        throw new Error(`Item ${idx + 1}: productId does not match variant`);

      const unitPrice = typeof v.price === "number" ? v.price : 0;
      const qty = it.quantity;
      return {
        productId: it.productId,
        supplierId: it.supplierId,
        variantId: it.variantId,
        quantity: qty,
        unitPrice,
        lineTotal: unitPrice * qty,
      };
    });

    const subtotal = prepared.reduce((sum, x) => sum + x.lineTotal, 0);

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber.trim(), // ✅ required + unique
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

      return order;
    });

    revalidatePath("/orders");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/jobs");

    return { success: true as const, order: created };
  } catch (e: any) {
    // ✅ Prisma unique constraint (orderNumber unique)
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

export type GetAllOrdersResult =
  | { success: true; data: OrderWithRelations[]; error: null }
  | { success: false; data: null; error: string };

export async function getAllOrders(): Promise<GetAllOrdersResult> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        job: { include: { supplier: true } }, // ✅ gives job.supplier
        items: {
          include: {
            product: true,
            supplier: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: orders, error: null };
  } catch (e: any) {
    return {
      success: false,
      data: null,
      error: e?.message ?? "Failed to fetch orders",
    };
  }
}

export async function deleteOrder(orderId: string) {
  if (!orderId) {
    return { success: false as const, error: "orderId is required" };
  }
  try {
    // Delete order and its items in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { orderId },
      });
      await tx.order.delete({
        where: { id: orderId },
      });
    });
    return { success: true as const };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message ?? "Failed to delete order",
    };
  }
}
