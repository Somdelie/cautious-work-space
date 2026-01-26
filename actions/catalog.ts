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

/**
 * Returns a client-safe catalog:
 * - Products
 * - Options attached to product (ProductVariant -> option)
 * - Supplier prices for each product-option (SupplierVariantPrice)
 */
export async function getCatalogDTO(params?: { supplierId?: string }) {
  const supplierId = params?.supplierId;

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      supplierVariantPrices: supplierId
        ? {
            where: { supplierId },
            include: { productOption: { include: { option: { include: { unit: true } } } }, supplier: { select: { id: true, name: true } } },
          }
        : {
            include: { productOption: { include: { option: { include: { unit: true } } } }, supplier: { select: { id: true, name: true } } },
          },
      supplierProducts: {
        include: { supplier: { select: { id: true, name: true } } },
      },
    },
  });

  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    shortcut: p.shortcut ?? null,
    usageType: p.usageType,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),

    prices: (p.supplierVariantPrices ?? []).map((sp: any) => ({
      id: sp.id,
      supplier: { id: sp.supplier.id, name: sp.supplier.name },
      option: {
        id: sp.productOption.option.id,
        value: sp.productOption.option.value,
        label: sp.productOption.option.label?.trim() || `${sp.productOption.option.value}${sp.productOption.option.unit.code.toLowerCase()}`,
        unit: { id: sp.productOption.option.unit.id, code: sp.productOption.option.unit.code, name: sp.productOption.option.unit.name },
      },
      price: decToNumber(sp.price),
      sku: sp.sku ?? null,
      isActive: sp.isActive,
      updatedAt: sp.updatedAt.toISOString(),
    })),
  }));

  return { success: true, data };
}
