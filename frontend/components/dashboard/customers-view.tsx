"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { fetchCustomers, CustomerRecord } from "@/lib/api";
import { Search, Mail, UserCheck, Users } from "lucide-react";

export function CustomersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dbCustomers, setDbCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    fetchCustomers()
      .then((data) => {
        if (!ignore && data) {
          setDbCustomers(data);
        }
      })
      .catch((err) => {
        console.warn("fetchCustomers error:", err);
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

  const customers = useMemo(() => {
    return dbCustomers.map((c) => {
      const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Customer";
      const email = c.email || "No email";
      const ordersCount = c.orders ? c.orders.length : 0;
      const totalSpend = c.orders
        ? c.orders.reduce((sum, o) => sum + parseFloat(String(o.totalAmount || 0)), 0)
        : 0;
      const lastOrderDate =
        c.orders && c.orders.length > 0
          ? c.orders[0].orderDate
          : c.createdAt || new Date().toISOString();

      return {
        id: c.id,
        name,
        email,
        ordersCount,
        totalSpend,
        lastOrderDate,
        tier: totalSpend > 3000 ? "VIP" : totalSpend > 1500 ? "Active" : "Regular",
      };
    });
  }, [dbCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Customer Directory
            </CardTitle>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {filteredCustomers.length} customers
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Profiles, lifetime spend, and purchase history from Shopify customers
          </CardDescription>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/20"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Customer</TableHead>
                <TableHead className="text-xs font-semibold">Tier</TableHead>
                <TableHead className="text-xs font-semibold">Orders</TableHead>
                <TableHead className="text-xs font-semibold">Total Spent</TableHead>
                <TableHead className="text-xs font-semibold">Last Order</TableHead>
                <TableHead className="text-right text-xs font-semibold">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-muted/60" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28 rounded bg-muted/70" />
                          <Skeleton className="h-3 w-36 rounded bg-muted/40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full bg-muted/60" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-12 rounded bg-muted/50" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-20 rounded bg-muted/70" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-24 rounded bg-muted/50" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-16 rounded ml-auto bg-muted/50" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Users className="h-6 w-6 text-muted-foreground/60" />
                      <p>No customer profiles found matching your search.</p>
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSearchTerm("")}
                          className="text-xs text-primary"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const initials = customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <TableRow
                      key={customer.email}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-xs">
                              {customer.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {customer.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            customer.tier === "VIP"
                              ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20"
                              : customer.tier === "Active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          <UserCheck className="h-3 w-3" />
                          {customer.tier}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {customer.ordersCount} {customer.ordersCount === 1 ? "order" : "orders"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground">
                        ₹{customer.totalSpend.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {customer.lastOrderDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            window.location.href = `mailto:${customer.email}`;
                          }}
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
