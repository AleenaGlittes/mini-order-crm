"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  Globe,
  Radio,
} from "lucide-react";
import { syncShopifyOrders } from "@/lib/api";

interface ShopifyStatusCardProps {
  shopDomain?: string;
  isLive?: boolean;
  initialSyncTime?: string;
  onSyncCompleted?: () => void;
}

export function ShopifyStatusCard({
  shopDomain = "mystore.myshopify.com",
  isLive = false,
  initialSyncTime = "2 mins ago",
  onSyncCompleted,
}: ShopifyStatusCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState(initialSyncTime);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncShopifyOrders();
      setSyncTime("Just now");
      onSyncCompleted?.();
    } catch (err) {
      console.warn("Shopify sync note:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {/* Shopify Brand Bag Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <svg
              className="h-5 w-5 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.344 7.15c-.03-.232-.206-.408-.44-.44L14.7 6.13l-2.074-2.075c-.172-.172-.442-.2-.647-.07L11.53 4.26c-.22.14-.325.4-.256.65l.84 3.03-4.52 1.34c-.167.05-.29.186-.32.356L5.3 19.34c-.035.195.04.39.198.514.157.123.368.14.542.046l13.1-7.07c.18-.097.28-.296.25-.5l-.046-.18zM12.63 4.96l1.23 1.23-1.63.48-.56-2.02.96.31zm-1.89 4.38l3.66-1.09 1.5 5.4-5.16 2.78V9.34z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Shopify Store
              </CardTitle>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground">{shopDomain}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={handleSync}
          disabled={isSyncing}
          className="gap-1.5 text-xs border-border/80"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
        </Button>
      </CardHeader>

      <CardContent className="pt-2 text-xs space-y-3">
        {/* Status Highlights */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-2.5 border border-border/50">
          <div>
            <span className="text-muted-foreground block text-[11px]">
              Connection State
            </span>
            <div
              className={`flex items-center gap-1.5 font-medium mt-0.5 ${
                isLive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {isLive ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              <span>{isLive ? "Live API Connected" : "Needs Admin Token"}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">
              Last Synced
            </span>
            <p className="font-medium text-foreground mt-0.5">{syncTime}</p>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2 pt-1 text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-500" /> Webhook Listener
            </span>
            <span className="font-medium text-foreground">Active (orders/create)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> API Version
            </span>
            <span className="font-mono text-[11px] text-foreground">2026-10 (GraphQL)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-500" /> Default Currency
            </span>
            <span className="font-medium text-foreground">INR (₹)</span>
          </div>
        </div>

        {/* Quick Link Button */}
        <div className="pt-2 border-t border-border/60">
          <a
            href={`https://admin.shopify.com/store/${shopDomain.replace(".myshopify.com", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full rounded-md bg-muted/50 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors border border-border/60"
          >
            <span>Open Shopify Admin</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
