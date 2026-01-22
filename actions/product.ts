"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

type UsageType = "INTERNAL" | "EXTERNAL" | "BOTH";
type MeasureUnit = "L" | "KG" | "EA";

// Get all products with their suppliers and active variants
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplierProducts: {
          include: {
            supplier: true,
            variants: {
              where: { isActive: true },
              orderBy: [{ unit: "asc" }, { size: "asc" }],
            },
          },
          orderBy: { createdAt: "desc" },
        },
        spreadRates: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });
    // console.log(products);
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error, data: [] as const };
  }
}

// Get total count of products
export async function getProductsCount() {
  try {
    const count = await prisma.product.count();
    return { success: true, count };
  } catch (error) {
    return { success: false, count: 0, error };
  }
}

// create a new product
export async function createProduct(data: {
  name: string;
  shortcut?: string | null;
  usageType?: UsageType;
  supplierId: string;
  variants: Array<{ size: number; unit: MeasureUnit; price: number }>;
}) {
  try {
    const name = data.name.trim();
    if (!name) return { success: false, error: "Product name is required" };
    if (!data.supplierId)
      return { success: false, error: "Supplier is required" };
    if (!data.variants?.length)
      return { success: false, error: "At least one variant is required" };

    const result = await prisma.$transaction(async (tx) => {
      // 1) Create (or find) product
      const product = await tx.product.upsert({
        where: { name },
        update: {
          shortcut: data.shortcut ?? undefined,
          usageType: (data.usageType ?? "BOTH") as any,
        },
        create: {
          name,
          shortcut: data.shortcut ?? null,
          usageType: (data.usageType ?? "BOTH") as any,
        },
      });

      // 2) Link product to supplier (SupplierProduct)
      await tx.supplierProduct.upsert({
        where: {
          supplierId_productId: {
            supplierId: data.supplierId,
            productId: product.id,
          },
        },
        update: { isActive: true },
        create: {
          supplierId: data.supplierId,
          productId: product.id,
          isActive: true,
        },
      });

      // 3) Upsert variants (unique by supplierId+productId+size+unit)
      for (const v of data.variants) {
        await tx.productVariant.upsert({
          where: {
            supplierId_productId_size_unit: {
              supplierId: data.supplierId,
              productId: product.id,
              size: v.size,
              unit: v.unit as any,
            },
          },
          update: { price: v.price, isActive: true },
          create: {
            supplierId: data.supplierId,
            productId: product.id,
            size: v.size,
            unit: v.unit as any,
            price: v.price,
            isActive: true,
          },
        });
      }

      return product;
    });

    revalidatePath("/products");
    return { success: true, data: result };
  } catch (e: any) {
    // Prisma unique constraint errors etc
    return { success: false, error: e?.message ?? "Failed to create product" };
  }
}

// ✅ Get one product with relations (for Edit dialog)
export async function getProductById(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplierProducts: {
          include: {
            supplier: true,
            variants: {
              orderBy: [{ unit: "asc" }, { size: "asc" }],
            },
          },
          orderBy: { createdAt: "desc" },
        },
        spreadRates: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!product)
      return { success: false as const, error: "Product not found" };

    return { success: true as const, data: product };
  } catch (error: any) {
    return {
      success: false as const,
      error: error?.message ?? "Failed to load product",
    };
  }
}

// ✅ Update product core fields (name/shortcut/usageType)
export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    shortcut?: string | null;
    usageType?: UsageType;
  },
) {
  try {
    const updateData: any = {};

    if (typeof data.name === "string") updateData.name = data.name.trim();
    if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
    if (data.usageType) updateData.usageType = data.usageType;

    if (updateData.name === "") {
      return { success: false as const, error: "Product name is required" };
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return { success: true as const, data: product };
  } catch (error: any) {
    return {
      success: false as const,
      error: error?.message ?? "Failed to update product",
    };
  }
}

// ✅ Create/update SupplierProduct link (and active flag)
export async function upsertSupplierProduct(data: {
  supplierId: string;
  productId: string;
  isActive: boolean;
}) {
  try {
    const sp = await prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId: data.supplierId,
          productId: data.productId,
        },
      },
      update: { isActive: data.isActive },
      create: {
        supplierId: data.supplierId,
        productId: data.productId,
        isActive: data.isActive,
      },
      include: { supplier: true },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${data.productId}`);
    revalidatePath(`/suppliers/${data.supplierId}`);

    return { success: true as const, data: sp };
  } catch (error: any) {
    return {
      success: false as const,
      error: error?.message ?? "Failed to update supplier link",
    };
  }
}

// ✅ Upsert a variant (supports both create + update)
export async function upsertVariant(data: {
  id?: string; // if provided -> update by id
  supplierId: string;
  productId: string;
  size: number;
  unit: MeasureUnit;
  price: number;
  sku?: string | null;
  isActive?: boolean;
}) {
  try {
    // guard rails
    if (!data.supplierId || !data.productId) {
      return {
        success: false as const,
        error: "Supplier and product are required",
      };
    }
    if (!Number.isFinite(data.size) || data.size <= 0) {
      return { success: false as const, error: "Size must be > 0" };
    }
    if (!Number.isFinite(data.price) || data.price < 0) {
      return { success: false as const, error: "Price must be >= 0" };
    }

    const isActive = data.isActive ?? true;

    // If updating by id
    if (data.id) {
      const updated = await prisma.productVariant.update({
        where: { id: data.id },
        data: {
          price: data.price,
          sku: data.sku ?? null,
          isActive,
        },
      });

      revalidatePath("/products");
      revalidatePath(`/products/${data.productId}`);
      return { success: true as const, data: updated };
    }

    // Otherwise upsert by unique compound key
    const variant = await prisma.productVariant.upsert({
      where: {
        supplierId_productId_size_unit: {
          supplierId: data.supplierId,
          productId: data.productId,
          size: data.size,
          unit: data.unit as any,
        },
      },
      update: {
        price: data.price,
        sku: data.sku ?? null,
        isActive,
      },
      create: {
        supplierId: data.supplierId,
        productId: data.productId,
        size: data.size,
        unit: data.unit as any,
        price: data.price,
        sku: data.sku ?? null,
        isActive,
      },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${data.productId}`);

    return { success: true as const, data: variant };
  } catch (error: any) {
    return {
      success: false as const,
      error: error?.message ?? "Failed to save variant",
    };
  }
}

// ✅ Delete a variant (hard delete)
// If you prefer soft delete, set isActive=false instead.
export async function deleteVariant(variantId: string) {
  try {
    const v = await prisma.productVariant.delete({
      where: { id: variantId },
      select: { productId: true, supplierId: true },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${v.productId}`);
    revalidatePath(`/suppliers/${v.supplierId}`);

    return { success: true as const };
  } catch (error: any) {
    return {
      success: false as const,
      error: error?.message ?? "Failed to delete variant",
    };
  }
}
