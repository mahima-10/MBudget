"use client";

import { useState } from "react";
import { formatCurrency, parseCurrencyInput } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateSettings } from "@/hooks/use-settings";
import { APIDashboardResponse } from "@/hooks/use-dashboard";

export function TotalBalanceCard({ dashboard }: { dashboard: APIDashboardResponse }) {
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totalBalance = dashboard.total_balance;
  const openingBalance = dashboard.opening_balance;

  const handleEditClick = () => {
    setEditAmount((openingBalance / 100).toString());
    setIsEditing(true);
  };

  const handleSave = async () => {
    const amount = parseCurrencyInput(editAmount);
    if (!isNaN(amount) && amount >= 0) {
      setIsSaving(true);
      try {
        await updateSettings({ opening_balance: amount });
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

  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 to-emerald-900/20 border-emerald-500/20 shadow-md">
      <CardContent className="p-6 md:p-8 flex items-center justify-between">
        <div className="w-full">
          <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest mb-1">
            Total Available Balance
          </p>
          
          {isEditing ? (
            <div className="my-2 space-y-2 max-w-xs transition-all">
              <Label className="text-emerald-600 dark:text-emerald-400 font-semibold">Opening Balance (₹)</Label>
              <Input 
                type="number" 
                value={editAmount} 
                onChange={(e) => setEditAmount(e.target.value)} 
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                autoFocus
                disabled={isSaving}
                className="text-lg bg-background/50 border-emerald-500/50"
              />
            </div>
          ) : (
            <div 
              className="group flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer w-fit py-1" 
              onClick={handleEditClick}
            >
              <div className={`text-4xl md:text-5xl font-black transition-colors ${totalBalance < 0 ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300'}`}>
                {formatCurrency(totalBalance)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-emerald-500/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Pencil className="h-4 w-4" />
                <span className="font-medium">Edit Opening Balance</span>
              </div>
            </div>
          )}

          {!isEditing && (
            <p className="text-xs text-muted-foreground mt-2">
              Your exact bank balance after all expenses and savings.
            </p>
          )}
        </div>
        <div className="hidden sm:flex p-6 bg-emerald-500/10 rounded-full shrink-0">
          <Building2 className="h-8 w-8 text-emerald-500" />
        </div>
      </CardContent>
    </Card>
  );
}
