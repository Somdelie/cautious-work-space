"use server";

import { prisma } from "@/lib/prisma";

type DashboardAnalyticsDTO = {
  totals: {
    totalJobs: number;
    finishedJobs: number;
    suppliers: number;
    products: number;
  };

  jobStatusBreakdown: Array<{
    name: "Not started" | "Ongoing" | "Finished";
    value: number;
  }>;

  jobsByMonth: Array<{
    month: string; // YYYY-MM
    count: number;
    created: number;
    finished: number;
  }>;

  ordersByMonth: Array<{
    month: string; // YYYY-MM
    count: number;
    orders: number;
    subtotal: number;
  }>;

  latestJobs: Array<{
    id: string;
    jobNumber: string;
    siteName: string;
    createdAt: string; // ISO
    status: "Not started" | "Ongoing" | "Finished";
    isStarted: boolean;
    isFinished: boolean;
  }>;
};

export async function getDashboardAnalytics(input?: {
  months?: number;
}): Promise<{
  success: boolean;
  data: DashboardAnalyticsDTO | null;
  error: string | null;
}> {
  try {
    const months = input?.months ?? 12;

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    /* =========================
       TOTAL COUNTS
    ========================= */

    const [
      totalJobs,
      finishedJobs,
      suppliers,
      products,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isFinished: true } }),
      prisma.supplier.count(),
      prisma.product.count(),
    ]);

    /* =========================
       JOB STATUS BREAKDOWN
    ========================= */

    const jobs = await prisma.job.findMany({
      select: {
        isStarted: true,
        isFinished: true,
      },
    });

    let notStarted = 0;
    let ongoing = 0;
    let finished = 0;

    for (const j of jobs) {
      if (j.isFinished) finished++;
      else if (j.isStarted) ongoing++;
      else notStarted++;
    }

    /* =========================
       JOBS BY MONTH
    ========================= */

    const jobsByMonthRaw = await prisma.job.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const jobsByMonthMap = new Map<string, number>();

    for (const j of jobsByMonthRaw) {
      const key = j.createdAt.toISOString().slice(0, 7);
      jobsByMonthMap.set(key, (jobsByMonthMap.get(key) ?? 0) + 1);
    }

    // For demo, set created/finished to count (real logic should aggregate per month)
    const jobsByMonth = Array.from(jobsByMonthMap.entries()).map(
      ([month, count]) => ({ month, count, created: count, finished: 0 }),
    );

    /* =========================
       ORDERS BY MONTH
    ========================= */

    const ordersByMonthRaw = await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const ordersByMonthMap = new Map<string, number>();

    for (const o of ordersByMonthRaw) {
      const key = o.createdAt.toISOString().slice(0, 7);
      ordersByMonthMap.set(key, (ordersByMonthMap.get(key) ?? 0) + 1);
    }

    // For demo, set orders/subtotal to count/0 (real logic should aggregate per month)
    const ordersByMonth = Array.from(ordersByMonthMap.entries()).map(
      ([month, count]) => ({ month, count, orders: count, subtotal: 0 }),
    );

    /* =========================
       LATEST JOBS
    ========================= */

    const latestJobsRaw = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        jobNumber: true,
        siteName: true,
        createdAt: true,
        isStarted: true,
        isFinished: true,
      },
    });

    const latestJobs = latestJobsRaw.map((j) => ({
      id: j.id,
      jobNumber: j.jobNumber,
      siteName: j.siteName,
      createdAt: j.createdAt.toISOString(),
      status: (j.isFinished
        ? "Finished"
        : j.isStarted
          ? "Ongoing"
          : "Not started") as "Not started" | "Ongoing" | "Finished",
      isStarted: j.isStarted,
      isFinished: j.isFinished,
    }));

    /* =========================
       FINAL DTO
    ========================= */

    const data: DashboardAnalyticsDTO = {
      totals: {
        totalJobs,
        finishedJobs,
        suppliers,
        products,
      },
      jobStatusBreakdown: [
        { name: "Not started", value: notStarted },
        { name: "Ongoing", value: ongoing },
        { name: "Finished", value: finished },
      ],
      jobsByMonth,
      ordersByMonth,
      latestJobs,
    };

    return { success: true, data, error: null };
  } catch (e: any) {
    return {
      success: false,
      data: null,
      error: e?.message ?? "Failed to load dashboard analytics",
    };
  }
}
