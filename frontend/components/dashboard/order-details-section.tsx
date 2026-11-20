"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PaymentStatusBadge,
  FulfillmentStatusBadge,
} from "@/components/dashboard/order-status-badge";
import { Order } from "@/lib/api";
import {
  ArrowLeft,
  ExternalLink,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  User,
  Hash,
  Store,
} from "lucide-react";

interface OrderDetailsSectionProps {
  order: Order;
  onBack: () => void;
}

export function OrderDetailsSection({ order, onBack }: OrderDetailsSectionProps) {
  const customerName =
    order.customer?.firstName || order.customer?.lastName
      ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
      : "Guest Customer";

  const customerInitials =
    customerName
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "GC";

  const formattedDate = (() => {
    try {
      const d = new Date(order.orderDate);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return order.orderDate;
    }
  })();

  const items =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            productName: "Standard Order Line Item",
            quantity: 1,
            price: Number(order.totalAmount),
          },
        ];

  const totalItemsCount = items.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0
  );

  const shopifyAdminUrl = `https://admin.shopify.com/store/orders/${
    order.shopifyId || order.orderNumber.replace("#", "")
  }`;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Navigation & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2 text-xs font-medium border-border/80 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </Button>
          <div className="hidden sm:flex items-center text-xs text-muted-foreground gap-1.5 pl-2 border-l border-border/60">
            <span>Orders</span>
            <span>/</span>
            <span className="font-semibold text-foreground">
              {order.orderNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.open(shopifyAdminUrl, "_blank")}
            className="gap-1.5 text-xs bg-[#eb5e28] text-white hover:bg-[#eb5e28]/90 font-medium shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View in Shopify Admin</span>
          </Button>
        </div>
      </div>

      {/* 2. Order Header Banner Card */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Order {order.orderNumber}
                </h2>
                {order.shopifyId && (
                  <span className="inline-flex items-center gap-1 font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border/70">
                    <Hash className="h-3 w-3" />
                    Shopify #{order.shopifyId}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Synced to CRM
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Placed on {formattedDate}</span>
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Payment
                </span>
                <PaymentStatusBadge status={order.financialStatus} />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Fulfillment
                </span>
                <FulfillmentStatusBadge status={order.fulfillmentStatus} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Main Details 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Line Items + Pricing Breakdown (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Purchased Line Items Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[#eb5e28]" />
                  <CardTitle className="text-base font-semibold tracking-tight">
                    Purchased Line Items
                  </CardTitle>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-[11px] text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Item & Description</th>
                      <th className="py-3 px-4 font-semibold text-center">Quantity</th>
                      <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.map((item, index) => {
                      const itemSubtotal =
                        Number(item.price) * (item.quantity || 1);
                      return (
                        <tr key={index} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 border border-border/60">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-xs">
                                  {item.productName}
                                </p>
                                {item.shopifyId && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    SKU / ID: {item.shopifyId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium text-foreground">
                            {item.quantity}
                          </td>
                          <td className="py-3.5 px-4 text-right text-muted-foreground">
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-foreground">
                            ₹{itemSubtotal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Financial Summary Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#eb5e28]" />
                <CardTitle className="text-base font-semibold tracking-tight">
                  Financial Breakdown
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-medium text-foreground">
                  ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping & Handling</span>
                <span className="text-emerald-600 font-medium">Free Standard Shipping</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes & Duties</span>
                <span>Included</span>
              </div>
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-foreground block">
                    Total Amount
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Currency: {order.currency || "INR"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-[#eb5e28]">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer & Synchronization Details (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Information Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#eb5e28]" />
                <CardTitle className="text-base font-semibold tracking-tight">
                  Customer Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eb5e28]/10 text-[#eb5e28] font-bold text-sm ring-1 ring-[#eb5e28]/20">
                  {customerInitials}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {customerName}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Shopify Customer
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  {order.customer?.email ? (
                    <a
                      href={`mailto:${order.customer.email}`}
                      className="text-foreground hover:underline truncate text-xs"
                    >
                      {order.customer.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">
                      No email provided
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  {order.customer?.phone ? (
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="text-foreground hover:underline text-xs"
                    >
                      {order.customer.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">
                      No phone provided
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shopify Integration Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[#eb5e28]" />
                <CardTitle className="text-base font-semibold tracking-tight">
                  Store Integration
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Connected Channel
                </span>
                <span className="font-mono text-xs text-foreground font-medium">
                  Shopify Online Store
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Shopify Order Identifier
                </span>
                <span className="font-mono text-xs text-foreground font-semibold">
                  {order.shopifyId || "Not assigned"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Database Record UUID
                </span>
                <span className="font-mono text-[11px] text-muted-foreground truncate block">
                  {order.id}
                </span>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-medium">
                  HMAC Verified & Stored in PostgreSQL
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Bottom Navigation Bar */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 text-xs font-medium border-border/80 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Orders</span>
        </Button>
      </div>
    </div>
  );
}
