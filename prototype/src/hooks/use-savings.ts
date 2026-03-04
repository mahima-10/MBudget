import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { savingsGoalKeys, savingsAllocationKeys, dashboardKeys } from "@/lib/queries";

export interface APISavingsGoal {
  id: string;
  name: string;
  target_amount: number | null;
  deadline: string | null;
  current_amount: number; // Computed by backend API
  created_at: string;
  updated_at: string;
}

export interface APISavingsAllocation {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  created_at: string;
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: savingsGoalKeys.all,
    queryFn: () => api.get<APISavingsGoal[]>("/savings-goals"),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<APISavingsGoal, "id" | "created_at" | "updated_at" | "current_amount">) =>
      api.post<APISavingsGoal>("/savings-goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<APISavingsGoal, "id" | "created_at" | "updated_at" | "current_amount">> }) =>
      api.put<APISavingsGoal>(`/savings-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/savings-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useSavingsAllocations(goalId: string) {
  return useQuery({
    queryKey: savingsAllocationKeys.byGoal(goalId),
    queryFn: () => api.get<APISavingsAllocation[]>(`/savings-allocations?goal_id=${goalId}`),
    enabled: !!goalId,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<APISavingsAllocation, "id" | "created_at">) =>
      api.post<APISavingsAllocation>("/savings-allocations", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
      queryClient.invalidateQueries({ queryKey: savingsAllocationKeys.byGoal(variables.goal_id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    // We pass both id and goal_id to accurately invalidate the correct nested allocation list
    mutationFn: ({ id }: { id: string; goal_id: string }) => api.delete(`/savings-allocations/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
      queryClient.invalidateQueries({ queryKey: savingsAllocationKeys.byGoal(variables.goal_id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
