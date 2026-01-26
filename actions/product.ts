"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/** ----------------- helpers ----------------- */
function decToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (v instanceof Prisma.Decimal) return Number(v.toString());
  if (typeof v === "string") return Number(v);
  if (typeof v === "number") return v;
  return Number(v);
}

function mapSupplierVariantPriceToVariant(row: any) {
  const opt = row.productOption?.option;
  const unitCode = opt?.unit?.code ?? "";
  const size = opt?.value ?? 0;

  return {
    id: row.id, // ✅ UI will use SupplierVariantPrice.id
    size: Number(size),
    unit: String(unitCode),
    price: decToNumber(row.price),
    sku: row.sku ?? null,
    isActive: Boolean(row.isActive),
  };
}

/** ----------------- get product by id (for Edit dialog) ----------------- */
export async function getProductById(productId: string) {
  if (!productId) return { success: false, data: null, error: "Missing productId" };

  try {
    const p = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        unit: true,
        supplierProducts: {
          include: { supplier: true },
        },
        supplierVariantPrices: {
          include: {
            productOption: {
              include: {
                option: { include: { unit: true } },
              },
            },
          },
          orderBy: [{ updatedAt: "desc" }],
        },
      },
    });

    if (!p) return { success: false, data: null, error: "Product not found" };

    // Group supplierVariantPrices by supplierId for dialog shape
    const variantsBySupplier = new Map<string, any[]>();
    for (const svp of p.supplierVariantPrices ?? []) {
      const arr = variantsBySupplier.get(svp.supplierId) ?? [];
      arr.push(mapSupplierVariantPriceToVariant(svp));
      variantsBySupplier.set(svp.supplierId, arr);
    }

    const supplierProducts = (p.supplierProducts ?? []).map((sp) => ({
      supplierId: sp.supplierId,
      isActive: sp.isActive,
      supplier: {
        id: sp.supplier.id,
        name: sp.supplier.name,
        logoUrl: sp.supplier.logoUrl ?? null,
      },
      variants: variantsBySupplier.get(sp.supplierId) ?? [],
    }));

    const dto = {
      id: p.id,
      name: p.name,
      shortcut: p.shortcut ?? null,
      usageType: p.usageType,
      unit: { id: p.unit.id, code: p.unit.code, name: p.unit.name },
      supplierProducts,
    };

    return { success: true, data: dto };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed to load product" };
  }
}


