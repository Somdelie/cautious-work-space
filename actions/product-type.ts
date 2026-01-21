/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProductType(data: {
  type: string;
  shortcut?: string;
  supplierId: string;
  usageType?: "INTERNAL" | "EXTERNAL" | "BOTH";
  price?: number;
  price5L?: number;
  price20L?: number;
}) {
  try {
    const productType = await prisma.productType.create({
      data: {
        type: data.type,
        shortcut: data.shortcut || "",
        supplierId: data.supplierId,
        usageType: data.usageType || "BOTH",
        price: typeof data.price === "number" ? data.price : 0,
        price5L: typeof data.price5L === "number" ? data.price5L : 0,
        price20L: typeof data.price20L === "number" ? data.price20L : 0,
      },
      include: {
        supplier: true,
      },
    });
    revalidatePath("/products");
    revalidatePath(`/suppliers/${data.supplierId}`);
    return { success: true, data: productType };
  } catch (error) {
    return { success: false, error: "Failed to create product type" };
  }
}

export async function getProductTypes(supplierId?: string) {
  try {
    const productTypes = await prisma.productType.findMany({
      where: supplierId ? { supplierId } : undefined,
      include: {
        supplier: true,
      },
      orderBy: {
        type: "asc",
      },
    });
    // Ensure usageType is present in returned objects
    const withUsageType = productTypes.map((pt) => ({
      ...pt,
      usageType: pt.usageType || "BOTH",
    }));
    return { success: true, data: withUsageType };
  } catch (error) {
    return { success: false, error: "Failed to fetch product types" };
  }
}

export async function getProductTypeById(id: string) {
  try {
    const productType = await prisma.productType.findUnique({
      where: { id },
      include: {
        supplier: true,
        jobProducts: {
          include: {
            job: true,
          },
        },
      },
    });
    return { success: true, data: productType };
  } catch (error) {
    return { success: false, error: "Failed to fetch product type" };
  }
}

export async function updateProductType(
  id: string,
  data: {
    type?: string;
    shortcut?: string;
    supplierId?: string;
    usageType?: "INTERNAL" | "EXTERNAL" | "BOTH";
    price?: number;
    price5L?: number;
    price20L?: number;
  },
) {
  try {
    const productType = await prisma.productType.update({
      where: { id },
      data: {
        type: data.type,
        shortcut: data.shortcut,
        supplierId: data.supplierId,
        usageType: data.usageType,
        price: typeof data.price === "number" ? data.price : undefined,
        price5L: typeof data.price5L === "number" ? data.price5L : undefined,
        price20L: typeof data.price20L === "number" ? data.price20L : undefined,
      },
      include: {
        supplier: true,
      },
    });
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { success: true, data: productType };
  } catch (error) {
    return { success: false, error: "Failed to update product type" };
  }
}

export async function deleteProductType(id: string) {
  try {
    await prisma.productType.delete({
      where: { id },
    });
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete product type" };
  }
}
