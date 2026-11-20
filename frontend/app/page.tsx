"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsGrid } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { RecentCustomersCard } from "@/components/dashboard/recent-customers-card";
import { OrderDetailsSection } from "@/components/dashboard/order-details-section";
import { ShopifyStatusCard } from "@/components/dashboard/shopify-status-card";
import { CustomersView } from "@/components/dashboard/customers-view";
import { CreateOrderSection } from "@/components/dashboard/create-order-section";
import { LoginView } from "@/components/auth/login-view";
import { Button } from "@/components/ui/button";
import {
  fetchShopifyStatus,
  syncShopifyOrders,
  ShopifyStatusResponse,
  Order,
  getStoredAuth,
  logoutUser,
  UserSession,
} from "@/lib/api";
import {
  RotateCw,
  Store,
  X,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Plus,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [shopifyData, setShopifyData] = useState<ShopifyStatusResponse | null>(null);
  const [ordersVersion, setOrdersVersion] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth) {
      setCurrentUser(auth);
    }
    setIsAuthChecking(false);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const loadShopifyData = useCallback(() => {
    fetchShopifyStatus()
      .then((data) => {
        if (data) {
          setShopifyData(data);
        }
      })
      .catch((err) => {
        console.warn("fetchShopifyStatus error:", err);
      })
      .finally(() => {
        setIsInitialLoading(false);
      });
  }, []);

  const handleSyncComplete = useCallback(() => {
    loadShopifyData();
    setOrdersVersion((v) => v + 1);
  }, [loadShopifyData]);

  useEffect(() => {
    loadShopifyData();

    // Auto-sync whenever the user switches back to this browser tab from Shopify
    const handleWindowFocus = () => {
      syncShopifyOrders()
        .then(() => handleSyncComplete())
        .catch(() => { });
    };

    // Periodic auto-sync every 30 seconds
    const interval = setInterval(() => {
      syncShopifyOrders()
        .then(() => handleSyncComplete())
        .catch(() => { });
    }, 30000);

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadShopifyData, handleSyncComplete]);

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
    ];

  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#fffcf2]">
        <RotateCw className="h-8 w-8 animate-spin text-[#eb5e28]" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(session) => setCurrentUser(session)} />;
  }

  return (
    <div className="flex min-h-screen bg-card font-sans text-foreground antialiased">
      {/* Desktop Sidebar with Active Tab Controller */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setViewingOrder(null);
          setIsCreatingOrder(false);
        }}
        shopDomain={shopifyData?.shopDomain}
        user={currentUser}
        onLogout={handleLogout}
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
                <span className="font-bold text-sm">Mini CRM</span>
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
                      setViewingOrder(null);
                      setIsCreatingOrder(false);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${isActive
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

            {/* Mobile Drawer Footer: User Profile & Sign Out */}
            <div className="mt-auto pt-4 border-t border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px] ring-1 ring-primary/20">
                  {currentUser?.name?.[0] || "A"}
                </div>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-semibold text-foreground truncate">
                    {currentUser?.name || "Store Admin"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {currentUser?.email || "admin@mystore.com"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          user={currentUser}
        />

        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Dashboard Header Bar (Shown on main views) */}
          {!isCreatingOrder && !viewingOrder && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl capitalize">
                  {activeTab === "dashboard"
                    ? "Dashboard"
                    : activeTab === "orders"
                      ? "Order Management"
                      : "Customer Profiles"}
                </h1>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshAll}
                  disabled={isRefreshing}
                  className="gap-1.5 text-xs border-border/80 hover:bg-muted"
                >
                  <RotateCw
                    className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""
                      }`}
                  />
                  <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setIsCreatingOrder(true);
                    setViewingOrder(null);
                  }}
                  className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Order</span>
                </Button>
              </div>
            </div>
          )}

          {/* VIEW: CREATE ORDER (Dedicated full screen experience) */}
          {isCreatingOrder ? (
            <CreateOrderSection
              onBack={() => setIsCreatingOrder(false)}
              onOrderCreated={() => {
                setIsCreatingOrder(false);
                handleSyncComplete();
              }}
            />
          ) : viewingOrder ? (
            <OrderDetailsSection
              order={viewingOrder}
              onBack={() => setViewingOrder(null)}
            />
          ) : (
            <>
              {/* VIEW: DASHBOARD - Focused Order CRM Layout */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* 1. Four Statistic Performance Cards */}
                  <section aria-label="Key Performance Indicators">
                    <StatsGrid liveStats={shopifyData?.stats} isLoading={isInitialLoading} />
                  </section>

                  {/* 2. Primary Showcase: Recent Orders Table (Given Full Dashboard Space) */}
                  <section id="orders" aria-label="Recent Orders Table">
                    <RecentOrders
                      refreshKey={ordersVersion}
                      onSelectOrder={(order) => setViewingOrder(order)}
                    />
                  </section>
                </div>
              )}

              {/* VIEW: ORDERS (Only the table section, static cards removed) */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <RecentOrders
                    refreshKey={ordersVersion}
                    onSelectOrder={(order) => setViewingOrder(order)}
                  />
                </div>
              )}

              {/* VIEW: CUSTOMERS */}
              {activeTab === "customers" && (
                <div className="space-y-6">
                  <CustomersView />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
