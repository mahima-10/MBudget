import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { budgetKeys, dashboardKeys } from "@/lib/queries";

export interface MonthlyBudget {
  id: string; // UUID from backend
  category_id: string;
  month: string;
  budget_limit: number;
  created_at: string;
  updated_at: string;
}

export function useBudgets(month: string) {
  return useQuery({
    queryKey: budgetKeys.byMonth(month),
    queryFn: () => api.get<MonthlyBudget[]>(`/budgets?month=${month}`),
  });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, month, limit }: { categoryId: string; month: string; limit: number }) =>
      api.put<{ detail: string }>(`/budgets/${categoryId}/month/${month}`, { budget_limit: limit }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byMonth(variables.month) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, month }: { categoryId: string; month: string }) =>
      api.delete(`/budgets/${categoryId}/month/${month}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useBulkUpsertBudgets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budgets: { category_id: string; month: string; budget_limit: number }[]) =>
      api.post<{ detail: string }>("/budgets/bulk", budgets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useRolloverBudgets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { from_month: string; to_month: string }) =>
      api.post<{ detail: string }>("/budgets/rollover", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byMonth(variables.to_month) });
    },
  });
}
