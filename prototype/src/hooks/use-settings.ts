import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { settingsKeys, dashboardKeys, categoryKeys } from "@/lib/queries";

export interface AppSettings {
  id: number;
  opening_balance: number;
  monthly_spending_limit: number;
  created_at: string;
  updated_at: string;
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => api.get<AppSettings>("/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Omit<AppSettings, "id" | "created_at" | "updated_at">>) =>
      api.put<AppSettings>("/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useInitSystem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.post<{ detail: string }>("/init"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    }
  });
}
