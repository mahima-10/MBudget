import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { trendsKeys } from "@/lib/queries";

export interface TrendPerMonth {
  month: string;
  total: number;
}

export interface TrendCategoryTotal {
  category_name: string;
  amount: number;
  color: string;
}

export interface TrendMomComparison {
  percentage_diff: number;
  direction: "up" | "down" | "flat";
}

export interface APITrendsResponse {
  per_month_spending: TrendPerMonth[];
  category_totals: TrendCategoryTotal[];
  mom_comparison: TrendMomComparison | null;
  average_daily_spend: number;
}

export function useTrends(month: string, months: number = 6) {
  return useQuery({
    queryKey: trendsKeys.byParams(month, months),
    queryFn: () => {
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (months) params.append("months", months.toString());
      return api.get<APITrendsResponse>(`/trends?${params.toString()}`);
    },
  });
}
