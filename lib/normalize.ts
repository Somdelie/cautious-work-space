// src/lib/normalize.ts
export function normalizeKey(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function titleCase(input: string) {
  const n = String(input ?? "").trim();
  if (!n) return n;
  return n
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Supplier canonical naming:
 * - Fix known typos/aliases
 * - Title-case everything else
 */
export function canonicalSupplierName(name: string) {
  const key = normalizeKey(name);

  const aliases: Record<string, string> = {
    dulax: "Dulux",
    dulux: "Dulux",
    terraco: "Terraco",
    marmoran: "Marmoran",
    plascon: "Plascon",
  };

  if (aliases[key]) return aliases[key];
  return titleCase(name);
}
