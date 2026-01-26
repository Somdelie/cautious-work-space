"use server";

import { prisma } from "@/lib/prisma";

/**
 * Helpers
 */
function normCode(code: string) {
  return String(code || "")
    .trim()
    .toUpperCase();
}
function safeNumber(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : NaN;
}

/**
 * ===========================
 * UNITS
 * ===========================
 */

export async function ensureUnit(input: { code: string; name?: string | null }) {
  try {
    const code = normCode(input.code);
    if (!code) return { success: false as const, data: null, error: "Unit code is required" };

    const name = (input.name?.trim() || code) as string;

    const unit = await prisma.unit.upsert({
      where: { code },
      create: { code, name },
      update: { name },
      select: { id: true, code: true, name: true },
    });

    return { success: true as const, data: unit, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Failed to ensure unit" };
  }
}

export async function getUnits() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });
    return { success: true as const, data: units, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Failed to fetch units" };
  }
}

/**
 * ===========================
 * GLOBAL OPTIONS (ProductVariantOption)
 * (value + unitId is unique)
 * ===========================
 */

/**
 * Creates (or returns existing) ProductVariantOption by (value + unitCode)
 * - also ensures Unit exists
 */
export async function createProductOption(input: {
  value: number;
  unitCode: string; // "MM", "L", "KG", "EA", ...
  unitName?: string | null; // optional human name
  label?: string | null; // optional display label e.g. "24mm"
}) {
  try {
    const value = safeNumber(input.value);
    const unitCode = normCode(input.unitCode);

    if (!Number.isFinite(value) || value <= 0) {
      return { success: false as const, data: null, error: "value must be > 0" };
    }
    if (!unitCode) {
      return { success: false as const, data: null, error: "unitCode is required" };
    }

    const unitRes = await ensureUnit({ code: unitCode, name: input.unitName ?? null });
    if (!unitRes.success || !unitRes.data) return { success: false as const, data: null, error: unitRes.error };

    const unitId = unitRes.data.id;
    const label = input.label?.trim() || null;

    const option = await prisma.productVariantOption.upsert({
      where: { value_unitId: { value, unitId } }, // requires @@unique([value, unitId])
      create: { value, unitId, label },
      update: { label },
      select: {
        id: true,
        value: true,
        label: true,
        unit: { select: { id: true, code: true, name: true } },
      },
    });

    return { success: true as const, data: option, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Failed to create option" };
  }
}

/**
 * Search global options by unitCode/value/label
 */
export async function searchProductOptions(input: {
  q?: string;
  unitCode?: string;
  take?: number;
}) {
  try {
    const q = (input.q || "").trim().toLowerCase();
    const unitCode = input.unitCode ? normCode(input.unitCode) : null;
    const take = Math.min(Math.max(input.take ?? 30, 1), 100);

    const rows = await prisma.productVariantOption.findMany({
      where: {
        ...(unitCode
          ? { unit: { code: unitCode } }
          : {}),
        ...(q
          ? {
              OR: [
                { label: { contains: q, mode: "insensitive" } },
                // value as string match
                { value: { equals: safeNumber(q) } as any }, // harmless fallback; if NaN it won't match
              ],
            }
          : {}),
      },
      take,
      orderBy: [{ unitId: "asc" }, { value: "asc" }],
      select: {
        id: true,
        value: true,
        label: true,
        unit: { select: { code: true } },
      },
    });

    const data = rows.map((r) => ({
      id: r.id,
      label: r.label || `${r.value}${r.unit.code}`,
      value: r.value,
      unitCode: r.unit.code,
    }));

    return { success: true as const, data, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Search failed" };
  }
}

/**
 * ===========================
 * PRODUCT ⇄ OPTION JOIN (ProductOption)
 * This join id is what you call `productOptionId`
 * ===========================
 */

export async function addOptionToProduct(input: { productId: string; optionId: string }) {
  if (!input.productId || !input.optionId) {
    return { success: false as const, data: null, error: "productId and optionId are required" };
  }

  try {
    const join = await prisma.productOption.create({
      data: { productId: input.productId, optionId: input.optionId },
      select: { id: true, productId: true, optionId: true },
    });
    return { success: true as const, data: join, error: null };
  } catch (e: any) {
    // Unique constraint should exist on (productId, optionId)
    if (e?.code === "P2002") {
      // already exists -> fetch it
      const existing = await prisma.productOption.findFirst({
        where: { productId: input.productId, optionId: input.optionId },
        select: { id: true, productId: true, optionId: true },
      });
      return { success: true as const, data: existing, error: null };
    }
    return { success: false as const, data: null, error: e?.message ?? "Failed to add option to product" };
  }
}

export async function removeOptionFromProduct(input: { productOptionId: string }) {
  if (!input.productOptionId) return { success: false as const, error: "productOptionId is required" };
  try {
    await prisma.productOption.delete({ where: { id: input.productOptionId } });
    return { success: true as const };
  } catch (e: any) {
    return { success: false as const, error: e?.message ?? "Failed to remove option" };
  }
}

/**
 * List options attached to a product (client safe)
 */
export async function getProductOptions(input: { productId: string }) {
  if (!input.productId) return { success: false as const, data: null, error: "productId is required" };

  try {
    const joins = await prisma.productOption.findMany({
      where: { productId: input.productId },
      select: {
        id: true, // productOptionId
        option: {
          select: {
            id: true,
            value: true,
            label: true,
            unit: { select: { code: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" as any }, // if you have createdAt on ProductOption; otherwise remove
    });

    const data = joins.map((j) => ({
      productOptionId: j.id,
      optionId: j.option.id,
      label: j.option.label || `${j.option.value}${j.option.unit.code}`,
      value: j.option.value,
      unitCode: j.option.unit.code,
    }));

    return { success: true as const, data, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Failed to fetch product options" };
  }
}

/**
 * ===========================
 * SUPPLIER PRICES (SupplierVariantPrice)
 * Key: (supplierId, productOptionId)
 * ===========================
 */

export async function setSupplierPriceForProductOption(input: {
  supplierId: string;
  productId: string;
  productOptionId: string;
  unitPrice: number;
  sku?: string | null;
  isActive?: boolean;
}) {
  try {
    if (!input.supplierId || !input.productId || !input.productOptionId) {
      return { success: false as const, data: null, error: "Missing supplierId/productId/productOptionId" };
    }
    const price = safeNumber(input.unitPrice);
    if (!Number.isFinite(price) || price < 0) {
      return { success: false as const, data: null, error: "price must be >= 0" };
    }

    const row = await prisma.supplierVariantPrice.upsert({
      where: {
        supplierId_productOptionId: {
          supplierId: input.supplierId,
          productOptionId: input.productOptionId,
        },
      },
      create: {
        supplierId: input.supplierId,
        productId: input.productId,
        productOptionId: input.productOptionId,
        price,
        sku: input.sku?.trim() || null,
        isActive: input.isActive ?? true,
      },
      update: {
        price,
        sku: input.sku?.trim() || null,
        isActive: input.isActive ?? true,
      },
      select: { id: true },
    });

    return { success: true as const, data: row, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Failed to set price" };
  }
}

/**
 * For OrderItem selection:
 * returns only options attached to product WITH an active price for the supplier.
 */
export async function searchPricedProductOptions(input: {
  supplierId: string;
  productId: string;
  q?: string;
  take?: number;
}) {
  try {
    const q = (input.q || "").trim().toLowerCase();
    const take = Math.min(Math.max(input.take ?? 50, 1), 200);

    if (!input.supplierId || !input.productId) {
      return { success: false as const, data: null, error: "Missing supplierId/productId" };
    }

    const joins = await prisma.productOption.findMany({
      where: {
        productId: input.productId,
        ...(q
          ? {
              OR: [
                { option: { label: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      take,
      select: {
        id: true, // productOptionId
        option: {
          select: {
            value: true,
            label: true,
            unit: { select: { code: true } },
          },
        },
        prices: {
          where: { supplierId: input.supplierId, isActive: true },
          select: { price: true },
          take: 1,
        },
      },
      orderBy: { id: "asc" },
    });

    const rows = joins
      .map((j) => {
        const unitCode = j.option.unit.code;
        const label = j.option.label || `${j.option.value}${unitCode}`;
        const price = j.prices?.[0]?.price;
        if (price === null || price === undefined) return null;
        return {
          productOptionId: j.id,
          label,
          unitPrice: Number(price),
        };
      })
      .filter(Boolean) as Array<{ productOptionId: string; label: string; unitPrice: number }>;

    const filtered = q ? rows.filter((r) => r.label.toLowerCase().includes(q)) : rows;

    return { success: true as const, data: filtered, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Search failed" };
  }
}

/**
 * Optional: get supplier prices for a whole product (for admin screens)
 */
export async function getSupplierPricesForProduct(input: {
  supplierId: string;
  productId: string;
}) {
  if (!input.supplierId || !input.productId) {
    return { success: false as const, data: null, error: "Missing supplierId/productId" };
  }

  try {
    const joins = await prisma.productOption.findMany({
      where: { productId: input.productId },
      select: {
        id: true,
        option: {
          select: {
            value: true,
            label: true,
            unit: { select: { code: true } },
          },
        },
        prices: {
          where: { supplierId: input.supplierId },
          select: { id: true, price: true, sku: true, isActive: true },
          take: 1,
        },
      },
    });

    const data = joins.map((j) => ({
      productOptionId: j.id,
      label: j.option.label || `${j.option.value}${j.option.unit.code}`,
      unitPrice: j.prices?.[0]?.price !== undefined ? Number(j.prices[0].price) : null,
      sku: j.prices?.[0]?.sku ?? null,
      isActive: j.prices?.[0]?.isActive ?? false,
    }));

    return { success: true as const, data, error: null };
  } catch (e: any) {
    return { success: false as const, data: null, error: e?.message ?? "Failed to fetch supplier prices" };
  }
}
