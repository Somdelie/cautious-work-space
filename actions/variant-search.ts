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
  const rows = await prisma.productVariant.findMany({
    take: take + 1,
    ...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
    where: {
      isActive: true,
      OR: [
        { sku: { contains: q, mode: "insensitive" } },
        {
          supplierProduct: {
            product: { name: { contains: q, mode: "insensitive" } },
          },
        },
        {
          supplierProduct: {
            supplier: { name: { contains: q, mode: "insensitive" } },
          },
        },
      ],
    },
    select: {
      id: true,
      size: true,
      unit: true,
      price: true,
      sku: true,
      productId: true,
      supplierId: true,
      supplierProduct: {
        select: {
          product: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const nextCursor = rows.length > take ? rows[take].id : null;

  const data: VariantSearchRow[] = rows.slice(0, take).map((r) => ({
    id: r.id,
    productId: r.productId,
    supplierId: r.supplierId,
    productName: r.supplierProduct.product.name,
    supplierName: r.supplierProduct.supplier.name,
    size: r.size,
    unit: String(r.unit),
    price: r.price.toString(),
    sku: r.sku,
  }));

  return { success: true as const, data, nextCursor };
}
