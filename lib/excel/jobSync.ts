// Extract jobs from Excel for office agent (no DB writes)
import type { IncomingJob } from "@/app/api/sync/jobs/route";
export async function extractJobsFromExcel(input: {
  filePath: string;
  sheetName?: string;
}): Promise<IncomingJob[]> {
  const xlsx = require("xlsx");
  const path = require("path");
  let wb;
  try {
    wb = xlsx.readFile(input.filePath, { cellDates: true });
  } catch (e: any) {
    throw new Error(
      `Failed to read Excel: ${e && e.message ? e.message : String(e)}`,
    );
  }
  const sheetNames = wb.SheetNames || [];
  if (sheetNames.length === 0) throw new Error("Workbook has no sheets");
  const selectedSheetName =
    input.sheetName && sheetNames.includes(input.sheetName)
      ? input.sheetName
      : sheetNames[0];
  const ws = wb.Sheets[selectedSheetName];
  if (!ws) throw new Error("Selected sheet not found");
  const rows = xlsx.utils.sheet_to_json(ws, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });
  if (rows.length < 2) return [];
  const headerRow = rows[0].map((h: any) => String(h || "").trim());
  // Map headers to canonical keys
  const HEADER_ALIASES: { [key: string]: string } = {
    job: "jobNumber",
    "job number": "jobNumber",
    "job nr": "jobNumber",
    "job no": "jobNumber",
    "job no.": "jobNumber",
    "job #": "jobNumber",
    "job#": "jobNumber",
    "job name": "siteName",
    company: "client",
    client: "client",
    supervis: "managerName",
    supervisor: "managerName",
    specsRecieved: "specsReceived",
  };
  function normalizeHeader(s: string) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }
  const headerMap = new Map();
  headerRow.forEach((h: string, idx: number) => {
    const nh = normalizeHeader(h);
    const canonical = (HEADER_ALIASES as any)[nh];
    if (canonical && !headerMap.has(canonical)) headerMap.set(canonical, idx);
  });
  const jobNumberIdx = headerMap.get("jobNumber");
  const siteNameIdx = headerMap.get("siteName");
  const clientIdx = headerMap.get("client");
  const managerNameIdx = headerMap.get("managerName");
  const jobs: IncomingJob[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const jobNumber = row[jobNumberIdx]
      ? String(row[jobNumberIdx]).replace(/\.0$/, "").trim()
      : "";
    const siteName = row[siteNameIdx] ? String(row[siteNameIdx]).trim() : "";
    const client =
      clientIdx !== undefined ? String(row[clientIdx] || "").trim() : undefined;
    const managerNameRaw =
      managerNameIdx !== undefined
        ? String(row[managerNameIdx] || "").trim()
        : undefined;
    let managerId: string | null = null;
    if (managerNameRaw) {
      managerId = await findManagerIdByName(managerNameRaw);
    }
    if (!jobNumber || !siteName) continue;
    jobs.push({ jobNumber, siteName, client, managerNameRaw, managerId });
  }
  return jobs;
}
// src/lib/excel/jobSync.ts
import path from "node:path";
import * as xlsx from "xlsx";
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
  dryRun?: boolean;
  wouldCreate?: number;
  wouldUpdate?: number;
  skippedBelowMin?: number;
};

