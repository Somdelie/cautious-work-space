import { Decimal } from "@prisma/client/runtime/client";

export function toNumber(x: any): number {
  if (x === null || x === undefined) return 0;
  if (typeof x === "number") return x;
  if (typeof x === "string") return Number(x) || 0;
  if (x instanceof Decimal) return Number(x.toString());
  if (typeof x?.toNumber === "function") return x.toNumber();
  return Number(x) || 0;
}

export function toISO(d: any): string | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}
