import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { dashboardKeys } from "@/lib/queries";
import { APICategory } from "@/hooks/use-categories";

export interface DashboardCategory {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  spent: number;
  budget_limit: number;
  remaining: number;
  percentage: number;
}

export interface DashboardOverallLimit {
  spent_vs_limit: number;
  limit: number;
  percentage: number;
  warning_tier: string | null;
}

export interface DashboardRecap {
  total_spent: number;
  total_income: number;
  net_saved: number;
  top_category: {
    name: string;
    amount: number;
  } | null;
  verdict_text: string;
}

export interface APIDashboardResponse {
  total_balance: number;
  opening_balance: number;
  total_income: number;
  total_expenses: number;
  net_saved: number;
  unassigned_balance: number;
  salary_added: boolean;
  categories: DashboardCategory[];
  overall_limit: DashboardOverallLimit;
  previous_month_recap: DashboardRecap | null;
}

export function useDashboard(month: string) {
  return useQuery({
    queryKey: dashboardKeys.byMonth(month),
    queryFn: () => api.get<APIDashboardResponse>(`/dashboard/${month}`),
  });
}
