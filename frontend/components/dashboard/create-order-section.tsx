"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Trash2,
  RotateCw,
  CheckCircle2,
  User,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  Package,
  Store,
} from "lucide-react";
import { createOrder, fetchProducts, ProductItem } from "@/lib/api";

interface CreateOrderSectionProps {
  onBack: () => void;
  onOrderCreated?: () => void;
}

export function CreateOrderSection({
  onBack,
  onOrderCreated,
}: CreateOrderSectionProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+91 ");
  const [financialStatus, setFinancialStatus] = useState("Paid");
  const [currency] = useState("INR");

  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
  const [items, setItems] = useState<
    Array<{ productName: string; price: number; quantity: number; shopifyId?: string }>
  >([{ productName: "Classic Cotton Tee", price: 1299, quantity: 1 }]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    orderNumber: string;
    shopifyId?: string;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchProducts().then((prods) => {
      if (!ignore && prods) {
        setCatalogProducts(prods);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, ProductItem[]> = {};
    catalogProducts.forEach((p) => {
      const cat = p.category || "Store Catalog";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [catalogProducts]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productName: "", price: 999, quantity: 1 }]);
  };

  const handleAddCatalogProduct = (productId: string) => {
    if (!productId) return;
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      if (prev.length === 1 && !prev[0].productName.trim()) {
        return [
          {
            productName: prod.title,
            price: prod.price,
            quantity: 1,
            shopifyId: prod.variantId,
          },
        ];
      }
      return [
        ...prev,
        {
          productName: prod.title,
          price: prod.price,
          quantity: 1,
          shopifyId: prod.variantId,
        },
      ];
    });
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

  const handleQuantityDelta = (index: number, delta: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const currentQty = copy[index].quantity || 1;
      const newQty = Math.max(1, currentQty + delta);
      copy[index] = { ...copy[index], quantity: newQty };
      return copy;
    });
  };

  const totalAmount = items.reduce(
    (acc, curr) => acc + (curr.price || 0) * (curr.quantity || 1),
    0
  );
  const totalItemsCount = items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (!customerEmail || !customerEmail.includes("@")) {
      setErrorMessage("Please enter a valid customer email address.");
      return;
    }

    const invalidItem = items.find(
      (i) => !i.productName.trim() || i.price <= 0 || i.quantity <= 0
    );
    if (invalidItem) {
      setErrorMessage(
        "Please ensure all line items have a valid product name, positive price, and quantity."
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await createOrder({
        customerName: customerName.trim() || "Guest Customer",
        customerEmail: customerEmail.trim(),
        customerPhone:
          customerPhone.trim() && customerPhone.trim() !== "+91"
            ? customerPhone.trim()
            : undefined,
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

  const handleCreateAnother = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("+91 ");
    setFinancialStatus("Paid");
    setItems([{ productName: "Classic Cotton Tee", price: 1299, quantity: 1 }]);
    setErrorMessage("");
    setSuccessInfo(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Success View */}
      {successInfo ? (
        <Card className="border border-border/80 bg-card shadow-sm p-8 text-center space-y-5 max-w-lg mx-auto my-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">
              Order {successInfo.orderNumber} Created Successfully!
            </h2>
            <p className="text-xs text-muted-foreground">
              Order has been created in Shopify and synced to your database in real-time.
            </p>
            {successInfo.shopifyId && (
              <div className="pt-1.5">
                <span className="inline-block font-mono text-xs bg-muted px-2.5 py-1 rounded-md text-foreground font-semibold border border-border/70">
                  Shopify Order ID: #{successInfo.shopifyId}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateAnother}
              className="border-border text-xs font-medium h-9 px-3.5"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Create Another</span>
            </Button>
            <Button
              size="sm"
              onClick={onBack}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-4.5 shadow-xs"
            >
              Done & View Orders
            </Button>
          </div>
        </Card>
      ) : (
        /* Streamlined Single-Screen Layout (NO SCROLL NEEDED) */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                className="gap-1.5 text-xs font-medium border-border/80 hover:bg-muted h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Orders</span>
              </Button>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Create New Order</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 border border-emerald-500/20">
                  <Store className="h-3 w-3" />
                  <span>Shopify Sync</span>
                </span>
              </div>
            </div>

            {/* Quick Actions (Always visible without scrolling) */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                disabled={isLoading}
                className="text-xs h-8 px-3 border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="gap-1.5 text-xs h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Order (₹{totalAmount.toLocaleString("en-IN")})</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Customer & Payment Details (Compact Single Row) */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardContent className="p-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <User className="h-3 w-3 text-primary" />
                    <span>Customer Name</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 text-primary" />
                    <span>Customer Email <span className="text-primary font-bold">*</span></span>
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>Phone (Optional)</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    <span>Payment Status</span>
                  </label>
                  <select
                    value={financialStatus}
                    onChange={(e) => setFinancialStatus(e.target.value)}
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Paid">Paid (Captured)</option>
                    <option value="Pending">Pending (COD)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Line Items & Summary (Unified compact card) */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="py-2.5 px-3.5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-bold text-foreground">
                  Line Items ({totalItemsCount} {totalItemsCount === 1 ? "item" : "items"})
                </CardTitle>
              </div>

              {/* Catalog Dropdown & Add Button */}
              <div className="flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    handleAddCatalogProduct(e.target.value);
                    e.target.value = "";
                  }}
                  className="h-7 max-w-[240px] rounded-md border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">+ Add product from catalog...</option>
                  {Object.entries(groupedProducts).map(([category, prods]) => (
                    <optgroup key={category} label={category}>
                      {prods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} — ₹{p.price.toLocaleString("en-IN")}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 px-2 text-[11px] gap-1 border-border hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Custom</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 space-y-2.5">
              {/* Product Rows */}
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const lineSubtotal = (item.price || 0) * (item.quantity || 1);

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-lg bg-muted/20 p-2 border border-border/60 hover:border-border transition-colors text-xs"
                    >
                      {/* Product Name */}
                      <div className="flex-1 min-w-0">
                        <Input
                          type="text"
                          placeholder="Product Name"
                          value={item.productName}
                          onChange={(e) =>
                            handleItemChange(idx, "productName", e.target.value)
                          }
                          className="h-8 text-xs bg-background"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div className="w-24 shrink-0 flex items-center gap-1">
                        <span className="text-muted-foreground font-semibold text-xs">₹</span>
                        <Input
                          type="number"
                          min="1"
                          step="any"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 text-xs bg-background font-medium"
                          required
                        />
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-md border border-border bg-background h-8 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityDelta(idx, -1)}
                          className="px-2 h-full text-muted-foreground hover:text-foreground font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-semibold text-xs text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityDelta(idx, 1)}
                          className="px-2 h-full text-muted-foreground hover:text-foreground font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="w-20 text-right shrink-0 font-bold text-foreground text-xs truncate">
                        ₹{lineSubtotal.toLocaleString("en-IN")}
                      </div>

                      {/* Delete Action */}
                      <div className="shrink-0">
                        {items.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-muted-foreground hover:text-destructive h-7 w-7 rounded-md hover:bg-destructive/10"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <div className="w-7" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total & Summary Bar */}
              <div className="pt-2.5 border-t border-border/70 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">
                  Currency: <strong className="text-foreground">{currency}</strong> • Free Shipping
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Order Total:</span>
                  <span className="text-lg font-extrabold text-primary">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
