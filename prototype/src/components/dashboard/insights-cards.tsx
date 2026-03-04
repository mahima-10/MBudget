"use client";

import { formatCurrencyNoCents } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, Flame, CalendarClock } from "lucide-react";
import { useTrends } from "@/hooks/use-trends";

export function InsightsCards({ month }: { month: string }) {
  const { data: trends, isLoading } = useTrends(month);

  if (isLoading || !trends) {
    return <div className="grid gap-4 md:grid-cols-3"><Card className="h-24 animate-pulse bg-muted/50" /><Card className="h-24 animate-pulse bg-muted/50" /><Card className="h-24 animate-pulse bg-muted/50" /></div>;
  }

  // --- MoM Calculation ---
  const mom = trends.mom_comparison;
  let momText = "No previous data";
  let momColor = "text-muted-foreground";
  if (mom && mom.direction === "up") {
    momText = `You spent ${Math.abs(Math.round(mom.percentage_diff))}% more than last month`;
    momColor = "text-rose-500";
  } else if (mom && mom.direction === "down") {
    momText = `You spent ${Math.abs(Math.round(mom.percentage_diff))}% less than last month`;
    momColor = "text-emerald-500";
  }

  // --- Top Category ---
  let topCategoryName = "None";
  let topCategoryAmount = 0;
  if (trends.category_totals.length > 0) {
    const top = trends.category_totals[0]; // Assuming backend returns sorted, or we just grab first. Actually we should find max.
    const maxCat = trends.category_totals.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
    topCategoryName = maxCat.category_name;
    topCategoryAmount = maxCat.amount;
  }

  // --- Average Daily Spend ---
  const avgDaily = trends.average_daily_spend;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full shrink-0">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Month over Month</p>
            <p className={`text-xs font-semibold ${momColor}`}>{momText}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-full shrink-0">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Highest Spending</p>
            {topCategoryAmount > 0 ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{topCategoryName}</span> at {formatCurrencyNoCents(topCategoryAmount)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Nothing spent yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-full shrink-0">
            <CalendarClock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Avg Daily Spend</p>
            <p className="text-xs font-semibold text-foreground">
              {formatCurrencyNoCents(avgDaily)} <span className="font-normal text-muted-foreground">/ day</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
