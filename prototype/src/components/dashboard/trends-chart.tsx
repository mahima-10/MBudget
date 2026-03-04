"use client";

import { formatMonth, formatCurrencyNoCents } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useTrends } from "@/hooks/use-trends";

export function TrendsChart({ month }: { month: string }) {
  const { data: trends, isLoading } = useTrends(month);

  if (isLoading || !trends) {
    return <div className="grid gap-4 md:grid-cols-2"><Card className="h-[300px] animate-pulse bg-muted/50" /><Card className="h-[300px] animate-pulse bg-muted/50" /></div>;
  }

  // --- Donut Chart Data (Current Month Breakdown) ---
  const breakdownData = trends.category_totals.map((cat) => ({
    name: cat.category_name,
    value: cat.amount / 100, // in rupees for charting
    color: cat.color,
  }));

  // --- Bar Chart Data (Last 6 Months Trend) ---
  const trendData = trends.per_month_spending.map((m) => ({
    name: formatMonth(m.month).split(" ")[0].slice(0, 3), // e.g. "Mar"
    m: m.month,
    spent: m.total / 100,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          {breakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: any) => formatCurrencyNoCents(Number(value) * 100)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No expenses this month
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">6-Month Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
                width={60}
              />
              <RechartsTooltip
                formatter={(value: any) => formatCurrencyNoCents(Number(value) * 100)}
                cursor={{ fill: "rgba(255,255,255,0.1)" }}
              />
              <Bar dataKey="spent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
