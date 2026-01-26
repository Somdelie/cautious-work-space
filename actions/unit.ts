"use server";

import { prisma } from "@/lib/prisma";

/**
 * ===========================
 * UNITS + VARIANT OPTIONS
 * ===========================
 *
 * Unit:            { code: "MM", "L", "KG", "EA", "ROLL" ... }
 * Variant Option:  { value: 24, unitId: MM, label: "24mm" }
 *
 * NOTE:
 * - We return DTOs only (no Prisma Date/Decimal objects).
 * - Options are global (reusable across products & suppliers).
 */

/** ---------- DTO TYPES ---------- */
export type UnitDTO = {
  id: string;
  code: string;
  name: string;
}

export type VariantOptionDTO = {
  id: string;
  value: number;
  unit: UnitDTO;
  label: string;
};

/** ---------- HELPERS ---------- */
function optionLabel(value: number, unitCode: string, label?: string | null) {
  const clean = (label ?? "").trim();
  if (clean) return clean;
  // default label if not provided (e.g. 24 + MM => "24mm")
  return `${value}${unitCode.toLowerCase()}`;
}

/** ---------- UNITS ---------- */

;

export async function getUnits() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });

    const data: UnitDTO[] = units.map((u) => ({
      id: u.id,
      code: u.code,
      name: u.name,
    }));

    return { success: true, data };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed to load units" };
  }
}

export async function createUnit(input: { code: string; name: string }) {
  const code = input.code?.trim().toUpperCase();
  const name = input.name?.trim();

  if (!code) return { success: false, error: "Unit code is required" };
  if (!name) return { success: false, error: "Unit name is required" };

  try {
    const unit = await prisma.unit.create({
      data: { code, name },
      select: { id: true, code: true, name: true },
    });

    const data: UnitDTO = {
      id: unit.id,
      code: unit.code,
      name: unit.name,
    };

    return { success: true, data };
  } catch (e: any) {
    // most common: unique violation on code
    return { success: false, error: e?.message ?? "Failed to create unit" };
  }
}

/** ---------- VARIANT OPTIONS ---------- */

export async function getVariantOptions(params?: {
  unitId?: string;
  search?: string;
  take?: number;
}) {
  const take = params?.take && params.take > 0 ? params.take : 200;
  const search = params?.search?.trim();

  const options = await prisma.productVariantOption.findMany({
    where: {
      ...(params?.unitId ? { unitId: params.unitId } : {}),
      ...(search
        ? {
            OR: [
              { label: { contains: search, mode: "insensitive" } },
              // value search if numeric
              ...(Number.isFinite(Number(search))
                ? [{ value: Number(search) }]
                : []),
              { unit: { code: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      unit: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ unit: { code: "asc" } }, { value: "asc" }],
    take,
  });

  const data: VariantOptionDTO[] = options.map((o) => ({
    id: o.id,
    value: o.value,
    unit: { id: o.unit.id, code: o.unit.code, name: o.unit.name },
    label: optionLabel(o.value, o.unit.code, o.label),
  }));

  return { success: true, data };
}

export async function createVariantOption(input: {
  value: number;
  unitId: string;
  label?: string;
}) {
  const value = Number(input.value);
  const unitId = input.unitId?.trim();
  const label = input.label?.trim() || null;

  if (!unitId) return { success: false, error: "unitId is required" };
  if (!Number.isFinite(value) || value <= 0) {
    return { success: false, error: "value must be a positive number" };
  }

  try {
    const created = await prisma.productVariantOption.create({
      data: { value, unitId, label },
      include: {
        unit: { select: { id: true, code: true, name: true } },
      },
    });

    const data: VariantOptionDTO = {
      id: created.id,
      value: created.value,
      unit: {
        id: created.unit.id,
        code: created.unit.code,
        name: created.unit.name,
      },
      label: optionLabel(created.value, created.unit.code, created.label),
    };

    return { success: true, data };
  } catch (e: any) {
    // most common: @@unique([value, unitId]) violation
    return {
      success: false,
      error: e?.message ?? "Failed to create variant option",
    };
  }
}

/**
 * Handy helper: get or create option by value+unit (safe)
 * Example: ensureOption(24, unitIdForMM, "24mm")
 */
export async function ensureVariantOption(input: {
  value: number;
  unitId: string;
  label?: string;
}) {
  const value = Number(input.value);
  const unitId = input.unitId?.trim();
  const label = input.label?.trim() || null;

  if (!unitId) return { success: false, error: "unitId is required" };
  if (!Number.isFinite(value) || value <= 0) {
    return { success: false, error: "value must be a positive number" };
  }

  const option = await prisma.productVariantOption.upsert({
    where: {
      value_unitId: { value, unitId }, // matches @@unique([value, unitId])
    },
    create: { value, unitId, label },
    update: {
      // don’t overwrite label unless you want to; keep existing by default
    },
    include: { unit: { select: { id: true, code: true, name: true } } },
  });

  const data: VariantOptionDTO = {
    id: option.id,
    value: option.value,
    unit: { id: option.unit.id, code: option.unit.code, name: option.unit.name },
    label: optionLabel(option.value, option.unit.code, option.label),
  };

  return { success: true, data };
}
