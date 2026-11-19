"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, RotateCw, X, ShoppingBag, CheckCircle2 } from "lucide-react";
import { createOrder } from "@/lib/api";

interface CreateOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
}

export function CreateOrderDialog({
  isOpen,
  onClose,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [financialStatus, setFinancialStatus] = useState("Paid");
  const [currency] = useState("INR");

  const [items, setItems] = useState<Array<{ productName: string; price: number; quantity: number }>>([
    { productName: "Classic Cotton Tee", price: 1299, quantity: 1 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ orderNumber: string; shopifyId?: string } | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productName: "", price: 999, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: string | number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const totalAmount = items.reduce((acc, curr) => acc + (curr.price || 0) * (curr.quantity || 1), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!customerEmail || !customerEmail.includes("@")) {
      setErrorMessage("Please enter a valid customer email.");
      return;
    }

    const invalidItem = items.find((i) => !i.productName.trim() || i.price <= 0 || i.quantity <= 0);
    if (invalidItem) {
      setErrorMessage("Please ensure all items have a valid product name, positive price, and quantity.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createOrder({
        customerName: customerName.trim() || "Guest Customer",
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        financialStatus,
        currency,
        items,
      });

      setIsLoading(false);
      setSuccessInfo({
        orderNumber: result?.order?.orderNumber || result?.orderNumber || "#NewOrder",
        shopifyId: result?.order?.shopifyId || result?.shopifyId,
      });

      onOrderCreated?.();
    } catch (err) {
      setIsLoading(false);
      setErrorMessage((err as Error).message || "Failed to create order on Shopify");
    }
  };

  const handleDone = () => {
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-0 shadow-2xl animate-in fade-in-50 zoom-in-95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Create Shopify Order</h2>
              <p className="text-xs text-muted-foreground">
                Syncs directly with Shopify Admin API and persists to PostgreSQL
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {successInfo ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Order {successInfo.orderNumber} Created!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully processed via Shopify Admin API and synchronized to your local database.
              </p>
              {successInfo.shopifyId && (
                <p className="text-[11px] font-mono text-muted-foreground mt-1">
                  Shopify ID: {successInfo.shopifyId}
                </p>
              )}
            </div>
            <div className="pt-2">
              <Button size="sm" onClick={handleDone} className="bg-primary text-primary-foreground">
                Done & View in CRM
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMessage && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                {errorMessage}
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground/80">
                1. Customer Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Customer Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Olivia Martin"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="olivia@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Phone (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Financial Status
                  </label>
                  <select
                    value={financialStatus}
                    onChange={(e) => setFinancialStatus(e.target.value)}
                    className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Line Items */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">
                  2. Product Line Items
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddItem}
                  className="gap-1 text-xs h-7"
                >
                  <Plus className="h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-muted/30 p-2 border border-border/60"
                  >
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Product name"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                        className="h-7 text-xs"
                        required
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, "price", parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs"
                        required
                      />
                    </div>
                    <div className="w-14">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value, 10) || 1)}
                        className="h-7 text-xs"
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-muted-foreground hover:text-destructive h-7 w-7"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3 border border-primary/20 text-xs font-semibold text-foreground">
                <span>Calculated Total ({currency})</span>
                <span className="text-sm font-bold text-primary">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5 bg-primary text-primary-foreground font-semibold">
                {isLoading ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Creating on Shopify...</span>
                  </>
                ) : (
                  <span>Create Order</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
