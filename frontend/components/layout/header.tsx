"use client";

import React from "react";
import {
  Search,
  Bell,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
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
            placeholder="Search orders, customers ..."
            className="h-9 w-full rounded-lg bg-muted/40 pl-8 text-xs border-border/80 focus-visible:bg-background"
          />
        </div>
      </div>

      {/* Right: Shopify Status & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shopify Connection Pill */}
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          <span className="font-semibold text-primary">
            Shopify: Connected
          </span>
         
        </div>

     

        {/* User Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
          AV
        </div>
      </div>
    </header>
  );
}
