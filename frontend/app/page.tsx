"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsGrid } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { ShopifyStatusCard } from "@/components/dashboard/shopify-status-card";
import { CustomersView } from "@/components/dashboard/customers-view";
import { SettingsView } from "@/components/dashboard/settings-view";
import { CreateOrderDialog } from "@/components/dashboard/create-order-dialog";
import { Button } from "@/components/ui/button";
import { fetchShopifyStatus, ShopifyStatusResponse } from "@/lib/api";
import {
  Download,
  RotateCw,
  ExternalLink,
  Store,
  X,
  LayoutDashboard,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [shopifyData, setShopifyData] = useState<ShopifyStatusResponse | null>(null);
  const [ordersVersion, setOrdersVersion] = useState(0);

  const loadShopifyData = useCallback(() => {
    fetchShopifyStatus()
      .then((data) => {
        if (data) {
          setShopifyData(data);
        }
      })
      .catch((err) => {
        console.warn("fetchShopifyStatus error:", err);
      });
  }, []);

  const handleSyncComplete = useCallback(() => {
    loadShopifyData();
    setOrdersVersion((v) => v + 1);
  }, [loadShopifyData]);

  useEffect(() => {
    loadShopifyData();
  }, [loadShopifyData]);

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    handleSyncComplete();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const navMenuItems: Array<{
    id: NavTab;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
    { id: "orders", title: "Orders", icon: ShoppingBag },
    { id: "customers", title: "Customers", icon: Users },
    { id: "analytics", title: "Analytics", icon: BarChart3 },
    { id: "settings", title: "Shopify Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20 font-sans text-foreground antialiased">
      {/* Desktop Sidebar with Active Tab Controller */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        shopDomain={shopifyData?.shopDomain}
      />

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-1 flex-col bg-card border-r border-border p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  <Store className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm">Shopify CRM</span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="mt-4 space-y-1">
              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl capitalize">
                  {activeTab === "dashboard"
                    ? "Dashboard Overview"
                    : activeTab === "orders"
                    ? "Order Management"
                    : activeTab === "customers"
                    ? "Customer Profiles"
                    : activeTab === "analytics"
                    ? "Revenue & Sales Analytics"
                    : "Shopify Store Settings"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  Live Sync
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {activeTab === "dashboard"
                  ? "Track revenue, analyze order flow, and monitor Shopify store synchronization in real-time."
                  : activeTab === "orders"
                  ? "Review, search, and manage all synced orders with payment and fulfillment tracking."
                  : activeTab === "customers"
                  ? "View customer order counts, lifetime spend, and purchase frequency."
                  : activeTab === "analytics"
                  ? "Analyze monthly sales, revenue trajectory, and peak performance metrics."
                  : "Manage API credentials, webhook listeners, and automatic sync preferences."}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="gap-1.5 text-xs border-border/80"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${
                    isRefreshing ? "animate-spin text-primary" : ""
                  }`}
                />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Order</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-border/80"
                onClick={() => {
                  alert("Exporting recent order records to CSV...");
                }}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>

              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                onClick={() => {
                  window.open("https://admin.shopify.com", "_blank");
                }}
              >
                <span>Shopify Admin</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* VIEW: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* 1. Four Statistic Cards */}
              <section aria-label="Key Performance Indicators">
                <StatsGrid liveStats={shopifyData?.stats} />
              </section>

              {/* 2. Middle Row: Revenue Chart (Left) + Shopify Connection Status (Right) */}
              <section
                aria-label="Analytics and Connection Status"
                className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
              >
                <div className="lg:col-span-8">
                  <RevenueChart data={shopifyData?.stats?.monthlyRevenue} />
                </div>
                <div className="lg:col-span-4">
                  <ShopifyStatusCard
                    shopDomain={shopifyData?.shopDomain}
                    isLive={shopifyData?.isLive}
                    initialSyncTime="Just now"
                    onSyncCompleted={handleSyncComplete}
                  />
                </div>
              </section>

              {/* 3. Bottom Row: Recent Orders Table with Status Badges */}
              <section id="orders" aria-label="Recent Orders Table">
                <RecentOrders refreshKey={ordersVersion} />
              </section>
            </>
          )}

          {/* VIEW: ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <StatsGrid liveStats={shopifyData?.stats} />
              <RecentOrders refreshKey={ordersVersion} />
            </div>
          )}

          {/* VIEW: CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <CustomersView />
            </div>
          )}

          {/* VIEW: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <RevenueChart data={shopifyData?.stats?.monthlyRevenue} />
              <section aria-label="Key Performance Indicators">
                <StatsGrid liveStats={shopifyData?.stats} />
              </section>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <SettingsView />
            </div>
          )}
        </main>
      </div>

      {/* Global Order Creation Dialog */}
      <CreateOrderDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          handleSyncComplete();
        }}
      />
    </div>
  );
}
