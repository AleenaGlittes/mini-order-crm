"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revenueData } from "@/lib/sample-data";
import { TrendingUp, BarChart3, LineChart } from "lucide-react";

interface RevenueChartProps {
  data?: typeof revenueData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { month: string; revenue: number };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const revenue = payload[0].value;
    return (
      <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md">
        <p className="text-xs font-medium text-muted-foreground">{label} 2026</p>
        <p className="mt-1 text-base font-bold text-foreground">
          ₹{revenue.toLocaleString("en-IN")}
        </p>
        <p className="text-[11px] text-[#eb5e28] flex items-center gap-1 mt-0.5">
          <TrendingUp className="h-3 w-3" /> Monthly sales
        </p>
      </div>
    );
  }
  return null;
}

const emptySubscribe = () => () => {};

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (data && data.length > 0 && data.some((d) => d.revenue > 0)) {
      return data;
    }
    return revenueData;
  }, [data]);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + item.revenue, 0),
    [chartData]
  );
  const averageMonthly = Math.round(totalRevenue / chartData.length);
  const peakMonth = useMemo(() => {
    return chartData.reduce(
      (max, item) => (item.revenue > max.revenue ? item : max),
      chartData[0]
    );
  }, [chartData]);

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Revenue Analytics
            </CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eb5e28]/10 px-2 py-0.5 text-xs font-medium text-[#eb5e28]">
              <TrendingUp className="h-3 w-3" /> +18.2% vs previous
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Track revenue growth and order sales performance across months
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick stats chips */}
          <div className="hidden xl:flex items-center gap-3 pr-2 text-xs text-muted-foreground border-r border-border/60">
            <div>
              <span>Period Total: </span>
              <strong className="text-foreground">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </strong>
            </div>
            <div>
              <span>Peak: </span>
              <strong className="text-foreground">
                {peakMonth?.month} (₹{peakMonth?.revenue.toLocaleString("en-IN")})
              </strong>
            </div>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/30 p-0.5">
            <Button
              type="button"
              variant={chartType === "area" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setChartType("area")}
              className="gap-1 text-xs"
            >
              <LineChart className="h-3.5 w-3.5" />
              <span>Area</span>
            </Button>
            <Button
              type="button"
              variant={chartType === "bar" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setChartType("bar")}
              className="gap-1 text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Bar</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[280px] w-full">
          {!mounted ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Loading analytics chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eb5e28" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#eb5e28" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border/60"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#eb5e28"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border/60"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="#eb5e28"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer Metrics */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-border/60 border-t border-border/60 pt-3 text-center text-xs">
          <div>
            <p className="text-muted-foreground">Total Revenue</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly Average</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              ₹{averageMonthly.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Peak Month</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {peakMonth?.month} (₹{peakMonth?.revenue.toLocaleString("en-IN")})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
