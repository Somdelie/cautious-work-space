"use server";

import { prisma } from "@/lib/prisma";

export type VariantSearchRow = {
  id: string;
  productId: string;
  supplierId: string;
  productName: string;
  supplierName: string;
  size: number;
  unit: string; // serialize enum for client
  price: string; // Decimal -> string
  sku: string | null;
};

export async function searchVariantsAction(input: {
  q: string;
  take?: number;
  cursor?: string | null;
}) {
  const take = input.take ?? 20;
  const q = input.q.trim();

  if (q.length < 2)
    return {
      success: true as const,
      data: [] as VariantSearchRow[],
      nextCursor: null as string | null,
    };

  // We page by variant.id (stable)
  const rows = await prisma.productOption.findMany({
    take: take + 1,
    ...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
    where: {
      isActive: true,
      OR: [
        {
          product: { name: { contains: q, mode: "insensitive" } },
        },
        {
          option: { value: { equals: Number(q) } },
        },
      ],
    },
    select: {
      id: true,
      productId: true,
      option: { select: { value: true, unit: true } },
      product: { select: { name: true } },
    },
    orderBy: { id: "asc" },
  });

  const nextCursor = rows.length > take ? rows[take].id : null;

  const data: VariantSearchRow[] = rows.slice(0, take).map((r: any) => ({
    id: r.id,
    productId: r.productId,
    supplierId: '', // Not available in productOption
    productName: r.product.name,
    supplierName: '', // Not available in productOption
    size: r.option.value,
    unit: String(r.option.unit),
    price: '', // Not available in productOption
    sku: '', // Not available in productOption
  }));

  return { success: true as const, data, nextCursor };
}
