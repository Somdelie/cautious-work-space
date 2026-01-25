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

// Sample data for different charts
const monthlyData = [
  { month: "Jan", sales: 4000, revenue: 2400, profit: 1200 },
  { month: "Feb", sales: 3000, revenue: 1398, profit: 900 },
  { month: "Mar", sales: 5000, revenue: 3800, profit: 1800 },
  { month: "Apr", sales: 4780, revenue: 3908, profit: 2100 },
  { month: "May", sales: 5890, revenue: 4800, profit: 2400 },
  { month: "Jun", sales: 4390, revenue: 3800, profit: 1900 },
];

const weeklyData = [
  { day: "Mon", visitors: 1200, pageViews: 3400 },
  { day: "Tue", visitors: 1400, pageViews: 4200 },
  { day: "Wed", visitors: 1100, pageViews: 2900 },
  { day: "Thu", visitors: 1800, pageViews: 5100 },
  { day: "Fri", visitors: 2100, pageViews: 6200 },
  { day: "Sat", visitors: 900, pageViews: 2100 },
  { day: "Sun", visitors: 700, pageViews: 1800 },
];

const pieData = [
  { name: "Desktop", value: 45, fill: "var(--color-desktop)" },
  { name: "Mobile", value: 35, fill: "var(--color-mobile)" },
  { name: "Tablet", value: 20, fill: "var(--color-tablet)" },
];

const donutData = [
  { name: "Unicast Flows", value: 70, fill: "var(--color-unicast)" },
  { name: "Broadcast Flows", value: 20, fill: "var(--color-broadcast)" },
  { name: "Multicast Flows", value: 10, fill: "var(--color-multicast)" },
];

const radialData = [
  { name: "Availability", value: 71, fill: "var(--color-availability)" },
  { name: "Reliability", value: 41, fill: "var(--color-reliability)" },
  { name: "Security", value: 27, fill: "var(--color-security)" },
];

