import chokidar from "chokidar";
import path from "node:path";
import { syncJobsFromExcel } from "@/lib/excel/jobSync";

import "dotenv/config";

const filePath = process.env.EXCEL_JOBS_PATH;
if (!filePath) {
  console.error("Missing EXCEL_JOBS_PATH in your env.");
  process.exit(1);
}
const filePathStr = filePath as string;

let running = false;

async function runSync() {
  if (running) return;
  running = true;

  try {
    const res = await syncJobsFromExcel({
      filePath: filePathStr,
      fileName: path.basename(filePathStr),
      dryRun: false,
      sheetName: "Proj Data", // optional: choose sheet
    });

    console.log("\n--- WATCH SYNC RESULT ---");
    console.log(JSON.stringify(res.summary, null, 2));
    if (res.errors?.length) {
      console.log("Errors:", res.errors.slice(0, 5));
    }
  } catch (e) {
    console.error("Watch sync failed:", e);
  } finally {
    running = false;
  }
}

console.log("Watching:", filePathStr);
chokidar.watch(filePathStr, { ignoreInitial: true }).on("change", async () => {
  console.log("Excel changed → syncing...");
  await runSync();
});

// Optional: run once immediately
runSync();

// Also run sync every 2 minutes (120,000 ms)
setInterval(
  () => {
    console.log("Scheduled sync (2 minutes)...");
    runSync();
  },
  2 * 60 * 1000,
);
