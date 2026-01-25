import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";
import { prisma } from "../lib/prisma";
import { MeasureUnit } from "@prisma/client";

// ✅ add normalize helpers
function normalizeKey(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
function titleCase(input: string) {
  const n = String(input ?? "").trim();
  if (!n) return n;
  return n
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
function canonicalSupplierName(name: string) {
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

// ---- helpers
function parseZAR(raw: string): number | null {
  const m = raw.match(/R\s*([\d\s]+,\d{2})/i);
  if (!m) return null;
  const cleaned = m[1].replace(/\s+/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// ✅ FIXED: case-insensitive supplier upsert + canonicalize
async function upsertSupplier(name: string) {
  const canonical = canonicalSupplierName(name);
  const existing = await prisma.supplier.findFirst({
    where: { name: { equals: canonical, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (existing) {
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

// product name is unique too; you may want same approach later
async function upsertProduct(name: string, shortcut?: string | null) {
  return prisma.product.upsert({
    where: { name },
    update: {},
    create: { name, shortcut: shortcut || null },
  });
}

async function upsertSupplierProduct(supplierId: string, productId: string) {
  return prisma.supplierProduct.upsert({
    where: { supplierId_productId: { supplierId, productId } },
    update: {},
    create: { supplierId, productId },
  });
}

async function upsertVariant(
  supplierId: string,
  productId: string,
  size: number,
  unit: MeasureUnit,
  price: number,
) {
  return prisma.productVariant.upsert({
    where: {
      supplierId_productId_size_unit: { supplierId, productId, size, unit },
    },
    update: { price, isActive: true },
    create: { supplierId, productId, size, unit, price, isActive: true },
  });
}

// ---- seed: PDF price list
async function seedPriceListFromPdf(pdfPath: string) {
  const buf = fs.readFileSync(pdfPath);

  // NOTE: your pdf-parse usage is nonstandard; keep as-is if it works for you.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buf });
  const parsed = await parser.getText();
  const text = parsed.text;
  await parser.destroy();

  // ✅ suppliers will not duplicate (case-insensitive)
  const plascon = await upsertSupplier("Plascon");
  const dulux = await upsertSupplier("Dulux"); // stays canonical

  const lines: string[] = text
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  let created = 0;

  for (const line of lines) {
    if (/20\s*LITRES|5\s*LITRES|SPECIAL|01\/03\/2025/i.test(line)) continue;
    if (!/R\s*\d/.test(line)) continue;

    const prices = [...line.matchAll(/R\s*[\d\s]+,\d{2}/g)]
      .map((m) => parseZAR(m[0]))
      .filter((n): n is number => typeof n === "number");

    if (prices.length === 0) continue;

    const name = line.split(/R\s*\d/i)[0].trim();
    if (name.length < 3) continue;

    const first = name.split(/\s+/)[0];
    const shortcut = /^[A-Z]{1,4}\d{1,5}(-\d+)?$/i.test(first) ? first : null;

    const product = await upsertProduct(name, shortcut);

    // ✅ This PDF section you said is Plascon lines (adjust later if needed)
    await upsertSupplierProduct(plascon!.id, product.id);

    if (prices.length >= 2) {
      await upsertVariant(
        plascon!.id,
        product.id,
        20,
        MeasureUnit.L,
        prices[0],
      );
      await upsertVariant(plascon!.id, product.id, 5, MeasureUnit.L, prices[1]);
      created++;
    } else if (prices.length === 1) {
      await upsertVariant(
        plascon!.id,
        product.id,
        20,
        MeasureUnit.L,
        prices[0],
      );
      created++;
    }
  }

  console.log(`PDF seed done. Variants created/updated: ${created}`);
}

// ---- seed: Spread rates Excel
async function seedSpreadRatesFromXlsx(xlsxPath: string) {
  const wb = xlsx.readFile(xlsxPath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: "" }) as any[];
  // Print the first 10 parsed rows for inspection
  console.log("First 10 parsed Excel rows:");
  console.log(rows.slice(0, 10));

  let created = 0;

  // ✅ These upserts are now safe
  const marmoran = await upsertSupplier("MARMORAN"); // will become Marmoran
  const terraco = await upsertSupplier("TERRACO"); // will become Terraco

  const supplierMap: Record<string, string> = {
    MARMORAN: marmoran!.id,
    TERRACO: terraco!.id,
  };

  let currentSupplier: "MARMORAN" | "TERRACO" | null = null;
  let supplierId: string | null = null;

  function normalizeRow(row: any) {
    const norm: Record<string, string> = {};
    for (const key in row) {
      if (!key) continue;
      const normKey = key.replace(/\s+/g, "").toUpperCase();
      norm[normKey] = row[key];
    }
    return norm;
  }

  for (const r of rows) {
    const row = normalizeRow(r);
    const section = String(row["PRODUCT"] || "")
      .trim()
      .toUpperCase();

    if (section === "MARMORAN" || section === "TERRACO") {
      currentSupplier = section;
      supplierId = supplierMap[section];
      console.log(`\n--- Switched to supplier: ${section}`);
      continue;
    }

    if (!currentSupplier || !supplierId) continue;

    const productName = String(row["PRODUCT"] || "").trim();
    const rate = String(row["SPREADRATE"] || row["RATE"] || "").trim();
    if (!productName || !rate) continue;

    if (
      productName.toUpperCase() === "MARMORAN" ||
      productName.toUpperCase() === "TERRACO"
    )
      continue;

    // Debug: log each row being processed
    console.log({ supplier: currentSupplier, productName, rate });

    const product = await upsertProduct(productName, null);
    await upsertSupplierProduct(supplierId, product.id);

    const lower = rate.toLowerCase();
    const perCoat = /per\s*coat/i.test(lower);

    // 1) "Xm² per L/kg" => invert
    let m = lower.match(/(\d+(\.\d+)?)\s*m²\s*\/?\s*per\s*(l|kg)/);
    if (m) {
      const m2PerUnit = Number(m[1]);
      if (m2PerUnit > 0) {
        const consumption = 1 / m2PerUnit;
        const unit = m[3] === "kg" ? MeasureUnit.KG : MeasureUnit.L;
        console.log(
          `  Matched m² per unit: m2PerUnit=${m2PerUnit}, unit=${unit}, consumption=${consumption}`,
        );
        await prisma.spreadRate.create({
          data: {
            productId: product.id,
            consumption,
            unit,
            perCoat,
            notes: "Imported from m² per unit, inverted",
          },
        });
        created++;
        continue;
      }
    }

    // 2) "Xkg per m²" or "XL per m²"
    m = lower.match(/(\d+(\.\d+)?)\s*(kg|l)\s*\/?\s*per\s*m²/);
    if (m) {
      const consumption = Number(m[1]);
      const unit = m[3] === "kg" ? MeasureUnit.KG : MeasureUnit.L;
      console.log(
        `  Matched unit per m²: consumption=${consumption}, unit=${unit}`,
      );
      await prisma.spreadRate.create({
        data: { productId: product.id, consumption, unit, perCoat },
      });
      created++;
      continue;
    }

    // 3) "Xl/m²" or "xkg/m²"
    m = lower.match(/(\d+(\.\d+)?)\s*(kg|l)\s*\/\s*m²/);
    if (m) {
      const consumption = Number(m[1]);
      const unit = m[3] === "kg" ? MeasureUnit.KG : MeasureUnit.L;
      console.log(
        `  Matched x/unit/m²: consumption=${consumption}, unit=${unit}`,
      );
      await prisma.spreadRate.create({
        data: {
          productId: product.id,
          consumption,
          unit,
          perCoat,
          notes: "Imported from x/unit/m²",
        },
      });
      created++;
      continue;
    }

    // Debug: log if no pattern matched
    console.log(`  No spread rate pattern matched for: "${rate}"`);
  }

  console.log(`Spread rate seed done. Rates created: ${created}`);
}

async function main() {
  const pdfPath = path.resolve(
    process.cwd(),
    "prisma",
    "seed_data",
    "Plascon & Dulux March 2025.pdf",
  );
  const spreadPath = path.resolve(
    process.cwd(),
    "prisma",
    "seed_data",
    "Marmoran_&_Terraco_Spread_rates.xlsx",
  );

  await seedPriceListFromPdf(pdfPath);
  await seedSpreadRatesFromXlsx(spreadPath);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
