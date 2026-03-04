"use client";

import { getCurrentMonthStr, formatMonth } from "@/lib/currency";
import { useTransactions, useCreateTransaction } from "@/hooks/use-transactions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { parseCurrencyInput } from "@/lib/currency";

export function SalaryReminder({ month, salaryAdded }: { month: string, salaryAdded: boolean }) {
  const { mutate: createTransaction } = useCreateTransaction();
  const [isAdding, setIsAdding] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");

  const today = new Date();
  const currentMonthStr = getCurrentMonthStr();
  const currentDay = today.getDate();

  // Only show on current month view
  if (month !== currentMonthStr) return null;

  // Check if salary already added
  if (salaryAdded) return null;

  const isUrgent = currentDay >= 3;

  const handleAddSalary = () => {
    const val = parseCurrencyInput(salaryInput);
    if (val > 0) {
      createTransaction({
        type: "income",
        amount: val,
        date: `${month}-${String(currentDay).padStart(2, "0")}`,
        notes: "Monthly Salary",
      });
    }
  };

  if (isAdding) {
    return (
      <Alert className="bg-muted/50 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <Input 
            autoFocus
            type="number"
            placeholder="Salary Amount (₹)..." 
            value={salaryInput} 
            onChange={(e) => setSalaryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSalary()}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={handleAddSalary} disabled={!salaryInput}>Confirm</Button>
          <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant={isUrgent ? "destructive" : "default"} className={!isUrgent ? "bg-primary/10 border-primary/20" : ""}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          {isUrgent ? <AlertCircle className="h-5 w-5" /> : <Info className="h-5 w-5 text-primary" />}
          <div>
            <AlertTitle className="font-semibold">{isUrgent ? "Reminder: Salary Missing" : "Time to add your salary!"}</AlertTitle>
            <AlertDescription className="text-sm opacity-90">
              {isUrgent 
                ? "You haven't added your salary for this month yet. Tracking works best when you start with your income." 
                : `It's the beginning of ${formatMonth(month)}. Have you gotten paid yet?`}
            </AlertDescription>
          </div>
        </div>
        <Button 
          variant={isUrgent ? "destructive" : "default"} 
          className="shrink-0"
          onClick={() => setIsAdding(true)}
        >
          Add Salary
        </Button>
      </div>
    </Alert>
  );
}
