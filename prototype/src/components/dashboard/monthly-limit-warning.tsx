"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { DashboardOverallLimit } from "@/hooks/use-dashboard";

export function MonthlyLimitWarning({ limit }: { limit: DashboardOverallLimit }) {
  const monthly_spending_limit = limit.limit;
  const totalSpent = limit.spent_vs_limit;

  if (monthly_spending_limit === 0) return null;

  const ratio = limit.percentage / 100;

  if (ratio < 0.5) return null;

  let message = "";
  let bannerClass = "";
  let Icon = Info;

  // Evaluated in reverse order for highest priority matches
  if (ratio >= 1.0) {
    message = "well... look at that. now you have no choice but to stop UNLESS YOU WANT TO BE BROKE FOREVER.";
    bannerClass = "bg-rose-500/15 border-rose-500/50 text-rose-500 dark:text-rose-400";
    Icon = AlertTriangle;
  } else if (ratio >= 0.9) {
    message = "okay now you need to Stop for real.";
    bannerClass = "bg-orange-500/15 border-orange-500/50 text-orange-600 dark:text-orange-400";
    Icon = AlertTriangle;
  } else if (ratio >= 0.75) {
    const remainingInPaise = monthly_spending_limit - totalSpent;
    const remainingRupees = Math.floor(remainingInPaise / 100);
    // Locale formatting for exact FRD match expectation or closest string interpolation
    const formatted = new Intl.NumberFormat("en-IN").format(remainingRupees);
    message = `₹${formatted} left for the month... maybe stop now...?`;
    bannerClass = "bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-500";
    Icon = AlertCircle;
  } else if (ratio >= 0.5) {
    message = "1/2 spent... slow down...";
    bannerClass = "bg-muted border-border text-muted-foreground";
    Icon = Info;
  }

  if (!message) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-sm ${bannerClass}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-semibold tracking-wide">{message}</p>
    </div>
  );
}