/** ----------------- SupplierProduct upsert (toggle supplier link) ----------------- */
export async function upsertSupplierProduct(input: {
  supplierId: string;
  productId: string;
  isActive: boolean;
}) {
  const { supplierId, productId, isActive } = input;
  if (!supplierId || !productId) {
    return { success: false, data: null, error: "Missing supplierId/productId" };
  }

  try {
    const row = await prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId, productId } },
      update: { isActive },
      create: { supplierId, productId, isActive },
      include: { supplier: true },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/suppliers/${supplierId}`);

    return {
      success: true,
      data: {
        supplierId: row.supplierId,
        productId: row.productId,
        isActive: row.isActive,
        supplier: {
          id: row.supplier.id,
          name: row.supplier.name,
          logoUrl: row.supplier.logoUrl ?? null,
        },
      },
    };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed to upsert supplierProduct" };
  }
}

export async function upsertVariant(payload: {
  id?: string;
  supplierId: string;
  productId: string;
  size: number;
  unit: string; // Unit.code
  price: number;
  sku?: string | null;
  isActive: boolean;
}) {
  const { id, supplierId, productId, size, unit, price, sku, isActive } = payload;

  if (!supplierId || !productId) {
    return { success: false, data: null, error: "Missing supplierId/productId" };
  }
  if (!Number.isFinite(Number(size)) || Number(size) <= 0) {
    return { success: false, data: null, error: "Invalid size" };
  }
  if (!unit?.trim()) {
    return { success: false, data: null, error: "Unit is required" };
  }
  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return { success: false, data: null, error: "Invalid price" };
  }

  try {
    // 1) Find Unit by code
    const unitRow = await prisma.unit.findUnique({
      where: { code: unit.trim() },
      select: { id: true, code: true, name: true },
    });
    if (!unitRow) {
      return { success: false, data: null, error: `Unknown unit code: ${unit}` };
    }

    // 2) Find or create ProductVariantOption (global option)
    const option = await prisma.productVariantOption.upsert({
      where: { value_unitId: { value: Number(size), unitId: unitRow.id } },
      update: {},
      create: {
        value: Number(size),
        unitId: unitRow.id,
        label: `${Number(size)}${unitRow.code.toLowerCase()}`,
      },
      select: { id: true, value: true, label: true, unit: { select: { id: true, code: true, name: true } } },
    });

    // 3) Attach option to product (ProductOption)
    const productOption = await prisma.productOption.upsert({
      where: { productId_optionId: { productId, optionId: option.id } },
      update: { isActive: true },
      create: { productId, optionId: option.id, isActive: true },
      select: { id: true },
    });

    // 4) Upsert SupplierVariantPrice
    // If id given, update by id (safer for edits)
    const row = id
      ? await prisma.supplierVariantPrice.update({
          where: { id },
          data: {
            supplierId,
            productId,
            productOptionId: productOption.id,
            price: new Prisma.Decimal(price),
            sku: sku?.trim() || null,
            isActive,
          },
          include: {
            productOption: { include: { option: { include: { unit: true } } } },
          },
        })
      : await prisma.supplierVariantPrice.upsert({
          where: { supplierId_productOptionId: { supplierId, productOptionId: productOption.id } },
          create: {
            supplierId,
            productId,
            productOptionId: productOption.id,
            price: new Prisma.Decimal(price),
            sku: sku?.trim() || null,
            isActive,
          },
          update: {
            price: new Prisma.Decimal(price),
            sku: sku?.trim() || null,
            isActive,
          },
          include: {
            productOption: { include: { option: { include: { unit: true } } } },
          },
        });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/suppliers/${supplierId}`);

    return {
      success: true,
      data: {
        id: row.id,
        supplierId: row.supplierId,
        productId: row.productId,
        size: row.productOption.option.value,
        unit: row.productOption.option.unit.code,
        price: decToNumber(row.price),
        sku: row.sku ?? null,
        isActive: row.isActive,
      },
    };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed to save variant" };
  }
}

/** ----------------- delete variant (delete supplier price row) ----------------- */
export async function deleteVariant(variantId: string) {
  if (!variantId) return { success: false, error: "Missing variantId" };

  try {
    // Read first so we can revalidate correct pages
    const existing = await prisma.supplierVariantPrice.findUnique({
      where: { id: variantId },
      select: { supplierId: true, productId: true },
    });

    await prisma.supplierVariantPrice.delete({ where: { id: variantId } });

    if (existing?.productId) revalidatePath(`/products/${existing.productId}`);
    if (existing?.supplierId) revalidatePath(`/suppliers/${existing.supplierId}`);
    revalidatePath("/products");

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to delete variant" };
  }
}

export type ProductDTO = {
  id: string;
  name: string;
  shortcut: string | null;
  usageType: "INTERNAL" | "EXTERNAL" | "BOTH";
  createdAt: string;
  updatedAt: string;
};

export type VariantOptionDTO = {
  id: string;
  value: number;
  label: string;
  unit: { id: string; code: string; name: string };
};

export type SupplierPriceDTO = {
  id: string;
  supplierId: string;
  productId: string;
  optionId: string;
  price: number;
  sku: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  option: VariantOptionDTO;
  supplier: { id: string; name: string };
};

export type ProductWithOptionsDTO = ProductDTO & {
  options: VariantOptionDTO[]; // options linked via ProductVariant table
};

/**
 * IMPORTANT:
 * Your schema uses:
 * - ProductVariant as the join between Product <-> ProductVariantOption (global option)
 * - SupplierVariantPrice for supplier pricing (supplier + product + option)
 *
 * ProductVariant still has supplierId in your schema; but you said options are attached to product.
 * In this version, ProductVariant rows are treated as "product has option".
 * If you want to remove supplierId later, you can — this code will still be mostly same.
 */

/** ----------------- Products ----------------- */

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
  orderBy: { name: "asc" },
  include: {
    unit: true, // ✅ ADD THIS
    supplierProducts: { include: { supplier: true } },
    supplierVariantPrices: {
      include: {
        productOption: {
          include: {
            option: { include: { unit: true } },
          },
        },
      },
    },
    spreadRates: { include: { unit: true } },
  },
});
    return { success: true, data: products };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed" };
  }
}

