"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function createOrder(
  orderNumber: string,
  jobId: string,
  items: Array<{
    productTypeId: string;
    quantity: number;
    unit: string;
  }>
) {
  // Validate input
  if (!orderNumber || !orderNumber.trim() || !jobId) {
    return { success: false, error: "Invalid order data" };
  }

  const validItems = items
    .map((it) => ({
      productTypeId: it.productTypeId,
      quantity: Number(it.quantity) || 0,
      unit: String(it.unit || "").trim(),
    }))
    .filter((it) => it.productTypeId && it.quantity > 0 && it.unit);

  if (validItems.length === 0) {
    return { success: false, error: "No valid order items provided" };
  }

  try {
    const order = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
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
            productTypeId: it.productTypeId,
            quantity: it.quantity,
            unit: it.unit,
          })),
        });

        // Re-fetch the order with items and productType relations
        const created = await tx.order.findUnique({
          where: { id: o.id },
          include: {
            items: { include: { productType: true } },
          },
        });

        return created;
      }
    );

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
            productType: true,
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
