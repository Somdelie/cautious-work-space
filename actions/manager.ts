/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createManager(data: {
  name: string;
  phone?: string;
  email?: string;
}) {
  try {
    const manager = await prisma.manager.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
    });
    revalidatePath("/managers");
    return { success: true, data: manager };
  } catch (error) {
    return { success: false, error: "Failed to create manager" };
  }
}

export async function getManagers() {
  try {
    const managers = await prisma.manager.findMany({
      include: {
        jobs: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return { success: true, data: managers };
  } catch (error) {
    return { success: false, error: "Failed to fetch managers" };
  }
}

export async function getManagerById(id: string) {
  try {
    const manager = await prisma.manager.findUnique({
      where: { id },
      include: {
        jobs: {
          include: {
            supplier: true,
            jobProducts: {
              include: {
                productType: true,
              },
            },
          },
        },
      },
    });
    return { success: true, data: manager };
  } catch (error) {
    return { success: false, error: "Failed to fetch manager" };
  }
}

export async function updateManager(
  id: string,
  data: { name?: string; phone?: string; email?: string }
) {
  try {
    const manager = await prisma.manager.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
    });
    revalidatePath("/managers");
    revalidatePath(`/managers/${id}`);
    return { success: true, data: manager };
  } catch (error) {
    return { success: false, error: "Failed to update manager" };
  }
}

export async function deleteManager(id: string) {
  try {
    await prisma.manager.delete({
      where: { id },
    });
    revalidatePath("/managers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete manager" };
  }
}
