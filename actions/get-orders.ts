import { prisma } from "@/lib/prisma";

export async function getAllOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      job: true,
      items: {
        include: {
          product: true,
          supplier: true,
          variant: true,
        },
      },
      // If you want supplier at order level, you may need to denormalize or pick from first item
    },
  });
  // Attach supplier at order level for compatibility
  return orders.map((order) => ({
    ...order,
    supplier: order.items[0]?.supplier ?? null,
  }));
}