export async function createProduct(input: {
  name: string;
  shortcut?: string | null;
  usageType?: "INTERNAL" | "EXTERNAL" | "BOTH";
  discountPrice?: number | null;
  unitId: string; // required
  options?: Array<{
    value: number;
    label?: string | null;
  }>;
  suppliers?: Array<{
    supplierId: string;
    isActive?: boolean;
  }>;
}) {
  const name = input.name?.trim();
  if (!name) return { success: false, error: "Product name is required" };
  if (!input.unitId) return { success: false, error: "Unit is required" };

  try {
    // check for existing product with same name
    const existing = await prisma.product.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: "A product with this name already exists. Please choose a different name." };
    }
    // Accept all fields from input that match the Product model
    const createData: any = {
      name,
      shortcut: input.shortcut?.trim() || null,
      usageType: input.usageType ?? "BOTH",
      unitId: input.unitId,
    };
    if (input.discountPrice !== undefined) createData.discountPrice = input.discountPrice;

    // Create the product first
    const product = await prisma.product.create({
      data: createData,
    });

    // Handle options (using product.unitId)
    if (Array.isArray(input.options) && input.options.length > 0) {
      for (const opt of input.options) {
        // Find or create the ProductVariantOption for this value/unit
        let variantOption = await prisma.productVariantOption.findFirst({
          where: { value: opt.value, unitId: product.unitId },
        });
        if (!variantOption) {
          variantOption = await prisma.productVariantOption.create({
            data: {
              value: opt.value,
              unitId: product.unitId,
              label: opt.label ?? `${opt.value}`,
            },
          });
        }
        // Attach option to product (ProductOption)
        await prisma.productOption.upsert({
          where: { productId_optionId: { productId: product.id, optionId: variantOption.id } },
          update: {},
          create: {
            productId: product.id,
            optionId: variantOption.id,
            isActive: true,
          },
        });
      }
    }

    // Handle suppliers
    if (Array.isArray(input.suppliers) && input.suppliers.length > 0) {
      for (const s of input.suppliers) {
        await prisma.supplierProduct.upsert({
          where: { supplierId_productId: { supplierId: s.supplierId, productId: product.id } },
          update: { isActive: s.isActive ?? true },
          create: {
            supplierId: s.supplierId,
            productId: product.id,
            isActive: s.isActive ?? true,
          },
        });
      }
    }

    revalidatePath("/products");

    // Return the product with options and suppliers
    const result = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        productOptions: {
          include: { option: { include: { unit: true } } },
        },
        supplierProducts: {
          include: { supplier: true },
        },
      },
    });

    return { success: true, data: result };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  input: { name?: string; shortcut?: string | null; usageType?: ProductDTO["usageType"] },
) {
  if (!id) return { success: false, error: "Missing id" };

  try {
    const p = await prisma.product.update({
      where: { id },
      data: {
        ...(typeof input.name === "string" ? { name: input.name.trim() } : {}),
        ...(input.shortcut !== undefined ? { shortcut: input.shortcut?.trim() || null } : {}),
        ...(input.usageType ? { usageType: input.usageType } : {}),
      },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);

    return {
      success: true,
      data: {
        id: p.id,
        name: p.name,
        shortcut: p.shortcut ?? null,
        usageType: p.usageType,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      } satisfies ProductDTO,
    };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  if (!id) return { success: false, error: "Missing id" };

  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to delete product" };
  }
}

/** ----------------- Attach options to product -----------------
 * This uses ProductVariant table as "product has option".
 * We keep supplierId nullable/optional by writing any supplierId if needed.
 * If your ProductVariant.supplierId is required, you must pass one.
 */

export async function getProductOptions(productId: string) {
  if (!productId) return { success: false, error: "Missing productId" };

  try {
    const rows = await prisma.productOption.findMany({
      where: { productId },
      include: {
        option: { include: { unit: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const options: VariantOptionDTO[] = rows
      .map((r) => r.option)
      .filter(Boolean)
      .map((o) => ({
        id: o.id,
        value: o.value,
        label: o.label?.trim() || `${o.value}${o.unit.code.toLowerCase()}`,
        unit: { id: o.unit.id, code: o.unit.code, name: o.unit.name },
      }));

    const unique = Array.from(new Map(options.map((o) => [o.id, o])).values());

    return { success: true, data: unique };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to load options" };
  }
}

export async function attachOptionToProduct(input: {
  productId: string;
  optionId: string;
  supplierId?: string | null; // only needed because ProductVariant currently has supplierId
}) {
  const { productId, optionId } = input;
  if (!productId || !optionId) return { success: false, error: "Missing productId/optionId" };

  try {
    // Prevent duplicates by checking existing ProductVariant rows
    const exists = await prisma.productOption.findFirst({
      where: { productId, optionId },
      select: { id: true },
    });
    if (exists) return { success: true, data: { already: true } };

    await prisma.productOption.create({
      data: {
        productId,
        optionId,
        isActive: true,
      },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to attach option" };
  }
}

export async function detachOptionFromProduct(input: { productId: string; optionId: string }) {
  const { productId, optionId } = input;
  if (!productId || !optionId) return { success: false, error: "Missing productId/optionId" };

  try {
    await prisma.productOption.deleteMany({
      where: { productId, optionId },
    });

    // Also remove supplier prices for that option & product
    await prisma.supplierVariantPrice.deleteMany({
      where: { productId, productOptionId: optionId },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to detach option" };
  }
}

/** ----------------- Supplier pricing ----------------- */

export async function setSupplierPrice(input: {
  supplierId: string;
  productId: string;
  optionId: string;
  price: number;
  sku?: string | null;
  isActive?: boolean;
}) {
  const { supplierId, productId, optionId } = input;
  if (!supplierId || !productId || !optionId) return { success: false, error: "Missing ids" };
  if (!Number.isFinite(Number(input.price))) return { success: false, error: "Invalid price" };

  try {
    const row = await prisma.supplierVariantPrice.upsert({
      where: { supplierId_productOptionId: { supplierId, productOptionId: optionId } },
      create: {
        supplierId,
        productId,
        productOptionId: optionId,
        price: new Prisma.Decimal(input.price),
        sku: input.sku?.trim() || null,
        isActive: input.isActive ?? true,
      },
      update: {
        price: new Prisma.Decimal(input.price),
        sku: input.sku?.trim() || null,
        isActive: input.isActive ?? true,
      },
      include: {
        supplier: { select: { id: true, name: true } },
        productOption: { include: { option: { include: { unit: true } } } },
      },
    });

    revalidatePath(`/suppliers/${supplierId}`);
    revalidatePath(`/products/${productId}`);

    const dto: SupplierPriceDTO = {
      id: row.id,
      supplierId: row.supplierId,
      productId: row.productId,
      optionId: row.productOptionId,
      price: decToNumber(row.price),
      sku: row.sku ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      supplier: { id: row.supplier.id, name: row.supplier.name },
      option: {
        id: row.productOption.option.id,
        value: row.productOption.option.value,
        label: row.productOption.option.label?.trim() || `${row.productOption.option.value}${row.productOption.option.unit.code.toLowerCase()}`,
        unit: { id: row.productOption.option.unit.id, code: row.productOption.option.unit.code, name: row.productOption.option.unit.name },
      },
    };

    return { success: true, data: dto };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to set supplier price" };
  }
}

export async function getSupplierPricesForProduct(input: { supplierId: string; productId: string }) {
  const { supplierId, productId } = input;
  if (!supplierId || !productId) return { success: false, error: "Missing ids" };

  try {
    const rows = await prisma.supplierVariantPrice.findMany({
      where: { supplierId, productId },
      include: {
        supplier: { select: { id: true, name: true } },
        productOption: { include: { option: { include: { unit: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    const data: SupplierPriceDTO[] = rows.map((row) => ({
      id: row.id,
      supplierId: row.supplierId,
      productId: row.productId,
      optionId: row.productOptionId,
      price: decToNumber(row.price),
      sku: row.sku ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      supplier: { id: row.supplier.id, name: row.supplier.name },
      option: {
        id: row.productOption.option.id,
        value: row.productOption.option.value,
        label: row.productOption.option.label?.trim() || `${row.productOption.option.value}${row.productOption.option.unit.code.toLowerCase()}`,
        unit: { id: row.productOption.option.unit.id, code: row.productOption.option.unit.code, name: row.productOption.option.unit.name },
      },
    }));

    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to load supplier prices" };
  }
}
