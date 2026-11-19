"use client";

import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Store,
  CheckCircle2,
} from "lucide-react";

export type NavTab = "dashboard" | "orders" | "customers" | "analytics" | "settings";

interface SidebarProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  shopDomain?: string;
}

export function Sidebar({
  activeTab = "dashboard",
  onTabChange,
  shopDomain = "aura-bu8xtypb.myshopify.com",
}: SidebarProps) {
  const storeShort = shopDomain.replace(".myshopify.com", "");
  const navItems: Array<{
    id: NavTab;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
  }> = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "orders",
      title: "Orders",
      icon: ShoppingBag,
      badge: "8",
    },
    {
      id: "customers",
      title: "Customers",
      icon: Users,
      badge: "8",
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "settings",
      title: "Shopify Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/80 bg-card sticky top-0 h-screen z-30 select-none">
      {/* Brand & Store Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/80 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
          <Store className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold tracking-tight text-foreground truncate">
            Shopify CRM
          </span>
          <span className="text-[11px] font-mono text-muted-foreground truncate">
            mystore.myshopify.com
          </span>
        </div>
      </div>

      {/* Main Navigation - scrollable if viewport is small */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-2 px-3 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange?.(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Fixed Footer: Shopify Connection & Admin Profile (always visible in viewport) */}
      <div className="shrink-0 p-3.5 border-t border-border/80 bg-card/60 backdrop-blur-xs space-y-3">
        {/* Connection Widget */}
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Shopify Connected
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug truncate">
            Sync active for {storeShort}.
          </p>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-[11px] text-foreground ring-1 ring-border">
            SA
          </div>
          <div className="flex flex-col min-w-0 text-xs leading-none">
            <span className="font-semibold text-foreground truncate">Store Admin</span>
            <span className="text-[11px] text-muted-foreground truncate mt-0.5">
              admin@{storeShort}.com
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
