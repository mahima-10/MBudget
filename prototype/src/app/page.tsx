"use client";

import { useEffect, useState } from "react";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { getCurrentMonthStr } from "@/lib/currency";
import { useBudgets, useRolloverBudgets } from "@/hooks/use-budgets";
import { useDashboard } from "@/hooks/use-dashboard";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { CategoryGrid } from "@/components/dashboard/category-grid";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { SalaryReminder } from "@/components/dashboard/salary-reminder";
import { InsightsCards } from "@/components/dashboard/insights-cards";
import { TotalBalanceCard } from "@/components/dashboard/total-balance-card";
import { MonthlyLimitCard } from "@/components/dashboard/monthly-limit-card";
import { MonthlyLimitWarning } from "@/components/dashboard/monthly-limit-warning";
import { MonthlyRecapCard } from "@/components/dashboard/monthly-recap-card";

export default function Home() {
  const [completeState, setCompleteState] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState("");

  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard(currentMonth);
  const { data: currentBudgets, isFetched } = useBudgets(currentMonth);
  const { mutate: rolloverBudgets } = useRolloverBudgets();

  useEffect(() => {
    setMounted(true);
    const month = getCurrentMonthStr();
    setCurrentMonth(month);
    
    // Read directly from window object safely
    const isCompleted = localStorage.getItem("mbudget_onboarded") === "true";
    setCompleteState(isCompleted);
  }, []);

  useEffect(() => {
    // On load, try to rollover budgets if needed
    if (completeState && isFetched && currentBudgets?.length === 0 && currentMonth) {
      const [year, m] = currentMonth.split("-").map(Number);
      const prevDate = new Date(year, m - 2, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
      rolloverBudgets({ from_month: prevMonthStr, to_month: currentMonth });
    }
  }, [completeState, isFetched, currentBudgets, currentMonth, rolloverBudgets]);

  if (!mounted) return null; // Wait for client hydration for Zustand persist

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-6xl pb-24">
      <OnboardingDialog />
      
      {completeState && currentMonth && (
        <>
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground hidden sm:block">
                Your financial overview.
              </p>
            </div>
            <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
          </header>

          {isDashboardLoading || !dashboard ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <main className="space-y-8 animate-in fade-in duration-500">
              <SalaryReminder month={currentMonth} salaryAdded={dashboard.salary_added} />
              
              <section>
                <TotalBalanceCard dashboard={dashboard} />
              </section>

              <MonthlyRecapCard currentMonth={currentMonth} recap={dashboard.previous_month_recap} />

              <MonthlyLimitWarning limit={dashboard.overall_limit} />

              <section className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Monthly Overview</h3>
                <MonthlyLimitCard limit={dashboard.overall_limit} />
                <OverviewCards dashboard={dashboard} />
              </section>
              
              <section className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Monthly Budgets</h3>
                <CategoryGrid month={currentMonth} categories={dashboard.categories} />
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Insights</h3>
                <InsightsCards month={currentMonth} />
                <TrendsChart month={currentMonth} />
              </section>
            </main>
          )}
        </>
      )}
    </div>
  );
}
