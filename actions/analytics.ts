"use server";

import { prisma } from "@/lib/prisma";

type MonthPoint = { month: string; created: number; finished: number };
type SupplierPoint = { name: string; jobs: number };
type StatusPoint = {
  name: "Not started" | "Ongoing" | "Finished";
  value: number;
};
type OrdersMonthPoint = { month: string; orders: number; subtotal: number };

type LatestJobPoint = {
  id: string;
  jobNumber: string;
  siteName: string;
  supplierName: string | null;
  managerName: string | null;
  createdAt: Date;
  isStarted: boolean;
  isFinished: boolean;
};

export type DashboardAnalytics = {
  totals: {
    totalJobs: number;
    finishedJobs: number;
    suppliers: number;
    products: number;
    orders: number;
    orderValue: number;
  };

  jobsByMonth: MonthPoint[];
  ordersByMonth: OrdersMonthPoint[];
  jobsBySupplierTop: SupplierPoint[];
  jobStatusBreakdown: StatusPoint[];

  latestJobs: LatestJobPoint[]; // ✅ ADD THIS
};

function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "short" });
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export async function getDashboardAnalytics(params?: {
  months?: number;
}): Promise<
  | { success: true; data: DashboardAnalytics }
  | { success: false; error: string }
> {
  try {
    const months = 12; // Always show 12 months (Jan-Dec)
    const year = new Date().getFullYear();
    const from = new Date(year, 0, 1); // Start from January of current year

    const [
      totalJobs,
      finishedJobs,
      suppliersCount,
      productsCount,
      ordersCount,
      ordersSum,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isFinished: true } }),
      prisma.supplier.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { subtotal: true } }),
    ]);

    // ---- jobs by month ----
    const jobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: { createdAt: true, isFinished: true, finishedAt: true },
    });

    // Prepare jobs by month (Jan-Dec)
    const jobsByMonthArr: MonthPoint[] = [];
    for (let m = 0; m < 12; m++) {
      jobsByMonthArr.push({
        month: new Date(year, m, 1).toLocaleString("en-US", { month: "short" }),
        created: 0,
        finished: 0,
      });
    }
    for (const j of jobs) {
      if (j.createdAt.getFullYear() === year) {
        jobsByMonthArr[j.createdAt.getMonth()].created += 1;
      }
      if (j.isFinished && j.finishedAt && j.finishedAt.getFullYear() === year) {
        jobsByMonthArr[j.finishedAt.getMonth()].finished += 1;
      }
    }
    const jobsByMonth = jobsByMonthArr;

    // ---- orders by month ----
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: { createdAt: true, subtotal: true },
    });

    // Prepare orders by month (Jan-Dec)
    const ordersByMonthArr: OrdersMonthPoint[] = [];
    for (let m = 0; m < 12; m++) {
      ordersByMonthArr.push({
        month: new Date(year, m, 1).toLocaleString("en-US", { month: "short" }),
        orders: 0,
        subtotal: 0,
      });
    }
    for (const o of orders) {
      if (o.createdAt.getFullYear() === year) {
        ordersByMonthArr[o.createdAt.getMonth()].orders += 1;
        // Convert Decimal to number if needed
        let subtotal: number = 0;
        if (o.subtotal !== undefined && o.subtotal !== null) {
          if (
            typeof o.subtotal === "object" &&
            typeof o.subtotal.toNumber === "function"
          ) {
            subtotal = o.subtotal.toNumber();
          } else if (typeof o.subtotal === "number") {
            subtotal = o.subtotal;
          }
        }
        ordersByMonthArr[o.createdAt.getMonth()].subtotal += subtotal;
      }
    }
    const ordersByMonth = ordersByMonthArr;

    // ---- job status breakdown ----
    const [notStarted, ongoing] = await Promise.all([
      prisma.job.count({ where: { isStarted: false, isFinished: false } }),
      prisma.job.count({ where: { isStarted: true, isFinished: false } }),
    ]);

    const jobStatusBreakdown: StatusPoint[] = [
      { name: "Not started", value: notStarted },
      { name: "Ongoing", value: ongoing },
      { name: "Finished", value: finishedJobs },
    ];

    // ---- top suppliers by jobs count ----
    const supplierGroups = await prisma.job.groupBy({
      by: ["supplierId"],
      where: { supplierId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });

    const supplierIds = supplierGroups.map((g) => g.supplierId!) as string[];

    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    });

    const supplierNameById = new Map(suppliers.map((s) => [s.id, s.name]));

    const jobsBySupplierTop: SupplierPoint[] = supplierGroups.map((g) => ({
      name: supplierNameById.get(g.supplierId as string) ?? "Unknown",
      jobs: g._count.id,
    }));

    // ---- latest 5 jobs (for your table) ----
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
        supplier: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });

    const latestJobs: LatestJobPoint[] = latestJobsRaw.map((j) => ({
      id: j.id,
      jobNumber: j.jobNumber,
      siteName: j.siteName,
      createdAt: j.createdAt,
      isStarted: j.isStarted,
      isFinished: j.isFinished,
      supplierName: j.supplier?.name ?? null,
      managerName: j.manager?.name ?? null,
    }));

    return {
      success: true,
      data: {
        totals: {
          totalJobs,
          finishedJobs,
          suppliers: suppliersCount,
          products: productsCount,
          orders: ordersCount,
          orderValue: (() => {
            const val = ordersSum._sum.subtotal;
            if (val === undefined || val === null) return 0;
            if (typeof val === "object" && typeof val.toNumber === "function")
              return val.toNumber();
            if (typeof val === "number") return val;
            return 0;
          })(),
        },
        jobsByMonth,
        ordersByMonth,
        jobsBySupplierTop,
        jobStatusBreakdown,
        latestJobs, // ✅ RETURN
      },
    };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Failed to build analytics" };
  }
}
