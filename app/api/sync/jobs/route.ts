import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

// ✅ Simple shared-secret auth (set this in Vercel + your office PC env)
function verifyToken(req: Request) {
  const token = req.headers.get("x-sync-token");
  const expected = process.env.EXCEL_SYNC_TOKEN;
  if (!expected) throw new Error("Missing EXCEL_SYNC_TOKEN env var on server");
  return (
    token && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  );
}

type IncomingJob = {
  jobNumber: string;
  siteName: string;
  client?: string | null;

  // optional fields from excel
  managerNameRaw?: string | null;

  // excel tracking
  excelFileName?: string | null;
  excelSheetName?: string | null;
  excelRowRef?: string | null;
};

export async function POST(req: Request) {
  try {
    if (!verifyToken(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { jobs: IncomingJob[] };

    if (!body?.jobs?.length) {
      return NextResponse.json({ error: "Missing jobs[]" }, { status: 400 });
    }

    const now = new Date();

    // ✅ Upsert by jobNumber (unique)
    const results = await prisma.$transaction(
      body.jobs.map((j) => {
        const jobNumber = String(j.jobNumber || "").trim();
        const siteName = String(j.siteName || "").trim();

        if (!jobNumber || !siteName) {
          // skip invalid row
          return prisma.job.findFirst({ where: { id: "__never__" } });
        }

        return prisma.job.upsert({
          where: { jobNumber },
          update: {
            siteName,
            client: j.client ?? null,

            source: "EXCEL",
            importedAt: now,
            excelFileName: j.excelFileName ?? null,
            excelSheetName: j.excelSheetName ?? null,
            excelRowRef: j.excelRowRef ?? null,

            // manager chosen in excel (raw text for now)
            managerNameRaw: j.managerNameRaw ?? null,

            // IMPORTANT: don't overwrite managerId/supplierId from app if already set.
            // Keep these as-is unless you explicitly want excel to control them too.
          },
          create: {
            jobNumber,
            siteName,
            client: j.client ?? null,

            source: "EXCEL",
            importedAt: now,
            excelFileName: j.excelFileName ?? null,
            excelSheetName: j.excelSheetName ?? null,
            excelRowRef: j.excelRowRef ?? null,
            managerNameRaw: j.managerNameRaw ?? null,
          },
          select: { id: true, jobNumber: true },
        });
      }),
    );

    // results includes placeholders for skipped rows; filter them
    const saved = results.filter(Boolean);

    return NextResponse.json({ success: true, count: saved.length, saved });
  } catch (err: any) {
    console.error("EXCEL SYNC FAILED:", err?.message ?? err);

    // Optional: alert on failure (Slack webhook or email)
    // await notifySlack(...)

    return NextResponse.json(
      { success: false, error: err?.message ?? "Sync failed" },
      { status: 500 },
    );
  }
}
