"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function decToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (v instanceof Prisma.Decimal) return Number(v.toString());
  if (typeof v === "string") return Number(v);
  if (typeof v === "number") return v;
  return Number(v);
}

export type UIOrderDTO = {
  id: string;
  orderNumber: string;
  createdAt: string;
  subtotal: number;

  job: { id: string; jobNumber: string; siteName: string } | null;
  supplier: { id: string; name: string } | null;

  items: Array<{
    id: string;
    quantity: number;
    unit: string;
  }>;
};

export async function getAllOrdersDTO() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        job: {
          include: {
            supplier: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            supplier: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
            productOption: { include: { option: { include: { unit: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data: UIOrderDTO[] = orders.map((o: any) => {
      const supplier = o.job?.supplier ?? (o.items?.[0]?.supplier ?? null);

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toISOString(),
        subtotal: decToNumber(o.subtotal),

        job: o.job
          ? { id: o.job.id, jobNumber: o.job.jobNumber, siteName: o.job.siteName }
          : null,

        supplier: supplier ? { id: supplier.id, name: supplier.name } : null,

        items: (o.items ?? []).map((it: any) => ({
          id: it.id,
          quantity: decToNumber(it.quantity),
          unit: it.productOption && it.productOption.option
            ? `${it.productOption.option.value}${it.productOption.option.unit.code.toLowerCase()}`
            : "—",
        })),
      };
    });

    return { success: true, data };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed to fetch orders" };
  }
}
