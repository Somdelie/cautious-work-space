/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type SupplierListRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  jobsCount: number;
};
/** Normalize for comparisons (case/space insensitive) */
function normalizeKey(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Optional: enforce consistent display casing */
function titleCase(input: string) {
  const n = String(input ?? "").trim();
  if (!n) return n;
  return n
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Optional: fix known supplier aliases/typos */
function canonicalSupplierName(name: string) {
  const key = normalizeKey(name);

  const aliases: Record<string, string> = {
    dulax: "Dulux",
    dulux: "Dulux",
    terraco: "Terraco",
    marmoran: "Marmoran",
    plascon: "Plascon",
  };

  return aliases[key] ?? titleCase(name);
}

/** Find supplier by name case-insensitively */
async function findSupplierByNameInsensitive(name: string) {
  return prisma.supplier.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });
}

export async function createSupplier(data: { name: string; logoUrl?: string }) {
  try {
    const canonicalName = canonicalSupplierName(data.name);

    if (!canonicalName) {
      return { success: false, error: "Supplier name is required" };
    }

    // ✅ Prevent duplicates (case-insensitive)
    const existing = await findSupplierByNameInsensitive(canonicalName);
    if (existing) {
      // Optional: update logo if provided & existing has none
      if (data.logoUrl !== undefined && data.logoUrl !== existing.logoUrl) {
        const updated = await prisma.supplier.update({
          where: { id: existing.id },
          data: { logoUrl: data.logoUrl },
        });

        revalidatePath("/suppliers");
        revalidatePath("/");
        return { success: true, data: updated };
      }

      revalidatePath("/suppliers");
      revalidatePath("/");
      return { success: true, data: existing };
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: canonicalName,
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
    });

    revalidatePath("/suppliers");
    revalidatePath("/");
    return { success: true, data: supplier };
  } catch (error: any) {
    // If DB unique constraint throws (just in case)
    if (error?.code === "P2002") {
      return { success: false, error: "Supplier already exists" };
    }
    return { success: false, error: "Failed to create supplier" };
  }
}

export async function getSuppliers(): Promise<
  { success: true; data: SupplierListRow[] } | { success: false; error: string }
> {
  try {
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        _count: { select: { jobs: true } },
      },
      orderBy: { name: "asc" },
    });

    // ✅ plain objects only
    const data: SupplierListRow[] = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl,
      jobsCount: s._count.jobs,
    }));

    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to fetch suppliers" };
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
    const canonicalName = canonicalSupplierName(data.name);

    if (!canonicalName) {
      return { success: false, error: "Supplier name is required" };
    }

    // ✅ Prevent renaming to a name that already exists (case-insensitive)
    const clash = await prisma.supplier.findFirst({
      where: {
        id: { not: id },
        name: { equals: canonicalName, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });

    if (clash) {
      return {
        success: false,
        error: `A supplier named "${clash.name}" already exists.`,
      };
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: canonicalName,
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
    });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    revalidatePath("/");
    return { success: true, data: supplier };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "Supplier name already exists" };
    }
    return { success: false, error: "Failed to update supplier" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.delete({ where: { id } });

    revalidatePath("/suppliers");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete supplier" };
  }
}
