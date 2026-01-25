import { NextResponse } from "next/server";
import { syncJobsFromExcel } from "@/lib/excel/jobSync";

export async function POST() {
  try {
    const filePath = process.env.EXCEL_JOBS_PATH;
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: "EXCEL_JOBS_PATH not set" },
        { status: 500 },
      );
    }
    // Capture logs
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: any[]) => {
      const msg = args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2)))
        .join(" ");
      logs.push(msg);
      origLog.apply(console, args);
    };
    let summary;
    try {
      summary = await syncJobsFromExcel({ filePath });
    } finally {
      console.log = origLog;
    }
    return NextResponse.json({ success: true, summary, logs });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Sync failed" },
      { status: 500 },
    );
  }
}
