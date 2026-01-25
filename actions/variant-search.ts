// src/actions/variant-search.ts
"use server";

import { prisma } from "@/lib/prisma";

export type VariantSearchRow = {
  id: string;
  productId: string;
  supplierId: string;

  productName: string;
  supplierName: string;

  size: number;
  unit: string;
  price: number;
  sku: string | null;
};

export async function searchVariantsAction(input: {
  q: string;
  take?: number;
  cursor?: string | null;
}) {
  const q = input.q.trim();
  const take = Math.min(Math.max(input.take ?? 20, 5), 50);
  const cursor = input.cursor ?? null;

  if (q.length < 2) {
    return {
      success: true as const,
      data: [] as VariantSearchRow[],
      nextCursor: null as string | null,
    };
  }

  const rows = await prisma.productVariant.findMany({
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
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      productId: true,
      supplierId: true,
      size: true,
      unit: true,
      price: true,
      sku: true,
      supplierProduct: {
        select: {
          product: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      },
    },
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return {
    success: true as const,
    data: page.map((v) => ({
      id: v.id,
      productId: v.productId,
      supplierId: v.supplierId,
      productName: v.supplierProduct.product.name,
      supplierName: v.supplierProduct.supplier.name,
      size: v.size,
      unit: String(v.unit),
      price: v.price,
      sku: v.sku,
    })),
    nextCursor,
  };
}
