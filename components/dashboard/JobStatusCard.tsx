"use client";

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
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

type StatusPoint = {
  name: "Not started" | "Ongoing" | "Finished";
  value: number;
};

export function JobStatusCard({
  jobStatusBreakdown,
}: {
  jobStatusBreakdown: StatusPoint[];
}) {
  const statusConfig = {
    value: { label: "Jobs", color: "#2ba3c1" },
  } satisfies ChartConfig;

  const radialData = jobStatusBreakdown.map((item) => ({
    name: item.name,
    value: item.value,
    fill:
      item.name === "Finished"
        ? "#f97316"
        : item.name === "Ongoing"
          ? "#2ba3c1"
          : "#1e5a8a",
  }));

  const total = jobStatusBreakdown.reduce((sum, item) => sum + item.value, 0);
  const finished =
    jobStatusBreakdown.find((item) => item.name === "Finished")?.value || 0;
  const percentage = total > 0 ? Math.round((finished / total) * 100) : 0;

  return (
    <Card className="w-full relative overflow-hidden bg-linear-to-br dark:from-slate-950 dark:to-slate-900 from-slate-100 to-slate-200 border dark:border-slate-800 border-slate-200">
      {/* 🌊 ANIMATED BACKGROUND - Light Theme */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 dark:hidden">
        <div className="absolute inset-0 bg-linear-to-r from-blue-200/30 via-cyan-200/20 to-transparent opacity-40" />
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 h-full w-[200%] animate-wave"
        >
          <defs>
            <linearGradient
              id="waveGradientLight"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradientLight)"
            d="M0,50 C120,70 240,30 360,45 480,60 600,90 720,85 840,80 960,45 1080,40 1200,35 1320,60 1440,70 L1440,120 L0,120 Z"
          />
          <path
            fill="#06b6d4"
            opacity="0.08"
            d="M0,60 C150,80 300,40 450,55 600,70 750,100 900,95 1050,90 1200,55 1350,50 L1440,45 L1440,120 L0,120 Z"
          />
        </svg>
      </div>

      {/* 🌊 ANIMATED BACKGROUND - Dark Theme */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 hidden dark:block">
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/20 via-cyan-900/15 to-transparent opacity-50" />
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 h-full w-[200%] animate-wave"
        >
          <defs>
            <linearGradient
              id="waveGradientDark"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradientDark)"
            d="M0,50 C120,70 240,30 360,45 480,60 600,90 720,85 840,80 960,45 1080,40 1200,35 1320,60 1440,70 L1440,120 L0,120 Z"
          />
          <path
            fill="#0891b2"
            opacity="0.1"
            d="M0,60 C150,80 300,40 450,55 600,70 750,100 900,95 1050,90 1200,55 1350,50 L1440,45 L1440,120 L0,120 Z"
          />
        </svg>
      </div>

      {/* CONTENT */}
      <div className="relative z-10">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 flex items-center justify-between gap-3">
              <CardTitle className="text-muted-foreground font-semibold">
                Job Status
              </CardTitle>
              <CardDescription className="mt-1 text-sm dark:text-slate-400">
                {total} total jobs • {percentage}% completed
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* CHART */}
          {/* CHART */}
          <ChartContainer config={statusConfig} className="h-[180px] w-full">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={100}
              barSize={14}
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={8}
                background={{
                  fill: "rgba(255,255,255,0.08)",
                  className: "dark:fill-slate-800",
                }}
              />

              {/* ✅ Tooltip: "9 Finished Jobs" */}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    // show the segment name (Finished/Ongoing/Not started)
                    labelKey="name"
                    // show "Jobs" instead of "value"
                    nameKey="value"
                    formatter={(val, _name, item) => {
                      const n = Number(val ?? 0);
                      const status = (item?.payload?.name ?? "") as string;
                      return [`${n} ${status} Jobs`, ""]; // value line only
                    }}
                  />
                }
              />
            </RadialBarChart>
          </ChartContainer>

          {/* ENHANCED LEGEND */}
          {/* <div className="grid grid-cols-3 gap-2 pt-1">
            <LegendItem
              icon={CheckCircle2}
              label="Finished"
              colorClass="bg-emerald-500 dark:bg-emerald-600"
              value={
                jobStatusBreakdown.find((item) => item.name === "Finished")
                  ?.value || 0
              }
            />
            <LegendItem
              icon={Clock}
              label="Ongoing"
              colorClass="bg-blue-500 dark:bg-blue-600"
              value={
                jobStatusBreakdown.find((item) => item.name === "Ongoing")
                  ?.value || 0
              }
            />
            <LegendItem
              icon={AlertCircle}
              label="Not started"
              colorClass="bg-slate-500 dark:bg-slate-600"
              value={
                jobStatusBreakdown.find((item) => item.name === "Not started")
                  ?.value || 0
              }
            />
          </div> */}

          {/* PROGRESS BAR */}
          <div className="space-y-1 pt-1 border-t dark:border-slate-800 border-slate-200">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="dark:text-slate-400 text-slate-600">
                Progress
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {percentage}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </div>

      {/* DECORATIVE GRADIENT ORBS */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-linear-to-br from-blue-400/20 to-cyan-400/10 dark:from-blue-500/10 dark:to-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-linear-to-tr from-cyan-400/15 to-blue-400/5 dark:from-cyan-500/8 dark:to-blue-500/3 blur-3xl" />
    </Card>
  );
}

function StatBadge({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <div
      className={`px-3 py-2 rounded-lg ${colorMap[color as keyof typeof colorMap]}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div className="text-right">
          <div className="text-xs font-medium opacity-75">{label}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  icon: Icon,
  label,
  colorClass,
  value,
}: {
  icon: React.ComponentType<any>;
  label: string;
  colorClass: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg dark:bg-slate-800/50 bg-slate-100/50 hover:dark:bg-slate-800 hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-1.5 w-full justify-center">
        <Icon className="h-3 w-3" />
      </div>
      <div className="text-center">
        <div className="text-xs dark:text-slate-400 text-slate-600 leading-none">
          {label}
        </div>
        <div className="text-sm font-bold dark:text-slate-100 text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}
