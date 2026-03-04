"use client";

import { useState } from "react";
import { CategoryCard } from "./category-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { parseCurrencyInput } from "@/lib/currency";
import { useCategories, useCreateCategory, APICategory } from "@/hooks/use-categories";
import { useUpsertBudget } from "@/hooks/use-budgets";
import { DashboardCategory } from "@/hooks/use-dashboard";

const ICON_OPTIONS = ["📊", "💰", "🛍️", "🏠", "🎮", "📚", "✈️", "💊", "📱", "🎵", "🍕", "⚡", "🚗", "👕", "💇", "🐶"];
const COLOR_OPTIONS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#2dd4bf", "#a3e635"];

export function CategoryGrid({ month, categories }: { month: string; categories: DashboardCategory[] }) {
  const { data: allCategories = [] } = useCategories();
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: upsertBudget } = useUpsertBudget();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [selectedCat, setSelectedCat] = useState<APICategory | null>(null);
  const [budgetInput, setBudgetInput] = useState("");

  // For create new mode
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📊");
  const [newColor, setNewColor] = useState("#38bdf8");

  const budgetedNames = new Set(categories.map((c) => c.category_name));
  const unbudgeted = allCategories.filter((c) => !budgetedNames.has(c.name));

  const resetDialog = () => {
    setMode("pick");
    setSelectedCat(null);
    setBudgetInput("");
    setNewName("");
    setNewIcon("📊");
    setNewColor("#38bdf8");
  };

  const handleOpen = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

  const handleAddExisting = () => {
    if (!selectedCat) return;
    const budgetPaise = parseCurrencyInput(budgetInput);
    if (budgetPaise > 0) {
      upsertBudget(
        { categoryId: selectedCat.id, month, limit: budgetPaise },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            resetDialog();
          },
        }
      );
    }
  };

  const handleCreateNew = () => {
    if (!newName.trim()) return;
    const budgetPaise = parseCurrencyInput(budgetInput);

    createCategory(
      { name: newName.trim(), icon: newIcon, color: newColor },
      {
        onSuccess: (created) => {
          if (budgetPaise > 0) {
            upsertBudget({ categoryId: created.id, month, limit: budgetPaise });
          }
          setIsDialogOpen(false);
          resetDialog();
        },
      }
    );
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => (
          <CategoryCard key={cat.category_name} category={cat} month={month} />
        ))}

        <Card
          className="flex items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors min-h-[200px]"
          onClick={handleOpen}
        >
          <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add Category</span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{mode === "pick" ? "Add Category" : "Create New Category"}</DialogTitle>
          </DialogHeader>

          {mode === "pick" ? (
            <div className="space-y-4 py-2 overflow-y-auto flex-1">
              {unbudgeted.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Existing Categories</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {unbudgeted.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                          selectedCat?.id === cat.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedCat(cat)}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm font-medium truncate">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCat && (
                <div className="space-y-2 pt-2">
                  <Label>Monthly Budget (₹)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    autoFocus
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddExisting()}
                  />
                </div>
              )}

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm"
                onClick={() => setMode("create")}
              >
                <Plus className="h-4 w-4" />
                Create New Category
              </button>
            </div>
          ) : (
            <div className="space-y-4 py-2 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Stocks"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        newIcon === icon ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                      }`}
                      onClick={() => setNewIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monthly Budget (₹)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {mode === "create" && (
              <Button variant="ghost" onClick={() => setMode("pick")} className="mr-auto">
                Back
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            {mode === "pick" ? (
              <Button onClick={handleAddExisting} disabled={!selectedCat || !budgetInput}>
                Add
              </Button>
            ) : (
              <Button onClick={handleCreateNew} disabled={!newName.trim()}>
                Create
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
