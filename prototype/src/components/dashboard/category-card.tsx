"use client";

import { useState } from "react";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useUpsertBudget, useDeleteBudget } from "@/hooks/use-budgets";
import { DashboardCategory } from "@/hooks/use-dashboard";
import { formatCurrencyNoCents, parseCurrencyInput } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";

interface CategoryCardProps {
  category: DashboardCategory;
  month: string;
}

export function CategoryCard({ category, month }: CategoryCardProps) {
  const { mutate: createTransaction } = useCreateTransaction();
  const { mutate: upsertBudget } = useUpsertBudget();
  const { mutate: deleteBudget } = useDeleteBudget();
  const { toast } = useToast();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState((category.budget_limit / 100).toString());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseInput, setExpenseInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [expenseNotes, setExpenseNotes] = useState("");
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  const spentPaise = category.spent;
  const budgetPaise = category.budget_limit;
  const remainingPaise = category.remaining;
  const percent = category.percentage;
  const ratio = percent / 100;

  let progressColor = "bg-primary";
  let textColor = "";
  if (ratio > 1.0) {
    progressColor = "bg-rose-500";
    textColor = "text-rose-500";
  } else if (ratio >= 0.9) {
    progressColor = "bg-orange-500";
    textColor = "text-orange-500";
  } else if (ratio >= 0.8) {
    progressColor = "bg-amber-500";
    textColor = "text-amber-500";
  }

  const handleSaveBudget = () => {
    const val = parseCurrencyInput(budgetInput);
    if (val > 0) {
      upsertBudget(
        { categoryId: category.category_id, month, limit: val },
        {
          onError: (err) => toast(err.message || "Failed to update budget", "error"),
        }
      );
    } else {
      setBudgetInput((category.budget_limit / 100).toString());
    }
    setIsEditingBudget(false);
  };

  const handleSaveExpense = () => {
    const val = parseCurrencyInput(expenseInput);
    if (val > 0) {
      createTransaction(
        {
          type: "expense",
          amount: val,
          date: new Date().toISOString().split("T")[0],
          category_id: category.category_id,
          notes: expenseNotes.trim() || undefined,
        },
        {
          onSuccess: () => toast("Expense added"),
          onError: (err) => toast(err.message || "Failed to add expense", "error"),
        }
      );
    }
    setExpenseInput("");
    setExpenseNotes("");
    setShowNotes(false);
    setIsAddingExpense(false);
  };

  const handleConfirmRemove = () => {
    deleteBudget(
      { categoryId: category.category_id, month },
      {
        onSuccess: () => toast("Budget removed"),
        onError: (err) => toast(err.message || "Failed to remove", "error"),
      }
    );
    setIsConfirmingRemove(false);
  };

  const willBeOver = (valStr: string) => {
    const val = parseCurrencyInput(valStr);
    const newRatio = budgetPaise > 0 ? (spentPaise + val) / budgetPaise : 0;
    return newRatio;
  };

  return (
    <>
      <Card className={cn("overflow-hidden flex flex-col", remainingPaise < 0 && "border-rose-500/50")}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${category.category_color || '#cccccc'}20`, color: category.category_color || '#cccccc' }}
            >
              {category.category_icon}
            </div>
            <CardTitle className="text-base">{category.category_name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {remainingPaise < 0 && (
              <span className="text-xs font-semibold text-rose-500 px-2 py-1 bg-rose-500/10 rounded-full">
                Overbudget
              </span>
            )}
            <button
              className="p-1 rounded-md text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              onClick={() => setIsConfirmingRemove(true)}
              title="Remove budget"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
          {!isAddingExpense ? (
            <>
              <div className="flex justify-between items-end text-sm">
                <div>
                  <span className="text-muted-foreground">Spent: </span>
                  <span className="font-semibold">{formatCurrencyNoCents(spentPaise)}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground text-xs block">Budget</span>
                  {isEditingBudget ? (
                    <Input
                      className="h-6 w-20 text-right text-xs px-1 py-0 mt-1"
                      autoFocus
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      onBlur={handleSaveBudget}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveBudget()}
                    />
                  ) : (
                    <span
                      className="font-medium inline-block cursor-pointer hover:underline border-b border-dashed border-transparent hover:border-primary transition-colors"
                      onClick={() => setIsEditingBudget(true)}
                    >
                      {formatCurrencyNoCents(budgetPaise)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className={remainingPaise < 0 ? "text-rose-500" : textColor}>
                    {remainingPaise < 0 ? "-" : ""}{formatCurrencyNoCents(Math.abs(remainingPaise))} left
                  </span>
                  <span className={textColor}>{Math.round(ratio * 100)}%</span>
                </div>
                <Progress value={percent} indicatorColor={progressColor} className="h-2" />
                {ratio > 1.0 && (
                  <p className="text-[10px] text-rose-500 font-medium">Exceeds budget!</p>
                )}
                {ratio >= 0.9 && ratio <= 1.0 && (
                  <p className="text-[10px] text-orange-500 font-medium">Almost out of budget!</p>
                )}
              </div>

              <Button
                variant="secondary"
                className="w-full mt-2 h-9 text-xs"
                onClick={() => setIsAddingExpense(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </>
          ) : (
            <div className="space-y-2 pt-2 bg-muted/30 p-2 rounded-lg border -mx-2 -mb-2 px-4 pb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Amount (₹)</span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setIsAddingExpense(false);
                    setShowNotes(false);
                    setExpenseNotes("");
                  }}
                >
                  Cancel
                </button>
              </div>

              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                autoFocus
                className="text-lg h-10 text-right font-medium"
                value={expenseInput}
                onChange={(e) => setExpenseInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveExpense()}
              />

              {expenseInput && willBeOver(expenseInput) >= 0.8 && willBeOver(expenseInput) < 0.9 && (
                <p className="text-[10px] text-amber-500 font-medium">This will push you past 80%!</p>
              )}
              {expenseInput && willBeOver(expenseInput) >= 0.9 && willBeOver(expenseInput) <= 1.0 && (
                <p className="text-[10px] text-orange-500 font-medium">This will push you past 90%!</p>
              )}
              {expenseInput && willBeOver(expenseInput) > 1.0 && (
                <p className="text-[10px] text-rose-500 font-medium">This will exceed your budget!</p>
              )}

              {showNotes ? (
                <Input
                  placeholder="Notes (optional)"
                  className="text-xs h-8"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveExpense()}
                />
              ) : (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline text-left w-full"
                  onClick={() => setShowNotes(true)}
                >
                  + Add note
                </button>
              )}

              <Button
                className="w-full h-10 mt-1"
                onClick={handleSaveExpense}
                disabled={!expenseInput}
              >
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isConfirmingRemove}
        onOpenChange={setIsConfirmingRemove}
        title={`Remove ${category.category_name} budget?`}
        description="This removes the budget for this month. The category and its expenses will remain."
        confirmLabel="Remove"
        onConfirm={handleConfirmRemove}
      />
    </>
  );
}
