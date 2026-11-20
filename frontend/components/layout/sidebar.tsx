"use client";

import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Store,
  CheckCircle2,
  LogOut,
} from "lucide-react";

export type NavTab = "dashboard" | "orders" | "customers";

interface SidebarProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  shopDomain?: string;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export function Sidebar({
  activeTab = "dashboard",
  onTabChange,
  shopDomain = "mystore.myshopify.com",
  user,
  onLogout,
}: SidebarProps) {
  const storeShort = shopDomain.replace(".myshopify.com", "");
  const userInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SA";
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
          {/* <span className="text-[11px] font-mono text-muted-foreground truncate">
            mystore.myshopify.com
          </span> */}
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
        

        {/* User Profile */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px] ring-1 ring-primary/20">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0 text-xs leading-none">
              <span className="font-semibold text-foreground truncate">
                {user?.name || "Store Admin"}
              </span>
              <span className="text-[11px] text-muted-foreground truncate mt-0.5">
                {user?.email || "admin@mystore.com"}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
