export const settingsKeys = {
  all: ["settings"] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
};

export const budgetKeys = {
  all: ["budgets"] as const,
  byMonth: (month: string) => ["budgets", month] as const,
};

export const transactionKeys = {
  all: ["transactions"] as const,
  byParams: (month?: string, category_id?: string, type?: string, search?: string, sort_by?: string, sort_order?: string) => 
    ["transactions", { month, category_id, type, search, sort_by, sort_order }] as const,
};

export const savingsGoalKeys = {
  all: ["savings-goals"] as const,
};

export const savingsAllocationKeys = {
    all: ["savings-allocations"] as const,
    byGoal: (goal_id: string) => ["savings-allocations", goal_id] as const,
};

export const dashboardKeys = {
    all: ["dashboard"] as const,
    byMonth: (month: string) => ["dashboard", month] as const,
};

export const trendsKeys = {
    all: ["trends"] as const,
    byParams: (month?: string, months?: number) => ["trends", { month, months }] as const,
};
