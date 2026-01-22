/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSupplier(data: { name: string; logoUrl?: string }) {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
    });
    revalidatePath("/suppliers");
    revalidatePath("/");
    return { success: true, data: supplier };
  } catch (error) {
    return { success: false, error: "Failed to create supplier" };
  }
}

export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        supplierProducts: {
          include: {
            product: true,
            variants: true,
          },
        },
        jobs: true,
      },
      orderBy: { name: "asc" },
    });

    console.log(suppliers);

    return { success: true, data: suppliers };
  } catch (error) {
    return { success: false, error: "Failed to fetch suppliers" };
  }
}

export async function getSupplierById(id: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        jobs: {
          include: {
            manager: true,
            jobProducts: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
    return { success: true, data: supplier };
  } catch (error) {
    return { success: false, error: "Failed to fetch supplier" };
  }
}

export async function updateSupplier(
  id: string,
  data: { name: string; logoUrl?: string },
) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
    });
    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    return { success: true, data: supplier };
  } catch (error) {
    return { success: false, error: "Failed to update supplier" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.delete({
      where: { id },
    });
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete supplier" };
  }
}
