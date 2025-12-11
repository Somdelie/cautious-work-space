/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProductType(data: {
  type: string;
  shortcut?: string;
  supplierId: string;
}) {
  try {
    const productType = await prisma.productType.create({
      data: {
        type: data.type,
        shortcut: data.shortcut || "",
        supplierId: data.supplierId,
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
    return { success: true, data: productTypes };
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
  data: { type?: string; shortcut?: string; supplierId?: string }
) {
  try {
    const productType = await prisma.productType.update({
      where: { id },
      data: {
        type: data.type,
        shortcut: data.shortcut,
        supplierId: data.supplierId,
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
