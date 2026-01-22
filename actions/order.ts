"use server";

import { prisma } from "@/lib/prisma";

export async function createOrder(
  orderNumber: string,
  jobId: string,
  items: Array<{
    productId: string;
    supplierId: string;
    variantId: string;
    quantity: number;
    unit: string;
    unitPrice?: number;
    lineTotal?: number;
  }>,
) {
  // Validate input
  if (!orderNumber || !orderNumber.trim() || !jobId) {
    return { success: false, error: "Invalid order data" };
  }

  const validItems = items
    .map((it) => ({
      productId: it.productId,
      supplierId: it.supplierId,
      variantId: it.variantId,
      quantity: Number(it.quantity) || 0,
      unit: String(it.unit || "").trim(),
      unitPrice: typeof it.unitPrice === "number" ? it.unitPrice : 0,
      lineTotal: typeof it.lineTotal === "number" ? it.lineTotal : 0,
    }))
    .filter(
      (it) =>
        it.productId &&
        it.supplierId &&
        it.variantId &&
        it.quantity > 0 &&
        it.unit,
    );

  if (validItems.length === 0) {
    return { success: false, error: "No valid order items provided" };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          jobId,
        },
      });

      // Use createMany for efficient insertion of multiple items
      await tx.orderItem.createMany({
        data: validItems.map((it) => ({
          orderId: o.id,
          productId: it.productId,
          supplierId: it.supplierId,
          variantId: it.variantId,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
        })),
      });

      // Re-fetch the order with items and product, supplier, variant relations
      const created = await tx.order.findUnique({
        where: { id: o.id },
        include: {
          items: {
            include: {
              product: true,
              supplier: true,
              variant: true,
            },
          },
        },
      });

      return created;
    });

    return { success: true, data: order };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export async function getJobOrders(jobId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { jobId },
      include: {
        items: {
          include: {
            product: true,
            supplier: true,
            variant: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: orders };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await prisma.order.delete({
      where: { id: orderId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}
