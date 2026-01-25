"use server";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

/** helpers */
function d(n: number | string | Decimal) {
  if (n instanceof Decimal) return n;
  return new Decimal(n);
}
function toMoney(x: Decimal) {
  // keep 2dp (Decimal(12,2) will store it correctly; this is just defensive)
  return x.toDecimalPlaces(2);
}

/**
 * Ensure a JobCostSummary row exists for a job.
 */
async function ensureSummary(tx: any, jobId: string) {
  await tx.jobCostSummary.upsert({
    where: { jobId },
    create: { jobId },
    update: {},
  });
}

/**
 * Apply a delta to summary based on cost type.
 */
async function applySummaryDelta(
  tx: any,
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

  // ADJUSTMENT: you decide where it applies.
  // Default: affect actual total only.
  await tx.jobCostSummary.update({
    where: { jobId },
    data: { totalActual: { increment: delta } },
  });
}

/**
 * Writes a ledger entry and updates the cached summary in the same transaction.
 */
async function writeCost(
  tx: any,
  input: {
    jobId: string;
    type:
      | "MATERIAL_ACTUAL"
      | "MATERIAL_ESTIMATE"
      | "LABOR_ACTUAL"
      | "ADJUSTMENT";
    source: "ORDER_ITEM" | "JOB_PRODUCT" | "TIMESHEET" | "MANUAL";
    sourceId?: string | null;
    amount: Decimal; // positive/negative
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
 * ===========================
 * ORDER ITEM COSTING (Actual materials)
 * ===========================
 */

/**
 * Create an order item:
 * - server reads variant price (authoritative)
 * - computes lineTotal
 * - updates Order.subtotal
 * - writes ledger entry (+lineTotal)
 * - updates JobCostSummary
 */
export async function addOrderItem(input: {
  orderId: string;
  variantId: string;
  quantity: number;
}) {
  if (!input.orderId || !input.variantId) {
    return { success: false, error: "Missing orderId/variantId" };
  }
  if (!(input.quantity > 0)) {
    return { success: false, error: "Quantity must be > 0" };
  }

  try {
    const res = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        select: { id: true, jobId: true },
      });
      if (!order) throw new Error("Order not found");

      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        select: { id: true, price: true, productId: true, supplierId: true },
      });
      if (!variant) throw new Error("Variant not found");

      const qty = d(input.quantity);
      const unitPrice = variant.price;
      const lineTotal = toMoney(qty.mul(unitPrice));

      const item = await tx.orderItem.create({
        data: {
          orderId: order.id,
          variantId: variant.id,
          productId: variant.productId,
          supplierId: variant.supplierId,
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

/**
 * Update an order item quantity:
 * - recompute lineTotal using stored unitPrice (or optionally re-read variant price)
 * - delta = new - old
 * - update Order.subtotal += delta
 * - ledger entry amount = delta
 * - summary += delta
 */
export async function updateOrderItemQuantity(input: {
  orderItemId: string;
  quantity: number;
}) {
  if (!input.orderItemId)
    return { success: false, error: "Missing orderItemId" };
  if (!(input.quantity > 0))
    return { success: false, error: "Quantity must be > 0" };

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

      // no-op
      if (delta.equals(0)) return { updated: existing, delta };

      const updated = await tx.orderItem.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          lineTotal: newLineTotal,
        },
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
        amount: delta, // can be + or -
        note: "Order item quantity updated",
      });

      return { updated, delta };
    });

    return { success: true, data: res };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message ?? "Failed to update order item",
    };
  }
}

/**
 * Delete an order item:
 * - delta = -oldLineTotal
 * - update Order.subtotal += delta
 * - ledger entry amount = delta (negative)
 * - summary += delta
 */
export async function deleteOrderItem(input: { orderItemId: string }) {
  if (!input.orderItemId)
    return { success: false, error: "Missing orderItemId" };

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

      const delta = toMoney(existing.lineTotal.mul(new Decimal(-1)));

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
    return {
      success: false,
      error: e?.message ?? "Failed to delete order item",
    };
  }
}

/**
 * ===========================
 * TIMESHEETS (Actual labor)
 * ===========================
 */

export async function createTimesheetEntry(input: {
  jobId: string;
  workerName: string;
  date: Date;
  hours: number;
  rate: number;
  note?: string;
}) {
  if (!input.jobId) return { success: false, error: "Missing jobId" };
  if (!input.workerName.trim())
    return { success: false, error: "Worker name is required" };
  if (!(input.hours > 0)) return { success: false, error: "Hours must be > 0" };
  if (!(input.rate >= 0)) return { success: false, error: "Rate must be >= 0" };

  try {
    const res = await prisma.timesheetEntry.create({
      data: {
        jobId: input.jobId,
        workerName: input.workerName.trim(),
        date: input.date,
        hours: d(input.hours),
        rate: d(input.rate),
        cost: new Decimal(0),
        status: "PENDING",
        note: input.note?.trim() || null,
      },
    });
    return { success: true, data: res };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message ?? "Failed to create timesheet entry",
    };
  }
}

