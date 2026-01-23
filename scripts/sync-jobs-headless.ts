// scripts/sync-jobs-headless.ts
// This script runs headless and posts jobs to the Vercel API automatically.
import "dotenv/config";
import { extractJobsFromExcel } from "@/lib/excel/jobSync";
import fetch from "node-fetch";

async function main() {
  const filePath = process.env.EXCEL_JOBS_PATH;
  const apiUrl = process.env.JOBS_RECEIVER_URL; // e.g. https://your-vercel-app.vercel.app/api/sync/jobs
  const syncToken = process.env.EXCEL_SYNC_TOKEN;

  if (!filePath) {
    console.error("Missing EXCEL_JOBS_PATH in your env.");
    process.exit(1);
  }
  if (!apiUrl) {
    console.error("Missing JOBS_RECEIVER_URL in your env.");
    process.exit(1);
  }
  if (!syncToken) {
    console.error("Missing EXCEL_SYNC_TOKEN in your env.");
    process.exit(1);
  }

  let jobs: any[] = [];
  try {
    jobs = extractJobsFromExcel({ filePath });
  } catch (e: any) {
    console.error("Failed to extract jobs from Excel:", e?.message || e);
    process.exit(1);
  }
  if (!jobs.length) {
    console.log("No jobs found to sync.");
    process.exit(0);
  }
  // POST jobs to Vercel
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-token": syncToken,
      },
      body: JSON.stringify({ jobs }),
    });
    const data: any = await res.json();
    if (!res.ok) {
      console.error("Sync failed:", data && data.error ? data.error : data);
      process.exit(1);
    }
    console.log("Sync result:", data);
  } catch (e: any) {
    console.error("Failed to POST jobs to API:", e?.message || e);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