function normalizeHeader(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


function normalizeName(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

const HEADER_ALIASES: Record<string, string> = {
  // jobNumber
  job: "jobNumber",
  "job number": "jobNumber",
  "job nr": "jobNumber",
  "job no": "jobNumber",
  "job no.": "jobNumber",
  "job #": "jobNumber",
  "job#": "jobNumber",

  // siteName
  "job name": "siteName",

  // client
  company: "client",
  client: "client",

  // managerNameRaw
  supervis: "managerName",
  supervisor: "managerName",

  // specsReceived
  specsrecieved: "specsReceived",
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

function getVal(row: any[], idx?: number) {
  if (typeof idx !== "number" || idx < 0) return "";
  return String(row[idx] ?? "").trim();
}


function toStringSafe(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

async function findManagerIdByName(rawManager: string) {
  // Stricter normalization: trim, collapse spaces, lowercase
  const name = normalizeName(rawManager);
  if (!name) {
    console.log(
      `[ManagerLookup] Empty manager name after normalization for raw: '${rawManager}'`,
    );
    return null;
  }

  // Print all manager names in DB for debugging
  const allManagers = await prisma.manager.findMany({
    select: { id: true, name: true },
  });
  const normalizedManagers = allManagers.map((m) => ({
    id: m.id,
    name: m.name,
    normalized: normalizeName(m.name),
  }));
  console.log(`[ManagerLookup] Looking for: '${name}' (raw: '${rawManager}')`);
  console.log(`[ManagerLookup] All managers:`, normalizedManagers);

  // Try to match normalized name
  const found = normalizedManagers.find((m) => m.normalized === name);
  if (found) {
    console.log(`[ManagerLookup] Match found:`, found);
    return found.id;
  }

  // Fallback: DB query (case-insensitive, just in case)
  const m = await prisma.manager.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (m) {
    console.log(`[ManagerLookup] DB match found for '${name}':`, m);
    return m.id;
  }

  console.log(`[ManagerLookup] No match for: '${name}' (raw: '${rawManager}')`);
  return null;
}



export async function syncJobsFromExcel(input: SyncInput) {

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
  console.log("Excel header row:", headerRow);
  const headerMap = mapHeaders(headerRow);
  console.log("HeaderMap:", Array.from(headerMap.entries()));

  const jobNumberIdx = headerMap.get("jobNumber");
  const siteNameIdx = headerMap.get("siteName");
  const clientIdx = headerMap.get("client");
  const managerNameIdx = headerMap.get("managerName");
  const specsReceivedIdx = headerMap.get("specsReceived");

  const errors: SyncError[] = [];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let protectedAppJobs = 0;
  let wouldCreate = 0;
  let wouldUpdate = 0;
  let skippedBelowMin = 0;

  // Helper for skip logging
  function explainSkip(rowIndex: number, reason: string, row: any) {
    if (skipped < 10) {
      console.log(`[SKIP row ${rowIndex}] ${reason}`);
      console.log("Row sample:", row);
      console.log("----");
    }
  }

  const seenJobNumbers = new Set<string>();
  const now = new Date();

  // Read min job number threshold from env
  const minJobNum = Number.parseInt(
    process.env.EXCEL_MIN_JOB_NUMBER || "0",
    10,
  );

  // Make the loop async to allow await inside
  await (async () => {
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const excelRowNumber = i + 1; // 1-based, includes header row
      const rowRef = `${selectedSheetName}:R${excelRowNumber}`;
      try {
        let jobNumber = getVal(row, jobNumberIdx).replace(/\.0$/, "");
        if (i <= 10) {
          const rawJobNum =
            typeof jobNumberIdx === "number" && jobNumberIdx >= 0
              ? row[jobNumberIdx]
              : undefined;
          console.log(
            `[DEBUG] Row ${excelRowNumber} jobNumber:`,
            jobNumber,
            "Raw:",
            rawJobNum,
          );
        }
        let siteName = getVal(row, siteNameIdx);
        let client = getVal(row, clientIdx) || null;
        let specsReceivedRaw = getVal(row, specsReceivedIdx);
        let specsReceived: Date | null = null;
        let managerNameRaw = getVal(row, managerNameIdx) || null;
        let managerId: string | null = null;
        if (managerNameRaw) {
          managerId = await findManagerIdByName(managerNameRaw);
        }
        if (!jobNumber) {
          skipped++;
          explainSkip(excelRowNumber, "Missing jobNumber", row);
          continue;
        }
        if (!siteName) {
          skipped++;
          explainSkip(excelRowNumber, "Missing siteName", row);
          continue;
        }

        // Only allow jobs with jobNumber >= minJobNum
        const jobNumberInt = parseInt(jobNumber, 10);
        if (isNaN(jobNumberInt) || jobNumberInt < minJobNum) {
          skippedBelowMin++;
          explainSkip(
            excelRowNumber,
            `Job number below min (${minJobNum})`,
            row,
          );
          continue;
        }

        seenJobNumbers.add(jobNumber);

        // Only add new jobs, skip if exists
        const existing = await prisma.job.findUnique({
          where: { jobNumber },
          select: { id: true, source: true },
        });

        if (existing) {
          // Skip existing jobs, do not update
          skipped++;
          explainSkip(excelRowNumber, "Job already exists", row);
          continue;
        }

        // Dry run logic
        if (input.dryRun) {
          wouldCreate++;
          continue;
        }

        // Real DB write: only create
        await prisma.job.create({
          data: {
            jobNumber,
            siteName,
            client,
            source: JobSource.EXCEL,
            importedAt: now,
            excelFileName: fileName,
            excelSheetName: selectedSheetName,
            excelRowRef: rowRef,
            managerNameRaw,
            managerId, // <-- link to Manager
            specsReceived: !!specsReceivedRaw,
          },
          select: { id: true, createdAt: true, updatedAt: true },
        });
        created++;
      } catch (e: any) {
        errors.push({
          rowRef,
          message: e?.message || String(e),
        });
      }
    }
  })();

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
    skippedBelowMin,
  };

  if (skippedBelowMin > 0) {
    console.log(
      `SkippedBelowMin: ${skippedBelowMin} (min job number: ${minJobNum})`,
    );
  }
  return {
    success: errors.length === 0,
    summary,
    errors,
  };
}
