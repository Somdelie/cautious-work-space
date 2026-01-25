"use client";
import { CreateManagerDialog } from "@/components/dialogs/create-manager";
import { CreateSupplierDialog } from "@/components/dialogs/create-supplier";
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CreateJobDialog } from "../dialogs/create-job";
import { CreateProductDialog } from "../dialogs/create-product";

const Charts = () => {
  // Sample data for different charts
  const monthlyData = [
    { month: "Jan", sales: 4000, revenue: 2400, profit: 1200 },
    { month: "Feb", sales: 3000, revenue: 1398, profit: 900 },
    { month: "Mar", sales: 5000, revenue: 3800, profit: 1800 },
    { month: "Apr", sales: 4780, revenue: 3908, profit: 2100 },
    { month: "May", sales: 5890, revenue: 4800, profit: 2400 },
    { month: "Jun", sales: 4390, revenue: 3800, profit: 1900 },
    { month: "Jul", sales: 4490, revenue: 4300, profit: 2000 },
    { month: "Aug", sales: 5290, revenue: 5000, profit: 2500 },
    { month: "Sep", sales: 6000, revenue: 5200, profit: 2700 },
    { month: "Oct", sales: 7000, revenue: 6000, profit: 3000 },
    { month: "Nov", sales: 8000, revenue: 7000, profit: 3500 },
    { month: "Dec", sales: 9000, revenue: 8000, profit: 4000 },
  ];

  const horizontalBarData = [
    { protocol: "TCP", value: 53, fill: "var(--color-tcp)" },
    { protocol: "UDP", value: 33, fill: "var(--color-udp)" },
    { protocol: "Non-IP", value: 8, fill: "var(--color-nonip)" },
    { protocol: "ICMP", value: 4, fill: "var(--color-icmp)" },
    { protocol: "Other", value: 2, fill: "var(--color-other)" },
  ];

  // Chart configs
  const barChartConfig = {
    sales: { label: "Sales", color: "#1e5a8a" },
    revenue: { label: "Revenue", color: "#2ba3c1" },
  } satisfies ChartConfig;

  const horizontalBarConfig = {
    tcp: { label: "TCP", color: "#1e5a8a" },
    udp: { label: "UDP", color: "#2ba3c1" },
    nonip: { label: "Non-IP", color: "#10b981" },
    icmp: { label: "ICMP", color: "#f97316" },
    other: { label: "Other", color: "#8b5cf6" },
  } satisfies ChartConfig;

  const stackedChartConfig = {
    product1: { label: "Product 1", color: "#1e5a8a" },
    product2: { label: "Product 2", color: "#2ba3c1" },
    product3: { label: "Product 3", color: "#10b981" },
  } satisfies ChartConfig;

  return (
    <div className="w-full grid">
      {/* Row 5: Horizontal Bar & Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Horizontal Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Horizontal Bar Chart</CardTitle>
            <CardDescription>Protocol distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={horizontalBarConfig}
              className="h-[200px] w-full"
            >
              <BarChart data={horizontalBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="protocol"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Progress Bar Style */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress Bars</CardTitle>
            <CardDescription>Network metrics overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Network Availability
                </span>
                <span className="font-medium text-foreground">71%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1e5a8a] rounded-full"
                  style={{ width: "71%" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Network Reliability
                </span>
                <span className="font-medium text-foreground">41%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2ba3c1] rounded-full"
                  style={{ width: "41%" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Security</span>
                <span className="font-medium text-foreground">27%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#f97316] rounded-full"
                  style={{ width: "27%" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPU Usage</span>
                <span className="font-medium text-foreground">85%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10b981] rounded-full"
                  style={{ width: "85%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Row 1: Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Simple Bar Chart */}
        {/* Grouped Bar Chart */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Grouped Bar Chart</CardTitle>
            <CardDescription>Sales vs Revenue comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={barChartConfig}
              className="h-[200px] w-full"
            >
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="sales"
                  fill="var(--color-sales)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/*quick actions */}
        <Card className="bg-slate-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Access common tasks quickly</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col w-full gap-2">
            {/* add supplier */}
            <div className="w-full p-1 bg-slate-900 border border-slate-800">
              <CreateJobDialog />
            </div>
            {/* add supplier */}
            <div className="w-full p-1 bg-slate-900 border border-slate-800">
              <CreateSupplierDialog />
            </div>
            {/* add manager */}
            <div className="w-full p-1 bg-slate-900 border border-slate-800">
              <CreateManagerDialog />
            </div>
            {/* add product */}
            <div className="w-full p-1 bg-slate-900 border border-slate-800">
              <CreateProductDialog />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Charts;
