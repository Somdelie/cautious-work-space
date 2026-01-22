import fs from "node:fs";
import path from "node:path";

import xlsx from "xlsx";
import { prisma } from "../lib/prisma";
import { MeasureUnit } from "@prisma/client";

// ---- helpers
function parseZAR(raw: string): number | null {
  // "R 1 507,89" -> 1507.89
  const m = raw.match(/R\s*([\d\s]+,\d{2})/i);
  if (!m) return null;
  const cleaned = m[1].replace(/\s+/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function upsertSupplier(name: string) {
  return prisma.supplier.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

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
    create: {
      supplierId,
      productId,
      size,
      unit,
      price,
      isActive: true,
    },
  });
}

// ---- seed: PDF price list
async function seedPriceListFromPdf(pdfPath: string) {
  const buf = fs.readFileSync(pdfPath);
  // Dynamically import PDFParse class from pdf-parse
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buf });
  const parsed = await parser.getText();
  const text = parsed.text;
  await parser.destroy();

  // We'll seed two suppliers as buckets (you can refine later)
  const plascon = await upsertSupplier("Plascon");
  const dulux = await upsertSupplier("Dulux");

  // Heuristic parser: looks for lines like:
  // "UC2 WOOD PRIMER - PINK R 369,18 ... R 326,06"
  // We’ll treat these as Plascon lines first; you can split by sections later if needed.
  interface PdfParseResult {
    text: string;
    // pdf-parse returns more, but we only use text here
  }

  const lines: string[] = text
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  let created = 0;

  for (const line of lines) {
    // skip obvious headers
    if (/20\s*LITRES|5\s*LITRES|SPECIAL|01\/03\/2025/i.test(line)) continue;

    // must contain a price
    if (!/R\s*\d/.test(line)) continue;

    // Extract two prices if present (20L and 5L)
    const prices = [...line.matchAll(/R\s*[\d\s]+,\d{2}/g)]
      .map((m) => parseZAR(m[0]))
      .filter((n): n is number => typeof n === "number");

    if (prices.length === 0) continue;

    // Product name is everything before first " R ..."
    const name = line.split(/R\s*\d/i)[0].trim();
    if (name.length < 3) continue;

    // crude shortcut: first token if it looks like a code (e.g. UC2, PP700)
    const first = name.split(/\s+/)[0];
    const shortcut = /^[A-Z]{1,4}\d{1,5}(-\d+)?$/i.test(first) ? first : null;

    const product = await upsertProduct(name, shortcut);
    await upsertSupplierProduct(plascon.id, product.id);

    // If 2 prices exist, assume [20L, 5L] in that order (matches the PDF header)
    // If 1 price exists, seed only 20L (common in the list)
    if (prices.length >= 2) {
      await upsertVariant(plascon.id, product.id, 20, MeasureUnit.L, prices[0]);
      await upsertVariant(plascon.id, product.id, 5, MeasureUnit.L, prices[1]);
      created++;
    } else if (prices.length === 1) {
      await upsertVariant(plascon.id, product.id, 20, MeasureUnit.L, prices[0]);
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

  // Expect columns like: Product, Size(s), Rate (as per your screenshot)
  // We'll just look for rows that have product name + a rate pattern like "3kg/per m²" or "8m²/ per L"
  let created = 0;

  for (const r of rows) {
    const productName = String(
      r["Product"] || r["PRODUCT"] || r["Name"] || r[""] || "",
    ).trim();
    const rate = String(r["Rate"] || r["RATE"] || r["Spread"] || "").trim();

    if (!productName || !rate) continue;

    // Find or create product globally (spread rates are per product)
    const product = await upsertProduct(productName, null);

    // Normalize to "units per m²"
    // Examples:
    // "3kg/per m²" => consumption=3, unit=KG
    // "8m²/ per L" => invert => 1/8 L per m²
    const lower = rate.toLowerCase();

    let perCoat = /per\s*coat/i.test(lower);

    // case 1: "Xkg per m²" or "XL per m²"
    let m = lower.match(/(\d+(\.\d+)?)\s*(kg|l)\s*\/?\s*per\s*m²/);
    if (m) {
      const consumption = Number(m[1]);
      const unit = m[3] === "kg" ? MeasureUnit.KG : MeasureUnit.L;

      await prisma.spreadRate.create({
        data: { productId: product.id, consumption, unit, perCoat },
      });
      created++;
      continue;
    }

    // case 2: "Xm² per L"  => invert
    m = lower.match(/(\d+(\.\d+)?)\s*m²\s*\/\s*per\s*(l|kg)/);
    if (m) {
      const m2PerUnit = Number(m[1]);
      if (m2PerUnit > 0) {
        const consumption = 1 / m2PerUnit;
        const unit = m[3] === "kg" ? MeasureUnit.KG : MeasureUnit.L;

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
  }

  console.log(`Spread rate seed done. Rates created: ${created}`);
}

async function main() {
  // IMPORTANT: update paths to where your files are
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
