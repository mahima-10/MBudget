import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { categoryKeys, dashboardKeys, trendsKeys, transactionKeys } from "@/lib/queries";

// Let's define the local type here to untether it from store.ts eventually
export interface APICategory {
  id: string; // backend returns UUID string
  name: string;
  icon: string;
  color: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => api.get<APICategory[]>("/categories"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<APICategory, "id" | "is_custom" | "created_at" | "updated_at">) =>
      api.post<APICategory>("/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    }
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<APICategory, "id" | "is_custom" | "created_at" | "updated_at">> }) =>
      api.put<APICategory>(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: trendsKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    }
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: trendsKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    }
  });
}
