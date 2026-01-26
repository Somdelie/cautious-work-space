// scripts/sync-jobs-dev.ts
import "dotenv/config";
import { syncJobsFromExcel } from "../lib/index";

async function main() {
  const filePath = process.env.EXCEL_JOBS_PATH;

  if (!filePath) {
    console.error("Missing EXCEL_JOBS_PATH in your env.");
    process.exit(1);
  }

  const res = await syncJobsFromExcel({ filePath });

  console.log("\n--- Excel → Jobs Sync Result ---");
  console.log(JSON.stringify(res.summary, null, 2));

  if (res.errors?.length) {
    console.log("\nErrors:");
    for (const e of res.errors.slice(0, 50)) {
      console.log(`- ${e.rowRef}: ${e.message}`);
    }
  }

  process.exit(res.success ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
