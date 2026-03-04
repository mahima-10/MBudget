import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { transactionKeys, dashboardKeys, trendsKeys } from "@/lib/queries";
import { APICategory } from "./use-categories";

export interface APITransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  category_id?: string | null;
  notes?: string;
  category?: APICategory | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  month?: string;
  category_id?: string;
  type?: "income" | "expense" | "all";
  search?: string;
  sort_by?: "date" | "amount";
  sort_order?: "asc" | "desc";
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.byParams(filters.month, filters.category_id, filters.type, filters.search, filters.sort_by, filters.sort_order),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.month && filters.month !== "all") params.append("month", filters.month);
      if (filters.category_id && filters.category_id !== "all") params.append("category_id", filters.category_id);
      if (filters.type && filters.type !== "all") params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);
      if (filters.sort_by) params.append("sort_by", filters.sort_by);
      if (filters.sort_order) params.append("sort_order", filters.sort_order);

      const qs = params.toString();
      const url = qs ? `/transactions?${qs}` : "/transactions";
      return api.get<APITransaction[]>(url);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<APITransaction, "id" | "created_at" | "updated_at" | "category">) =>
      api.post<APITransaction>("/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: trendsKeys.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<APITransaction, "id" | "created_at" | "updated_at" | "category">> }) =>
      api.put<APITransaction>(`/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: trendsKeys.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: trendsKeys.all });
    },
  });
}
