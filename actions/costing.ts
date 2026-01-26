"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/** helpers */
function d(n: number | string | Prisma.Decimal) {
  if (n instanceof Prisma.Decimal) return n;
  return new Prisma.Decimal(n);
}
function toMoney(x: Prisma.Decimal) {
  return x.toDecimalPlaces(2);
}

async function ensureSummary(tx: any, jobId: string) {
  await tx.jobCostSummary.upsert({
    where: { jobId },
    create: { jobId },
    update: {},
  });
}

async function applySummaryDelta(
  tx: any,
  jobId: string,
  type: "MATERIAL_ACTUAL" | "MATERIAL_ESTIMATE" | "LABOR_ACTUAL" | "ADJUSTMENT",
  delta: Prisma.Decimal,
) {
  await ensureSummary(tx, jobId);

  if (type === "MATERIAL_ACTUAL") {
    await tx.jobCostSummary.update({
      where: { jobId },
      data: { materialsActual: { increment: delta }, totalActual: { increment: delta } },
    });
    return;
  }

  if (type === "LABOR_ACTUAL") {
    await tx.jobCostSummary.update({
      where: { jobId },
      data: { laborActual: { increment: delta }, totalActual: { increment: delta } },
    });
    return;
  }

  if (type === "MATERIAL_ESTIMATE") {
    await tx.jobCostSummary.update({
      where: { jobId },
      data: { materialsEstimate: { increment: delta }, totalEstimate: { increment: delta } },
    });
    return;
  }

  await tx.jobCostSummary.update({
    where: { jobId },
    data: { totalActual: { increment: delta } },
  });
}

async function writeCost(
  tx: any,
  input: {
    jobId: string;
    type: "MATERIAL_ACTUAL" | "MATERIAL_ESTIMATE" | "LABOR_ACTUAL" | "ADJUSTMENT";
    source: "ORDER_ITEM" | "JOB_PRODUCT" | "TIMESHEET" | "MANUAL";
    sourceId?: string | null;
    amount: Prisma.Decimal;
    note?: string | null;
  },
) {
  const amt = toMoney(input.amount);

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
 * ORDER ITEMS (Actual materials)
 * Schema now uses optionId instead of variantId for pricing.
 */
export async function addOrderItem(input: {
  orderId: string;
  productId: string;
  supplierId: string;
  optionId: string;
  quantity: number;
}) {
  if (!input.orderId || !input.productId || !input.supplierId || !input.optionId) {
    return { success: false, error: "Missing ids" };
  }
  if (!(input.quantity > 0)) return { success: false, error: "Quantity must be > 0" };

  try {
    const res = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        select: { id: true, jobId: true },
      });
      if (!order) throw new Error("Order not found");

      // supplier price for this product+option (authoritative)
      const sp = await tx.supplierVariantPrice.findUnique({
        where: {
          supplierId_productOptionId: {
            supplierId: input.supplierId,
            productOptionId: input.optionId,
          },
        },
        select: { price: true },
      });
      if (!sp) throw new Error("No supplier price set for this option");

      const qty = d(input.quantity);
      const unitPrice = sp.price;
      const lineTotal = toMoney(qty.mul(unitPrice));

      const item = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: input.productId,
          supplierId: input.supplierId,
          productOptionId: input.optionId,
          quantity: qty,
          unitPrice,
          lineTotal,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { subtotal: { increment: lineTotal } },
      });

      await writeCost(tx, {
        jobId: order.jobId,
        type: "MATERIAL_ACTUAL",
        source: "ORDER_ITEM",
        sourceId: item.id,
        amount: lineTotal,
        note: "Order item added",
      });

      return item;
    });

    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to add order item" };
  }
}

export async function updateOrderItemQuantity(input: { orderItemId: string; quantity: number }) {
  if (!input.orderItemId) return { success: false, error: "Missing orderItemId" };
  if (!(input.quantity > 0)) return { success: false, error: "Quantity must be > 0" };

  try {
    const res = await prisma.$transaction(async (tx) => {
      const existing = await tx.orderItem.findUnique({
        where: { id: input.orderItemId },
        select: {
          id: true,
          orderId: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          order: { select: { jobId: true } },
        },
      });
      if (!existing) throw new Error("Order item not found");

      const newQty = d(input.quantity);
      const newLineTotal = toMoney(newQty.mul(existing.unitPrice));
      const delta = toMoney(newLineTotal.sub(existing.lineTotal));

      if (delta.equals(0)) return { updated: existing, delta };

      const updated = await tx.orderItem.update({
        where: { id: existing.id },
        data: { quantity: newQty, lineTotal: newLineTotal },
      });

      await tx.order.update({
        where: { id: existing.orderId },
        data: { subtotal: { increment: delta } },
      });

      await writeCost(tx, {
        jobId: existing.order.jobId,
        type: "MATERIAL_ACTUAL",
        source: "ORDER_ITEM",
        sourceId: existing.id,
        amount: delta,
        note: "Order item quantity updated",
      });

      return { updated, delta };
    });

    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to update order item" };
  }
}

export async function deleteOrderItem(input: { orderItemId: string }) {
  if (!input.orderItemId) return { success: false, error: "Missing orderItemId" };

  try {
    const res = await prisma.$transaction(async (tx) => {
      const existing = await tx.orderItem.findUnique({
        where: { id: input.orderItemId },
        select: {
          id: true,
          orderId: true,
          lineTotal: true,
          order: { select: { jobId: true } },
        },
      });
      if (!existing) throw new Error("Order item not found");

      const delta = toMoney(existing.lineTotal.mul(new Prisma.Decimal(-1)));

      await tx.orderItem.delete({ where: { id: existing.id } });

      await tx.order.update({
        where: { id: existing.orderId },
        data: { subtotal: { increment: delta } },
      });

      await writeCost(tx, {
        jobId: existing.order.jobId,
        type: "MATERIAL_ACTUAL",
        source: "ORDER_ITEM",
        sourceId: existing.id,
        amount: delta,
        note: "Order item deleted",
      });

      return { deletedId: existing.id, delta };
    });

    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to delete order item" };
  }
}
