"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchShopifyStatus } from "@/lib/api";
import {
  CheckCircle2,
  Radio,
  Save,
  RotateCw,
} from "lucide-react";

export function SettingsView() {
  const [storeDomain, setStoreDomain] = useState("aura-bu8xtypb.myshopify.com");
  const [apiVersion, setApiVersion] = useState("2026-10 (Latest)");
  const [autoSync, setAutoSync] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchShopifyStatus().then((data) => {
      if (data?.shopDomain) {
        setStoreDomain(data.shopDomain);
      }
      if (data?.apiVersion) {
        setApiVersion(`${data.apiVersion} (Admin REST)`);
      }
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">
              Shopify Connection & API Credentials
            </CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Configure your Shopify Custom App API access and synchronization parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Shopify Store Domain
              </label>
              <Input
                type="text"
                value={storeDomain}
                onChange={(e) => setStoreDomain(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Your permanent myshopify.com domain.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Admin API Version
              </label>
              <Input
                type="text"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Recommended version: 2026-10 or later.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="font-semibold text-foreground">
              Admin API Access Token
            </label>
            <Input
              type="password"
              defaultValue="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled
              className="h-8 text-xs font-mono bg-muted/50"
            />
            <p className="text-[11px] text-muted-foreground">
              Token is encrypted and stored safely. Scopes: `read_orders`, `write_orders`, `read_customers`.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border/60">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autosync"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="autosync" className="font-medium text-foreground cursor-pointer">
                Enable Real-time Webhook Synchronization
              </label>
            </div>

            <Button
              size="xs"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5 bg-primary text-primary-foreground"
            >
              {isSaving ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{isSaving ? "Saving..." : savedSuccess ? "Saved!" : "Save Changes"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Active Webhook Subscriptions</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Webhooks push updates from Shopify to this CRM in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs">
          {[
            { topic: "orders/create", status: "Healthy (200 OK)", format: "JSON" },
            { topic: "orders/updated", status: "Healthy (200 OK)", format: "JSON" },
            { topic: "orders/fulfilled", status: "Healthy (200 OK)", format: "JSON" },
            { topic: "customers/create", status: "Healthy (200 OK)", format: "JSON" },
          ].map((hook) => (
            <div
              key={hook.topic}
              className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5 border border-border/50"
            >
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-mono font-medium text-foreground">{hook.topic}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-[11px]">{hook.format}</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {hook.status}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
