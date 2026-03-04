"use client";

import { useState } from "react";
import { formatCurrencyNoCents } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { parseCurrencyInput } from "@/lib/currency";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions, useDeleteTransaction, useUpdateTransaction, APITransaction } from "@/hooks/use-transactions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";

export default function TransactionsPage() {
  const { data: categories = [] } = useCategories();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<"all" | "this_month" | "last_month" | "last_3_months">("this_month");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  const [editingTx, setEditingTx] = useState<APITransaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  let apiMonth: string | undefined = undefined;
  const now = new Date();
  if (filterDate === "this_month") {
    apiMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  } else if (filterDate === "last_month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    apiMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  }

  const [apiSortBy, apiSortOrder] = sortBy.split("_") as ["date" | "amount", "desc" | "asc"];

  const { data: transactions = [] } = useTransactions({
    type: filterType === "all" ? undefined : filterType,
    category_id: filterCategory === "all" ? undefined : filterCategory,
    search: search || undefined,
    sort_by: apiSortBy,
    sort_order: apiSortOrder,
    month: apiMonth,
  });

  const { mutate: deleteTx } = useDeleteTransaction();
  const { mutate: updateTx } = useUpdateTransaction();

  const sorted = transactions.filter((t) => {
    if (filterDate === "last_3_months") {
      const txDate = new Date(t.date);
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      if (txDate < threeMonthsAgo) return false;
    }
    return true;
  });

  const handleSaveEdit = () => {
    if (!editingTx) return;
    const val = parseCurrencyInput(editAmount);
    if (val > 0 && editDate) {
      updateTx(
        {
          id: editingTx.id,
          data: {
            amount: val,
            date: editDate,
            notes: editNotes,
            category_id: editingTx.type === "expense" ? editCategory : null,
          },
        },
        {
          onSuccess: () => toast("Transaction updated"),
          onError: (err) => toast(err.message || "Failed to update", "error"),
        }
      );
    }
    setEditingTx(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTxId) return;
    deleteTx(deletingTxId, {
      onSuccess: () => toast("Transaction deleted"),
      onError: (err) => toast(err.message || "Failed to delete", "error"),
    });
    setDeletingTxId(null);
  };

  const openEdit = (t: APITransaction) => {
    setEditingTx(t);
    setEditAmount((t.amount / 100).toString());
    setEditDate(t.date);
    setEditNotes(t.notes || "");
    setEditCategory(t.category_id || "");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl pb-24">
      <header className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">History</h2>
          <p className="text-muted-foreground hidden sm:block">
            View, filter, and manage your past transactions.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 bg-muted/30 p-4 rounded-lg border">
          <div className="relative col-span-2 lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={filterDate} onValueChange={(val: any) => setFilterDate(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val)} disabled={filterType === "income"}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="amount_desc">Highest Amount</SelectItem>
              <SelectItem value="amount_asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="space-y-4">
        {sorted.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No transactions found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((t) => {
              const cat = categories.find((c) => c.id === t.category_id);
              return (
                <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                      style={{
                        backgroundColor: t.type === "income" ? "#10b98120" : `${cat?.color}20`,
                        color: t.type === "income" ? "#10b981" : cat?.color,
                      }}
                    >
                      {t.type === "income" ? "💰" : cat?.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {t.type === "income" ? "Salary / Income" : cat?.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {t.date} {t.notes ? `• ${t.notes}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`font-semibold text-sm sm:text-base ${t.type === "income" ? "text-emerald-500" : "text-foreground"}`}>
                      {t.type === "income" ? "+" : "-"}{formatCurrencyNoCents(t.amount)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500" onClick={() => setDeletingTxId(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              {editingTx.type === "expense" && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTx(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingTxId}
        onOpenChange={(open) => !open && setDeletingTxId(null)}
        title="Delete transaction?"
        description="This action cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
