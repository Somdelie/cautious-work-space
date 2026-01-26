"use server";

import { prisma } from "@/lib/prisma";

export type JobRowDTO = {
  id: string;
  jobNumber: string;
  siteName: string;
  client: string | null;

  manager: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;

  isStarted: boolean;
  isFinished: boolean;

  specsReceived: boolean;
  specNotRequired: boolean;

  boqNotRequired: boolean;
  boqReceived: boolean;

  finishingSchedule: string | null;

  safetyFile: boolean;
  safetyFileNotRequired: boolean;

  totalActualCost: number;

  createdAt: string; // ISO (client safe)
};

export async function getJobsForTable(): Promise<{
  success: boolean;
  data: JobRowDTO[] | null;
  error: string | null;
}> {
  try {
    const jobs = await prisma.job.findMany({
      select: {
        id: true,
        jobNumber: true,
        siteName: true,
        client: true,

        isStarted: true,
        isFinished: true,

        specPdfUrl: true,
        specNotRequired: true,

        boqNotRequired: true,
        boqPdfUrl: true,

        finishingSchedule: true,

        safetyFile: true,
        safetyFileNotRequired: true,

        createdAt: true,

        manager: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },

        jobCostSummary: { select: { totalActual: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const sorted = [...jobs].sort((a, b) => {
      const aOngoing = a.isStarted && !a.isFinished;
      const bOngoing = b.isStarted && !b.isFinished;
      if (aOngoing && !bOngoing) return -1;
      if (!aOngoing && bOngoing) return 1;
      return 0;
    });

    const data: JobRowDTO[] = sorted.map((j) => {
      const totalActual = j.jobCostSummary?.totalActual;

      return {
        id: j.id,
        jobNumber: j.jobNumber,
        siteName: j.siteName,
        client: j.client ?? null,

        manager: j.manager ? { id: j.manager.id, name: j.manager.name } : null,
        supplier: j.supplier ? { id: j.supplier.id, name: j.supplier.name } : null,

        isStarted: j.isStarted,
        isFinished: j.isFinished,

        specsReceived: Boolean(j.specPdfUrl),
        specNotRequired: j.specNotRequired,

        boqNotRequired: j.boqNotRequired,
        boqReceived: Boolean(j.boqPdfUrl),

        finishingSchedule: j.finishingSchedule ?? null,

        safetyFile: j.safetyFile,
        safetyFileNotRequired: j.safetyFileNotRequired,

        totalActualCost: totalActual ? Number(totalActual) : 0,

        createdAt: j.createdAt.toISOString(),
      };
    });

    return { success: true, data, error: null };
  } catch (e: any) {
    return {
      success: false,
      data: null,
      error: e?.message ?? "Failed to fetch jobs",
    };
  }
}