const stackedData = [
  { category: "A", product1: 400, product2: 240, product3: 180 },
  { category: "B", product1: 300, product2: 456, product3: 220 },
  { category: "C", product1: 520, product2: 320, product3: 290 },
  { category: "D", product1: 450, product2: 380, product3: 350 },
  { category: "E", product1: 380, product2: 290, product3: 410 },
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

const lineChartConfig = {
  visitors: { label: "Visitors", color: "#1e5a8a" },
  pageViews: { label: "Page Views", color: "#2ba3c1" },
} satisfies ChartConfig;

const areaChartConfig = {
  sales: { label: "Sales", color: "#1e5a8a" },
  revenue: { label: "Revenue", color: "#2ba3c1" },
  profit: { label: "Profit", color: "#10b981" },
} satisfies ChartConfig;

const pieChartConfig = {
  desktop: { label: "Desktop", color: "#1e5a8a" },
  mobile: { label: "Mobile", color: "#2ba3c1" },
  tablet: { label: "Tablet", color: "#10b981" },
} satisfies ChartConfig;

const donutChartConfig = {
  unicast: { label: "Unicast Flows", color: "#1e5a8a" },
  broadcast: { label: "Broadcast Flows", color: "#2ba3c1" },
  multicast: { label: "Multicast Flows", color: "#10b981" },
} satisfies ChartConfig;

const radialChartConfig = {
  availability: { label: "Availability", color: "#1e5a8a" },
  reliability: { label: "Reliability", color: "#2ba3c1" },
  security: { label: "Security", color: "#f97316" },
} satisfies ChartConfig;

const stackedChartConfig = {
  product1: { label: "Product 1", color: "#1e5a8a" },
  product2: { label: "Product 2", color: "#2ba3c1" },
  product3: { label: "Product 3", color: "#10b981" },
} satisfies ChartConfig;

const horizontalBarConfig = {
  tcp: { label: "TCP", color: "#1e5a8a" },
  udp: { label: "UDP", color: "#2ba3c1" },
  nonip: { label: "Non-IP", color: "#10b981" },
  icmp: { label: "ICMP", color: "#f97316" },
  other: { label: "Other", color: "#8b5cf6" },
} satisfies ChartConfig;

export default function ChartsShowcase() {
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Charts Showcase
          </h1>
          <p className="text-muted-foreground">
            Choose from various chart types for your dashboard
          </p>
        </div>

        {/* Row 1: Bar Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Simple Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bar Chart</CardTitle>
              <CardDescription>Monthly sales comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={barChartConfig}
                className="h-[250px] w-full"
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
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Grouped Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Grouped Bar Chart</CardTitle>
              <CardDescription>Sales vs Revenue comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={barChartConfig}
                className="h-[250px] w-full"
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

          {/* Stacked Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Stacked Bar Chart</CardTitle>
              <CardDescription>
                Product distribution by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={stackedChartConfig}
                className="h-[250px] w-full"
              >
                <BarChart data={stackedData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="product1"
                    stackId="a"
                    fill="var(--color-product1)"
                  />
                  <Bar
                    dataKey="product2"
                    stackId="a"
                    fill="var(--color-product2)"
                  />
                  <Bar
                    dataKey="product3"
                    stackId="a"
                    fill="var(--color-product3)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Line & Area Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Line Chart</CardTitle>
              <CardDescription>Weekly visitor trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={lineChartConfig}
                className="h-[250px] w-full"
              >
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="var(--color-visitors)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-visitors)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Multi-Line Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Multi-Line Chart</CardTitle>
              <CardDescription>Visitors vs Page Views</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={lineChartConfig}
                className="h-[250px] w-full"
              >
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="var(--color-visitors)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    stroke="var(--color-pageViews)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Area Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Area Chart</CardTitle>
              <CardDescription>Revenue trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={areaChartConfig}
                className="h-[250px] w-full"
              >
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Stacked Area & Composed Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stacked Area Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Stacked Area Chart</CardTitle>
              <CardDescription>
                Sales, Revenue & Profit over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={areaChartConfig}
                className="h-[280px] w-full"
              >
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stackId="1"
                    stroke="var(--color-sales)"
                    fill="var(--color-sales)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="1"
                    stroke="var(--color-profit)"
                    fill="var(--color-profit)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Composed Chart (Bar + Line) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Composed Chart</CardTitle>
              <CardDescription>Bar and Line combination</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={barChartConfig}
                className="h-[280px] w-full"
              >
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="sales"
                    fill="var(--color-sales)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-revenue)", r: 4 }}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Pie, Donut & Radial Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pie Chart</CardTitle>
              <CardDescription>Device distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={pieChartConfig}
                className="h-[250px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Donut Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Donut Chart</CardTitle>
              <CardDescription>Network flows distribution</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <ChartContainer
                config={donutChartConfig}
                className="h-[250px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  />
                </PieChart>
              </ChartContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10K</div>
                  <div className="text-xs text-muted-foreground">Flows</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Semi-Circle Donut */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Semi-Circle Chart</CardTitle>
              <CardDescription>Progress indicator</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={radialChartConfig}
                className="h-[250px] w-full"
              >
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: 71, fill: "#1e5a8a" },
                      { name: "Remaining", value: 29, fill: "#e5e7eb" },
                    ]}
                    cx="50%"
                    cy="70%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    strokeWidth={0}
                  />
                </PieChart>
              </ChartContainer>
              <div className="text-center -mt-16">
                <div className="text-3xl font-bold text-foreground">71%</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>

          {/* Radial Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Radial Bar Chart</CardTitle>
              <CardDescription>Multiple metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={radialChartConfig}
                className="h-[250px] w-full"
              >
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={100}
                  barSize={10}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={5} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 5: Horizontal Bar & Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Horizontal Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Horizontal Bar Chart</CardTitle>
              <CardDescription>Protocol distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={horizontalBarConfig}
                className="h-[280px] w-full"
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
            <CardContent className="space-y-6">
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
                  <span className="text-muted-foreground">
                    Network Security
                  </span>
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

        {/* Row 6: Sparklines & Mini Charts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "Assets Discovered",
              value: "3,424",
              change: "+16%",
              positive: true,
            },
            {
              title: "Network Connections",
              value: "2,733",
              change: "-3%",
              positive: false,
            },
            {
              title: "Anomalies Detected",
              value: "1,041",
              change: "+11%",
              positive: false,
            },
            {
              title: "Network Errors",
              value: "1,966",
              change: "-1%",
              positive: true,
            },
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${stat.positive ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {stat.change}
                  </span>
                </div>
                {/* Mini Sparkline */}
                <div className="h-12 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData.slice(0, 5)}>
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke={stat.positive ? "#10b981" : "#ef4444"}
                        fill={stat.positive ? "#10b981" : "#ef4444"}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>
            All charts are interactive. Hover over data points for more details.
          </p>
        </div>
      </div>
    </div>
  );
}
