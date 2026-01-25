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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  AreaChart,
  Area,
} from "recharts";
import { CreateJobDialog } from "../dialogs/create-job";
import { CreateSupplierDialog } from "@/components/dialogs/create-supplier";
import { CreateManagerDialog } from "@/components/dialogs/create-manager";
import { CreateProductDialog } from "../dialogs/create-product";
import { JobStatusCard } from "../dashboard/JobStatusCard";

type JobsByMonth = { month: string; created: number; finished: number };
type OrdersByMonth = { month: string; orders: number; subtotal: number };
type StatusPoint = {
  name: "Not started" | "Ongoing" | "Finished";
  value: number;
};

export default function BottomCharts({
  jobsByMonth,
  ordersByMonth,
  jobStatusBreakdown,
}: {
  jobsByMonth: JobsByMonth[];
  ordersByMonth: OrdersByMonth[];
  jobStatusBreakdown: StatusPoint[];
}) {
  const jobsConfig = {
    created: { label: "Jobs created", color: "#8b5cf6" },
    finished: { label: "Jobs finished", color: "#10b981" },
  } satisfies ChartConfig;

  const ordersConfig = {
    orders: { label: "Orders", color: "#3b82f6" },
    subtotal: { label: "Order value", color: "#f59e0b" },
  } satisfies ChartConfig;

  const statusConfig = {
    value: { label: "Jobs", color: "#2ba3c1" },
  } satisfies ChartConfig;

  return (
    <div className="w-full space-y-3">
      {/* Top Grid */}
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Stacked Area Chart - Jobs by month */}
        <Card className="col-span-1 md:col-span-2 border-green-800 border-2 bg-green-950/90">
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-muted-foreground">
              Jobs per month
            </CardTitle>
            <CardDescription>Added vs Finished</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={jobsConfig} className="h-[180px] w-full">
              <AreaChart data={jobsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="created"
                  stackId="1"
                  stroke="var(--color-created)"
                  fill="var(--color-created)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="finished"
                  stackId="1"
                  stroke="var(--color-finished)"
                  fill="var(--color-finished)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="w-full gap-0">
          <CardHeader className="py-0">
            <CardTitle className="text-muted-foreground">
              Quick Actions
            </CardTitle>
            {/* <CardDescription>Access common tasks quickly</CardDescription> */}
          </CardHeader>
          <CardContent className="flex flex-col w-full gap-2 py-0">
            <div className="w-full p-1 dark:bg-slate-900 border border-gray-300 dark:border-slate-800">
              <CreateJobDialog />
            </div>
            <div className="w-full p-1 dark:bg-slate-900 border border-gray-300 dark:border-slate-800">
              <CreateSupplierDialog />
            </div>
            <div className="w-full p-1 dark:bg-slate-900 border border-gray-300 dark:border-slate-800">
              <CreateManagerDialog />
            </div>
            <div className="w-full p-1 dark:bg-slate-900 border border-gray-300 dark:border-slate-800">
              <CreateProductDialog />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Radial Bar Chart - Status breakdown */}
        <JobStatusCard jobStatusBreakdown={jobStatusBreakdown} />
        {/* Grouped Bar Chart - Orders by month */}
        <Card className="col-span-1 md:col-span-2 bg-sky-900/90 border-sky-800 border-2">
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-muted-foreground">
              Orders per month
            </CardTitle>
            <CardDescription>Count and total value</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ordersConfig} className="h-[180px] w-full">
              <BarChart data={ordersByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="orders"
                  fill="var(--color-orders)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="subtotal"
                  fill="var(--color-subtotal)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
