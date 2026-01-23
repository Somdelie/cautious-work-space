// app/api/sync/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { JobSource } from "@prisma/client";

type DebugFileInfo = {
  name: string;
  ext: string | null;
  size: number | null;
  isFile?: boolean;
  isDirectory?: boolean;
  created: Date | null;
  modified: Date | null;
  error: string | null;
};

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function verifyToken(req: Request) {
  const token = req.headers.get("x-sync-token") || "";
  const expected = process.env.EXCEL_SYNC_TOKEN || "";
  if (!expected) throw new Error("Missing EXCEL_SYNC_TOKEN on server");
  return safeEqual(token, expected);
}

export async function GET() {
  // Guard: never allow UNC/file access on Vercel
  return NextResponse.json({ error: "UNC/file access is disabled in production." }, { status: 403 });
}



export type IncomingJob = {
  jobNumber: string;
  siteName: string;
  client?: string;
  managerNameRaw?: string;
  managerId?: string | null;
  supplierId?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    if (process.env.ALLOW_UNC_READ === "true") {
      // Guard: never allow UNC/file access on Vercel
      return NextResponse.json({ error: "UNC/file access is not allowed in production." }, { status: 403 });
    }
    if (!verifyToken(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const jobs = body && Array.isArray(body.jobs) ? body.jobs : null;
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: "Request body must be { jobs: IncomingJob[] }" }, { status: 400 });
    }
    let created = 0;
    let updated = 0;
    let errors: { jobNumber: string; message: string }[] = [];
    const now = new Date();
    for (const job of jobs) {
      try {
        if (!job.jobNumber || !job.siteName) {
          errors.push({ jobNumber: job.jobNumber || "", message: "Missing jobNumber or siteName" });
          continue;
        }
        const existing = await prisma.job.findUnique({ where: { jobNumber: job.jobNumber }, select: { id: true, source: true, managerId: true, supplierId: true } });
        if (existing && existing.source === JobSource.APP) {
          // Do not overwrite jobs created in the app
          continue;
        }
        await prisma.job.upsert({
          where: { jobNumber: job.jobNumber },
          create: {
            jobNumber: job.jobNumber,
            siteName: job.siteName,
            client: job.client || null,
            source: JobSource.EXCEL,
            importedAt: now,
            managerNameRaw: job.managerNameRaw || null,
            managerId: job.managerId || null,
            supplierId: job.supplierId || null,
          },
          update: {
            siteName: job.siteName,
            client: job.client || null,
            importedAt: now,
            managerNameRaw: job.managerNameRaw || null,
            // Only set managerId/supplierId if not already set
            managerId: existing && existing.managerId ? existing.managerId : (job.managerId || null),
            supplierId: existing && existing.supplierId ? existing.supplierId : (job.supplierId || null),
          },
        });
        if (!existing) created++;
        else updated++;
      } catch (e: any) {
        errors.push({ jobNumber: job.jobNumber, message: e?.message || String(e) });
      }
    }
    return NextResponse.json({ success: errors.length === 0, created, updated, errors });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
