import React from "react";
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  PackageCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { dashboardStats } from "@/lib/sample-data";

interface StatItem {
  title: string;
  value: string;
  change: string;
  description: string;
}

interface StatsGridProps {
  stats?: StatItem[];
  liveStats?: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    fulfilledOrders: number;
  };
}

const statConfig = {
  "Total Orders": {
    icon: ShoppingBag,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/20",
  },
  "Total Revenue": {
    icon: IndianRupee,
    iconColor: "text-primary",
    iconBg: "bg-primary/10 ring-1 ring-primary/20",
  },
  "Pending Orders": {
    icon: Clock,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/60 ring-1 ring-amber-500/20",
  },
  "Fulfilled Orders": {
    icon: PackageCheck,
    iconColor: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-50 dark:bg-teal-950/60 ring-1 ring-teal-500/20",
  },
};

export function StatsGrid({ stats, liveStats }: StatsGridProps) {
  const displayStats: StatItem[] = React.useMemo(() => {
    if (liveStats) {
      return [
        {
          title: "Total Orders",
          value: liveStats.totalOrders.toLocaleString(),
          change: "+12.5%",
          description: "All synchronized orders",
        },
        {
          title: "Total Revenue",
          value: `₹${liveStats.totalRevenue.toLocaleString("en-IN")}`,
          change: "+18.2%",
          description: "From online store orders",
        },
        {
          title: "Pending Orders",
          value: liveStats.pendingOrders.toString(),
          change: liveStats.pendingOrders > 0 ? "+4" : "0",
          description: "Awaiting payment or action",
        },
        {
          title: "Fulfilled Orders",
          value: liveStats.fulfilledOrders.toString(),
          change: "+9.1%",
          description: "Successfully delivered",
        },
      ];
    }
    return stats || dashboardStats;
  }, [stats, liveStats]);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((stat) => {
        const config =
          statConfig[stat.title as keyof typeof statConfig] || {
            icon: ShoppingBag,
            iconColor: "text-primary",
            iconBg: "bg-muted ring-1 ring-border",
          };
        const Icon = config.icon;
        const isPositive = stat.change.startsWith("+");

        return (
          <Card
            key={stat.title}
            className="relative overflow-hidden border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  {stat.title}
                </p>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </div>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 pt-1 border-t border-border/50 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.change}
              </span>
              <span className="text-muted-foreground text-[11px] truncate">
                {stat.description}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
