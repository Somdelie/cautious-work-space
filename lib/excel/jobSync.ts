// src/lib/excel/jobSync.ts
import path from "node:path";
import xlsx from "xlsx";
import { prisma } from "../prisma";
import { JobSource } from "@prisma/client";

type SyncInput = {
  filePath?: string;
  buffer?: Buffer;
  fileName?: string;
  sheetName?: string; // optional: pick a specific sheet
  dryRun?: boolean; // ✅ add this
};

type SyncError = {
  rowRef: string;
  jobNumber?: string;
  message: string;
};

type SyncSummary = {
  fileName: string;
  sheetNames: string[];
  rowsRead: number;
  rowsSkipped: number;
  created: number;
  updated: number;
  protectedAppJobs: number;
  errors: number;
  dryRun?: boolean; // ✅ optional
  wouldCreate?: number; // ✅ optional
  wouldUpdate?: number; // ✅ optional
};

function normalizeHeader(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeJobNumber(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeName(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

const HEADER_ALIASES: Record<string, string> = {
  // jobNumber
  "job number": "jobNumber",
  "job no": "jobNumber",
  "job no.": "jobNumber",
  "job #": "jobNumber",
  "job#": "jobNumber",
  job: "jobNumber",
  jobnum: "jobNumber",

  // siteName
  "site name": "siteName",
  site: "siteName",
  project: "siteName",
  "project name": "siteName",
  "site/project": "siteName",

  // client
  client: "client",
  "client name": "client",
  company: "client",
  "company name": "client",
  customer: "client",

  // manager
  manager: "managerName",
  "manager name": "managerName",
  "project manager": "managerName",
  pm: "managerName",

  // supplier
  supplier: "supplierName",
  "supplier name": "supplierName",
};

function mapHeaders(rawHeaders: string[]) {
  // returns map of canonicalKey -> columnIndex
  const map = new Map<string, number>();
  rawHeaders.forEach((h, idx) => {
    const nh = normalizeHeader(h);
    const canonical = HEADER_ALIASES[nh];
    if (canonical && !map.has(canonical)) map.set(canonical, idx);
  });
  return map;
}

function getCell(row: any[], idx?: number) {
  if (idx === undefined) return "";
  return row[idx];
}

function toStringSafe(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

async function findManagerIdByName(rawManager: string) {
  const name = normalizeName(rawManager);
  if (!name) return null;

  // basic case-insensitive match
  const m = await prisma.manager.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });

  return m?.id ?? null;
}

async function findSupplierIdByName(rawSupplier: string) {
  const name = normalizeName(rawSupplier);
  if (!name) return null;

  const s = await prisma.supplier.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });

  return s?.id ?? null;
}

function isTruthyFlag(v: any): boolean | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (!s) return null;
  if (["yes", "y", "true", "1"].includes(s)) return true;
  if (["no", "n", "false", "0"].includes(s)) return false;
  return null;
}

