/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createJobProduct(data: {
  jobId: string;
  productId: string;
  required?: boolean;
  quantity?: number;
  unit?: string;
}) {
  try {
    const jobProduct = await prisma.jobProduct.create({
      data: {
        jobId: data.jobId,
        productId: data.productId,
        required: data.required ?? false,
        quantity: data.quantity,
        unit: data.unit,
      },
      include: {
        job: true,
        productType: true,
      },
    });
    revalidatePath("/jobs");
    revalidatePath("/");
    revalidatePath(`/jobs/${data.jobId}`);
    return { success: true, data: jobProduct };
  } catch (error) {
    return { success: false, error: "Failed to create job product" };
  }
}

export async function getJobProducts(jobId?: string) {
  try {
    const jobProducts = await prisma.jobProduct.findMany({
      where: jobId ? { jobId } : undefined,
      include: {
        job: {
          include: {
            manager: true,
            supplier: true,
          },
        },
        productType: {
          include: {
            supplier: true,
          },
        },
      },
    });
    return { success: true, data: jobProducts };
  } catch (error) {
    return { success: false, error: "Failed to fetch job products" };
  }
}

export async function getJobProductById(id: string) {
  try {
    const jobProduct = await prisma.jobProduct.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            manager: true,
            supplier: true,
          },
        },
        productType: {
          include: {
            supplier: true,
          },
        },
      },
    });
    return { success: true, data: jobProduct };
  } catch (error) {
    return { success: false, error: "Failed to fetch job product" };
  }
}

export async function updateJobProduct(
  id: string,
  data: {
    productId?: string;
    required?: boolean;
    quantity?: number;
    unit?: string;
  }
) {
  try {
    const jobProduct = await prisma.jobProduct.update({
      where: { id },
      data: {
        productId: data.productId,
        required: data.required,
        quantity: data.quantity,
        unit: data.unit,
      },
      include: {
        job: true,
        productType: true,
      },
    });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobProduct.jobId}`);
    return { success: true, data: jobProduct };
  } catch (error) {
    return { success: false, error: "Failed to update job product" };
  }
}

export async function deleteJobProduct(id: string) {
  try {
    const jobProduct = await prisma.jobProduct.findUnique({
      where: { id },
      select: { jobId: true },
    });

    await prisma.jobProduct.delete({
      where: { id },
    });

    if (jobProduct) {
      revalidatePath("/jobs");
      revalidatePath(`/jobs/${jobProduct.jobId}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete job product" };
  }
}

export async function bulkUpdateJobProducts(
  jobId: string,
  products: Array<{
    productId: string;
    required: boolean;
    quantity?: number;
    unit?: string;
  }>
) {
  try {
    // Delete existing job products
    await prisma.jobProduct.deleteMany({
      where: { jobId },
    });

    // Create new job products
    const jobProducts = await prisma.jobProduct.createMany({
      data: products.map((product) => ({
        jobId,
        productId: product.productId,
        required: product.required,
        quantity: product.quantity,
        unit: product.unit,
      })),
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, data: jobProducts };
  } catch (error) {
    return { success: false, error: "Failed to bulk update job products" };
  }
}
