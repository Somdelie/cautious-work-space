import xlsx from "xlsx";
import path from "node:path";
import fs from "node:fs";

const VERCEL_SYNC_URL = process.env.VERCEL_SYNC_URL; // e.g. https://your-app.vercel.app/api/sync/jobs
const SYNC_TOKEN = process.env.EXCEL_SYNC_TOKEN;     // same token as Vercel
const EXCEL_PATH = process.env.EXCEL_PATH;           // e.g. "\\\\SERVER\\Share\\Contract Data Outstanding Money.xlsx"

if (!VERCEL_SYNC_URL || !SYNC_TOKEN || !EXCEL_PATH) {
  console.error("Missing env vars: VERCEL_SYNC_URL, EXCEL_SYNC_TOKEN, EXCEL_PATH");
  process.exit(1);
}

if (!fs.existsSync(EXCEL_PATH)) {
  console.error("Excel file not found:", EXCEL_PATH);
  process.exit(1);
}

const wb = xlsx.readFile(EXCEL_PATH, { cellDates: true });
const sheetName = wb.SheetNames[0]; // or specify by env var later
const ws = wb.Sheets[sheetName];

const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });

// TODO: map columns exactly to your sheet columns
// Example expected headers: "Job Number", "Job Name", "Client", "Manager"
function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") return row[k];
  }
  return "";
}

const jobs = rows
  .map((r, idx) => {
    const jobNumber = String(pick(r, "Job Number", "JobNumber", "JOB NUMBER")).trim();
    const siteName = String(pick(r, "Job Name", "Site Name", "JobName")).trim();
    const client = String(pick(r, "Client", "CLIENT")).trim() || null;
    const managerNameRaw = String(pick(r, "Manager", "Manager Name")).trim() || null;

    if (!jobNumber || !siteName) return null;

    return {
      jobNumber,
      siteName,
      client,
      managerNameRaw,
      excelFileName: path.basename(EXCEL_PATH),
      excelSheetName: sheetName,
      excelRowRef: `row:${idx + 2}`, // +2 because header row + 1-based excel rows
    };
  })
  .filter(Boolean);

console.log(`Prepared ${jobs.length} jobs from Excel`);

const res = await fetch(VERCEL_SYNC_URL, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-sync-token": SYNC_TOKEN,
  },
  body: JSON.stringify({ jobs }),
});

const data = await res.json();
if (!res.ok) {
  console.error("Sync failed:", data);
  process.exit(1);
}

console.log("Sync OK:", data);
