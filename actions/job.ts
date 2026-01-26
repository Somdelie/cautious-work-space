
"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

function decToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (v instanceof Prisma.Decimal) return Number(v.toString());
  if (typeof v === "string") return Number(v);
  if (typeof v === "number") return v;
  return Number(v);
}

export type JobRowDTO = {
  specPdfUrl: null;
  boqPdfUrl: null;
  id: string;
  jobNumber: string;
  siteName: string;
  client: string | null;

  manager: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;

  isStarted: boolean;
  isFinished: boolean;

  specNotRequired?: boolean;
  boqNotRequired?: boolean;
  safetyFileNotRequired?: boolean;

  specsReceived: boolean;
  boqReceived: boolean;
  safetyFile: boolean;
  finishingSchedule: string | null;

  createdAt: string;

  // ✅ costs
  materialCost: number;
  totalActual: number;
};

export async function getAllJobsDTO() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        manager: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        jobCostSummary: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // ongoing first
    const sorted = [...jobs].sort((a, b) => {
      const ao = a.isStarted && !a.isFinished;
      const bo = b.isStarted && !b.isFinished;
      if (ao && !bo) return -1;
      if (!ao && bo) return 1;
      return 0;
    });

    const data: JobRowDTO[] = sorted.map((j) => {
      const summary = j.jobCostSummary ?? null;

      return {
        id: j.id,
        jobNumber: j.jobNumber,
        siteName: j.siteName,
        client: j.client ?? null,

        manager: j.manager ? { id: j.manager.id, name: j.manager.name } : null,
        supplier: j.supplier ? { id: j.supplier.id, name: j.supplier.name } : null,

        isStarted: j.isStarted,
        isFinished: j.isFinished,

        specNotRequired: j.specNotRequired,
        boqNotRequired: j.boqNotRequired,
        safetyFileNotRequired: j.safetyFileNotRequired,

        specsReceived: !!j.specPdfUrl,
        boqReceived: !!j.boqPdfUrl,
        safetyFile: !!j.safetyFile,
        finishingSchedule: j.finishingSchedule ?? null,

        createdAt: j.createdAt.toISOString(),

        materialCost: decToNumber(summary?.materialsActual ?? 0),
        totalActual: decToNumber(summary?.totalActual ?? 0),
        specPdfUrl: null,
        boqPdfUrl: null,
      };
    });

    return { success: true, data, error: null };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed" };
  }
}

/** Keep your update/create logic (server-only), but never return raw prisma objects to client pages */
export async function createJob(input: {
  jobNumber: string;
  siteName: string;
  client?: string;
  managerId?: string;
  supplierId?: string;
}) {
  const jobNumber = input.jobNumber?.trim();
  const siteName = input.siteName?.trim();

  if (!jobNumber || !siteName) return { success: false, error: "jobNumber + siteName required" };

  try {
    const j = await prisma.job.create({
      data: {
        jobNumber,
        siteName,
        client: input.client?.trim() || null,
        managerId: input.managerId ?? null,
        supplierId: input.supplierId ?? null,
      },
    });

    revalidatePath("/jobs");
    return { success: true, data: { id: j.id } };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to create job" };
  }
}

export async function updateJob(id: string, data: any) {
  if (!id) return { success: false, error: "Missing id" };

  try {
    await prisma.job.update({ where: { id }, data });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${id}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to update job" };
  }
}

/**
 * Mark job as started
 */
export async function markJobAsStarted(jobId: string) {
  if (!jobId) return { success: false, error: "Missing jobId" };
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { isStarted: true, startedAt: new Date() },
    });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to mark as started" };
  }
}

/**
 * Mark job as finished
 */
export async function markJobAsFinished(jobId: string) {
  if (!jobId) return { success: false, error: "Missing jobId" };
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { isFinished: true, finishedAt: new Date() },
    });
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to mark as finished" };
  }
}

// ==========================================
// get job by id with all details
export async function getJobByIdDTO(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        manager: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        jobCostSummary: true,
      },
    });
    if (!job) return { success: false, data: null, error: "Job not found" };

    const data: JobRowDTO = {
      id: job.id,
      jobNumber: job.jobNumber,
      siteName: job.siteName,
      client: job.client ?? null,
      manager: job.manager ? { id: job.manager.id, name: job.manager.name } : null,
      supplier: job.supplier ? { id: job.supplier.id, name: job.supplier.name } : null,
      isStarted: job.isStarted,
      isFinished: job.isFinished,
      specNotRequired: job.specNotRequired,
      boqNotRequired: job.boqNotRequired,
      safetyFileNotRequired: job.safetyFileNotRequired,
      specsReceived: !!job.specPdfUrl,
      boqReceived: !!job.boqPdfUrl,
      safetyFile: !!job.safetyFile,
      finishingSchedule: job.finishingSchedule ?? null,
      createdAt: job.createdAt.toISOString(),
      materialCost: decToNumber(job.jobCostSummary?.materialsActual ?? 0),
      totalActual: decToNumber(job.jobCostSummary?.totalActual ?? 0),
      specPdfUrl: null,
      boqPdfUrl: null
    }
    return { success: true, data, error: null }
  } catch (e: any) {
    return { success: false, data: null, error: e?.message ?? "Failed to fetch job" };
  }
}

// ==========================================
