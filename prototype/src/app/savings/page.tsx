"use client";

import { useState } from "react";
import { formatCurrencyNoCents, parseCurrencyInput } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, PartyPopper, Pencil, Trash2 } from "lucide-react";
import {
  useSavingsGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateAllocation,
  useSavingsAllocations,
  APISavingsGoal
} from "@/hooks/use-savings";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";

export default function SavingsPage() {
  const { data: goals = [] } = useSavingsGoals();
  const { mutate: createGoal } = useCreateGoal();
  const { toast } = useToast();
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");

  const handleCreateGoal = () => {
    if (!newGoalName.trim()) return;
    const target = newGoalTarget ? parseCurrencyInput(newGoalTarget) : null;
    createGoal(
      {
        name: newGoalName,
        target_amount: target,
        deadline: newGoalDeadline || null,
      },
      {
        onSuccess: () => toast("Goal created"),
        onError: (err) => toast(err.message || "Failed to create goal", "error"),
      }
    );
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalDeadline("");
    setIsNewGoalOpen(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-5xl pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Savings Goals</h2>
          <p className="text-muted-foreground hidden sm:block">
            Track your progress toward your financial targets.
          </p>
        </div>
        <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Goal</Button>
          </DialogTrigger>
          <DialogContent onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input
                  placeholder="e.g. New Laptop"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Amount (Optional, leave blank for "Save More")</Label>
                <Input
                  type="number"
                  placeholder="₹"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline (Optional)</Label>
                <Input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </main>
    </div>
  );
}

function GoalCard({ goal }: { goal: APISavingsGoal }) {
  const { mutate: createAllocation } = useCreateAllocation();
  const { mutate: updateGoal } = useUpdateGoal();
  const { mutate: deleteGoal } = useDeleteGoal();
  const { data: allocations = [] } = useSavingsAllocations(goal.id);
  const { toast } = useToast();

  const [amountInput, setAmountInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(goal.target_amount ? (goal.target_amount / 100).toString() : "");
  const [editDeadline, setEditDeadline] = useState(goal.deadline || "");

  const currentAmount = goal.current_amount;

  const targetPaise = goal.target_amount;
  const isSpecific = targetPaise !== null && targetPaise > 0;
  const ratio = isSpecific ? currentAmount / targetPaise! : 0;
  const percent = isSpecific ? Math.min(Math.max(ratio * 100, 0), 100) : 100;
  const isCompleted = isSpecific && ratio >= 1.0;

  const handleTransact = () => {
    const val = parseCurrencyInput(amountInput);
    if (val > 0) {
      createAllocation(
        {
          goal_id: goal.id,
          amount: isWithdrawing ? -val : val,
          date: new Date().toISOString().split("T")[0],
        },
        {
          onSuccess: () => toast(isWithdrawing ? "Withdrawn" : "Funds added"),
          onError: (err) => toast(err.message || "Failed", "error"),
        }
      );
    }
    setAmountInput("");
    setIsAdding(false);
    setIsWithdrawing(false);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    const target = editTarget ? parseCurrencyInput(editTarget) : null;
    updateGoal(
      {
        id: goal.id,
        data: {
          name: editName,
          target_amount: target,
          deadline: editDeadline || null,
        },
      },
      {
        onSuccess: () => toast("Goal updated"),
        onError: (err) => toast(err.message || "Failed to update", "error"),
      }
    );
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    deleteGoal(goal.id, {
      onSuccess: () => toast("Goal deleted"),
      onError: (err) => toast(err.message || "Failed to delete", "error"),
    });
    setIsConfirmingDelete(false);
  };

  return (
    <Card className={`overflow-hidden flex flex-col ${isCompleted ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-0 pt-4">
        <div className="flex items-center gap-2">
          {isCompleted ? <PartyPopper className="h-5 w-5 text-emerald-500" /> : <Target className="h-5 w-5 text-primary" />}
          <CardTitle className="text-base">{goal.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500" onClick={() => setIsConfirmingDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="flex justify-between items-end text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Saved</span>
            <span className="font-semibold text-xl">{formatCurrencyNoCents(currentAmount)}</span>
          </div>
          {isSpecific && (
            <div className="text-right">
              <span className="text-muted-foreground block text-xs">Target</span>
              <span className="font-medium text-lg">{formatCurrencyNoCents(targetPaise!)}</span>
            </div>
          )}
        </div>

        {isSpecific && (
          <div className="space-y-1 mt-4">
            <Progress value={percent} className="h-2" indicatorColor={isCompleted ? "bg-emerald-500" : "bg-primary"} />
            <div className="text-right text-xs text-muted-foreground font-medium">
              {Math.round(percent)}%
            </div>
          </div>
        )}

        {(isAdding || isWithdrawing) && (
          <div className="pt-4 space-y-2">
            <Label className="text-xs">{isAdding ? "Add Funds" : "Withdraw Funds"}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="₹"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleTransact()}
              />
              <Button onClick={handleTransact}>{isAdding ? "Add" : "Remove"}</Button>
              <Button variant="ghost" onClick={() => { setIsAdding(false); setIsWithdrawing(false); }}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>

      {!isAdding && !isWithdrawing && (
        <CardFooter className="flex gap-2 pt-0">
          <Button variant="secondary" className="flex-1 text-xs h-8" onClick={() => setIsAdding(true)}>
            Fund Goal
          </Button>
          <Button variant="outline" className="text-xs h-8" onClick={() => setIsWithdrawing(true)} disabled={currentAmount <= 0}>
            Withdraw
          </Button>
        </CardFooter>
      )}

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Target Amount (Optional)</Label>
              <Input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete this goal?"
        description="This will permanently delete the goal and all its allocation history."
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
