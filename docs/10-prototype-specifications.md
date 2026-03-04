# FRD-10: Prototype Specifications

**Status:** Draft
**Component:** P1 - Prototype (Phase 1)

## 1. Overview

This spec defines the boundaries of Phase 1: Prototype. The main objective is to build a functional, beautiful frontend with mock data and local state management before attaching a real PostgreSQL backend.

## 2. Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand (mocking database interactions)
- **Persistent State:** `zustand/middleware/persist` with `localStorage` is REQUIRED. Data must survive page refreshes.
- **Charts:** Recharts
- **Icons:** Lucide React

## 3. Navigation Structure

- `/` (Dashboard): Main overview and category cards.
- `/transactions` (History): Filterable list of all expenses and income.
- `/savings` (Goals): Savings goals tracker.
- **Layout:** Desktop sidebar navigation, Mobile bottom navigation bar.
- **Constraints:** No separate `/settings` page needed. Keep navigation strictly to these 3 routes.

## 4. Scope of Prototype

1. **Mock Data Store Initialization:**
   - Realistic `opening_balance` (e.g., ₹50,000).
   - All 10 predefined categories.
   - `MonthlyBudget` records set up for all categories across the last 6 months.
   - ~80-100 `Transaction` records spread over the last 6 months.
   - 2-3 `SavingsGoal` records (e.g., one specific with a deadline, one general).
   - The current month MUST have an initial salary income transaction added.
2. **First-Time Onboarding Flow:**
   - User goes through a 4-step setup:
     1. Set current bank balance (opening balance).
     2. Add the first salary of the month.
     3. Ensure initial `MonthlyBudget` limits per category are set.
     4. Set the overall maximum spending limit for the month.
3. **Dashboard UI:**
   - Full implementation of FRD-05 (Overview, Category Grid, Charts, Last Month Recap) including the month selector.
   - Include a visually distinct, large **Total Balance** card.
   - Evaluate whether to show the "Last Month Recap", tracking its dismissed state via Zustand persistence (resets on rollover).
   - **Inline Budget & Limit Editing:** Users can edit any category's budget limit directly on the dashboard by tapping the budget amount, and equally edit the overall monthly spending limit by tapping its amount on the overview card.
4. **Transaction Forms:** UI to log salary and add expenses.
   - **Critical UX:** Add-expense must be the absolute fastest flow: Tap category → Type amount → Save (2-3 taps max).
5. **Warnings:** Pre-save inline warnings, category warnings, and the exact snarky global multi-tiered warnings.
6. **Transactions Page:** List, filter, sort, search, edit, and delete tools (FRD-02).
7. **Savings Goals UI:** Display, fund, withdraw, edit, delete, complete logic (FRD-04).

## 5. Design Requirements

- Follow mobile-first or highly responsive desktop layout.
- **Theme:** Dark mode is the default and primary theme.
- **Currency formatting:** All internal values in paise, display as `₹X,XXX.XX` with Indian number formatting (lakhs/crores grouping). Example: `₹1,00,000.00`.
