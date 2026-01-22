// scripts/excel-sync-watcher.ts
import "dotenv/config";
import { syncJobsFromExcel } from "@/lib/excel/jobSync";

const filePath = process.env.EXCEL_JOBS_PATH;
if (!filePath) {
  console.error("Missing EXCEL_JOBS_PATH in your env.");
  process.exit(1);
}

async function runSync() {
  const res = await syncJobsFromExcel({ filePath });
  console.log(
    `\n[${new Date().toLocaleTimeString()}] Excel → Jobs Sync Result:`,
  );
  console.log(JSON.stringify(res.summary, null, 2));
  if (res.errors?.length) {
    console.log("Errors:");
    for (const e of res.errors.slice(0, 10)) {
      console.log(`- ${e.rowRef}: ${e.message}`);
    }
  }
}

console.log("Starting Excel sync watcher (interval: 30s)...");
runSync();
setInterval(runSync, 30 * 1000); // 30 seconds
