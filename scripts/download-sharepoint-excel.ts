// scripts/download-sharepoint-excel.ts
import fs from "fs";
import fetch from "node-fetch";

const SHAREPOINT_URL =
  "https://firstclassprojects-my.sharepoint.com/:x:/r/personal/cautious_firstclassprojects_co_za/_layouts/15/Doc.aspx?sourcedoc=%7BB675F493-32F1-4084-B2D0-4B8D2CBEC3E1%7D&file=Test_Job_Sync_Spreadsheet%201.xlsx&action=default&mobileredirect=true";
const LOCAL_PATH =
  process.env.EXCEL_JOBS_PATH || "./downloaded_sharepoint.xlsx";

if (!SHAREPOINT_URL) {
  console.error("Missing SHAREPOINT_EXCEL_URL in your .env file.");
  process.exit(1);
}

async function downloadExcel() {
  try {
    const res = await fetch(SHAREPOINT_URL, {
      // If authentication is needed, add headers here
      // headers: { 'Authorization': 'Bearer <token>' }
    });
    if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);
    const buffer = await res.buffer();
    fs.writeFileSync(LOCAL_PATH, buffer);
    console.log(`Downloaded Excel to ${LOCAL_PATH}`);
  } catch (e) {
    console.error("Download failed:", e);
    process.exit(1);
  }
}

downloadExcel();
