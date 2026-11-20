"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCustomers, CustomerRecord } from "@/lib/api";
import { Users, ArrowRight, Mail } from "lucide-react";

interface RecentCustomersCardProps {
  onViewAll?: () => void;
  className?: string;
}

export function RecentCustomersCard({
  onViewAll,
  className = "",
}: RecentCustomersCardProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    fetchCustomers()
      .then((data) => {
        if (!ignore && data) {
          // Take the most recent 5 customers
          setCustomers(data.slice(0, 5));
        }
      })
      .catch((err) => {
        console.warn("fetchCustomers in RecentCustomersCard failed:", err);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Card
      className={`border border-border/80 bg-card shadow-xs flex flex-col justify-between h-full ${className}`}
    >
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Recent Customers
            </CardTitle>
          </div>
          {onViewAll && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onViewAll}
              className="text-xs text-primary hover:text-primary/80 gap-1 px-1.5 h-7"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-full bg-muted/60 shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24 rounded bg-muted/70" />
                    <Skeleton className="h-2.5 w-32 rounded bg-muted/40" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12 rounded bg-muted/50" />
              </div>
            ))
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
              <Users className="h-6 w-6 text-muted-foreground/50 mx-auto" />
              <p>No customer profiles found yet.</p>
            </div>
          ) : (
            customers.map((c) => {
              const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Customer";
              const initials =
                fullName
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "CU";

              const ordersCount = c.orders ? c.orders.length : 0;
              const totalSpend = c.orders
                ? c.orders.reduce(
                    (sum, o) => sum + parseFloat(String(o.totalAmount || 0)),
                    0
                  )
                : 0;

              return (
                <div
                  key={c.id || c.email}
                  className="flex items-center justify-between py-1.5 group hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground text-xs truncate">
                        {fullName}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {c.email || "No email"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    {totalSpend > 0 ? (
                      <span className="text-xs font-bold text-foreground block">
                        ₹{Math.round(totalSpend).toLocaleString("en-IN")}
                      </span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground">
                      {ordersCount} {ordersCount === 1 ? "order" : "orders"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </div>

      {onViewAll && customers.length > 0 && !isLoading && (
        <div className="p-3 border-t border-border/60 bg-muted/10">
          <Button
            variant="ghost"
            size="xs"
            onClick={onViewAll}
            className="w-full text-xs text-muted-foreground hover:text-foreground justify-center gap-1.5 h-7"
          >
            <span>See complete customer directory</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </Card>
  );
}