export async function approveTimesheetEntry(input: {
  timesheetId: string;
  approvedByUserId?: string;
}) {
  if (!input.timesheetId)
    return { success: false, error: "Missing timesheetId" };

  try {
    const res = await prisma.$transaction(async (tx) => {
      const t = await tx.timesheetEntry.findUnique({
        where: { id: input.timesheetId },
        select: {
          id: true,
          jobId: true,
          hours: true,
          rate: true,
          status: true,
          cost: true,
        },
      });
      if (!t) throw new Error("Timesheet not found");

      if (t.status === "APPROVED") {
        return { alreadyApproved: true };
      }

      const cost = toMoney(t.hours.mul(t.rate));

      await tx.timesheetEntry.update({
        where: { id: t.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: input.approvedByUserId ?? null,
          cost,
        },
      });

      await writeCost(tx, {
        jobId: t.jobId,
        type: "LABOR_ACTUAL",
        source: "TIMESHEET",
        sourceId: t.id,
        amount: cost,
        note: "Timesheet approved",
      });

      return { approved: true, cost };
    });

    return { success: true, data: res };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message ?? "Failed to approve timesheet",
    };
  }
}

/**
 * Optional but professional: allow unapprove (creates negative delta ledger entry)
 */
export async function unapproveTimesheetEntry(input: { timesheetId: string }) {
  if (!input.timesheetId)
    return { success: false, error: "Missing timesheetId" };

  try {
    const res = await prisma.$transaction(async (tx) => {
      const t = await tx.timesheetEntry.findUnique({
        where: { id: input.timesheetId },
        select: { id: true, jobId: true, status: true, cost: true },
      });
      if (!t) throw new Error("Timesheet not found");
      if (t.status !== "APPROVED") throw new Error("Timesheet is not approved");

      const delta = toMoney(t.cost.mul(new Decimal(-1)));

      await tx.timesheetEntry.update({
        where: { id: t.id },
        data: {
          status: "PENDING",
          approvedAt: null,
          approvedBy: null,
          cost: new Decimal(0),
        },
      });

      await writeCost(tx, {
        jobId: t.jobId,
        type: "LABOR_ACTUAL",
        source: "TIMESHEET",
        sourceId: t.id,
        amount: delta,
        note: "Timesheet unapproved (reversed)",
      });

      return { reversed: true, delta };
    });

    return { success: true, data: res };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message ?? "Failed to unapprove timesheet",
    };
  }
}

/**
 * ===========================
 * ESTIMATED MATERIALS (JobProducts)
 * ===========================
 *
 * Professional approach:
 * - JobProduct stores estimateVariantId and estimateUnitPrice snapshot.
 * - Recalculate estimate sums quantity * estimateUnitPrice for all job products where both exist.
 * - We store the delta in summary and write an audit ledger entry as an ADJUSTMENT (or MATERIAL_ESTIMATE).
 *
 * Best: MATERIAL_ESTIMATE as a "snapshot recalculation delta".
 */
export async function recalcJobMaterialsEstimate(jobId: string) {
  if (!jobId) return { success: false, error: "Missing jobId" };

  try {
    const res = await prisma.$transaction(async (tx) => {
      await ensureSummary(tx, jobId);

      const current = await tx.jobCostSummary.findUnique({
        where: { jobId },
        select: { materialsEstimate: true, totalEstimate: true },
      });
      const currentEstimate = current?.materialsEstimate ?? new Decimal(0);

      const items = await tx.jobProduct.findMany({
        where: { jobId },
        select: { quantity: true, estimateUnitPrice: true },
      });

      let nextEstimate = new Decimal(0);
      for (const it of items) {
        if (!it.quantity || !it.estimateUnitPrice) continue;
        nextEstimate = nextEstimate.add(it.quantity.mul(it.estimateUnitPrice));
      }
      nextEstimate = toMoney(nextEstimate);

      const delta = toMoney(nextEstimate.sub(currentEstimate));

      // set summary to exact values (more robust than increment for recalcs)
      await tx.jobCostSummary.update({
        where: { jobId },
        data: {
          materialsEstimate: nextEstimate,
          totalEstimate: nextEstimate, // you can later add labor estimate too
        },
      });

      // ledger entry records the recalculation delta for audit
      if (!delta.equals(0)) {
        await tx.jobCostEntry.create({
          data: {
            jobId,
            type: "MATERIAL_ESTIMATE",
            source: "JOB_PRODUCT",
            sourceId: null,
            amount: delta,
            note: "Materials estimate recalculated (delta)",
          },
        });
      }

      return { nextEstimate, delta };
    });

    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to recalc estimate" };
  }
}
