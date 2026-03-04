"use client";

import { useState } from "react";
import { formatCurrencyNoCents, parseCurrencyInput } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pencil, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateSettings } from "@/hooks/use-settings";
import { DashboardOverallLimit } from "@/hooks/use-dashboard";

export function MonthlyLimitCard({ limit }: { limit: DashboardOverallLimit }) {
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const monthly_spending_limit = limit.limit;
  const totalSpent = limit.spent_vs_limit;

  const handleEditClick = () => {
    setEditAmount((monthly_spending_limit / 100).toString());
    setIsEditing(true);
  };

  const handleSave = async () => {
    const amount = parseCurrencyInput(editAmount);
    if (!isNaN(amount) && amount > 0) {
      setIsSaving(true);
      try {
        await updateSettings({ monthly_spending_limit: amount });
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
        setIsEditing(false);
      }
    } else {
        setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  };

  const percent = limit.percentage;
  
  let progressColor = "bg-primary";
  if (limit.warning_tier === "red") progressColor = "bg-rose-500";
  else if (limit.warning_tier === "orange") progressColor = "bg-orange-500";
  else if (limit.warning_tier === "amber") progressColor = "bg-amber-500";

  return (
    <Card className="border-primary/20 bg-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Overall Monthly Limit
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="my-2 space-y-2 max-w-sm transition-all pb-4">
            <Label className="text-primary font-semibold">Max Spending Limit (₹)</Label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={editAmount} 
                onChange={(e) => setEditAmount(e.target.value)} 
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                autoFocus
                disabled={isSaving}
                className="text-lg bg-background"
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 group cursor-pointer w-fit" onClick={handleEditClick}>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{formatCurrencyNoCents(totalSpent)}</span>
              <span className="text-muted-foreground pb-1">/ {formatCurrencyNoCents(monthly_spending_limit)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-1">
              <Pencil className="h-3 w-3" />
              <span className="font-medium">Edit Limit</span>
            </div>
          </div>
        )}

        <Progress 
          value={percent} 
          className="h-3 w-full bg-secondary" 
          indicatorColor={progressColor} 
        />
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {percent}% spent
        </p>
      </CardContent>
    </Card>
  );
}
