"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, PiggyBank, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "History", href: "/transactions", icon: ArrowRightLeft },
  { label: "Goals", href: "/savings", icon: PiggyBank },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const resetData = async () => {
    try {
      await api.post("/reset");
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("mbudget_onboarded");
    localStorage.removeItem("mbudget_recap_dismissed");
  };

  const ResetButton = ({ isMobile }: { isMobile?: boolean }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {isMobile ? (
          <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-colors text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-5 w-5" />
            Reset
          </button>
        ) : (
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left mt-auto">
            <RotateCcw className="h-5 w-5" />
            Reset Data
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[90vw] max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all data?</AlertDialogTitle>
          <AlertDialogDescription>
            This will erase all data and restart the app. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={async () => {
              await resetData();
              window.location.href = "/";
            }} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">MBudget</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 flex flex-col">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          
          <div className="mt-auto pt-4 pb-4">
            <ResetButton />
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card h-16 flex items-center justify-around px-2 z-50">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "fill-primary/20" : "")} />
              {item.label}
            </Link>
          );
        })}
        <ResetButton isMobile />
      </nav>
    </div>
  );
}
