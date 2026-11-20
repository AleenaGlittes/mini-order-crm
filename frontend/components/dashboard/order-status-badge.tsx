import React from "react";
import { Check, Clock, RotateCcw, PackageCheck, Layers } from "lucide-react";
export type PaymentStatusType = 'Paid' | 'Pending' | 'Refunded' | 'Partially Paid' | string;
export type FulfillmentStatusType = 'Fulfilled' | 'Unfulfilled' | 'Partially Fulfilled' | 'Restocked' | string;

export interface PaymentStatusBadgeProps {
  status: PaymentStatusType;
  className?: string;
}

export interface FulfillmentStatusBadgeProps {
  status: FulfillmentStatusType;
  className?: string;
}

export function PaymentStatusBadge({ status, className = "" }: PaymentStatusBadgeProps) {
  switch (status) {
    case "Paid":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <Check className="h-3 w-3 stroke-[2.5]" />
          Paid
        </span>
      );
    case "Pending":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20 ${className}`}
        >
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case "Refunded":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400 border border-rose-500/20 ${className}`}
        >
          <RotateCcw className="h-3 w-3" />
          Refunded
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border ${className}`}
        >
          {status}
        </span>
      );
  }
}

export function FulfillmentStatusBadge({
  status,
  className = "",
}: FulfillmentStatusBadgeProps) {
  switch (status) {
    case "Fulfilled":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-500/20 ${className}`}
        >
          <PackageCheck className="h-3 w-3" />
          Fulfilled
        </span>
      );
    case "Unfulfilled":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-400 border border-zinc-500/20 ${className}`}
        >
          <Clock className="h-3 w-3" />
          Unfulfilled
        </span>
      );
    case "Partially Fulfilled":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-500/20 ${className}`}
        >
          <Layers className="h-3 w-3" />
          Partially Fulfilled
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border ${className}`}
        >
          {status}
        </span>
      );
  }
}

