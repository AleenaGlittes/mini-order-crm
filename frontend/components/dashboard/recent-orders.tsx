"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PaymentStatusBadge,
  FulfillmentStatusBadge,
} from "@/components/dashboard/order-status-badge";
import { fetchOrders, Order } from "@/lib/api";
import {
  Search,
  ExternalLink,
  Eye,
  ShoppingBag,
  ArrowUpDown,
  Download,
  Calendar,
} from "lucide-react";

interface RecentOrdersProps {
  initialOrders?: Order[];
  refreshKey?: number;
}

type FinancialStatusType = "Paid" | "Pending" | "Refunded";
type FulfillmentStatusType = "Fulfilled" | "Unfulfilled" | "Partially Fulfilled";

export function RecentOrders({ initialOrders, refreshKey }: RecentOrdersProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(8);

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"orderDate" | "totalAmount">("orderDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) return;
    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Email",
      "Items Count",
      "Total Amount",
      "Currency",
      "Financial Status",
      "Fulfillment Status",
    ];
    const rows = orders.map((o) => {
      const customerName =
        o.customer?.firstName || o.customer?.lastName
          ? `${o.customer.firstName || ""} ${o.customer.lastName || ""}`.trim()
          : "Guest Customer";
      const itemCount =
        o.items?.reduce((s, i) => s + (i.quantity || 1), 0) || o.items?.length || 1;
      return [
        o.orderNumber,
        new Date(o.orderDate).toLocaleDateString(),
        customerName,
        o.customer?.email || "",
        itemCount,
        o.totalAmount,
        o.currency || "INR",
        o.financialStatus,
        o.fulfillmentStatus,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `shopify_orders_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    let ignore = false;

    fetchOrders({
      page,
      limit,
      search: searchTerm,
      status: paymentFilter,
      fulfillmentStatus: fulfillmentFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy,
      sortOrder,
    })
      .then((res) => {
        if (!ignore) {
          setOrders(res.data);
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.total);
        }
      })
      .catch((err) => {
        console.warn("Failed fetching orders:", err);
      });

    return () => {
      ignore = true;
    };
  }, [
    page,
    limit,
    searchTerm,
    paymentFilter,
    fulfillmentFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    refreshTrigger,
    refreshKey,
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setPaymentFilter(status);
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Recent Orders
              </CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {totalCount} total
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Server-side paginated orders synchronized with Shopify & PostgreSQL
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs h-8 border-border/80 text-muted-foreground hover:text-foreground"
              title="Download orders as CSV spreadsheet"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </CardHeader>

        {/* Filter Controls Row */}
        <div className="border-t border-b border-border/60 bg-muted/10 px-4 py-3 space-y-3 text-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by order # or customer name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            {/* Payment Filter Pills */}
            <div className="flex items-center rounded-lg border border-border/80 bg-background p-0.5 self-start lg:self-auto">
              {["All", "Paid", "Pending", "Refunded"].map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={paymentFilter === status ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => handleStatusChange(status)}
                  className="text-xs px-2.5 h-7"
                >
                  {status}
                </Button>
              ))}
            </div>

            {/* Fulfillment Filter */}
            <div className="flex items-center gap-2">
              <select
                value={fulfillmentFilter}
                onChange={(e) => {
                  setFulfillmentFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="All">Fulfillment: All</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Unfulfilled">Unfulfilled</option>
                <option value="Partially Fulfilled">Partially Fulfilled</option>
              </select>

              {/* Sort & Order Toggle */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "orderDate" | "totalAmount")}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="orderDate">Sort: Order Date</option>
                <option value="totalAmount">Sort: Amount</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                className="h-8 px-2 text-xs gap-1 border-border"
                title={`Order: ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                <ArrowUpDown className="h-3 w-3" />
                <span className="uppercase text-[10px] font-bold">{sortOrder}</span>
              </Button>
            </div>
          </div>

          {/* Date Range Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-muted-foreground">
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <Calendar className="h-3 w-3 text-primary" /> Date Range:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-7 text-xs w-36 bg-background"
              />
              <span className="text-[11px]">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-7 text-xs w-36 bg-background"
              />
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setPage(1);
                  }}
                  className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear dates
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] text-xs font-semibold">Order ID</TableHead>
                  <TableHead className="text-xs font-semibold">Customer</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Items</TableHead>
                  <TableHead className="text-xs font-semibold">Total Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Financial Status</TableHead>
                  <TableHead className="text-xs font-semibold">Fulfillment</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/60" />
                        <p>No orders found matching your search or filters.</p>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSearchTerm("");
                            setPaymentFilter("All");
                            setFulfillmentFilter("All");
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="text-xs text-primary"
                        >
                          Reset filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const customerName =
                      order.customer?.firstName || order.customer?.lastName
                        ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
                        : "Guest Customer";
                    const itemCount =
                      order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || order.items?.length || 1;

                    return (
                      <TableRow key={order.id} className="transition-colors hover:bg-muted/30">
                        <TableCell className="font-semibold text-foreground">
                          <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {order.orderNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground text-xs">{customerName}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {order.customer?.email || "No email"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(order.orderDate)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={order.financialStatus as FinancialStatusType} />
                        </TableCell>
                        <TableCell>
                          <FulfillmentStatusBadge status={order.fulfillmentStatus as FulfillmentStatusType} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setSelectedOrder(order)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            title="View Order Details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Server-side Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground gap-2">
            <div>
              Showing page <strong className="text-foreground">{page}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong> ({totalCount} total orders)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs border-border/80"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs border-border/80"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>

        {/* 3. Detailed Order Modal View */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      Order {selectedOrder.orderNumber}
                    </h3>
                    {selectedOrder.shopifyId && (
                      <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        Shopify #{selectedOrder.shopifyId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Placed on {formatDate(selectedOrder.orderDate)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelectedOrder(null)}
                  className="h-7 w-7 p-0 rounded-full"
                >
                  ✕
                </Button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Customer and Summary Card */}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3.5 border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Customer</span>
                    <p className="font-semibold text-foreground text-xs mt-0.5">
                      {selectedOrder.customer?.firstName || selectedOrder.customer?.lastName
                        ? `${selectedOrder.customer.firstName || ""} ${selectedOrder.customer.lastName || ""}`.trim()
                        : "Guest Customer"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">{selectedOrder.customer?.email || "No email"}</p>
                    {selectedOrder.customer?.phone && (
                      <p className="text-muted-foreground text-[11px]">{selectedOrder.customer.phone}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Order Total</span>
                    <p className="font-bold text-foreground text-sm mt-0.5">
                      ₹{Number(selectedOrder.totalAmount).toLocaleString("en-IN")}
                    </p>
                    <p className="text-muted-foreground text-[11px]">{selectedOrder.currency || "INR"}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px] mb-1">Financial Status</span>
                    <PaymentStatusBadge status={selectedOrder.financialStatus as FinancialStatusType} />
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] mb-1">Fulfillment Status</span>
                    <FulfillmentStatusBadge status={selectedOrder.fulfillmentStatus as FulfillmentStatusType} />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground/80">
                    Purchased Line Items
                  </span>
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-[11px] text-muted-foreground border-b border-border/60">
                        <tr>
                          <th className="p-2">Item</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Price</th>
                          <th className="p-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {(selectedOrder.items && selectedOrder.items.length > 0
                          ? selectedOrder.items
                          : [{ productName: "Standard Order Line Item", quantity: 1, price: selectedOrder.totalAmount }]
                        ).map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2 font-medium text-foreground">{item.productName}</td>
                            <td className="p-2 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="p-2 text-right text-muted-foreground">
                              ₹{Number(item.price).toLocaleString("en-IN")}
                            </td>
                            <td className="p-2 text-right font-semibold text-foreground">
                              ₹{(Number(item.price) * (item.quantity || 1)).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 flex justify-end gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" size="xs" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
                <Button
                  size="xs"
                  className="gap-1 bg-primary text-primary-foreground font-semibold"
                  onClick={() => {
                    const orderId = selectedOrder.shopifyId || selectedOrder.orderNumber.replace("#", "");
                    window.open(`https://admin.shopify.com/store/orders/${orderId}`, "_blank");
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                  View in Shopify Admin
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Order Details Slideover/Modal */}
    </>
  );
}
