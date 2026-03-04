"use client";

import { useState, useEffect } from "react";
import { formatCurrencyNoCents } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Trophy, TrendingDown, PiggyBank, X } from "lucide-react";
import { DashboardRecap } from "@/hooks/use-dashboard";

export function MonthlyRecapCard({ currentMonth, recap }: { currentMonth: string, recap: DashboardRecap | null }) {
  const [dismissedRecapForMonth, setDismissedRecapForMonth] = useState<string | null>(null);

  useEffect(() => {
    setDismissedRecapForMonth(localStorage.getItem("mbudget_recap_dismissed"));
  }, []);

  const dismissRecap = (month: string) => {
    localStorage.setItem("mbudget_recap_dismissed", month);
    setDismissedRecapForMonth(month);
  };
  
  if (!recap) return null;
  
  const [year, m] = currentMonth.split("-").map(Number);
  const prevDate = new Date(year, m - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  // If the user already dismissed this month's recap, don't show it.
  if (dismissedRecapForMonth === prevMonthStr) return null;

  const totalIncome = recap.total_income;
  const totalSpent = recap.total_spent;
  const netSaved = recap.net_saved;

  const topCategoryDetail = recap.top_category;
  const topCategoryAmount = topCategoryDetail ? topCategoryDetail.amount : 0;

  // Determine the snarky one-liner verdict
  let verdictMessage = recap.verdict_text;

  // Format month name (e.g. "2026-02" -> "February")
  const dateObj = new Date(`${prevMonthStr}-02`);
  const monthName = dateObj.toLocaleString('default', { month: 'long' });

  return (
    <Card className="bg-muted/30 border-primary/20 shadow-sm relative overflow-hidden">
      {/* Decorative background flair */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10" />

      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {monthName} Recap
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => dismissRecap(prevMonthStr)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-5 space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Total Spent</p>
          <div className="text-3xl font-bold text-primary">
            {formatCurrencyNoCents(totalSpent)}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background/50 rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Income</p>
            <p className="font-semibold text-emerald-500">{formatCurrencyNoCents(totalIncome)}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Net Saved</p>
            <p className={`font-semibold ${netSaved < 0 ? 'text-rose-500' : 'text-blue-500'}`}>{formatCurrencyNoCents(netSaved)}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border col-span-2">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Top Category</p>
            {topCategoryDetail && topCategoryDetail.name !== "None" ? (
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">
                  {topCategoryDetail.name} <span className="text-rose-500 font-normal ml-1">({formatCurrencyNoCents(topCategoryAmount)})</span>
                </p>
              </div>
            ) : (
              <p className="font-semibold text-muted-foreground">None</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-primary/5 border-t border-primary/10 py-3 flex justify-between items-center">
        <p className="text-sm font-semibold tracking-wide text-foreground italic flex-1 text-center">"{verdictMessage}"</p>
      </CardFooter>
    </Card>
  );
}
