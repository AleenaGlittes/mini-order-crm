"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  RotateCw,
  ExternalLink,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState("Synced 2m ago");

  const handleQuickSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncText("Synced just now");
    }, 1000);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMobileMenuToggle}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search orders, customers, or SKUs... (Ctrl+K)"
            className="h-9 w-full rounded-lg bg-muted/40 pl-8 text-xs border-border/80 focus-visible:bg-background"
          />
        </div>
      </div>

      {/* Right: Shopify Status, Sync & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shopify Connection Pill */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          <span className="font-semibold text-primary">
            Shopify: Connected
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-[11px] text-muted-foreground">{lastSyncText}</span>
        </div>

        {/* Sync Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickSync}
          disabled={isSyncing}
          className="gap-1.5 text-xs border-border/80"
        >
          <RotateCw
            className={`h-3.5 w-3.5 ${
              isSyncing ? "animate-spin text-primary" : ""
            }`}
          />
          <span className="hidden sm:inline">
            {isSyncing ? "Syncing..." : "Sync Store"}
          </span>
        </Button>

        {/* Shopify Admin Link */}
        <a
          href="https://admin.shopify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 rounded-lg border border-border/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <span>Shopify Admin</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
        </Button>

        {/* User Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
          SA
        </div>
      </div>
    </header>
  );
}
