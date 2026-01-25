"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { RadialBarChart, RadialBar } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";

type StatusPoint = {
  name: "Not started" | "Ongoing" | "Finished";
  value: number;
};

export type LatestJobRow = {
  id: string;
  jobNumber: string;
  siteName: string;
  supplierName?: string | null;
  managerName?: string | null;
  createdAt: string | Date;
  isStarted: boolean;
  isFinished: boolean;
};

function formatDate(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleDateString();
}

function statusBadge(j: LatestJobRow) {
  if (j.isFinished) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wide">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Finished
      </Badge>
    );
  }
  if (j.isStarted) {
    return (
      <Badge className="bg-sky-500/80 dark:bg-blue-500/10 text-blue-100 border border-blue-500/20 tracking-wide">
        <Clock className="mr-1 h-3 w-3" />
        Ongoing
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-500/10 text-slate-400 dark:text-slate-300 border border-slate-500/20 tracking-wide">
      <CircleDashed className="mr-1 h-3 w-3" />
      Not started
    </Badge>
  );
}

export default function TopCharts({
  latestJobs,
  jobStatusBreakdown,
}: {
  latestJobs: LatestJobRow[];
  jobStatusBreakdown: StatusPoint[];
}) {
  // --- Radial chart: convert your breakdown into recharts data
  const statusData = React.useMemo(() => {
    return jobStatusBreakdown.map((x) => ({
      name: x.name,
      value: x.value,
      fill:
        x.name === "Finished"
          ? "var(--color-finished)"
          : x.name === "Ongoing"
            ? "var(--color-ongoing)"
            : "var(--color-notstarted)",
    }));
  }, [jobStatusBreakdown]);

  const radialChartConfig = {
    finished: { label: "Finished", color: "#10b981" },
    ongoing: { label: "Ongoing", color: "#3b82f6" },
    notstarted: { label: "Not started", color: "#94a3b8" },
  } satisfies ChartConfig;

  // Map CSS vars used by statusData.fill above
  const configWithVars = {
    ...radialChartConfig,
    // these keys aren't used directly by recharts, but ChartContainer will set CSS vars
    notstarted: radialChartConfig.notstarted,
    ongoing: radialChartConfig.ongoing,
    finished: radialChartConfig.finished,
  } satisfies ChartConfig;

  const top5 = (latestJobs ?? []).slice(0, 5);

  return (
    <div className="w-full">
      {/* Latest 5 Jobs - Table */}
      <Card className="bg-purple-900/70 border-purple-800 border-2">
        <CardHeader className="py-0 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-muted-foreground">
            Latest jobs
          </CardTitle>
          <CardDescription>Most recent 5 jobs created</CardDescription>

          <Link
            href="/jobs"
            className="bg-green-700 px-2 py-1 rounded hover:opacity-90 text-gray-300"
          >
            View all jobs &rarr;
          </Link>
        </CardHeader>

        <CardContent className="pt-0">
          <div className=" border dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-300">Job #</TableHead>
                  <TableHead className="text-slate-300">Site</TableHead>
                  <TableHead className="text-slate-300 hidden md:table-cell">
                    Supplier
                  </TableHead>
                  <TableHead className="text-slate-300 hidden lg:table-cell">
                    Supervisor
                  </TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300 text-right">
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {top5.length === 0 ? (
                  <TableRow className="border-slate-800">
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-slate-400"
                    >
                      No jobs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  top5.map((j) => (
                    <TableRow
                      key={j.id}
                      className="border-slate-800 hover:bg-slate-950/40"
                    >
                      <TableCell className=" font-medium text-primary tracking-widest">
                        {j.jobNumber}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-muted-foreground text-xs">
                        {j.siteName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="secondary"
                          className={`${
                            j.supplierName
                              ? "bg-orange-600/10 text-orange-400 border border-orange-600/20"
                              : "opacity-60"
                          } text-xs tracking-wide`}
                        >
                          {j.supplierName ?? "Missing"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-slate-300">
                        {j.managerName ?? "—"}
                      </TableCell>
                      <TableCell>{statusBadge(j)}</TableCell>
                      <TableCell className="text-right text-slate-400">
                        {formatDate(j.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
