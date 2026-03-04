"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentMonthStr, parseCurrencyInput } from "@/lib/currency";
import { useInitSystem, useUpdateSettings } from "@/hooks/use-settings";
import { useCategories } from "@/hooks/use-categories";
import { api } from "@/lib/api";

export function OnboardingDialog() {
  const [completeState, setCompleteState] = useState(true);
  
  useEffect(() => {
    // Only run on client mount to avoid hydration mismatch
    const isCompleted = localStorage.getItem("mbudget_onboarded") === "true";
    setCompleteState(isCompleted);
  }, []);

  const [step, setStep] = useState(1);
  const [openingBalanceText, setOpeningBalanceText] = useState("");
  const [salaryText, setSalaryText] = useState("");
  const [budgets, setBudgets] = useState<Record<string, string>>({}); // string input for ease
  const [monthlyLimitText, setMonthlyLimitText] = useState("");
  const currentMonth = getCurrentMonthStr();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: initSystem } = useInitSystem();
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const { data: categories = [], isLoading: catsLoading } = useCategories();

  useEffect(() => {
    if (completeState === false) {
        initSystem();
    }
  }, [completeState, initSystem]);

  if (completeState) return null;

  const handleNext = () => {
    if (step === 1 && openingBalanceText !== "") {
      setStep(2);
    } else if (step === 2 && parseCurrencyInput(salaryText) > 0) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const ob = parseCurrencyInput(openingBalanceText);
      if (ob >= 0) {
        await updateSettings({ opening_balance: ob });
      }

      const salary = parseCurrencyInput(salaryText);
      if (salary > 0) {
        await api.post("/transactions", {
          type: "income",
          amount: salary,
          date: `${currentMonth}-01`,
          notes: "Initial Salary"
        });
      }

      const budgetPayload = categories.map(cat => ({
        category_id: cat.id,
        month: currentMonth,
        budget_limit: parseCurrencyInput(budgets[cat.id] || "0")
      })).filter(b => b.budget_limit > 0);

      if (budgetPayload.length > 0) {
        await api.post("/budgets/bulk", budgetPayload);
      }

      const limit = parseCurrencyInput(monthlyLimitText);
      if (limit > 0) {
        await updateSettings({ monthly_spending_limit: limit });
      }

      localStorage.setItem("mbudget_onboarded", "true");
      setCompleteState(true);
      window.location.reload(); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Welcome to MBudget</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "First, let's set your starting bank balance." 
              : step === 2
              ? "Now, let's add your salary or income for this month."
              : step === 3
              ? "Next, set your monthly budget limits for each category."
              : "Finally, what's the max you want to spend per month?"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opening_balance">Current Bank Balance (₹)</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  placeholder="e.g. 50000"
                  value={openingBalanceText}
                  onChange={(e) => setOpeningBalanceText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  autoFocus
                />
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (₹)</Label>
                <Input
                  id="salary"
                  type="number" 
                  placeholder="e.g. 150000"
                  value={salaryText}
                  onChange={(e) => setSalaryText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  autoFocus
                />
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              {catsLoading ? (
                 <div className="text-center py-4 text-sm text-muted-foreground">Loading categories...</div>
              ) : categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-1/2">
                    <span className="text-xl">{cat.icon}</span>
                    <Label className="text-sm font-medium">{cat.name}</Label>
                  </div>
                  <Input
                    className="w-1/2"
                    type="number"
                    placeholder="Budget (₹)"
                    value={budgets[cat.id] || ""}
                    onChange={(e) => setBudgets({ ...budgets, [cat.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_limit">Overall Monthly Spending Limit (₹)</Label>
                <Input
                  id="monthly_limit"
                  type="number"
                  placeholder="e.g. 20000"
                  value={monthlyLimitText}
                  onChange={(e) => setMonthlyLimitText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 ? (
            <Button onClick={handleNext} disabled={openingBalanceText === "" || parseCurrencyInput(openingBalanceText) < 0}>
              Next Step
            </Button>
          ) : step === 2 ? (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>Back</Button>
              <Button onClick={handleNext} disabled={!salaryText || parseCurrencyInput(salaryText) <= 0 || isSubmitting}>
                Next Step
              </Button>
            </div>
          ) : step === 3 ? (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>Back</Button>
              <Button onClick={handleNext} disabled={isSubmitting}>Next Step</Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setStep(3)} disabled={isSubmitting}>Back</Button>
              <Button onClick={handleComplete} disabled={!monthlyLimitText || parseCurrencyInput(monthlyLimitText) <= 0 || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save & Start"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
