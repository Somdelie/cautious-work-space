"use server";

import { prisma } from "@/lib/prisma";

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// If you still have ProductType model elsewhere, keep this.
// If you removed ProductType from schema, delete this file.
export async function getProductTypes() {
  try {
    const rows = await (prisma as any).productType.findMany({
      orderBy: { type: "asc" },
    });
    return { success: true as const, data: toPlain(rows) };
  } catch (e: any) {
    return { success: false as const, error: e?.message ?? "Failed to load product types" };
  }
}
