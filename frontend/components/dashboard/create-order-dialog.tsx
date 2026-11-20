"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  RotateCw,
  X,
  ShoppingBag,
  CheckCircle2,
  User,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  Package,
} from "lucide-react";
import { createOrder, fetchProducts, ProductItem } from "@/lib/api";

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

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productName: "", price: 999, quantity: 1 }]);
  };

  const handleAddCatalogProduct = (productId: string) => {
    if (!productId) return;
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      // If the only item is empty, replace it
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

  const handleSelectCatalogItemForRow = (index: number, productId: string) => {
    if (productId === "custom") return;
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productName: prod.title,
        price: prod.price,
        shopifyId: prod.variantId,
      };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleDone = () => {
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Create New Order</h2>
             
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Success View */}
        {successInfo ? (
          <div className="p-8 sm:p-12 text-center space-y-5 my-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-foreground">
                Order {successInfo.orderNumber} Created Successfully!
              </h3>
              <p className="text-sm text-muted-foreground">
                Order has been created in Shopify and synchronized to your local database.
              </p>
              {successInfo.shopifyId && (
                <div className="pt-2">
                  <span className="inline-block font-mono text-xs bg-muted px-2.5 py-1 rounded-md text-muted-foreground border border-border/70">
                    Shopify Order ID: #{successInfo.shopifyId}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <Button
                size="sm"
                onClick={handleDone}
                className="bg-primary text-primary-foreground font-medium px-5 h-9"
              >
                Done & View Orders
              </Button>
            </div>
          </div>
        ) : (
          /* Form Content with clean scrolling */
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 text-sm"
          >
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Customer Information Section */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  1. Customer Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    Customer Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-10 text-sm bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    Email Address <span className="text-primary font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="pl-9 h-10 text-sm bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="pl-9 h-10 text-sm bg-background border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    Payment Status
                  </label>
                  <select
                    value={financialStatus}
                    onChange={(e) => setFinancialStatus(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Paid">Paid (Payment Captured)</option>
                    <option value="Pending">Pending (Payment Due / COD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Product Line Items Section */}
            <div className="space-y-3.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">
                    2. Purchased Line Items
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Product Catalog Dropdown Bar (Perfect for large catalogs) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border/70">
                <div className="flex-1">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      handleAddCatalogProduct(e.target.value);
                      e.target.value = "";
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">
                      + Select a product from store catalog to add...
                    </option>
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
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-10 px-3.5 text-xs gap-1.5 border-border hover:bg-muted shrink-0"
                  title="Add a custom item that is not in the store catalog"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Custom Item</span>
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const lineSubtotal = (item.price || 0) * (item.quantity || 1);
                  const matchingProduct = catalogProducts.find(
                    (p) =>
                      p.title.toLowerCase() === item.productName.toLowerCase() ||
                      p.variantId === item.shopifyId
                  );

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-xl bg-muted/20 p-3 border border-border/70 hover:border-border transition-colors"
                    >
                      {/* Product Selector / Name */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-medium uppercase text-muted-foreground block">
                            Item {idx + 1}
                          </label>
                          {catalogProducts.length > 0 && (
                            <select
                              value={matchingProduct?.id || "custom"}
                              onChange={(e) =>
                                handleSelectCatalogItemForRow(idx, e.target.value)
                              }
                              className="text-[11px] bg-transparent text-primary hover:underline cursor-pointer border-0 p-0 focus:outline-none"
                            >
                              <option value="custom">Manual Title</option>
                              {catalogProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  Fill: {p.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <Input
                          type="text"
                          placeholder="e.g. Cotton T-Shirt"
                          value={item.productName}
                          onChange={(e) =>
                            handleItemChange(idx, "productName", e.target.value)
                          }
                          className="h-9 text-xs sm:text-sm bg-background"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Price Input */}
                        <div className="w-28">
                          <label className="text-[10px] font-medium uppercase text-muted-foreground block mb-1">
                            Price (₹)
                          </label>
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
                            className="h-9 text-xs sm:text-sm bg-background font-medium"
                            required
                          />
                        </div>

                        {/* Quantity Stepper */}
                        <div className="w-32">
                          <label className="text-[10px] font-medium uppercase text-muted-foreground block mb-1">
                            Quantity
                          </label>
                          <div className="flex items-center rounded-lg border border-border bg-background h-9">
                            <button
                              type="button"
                              onClick={() => handleQuantityDelta(idx, -1)}
                              className="px-2.5 h-full text-muted-foreground hover:text-foreground font-bold text-sm"
                            >
                              -
                            </button>
                            <span className="flex-1 text-center font-semibold text-xs text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityDelta(idx, 1)}
                              className="px-2.5 h-full text-muted-foreground hover:text-foreground font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="w-24 text-right hidden sm:block">
                          <label className="text-[10px] font-medium uppercase text-muted-foreground block mb-1">
                            Subtotal
                          </label>
                          <span className="font-bold text-foreground text-xs sm:text-sm block h-9 leading-9 truncate">
                            ₹{lineSubtotal.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <div className="pt-4 sm:pt-0">
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-lg hover:bg-destructive/10"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Order Summary & Totals Box */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Items Subtotal ({totalItemsCount} items)</span>
                  <span className="font-medium text-foreground">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping & Taxes</span>
                  <span className="text-emerald-600 font-medium">Free / Included</span>
                </div>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-foreground block">
                      Total Order Amount
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Currency: {currency} • Status: {financialStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-primary">
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 px-4 text-xs font-medium border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="h-10 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Processing on Shopify...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create & Sync Order</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