export async function syncJobsFromExcel(input: SyncInput) {
  const allowOverwrite =
    String(process.env.ALLOW_EXCEL_OVERWRITE || "false").toLowerCase() ===
    "true";

  if (!input.filePath && !input.buffer) {
    return {
      success: false,
      summary: null as any,
      errors: [{ rowRef: "N/A", message: "Provide filePath or buffer" }],
    };
  }

  const fileName =
    input.fileName ||
    (input.filePath ? path.basename(input.filePath) : "uploaded.xlsx");

  let wb: xlsx.WorkBook;
  try {
    if (input.buffer) {
      wb = xlsx.read(input.buffer, { type: "buffer", cellDates: true });
    } else {
      wb = xlsx.readFile(input.filePath!, { cellDates: true });
    }
  } catch (e: any) {
    return {
      success: false,
      summary: null as any,
      errors: [
        {
          rowRef: "N/A",
          message: `Failed to read Excel: ${e?.message || String(e)}`,
        },
      ],
    };
  }

  const sheetNames = wb.SheetNames || [];
  if (sheetNames.length === 0) {
    return {
      success: false,
      summary: null as any,
      errors: [{ rowRef: "N/A", message: "Workbook has no sheets" }],
    };
  }

  const selectedSheetName = input.sheetName
    ? sheetNames.includes(input.sheetName)
      ? input.sheetName
      : sheetNames[0]
    : sheetNames[0];

  const ws = wb.Sheets[selectedSheetName];
  if (!ws) {
    return {
      success: false,
      summary: null as any,
      errors: [{ rowRef: "N/A", message: "Selected sheet not found" }],
    };
  }

  // Read as arrays to preserve row numbers
  const rows = xlsx.utils.sheet_to_json(ws, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  }) as any[][];

  if (rows.length < 2) {
    return {
      success: true,
      summary: {
        fileName,
        sheetNames,
        rowsRead: rows.length,
        rowsSkipped: 0,
        created: 0,
        updated: 0,
        protectedAppJobs: 0,
        errors: 0,
      } satisfies SyncSummary,
      errors: [],
    };
  }

  const headerRow = rows[0].map((h) => toStringSafe(h));
  const headerMap = mapHeaders(headerRow);

  const jobNumberIdx = headerMap.get("jobNumber");
  const siteNameIdx = headerMap.get("siteName");
  const clientIdx = headerMap.get("client");
  const managerNameIdx = headerMap.get("managerName");
  const supplierNameIdx = headerMap.get("supplierName");

  const errors: SyncError[] = [];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let protectedAppJobs = 0;
  let wouldCreate = 0;
  let wouldUpdate = 0;

  // Basic duplicate detection within this sheet
  const seenJobNumbers = new Set<string>();
  const now = new Date();

  function explainSkip(rowIndex: number, reason: string, row: any) {
    if (skipped < 10) {
      console.log(`[SKIP row ${rowIndex}] ${reason}`);
      if (Array.isArray(row)) {
        console.log("Row sample:", row);
      } else {
        console.log("Row keys:", Object.keys(row));
        console.log("Row sample:", row);
      }
      console.log("----");
    }
  }

  // Helper to pick value from possible keys
  function pick(row: any, keys: string[]) {
    if (Array.isArray(row)) return "";
    for (const k of keys) {
      if (
        row[k] !== undefined &&
        row[k] !== null &&
        String(row[k]).trim() !== ""
      ) {
        return row[k];
      }
    }
    return "";
  }

  // Convert rows to object if possible (header-based)
  let objectRows: any[] = [];
  if (rows.length > 1 && rows[0].length > 0) {
    const headers = rows[0].map((h: any) => String(h).trim());
    for (let i = 1; i < rows.length; i++) {
      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = rows[i][j];
      }
      objectRows.push(obj);
    }
  }

  for (let i = 0; i < objectRows.length; i++) {
    const r = objectRows[i];
    const excelRowNumber = i + 2; // 1-based, includes header row
    const rowRef = `${selectedSheetName}:R${excelRowNumber}`;

    try {
      // Flexible mapping
      const jobNumberRaw = pick(r, [
        "Job",
        "JOB",
        "Job No",
        "Job#",
        "Job Number",
        "jobNumber",
      ]);
      const siteNameRaw = pick(r, [
        "Job Name",
        "JOB NAME",
        "Site Name",
        "Project",
        "Project Name",
        "siteName",
      ]);
      const clientRaw = pick(r, [
        "Company",
        "COMPANY",
        "Client",
        "Client/Company",
        "client",
      ]);
      const managerRaw = pick(r, [
        "Supervisor",
        "Supervis",
        "Manager",
        "Supervisor Name",
        "managerName",
      ]);

      let jobNumber = String(jobNumberRaw ?? "").trim();
      // Remove trailing .0 if present (Excel sometimes outputs numbers as floats)
      jobNumber = jobNumber.replace(/\.0$/, "");
      const siteName = String(siteNameRaw ?? "").trim();
      const client = String(clientRaw ?? "").trim() || null;
      const managerNameRaw = String(managerRaw ?? "").trim() || null;

      if (!jobNumber) {
        skipped++;
        explainSkip(excelRowNumber, "Missing jobNumber", r);
        continue;
      }
      if (!siteName) {
        skipped++;
        explainSkip(excelRowNumber, "Missing siteName", r);
        continue;
      }

      seenJobNumbers.add(jobNumber);

      // Manager/Supplier mapping (optional)
      const managerId = managerNameRaw
        ? await findManagerIdByName(managerNameRaw)
        : null;
      // Supplier mapping can be added similarly if needed

      const existing = await prisma.job.findUnique({
        where: { jobNumber },
        select: { id: true, source: true },
      });

      if (existing && existing.source === JobSource.APP && !allowOverwrite) {
        protectedAppJobs++;
        continue;
      }

      // Dry run logic
      if (!existing) {
        if (input.dryRun) {
          wouldCreate++;
          continue;
        }
      } else {
        if (input.dryRun) {
          wouldUpdate++;
          continue;
        }
      }

      // Real DB write
      const result = await prisma.job.upsert({
        where: { jobNumber },
        create: {
          jobNumber,
          siteName,
          client,
          source: JobSource.EXCEL,
          importedAt: now,
          excelFileName: fileName,
          excelSheetName: selectedSheetName,
          excelRowRef: rowRef,
          managerId: managerId ?? null,
          managerNameRaw: managerId ? null : managerNameRaw || null,
        },
        update: {
          siteName,
          client,
          source: JobSource.EXCEL,
          importedAt: now,
          excelFileName: fileName,
          excelSheetName: selectedSheetName,
          excelRowRef: rowRef,
          managerId: managerId ?? null,
          managerNameRaw: managerId ? null : managerNameRaw || null,
        },
        select: { id: true, createdAt: true, updatedAt: true },
      });

      if (!existing) created++;
      else updated++;
    } catch (e: any) {
      errors.push({
        rowRef,
        message: e?.message || String(e),
      });
    }
  }

  const summary: SyncSummary = {
    fileName,
    sheetNames,
    rowsRead: rows.length - 1, // exclude header
    rowsSkipped: skipped,
    created: input.dryRun ? 0 : created,
    updated: input.dryRun ? 0 : updated,
    protectedAppJobs,
    errors: errors.length,
    dryRun: !!input.dryRun,
    wouldCreate: input.dryRun ? wouldCreate : 0,
    wouldUpdate: input.dryRun ? wouldUpdate : 0,
  };

  return {
    success: errors.length === 0,
    summary,
    errors,
  };
}
