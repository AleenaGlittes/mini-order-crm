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
import { Skeleton } from "@/components/ui/skeleton";

interface StatItem {
  title: string;
  value: string;
  change: string;
  description: string;
}

interface StatsGridProps {
  stats?: StatItem[];
  isLoading?: boolean;
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

export function StatsGrid({ stats, liveStats, isLoading }: StatsGridProps) {
  if (isLoading || (!liveStats && !stats)) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="border border-border/80 bg-card p-5 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2.5 w-full pr-4">
                <Skeleton className="h-3.5 w-24 rounded bg-muted/60" />
                <Skeleton className="h-8 w-28 rounded bg-muted/80" />
                <Skeleton className="h-3 w-36 rounded bg-muted/50" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg shrink-0 bg-muted/60" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const displayStats: StatItem[] = liveStats
    ? [
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
      ]
    : stats || [];
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

          </Card>
        );
      })}
    </div>
  );
}
