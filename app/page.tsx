// app/(dashboard)/dashboard/page.tsx  (or wherever your DashboardPage lives)

import { DownloadUserGuide } from "@/components/common/download-user-guide";
import {
  Briefcase,
  Building2,
  Package,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import BottomCharts from "@/components/charts/BottomCharts";
import TopCharts from "@/components/charts/TopCharts";
import { getDashboardAnalytics } from "@/actions/analytics";

// ✅ client stat card with mini donut chart
import { StatCard } from "@/components/dashboard/StatCard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");

  const analyticsRes = await getDashboardAnalytics({ months: 12 });
  const analytics = analyticsRes.success ? analyticsRes.data : null;

  const totalJobs = analytics?.totals.totalJobs ?? 0;
  const suppliersCount = analytics?.totals.suppliers ?? 0;
  const productsCount = analytics?.totals.products ?? 0;
  const finishedJobsCount = analytics?.totals.finishedJobs ?? 0;

  // derive % for mini charts from jobStatusBreakdown
  const breakdown = analytics?.jobStatusBreakdown ?? [];
  const getVal = (name: "Not started" | "Ongoing" | "Finished") =>
    breakdown.find((x) => x.name === name)?.value ?? 0;

  const notStarted = getVal("Not started");
  const ongoing = getVal("Ongoing");
  const finished = getVal("Finished");
  const totalFromBreakdown = notStarted + ongoing + finished;

  const startedRate =
    totalFromBreakdown > 0
      ? ((ongoing + finished) / totalFromBreakdown) * 100
      : 0;

  const finishedRate =
    totalFromBreakdown > 0 ? (finished / totalFromBreakdown) * 100 : 0;

  return (
    <div className="grid gap-4 py-2">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Jobs"
          value={totalJobs}
          hint="Create and track projects"
          icon={<Briefcase className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-500/10"
          bgColor="bg-green-900/90"
          borderColor="border-green-800"
          percent={startedRate}
          statusText={`${Math.round(startedRate)}%`}
          subLines={[
            { dotClassName: "bg-amber-400", text: `${notStarted} not started` },
            { dotClassName: "bg-blue-400", text: `${ongoing} ongoing` },
          ]}
        />

        <StatCard
          label="Suppliers"
          value={suppliersCount}
          hint="Maintain supplier catalog"
          icon={<Building2 className="h-5 w-5 text-purple-500" />}
          iconBg="bg-purple-500/10"
          bgColor="bg-purple-900/90"
          borderColor="border-purple-800"
          // until you add real “coverage” metrics, keep this neutral
          percent={100}
          statusText="—"
          subLines={[
            { dotClassName: "bg-purple-400", text: "Suppliers in catalog" },
            { dotClassName: "bg-slate-500", text: "Used on jobs/orders" },
          ]}
        />

        <StatCard
          label="Finished Jobs"
          value={finishedJobsCount}
          hint="Jobs marked complete"
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
          iconBg="bg-emerald-500/10"
          bgColor="bg-emerald-900/90"
          borderColor="border-emerald-800"
          percent={finishedRate}
          statusText={`${Math.round(finishedRate)}%`}
          subLines={[
            { dotClassName: "bg-emerald-400", text: `${finished} finished` },
            {
              dotClassName: "bg-slate-500",
              text: `${Math.max(0, totalFromBreakdown - finished)} remaining`,
            },
          ]}
        />

        <StatCard
          label="Products"
          value={productsCount}
          hint="Products + variants + prices"
          icon={<Package className="h-5 w-5 text-orange-500" />}
          iconBg="bg-orange-500/10"
          bgColor="bg-orange-900/90"
          borderColor="border-orange-800"
          percent={100}
          statusText="—"
          subLines={[
            { dotClassName: "bg-orange-400", text: "Products in catalog" },
            { dotClassName: "bg-slate-500", text: "Variants/prices managed" },
          ]}
        />
      </div>

      {/* charts (REAL DATA) */}
      <BottomCharts
        jobsByMonth={analytics?.jobsByMonth ?? []}
        ordersByMonth={analytics?.ordersByMonth ?? []}
        jobStatusBreakdown={analytics?.jobStatusBreakdown ?? []}
      />

      <TopCharts
        latestJobs={analytics?.latestJobs ?? []}
        jobStatusBreakdown={analytics?.jobStatusBreakdown ?? []}
      />

      {/* User Guide */}
      <div className="bg-linear-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">
              Need Help?
            </h3>
            <p className="text-sm text-slate-400">
              Download the user guide for the Job Management System.
            </p>
          </div>
          <DownloadUserGuide />
        </div>
      </div>
    </div>
  );
}

/**
 * If you want to keep a local StatCard fallback here, delete it —
 * you're now importing StatCard from:
 *   "@/components/dashboard/StatCard"
 *
 * That client component renders the mini donut chart.
 */
