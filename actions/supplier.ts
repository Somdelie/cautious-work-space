"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/** helpers */
function decToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (v instanceof Prisma.Decimal) return Number(v.toString());
  if (typeof v === "string") return Number(v);
  if (typeof v === "number") return v;
  return Number(v);
}

export type SupplierDTO = {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  jobsCount: number;
};

export type SupplierDetailsDTO = SupplierDTO & {
  jobs: Array<{ id: string; jobNumber: string; siteName: string; createdAt: string }>;
  supplierProducts: Array<{
    product: { id: string; name: string };
    isActive: boolean;
  }>;
  prices: Array<{
    id: string;
    product: { id: string; name: string };
    option: { id: string; value: number; label: string; unit: { id: string; code: string; name: string } };
    price: number;
    sku: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        jobs: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    });

    const data: SupplierDTO[] = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      jobsCount: s.jobs ? s.jobs.length : 0,
    }));

    return { success: true, data };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed" };
  }
}

export async function getSupplierById(id: string) {
  if (!id) return { success: false, error: "Missing supplier id" };

  try {
    const s = await prisma.supplier.findUnique({
      where: { id },
      include: {
        jobs: { select: { id: true, jobNumber: true, siteName: true, createdAt: true } },
        supplierProducts: {
          include: { product: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        supplierVariantPrices: {
          include: {
            product: { select: { id: true, name: true } },
            productOption: { include: { option: { include: { unit: true } } } },
          },
          orderBy: [{ updatedAt: "desc" }],
        },
      },
    });

    if (!s) return { success: false, error: "Supplier not found" };

    // ✅ DTO conversion (no Date/Decimal objects)
    const dto: SupplierDetailsDTO = {
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      jobsCount: s.jobs ? s.jobs.length : 0,

      jobs: (s.jobs ?? []).map((j: any) => ({
        id: j.id,
        jobNumber: j.jobNumber,
        siteName: j.siteName,
        createdAt: j.createdAt.toISOString(),
      })),

      supplierProducts: (s.supplierProducts ?? []).map((sp: any) => ({
        product: { id: sp.product.id, name: sp.product.name },
        isActive: sp.isActive,
      })),

      prices: (s.supplierVariantPrices ?? []).map((p: any) => ({
        id: p.id,
        product: { id: p.product.id, name: p.product.name },
        option: {
          id: p.productOption.option.id,
          value: p.productOption.option.value,
          label: p.productOption.option.label?.trim() || `${p.productOption.option.value}${p.productOption.option.unit.code.toLowerCase()}`,
          unit: { id: p.productOption.option.unit.id, code: p.productOption.option.unit.code, name: p.productOption.option.unit.name },
        },
        price: decToNumber(p.price),
        sku: p.sku ?? null,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };

    return { success: true, data: dto };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to fetch supplier" };
  }
}

export async function createSupplier(input: { name: string; logoUrl?: string | null }) {
  const name = input.name?.trim();
  if (!name) return { success: false, error: "Supplier name is required" };

  try {
    const s = await prisma.supplier.create({
      data: {
        name,
        logoUrl: input.logoUrl?.trim() || null,
      },
    });

    revalidatePath("/suppliers");

    return {
      success: true,
      data: {
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        jobsCount: 0,
      } satisfies SupplierDTO,
    };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to create supplier" };
  }
}

export async function updateSupplier(id: string, input: { name?: string; logoUrl?: string | null }) {
  if (!id) return { success: false, error: "Missing supplier id" };

  try {
    const s = await prisma.supplier.update({
      where: { id },
      data: {
        ...(typeof input.name === "string" ? { name: input.name.trim() } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl?.trim() || null } : {}),
      },
      include: { jobs: { select: { id: true } } },
    });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);

    return {
      success: true,
      data: {
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        jobsCount: s.jobs.length,
      } satisfies SupplierDTO,
    };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to update supplier" };
  }
}

export async function deleteSupplier(id: string) {
  if (!id) return { success: false, error: "Missing supplier id" };

  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/suppliers");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to delete supplier" };
  }
}
