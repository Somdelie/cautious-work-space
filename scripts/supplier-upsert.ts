// src/lib/supplier-upsert.ts
import { canonicalSupplierName } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";

export async function upsertSupplierByName(rawName: string) {
  const canonical = canonicalSupplierName(rawName);
  if (!canonical) throw new Error("Supplier name is required");

  // Case-insensitive find first
  const existing = await prisma.supplier.findFirst({
    where: { name: { equals: canonical, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (existing) {
    // normalize stored name to canonical (optional but recommended)
    if (existing.name !== canonical) {
      return prisma.supplier.update({
        where: { id: existing.id },
        data: { name: canonical },
      });
    }
    return prisma.supplier.findUnique({ where: { id: existing.id } });
  }

  return prisma.supplier.create({ data: { name: canonical } });
}
