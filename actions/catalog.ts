"use server";

import { prisma } from "@/lib/prisma";

export async function getSuppliersLite() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return { success: true as const, data: suppliers };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message ?? "Failed to load suppliers",
    };
  }
}

export async function getProductsForSupplier(supplierId: string) {
  try {
    if (!supplierId) return { success: true as const, data: [] as any[] };

    const products = await prisma.supplierProduct.findMany({
      where: { supplierId, isActive: true },
      orderBy: { product: { name: "asc" } },
      select: {
        product: { select: { id: true, name: true, shortcut: true } },
      },
    });

    return {
      success: true as const,
      data: products.map((p) => p.product),
    };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message ?? "Failed to load products",
    };
  }
}

export async function getVariantsForSupplierProduct(input: {
  supplierId: string;
  productId: string;
}) {
  try {
    const { supplierId, productId } = input;
    if (!supplierId || !productId)
      return { success: true as const, data: [] as any[] };

    const variants = await prisma.productVariant.findMany({
      where: { supplierId, productId, isActive: true },
      orderBy: [{ size: "asc" }, { unit: "asc" }],
      select: {
        id: true,
        size: true,
        unit: true,
        price: true,
      },
    });

    return { success: true as const, data: variants };
  } catch (e: any) {
    return {
      success: false as const,
      error: e?.message ?? "Failed to load variants",
    };
  }
}
