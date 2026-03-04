# FRD-02: Transaction Management

**Status:** Draft
**Component:** P0 - Critical Core

## 1. Overview

The core flow of adding income (salary) and logging expenses. Categories act as distinct buckets with running balances.

## 2. Core Flows

### 2.1 Monthly Income (Salary)

- User logs their salary once at the beginning of the month.
- Stored as a `Transaction` of type `income` without a specific expense category.

### 2.2 Expense Logging

- User adds an expense and selects a `Category`.
- Must input `amount` (INR formatted for user, paise internally). `date` and `notes` are optional (date defaults to today).
- **Minimal Flow:** Tap category → type amount → save. This is the most-used action in the entire app (5-10x daily), so speed is critical. (2-3 taps max).
- **Deduction:** The amount is logically "subtracted" from the category to compute the remaining balance (computed as `MonthlyBudget.budget_limit` minus the sum of expenses for that month). This is a computed value, NOT a mutation of the `budget_limit` field.
- **Running Balance:** The category UI instantly reflects the updated remaining balance.

### 2.3 Transaction History

- **View:** A dedicated screen displaying all transactions.
- **Filters:**
  - Date range (e.g., "This Month", "Last Month")
  - Category
  - Type (Income/Expense)
- **Sort:** Date (descending/ascending), Amount (high/low).
- **Search:** Text matching on the `notes` field.

### 2.4 Edit / Delete Transactions

- User can select any transaction from the history to modify it.
- **Edit:** User can change the `amount`, `category`, `date`, or `notes`.
- **Delete:** User can completely remove a transaction.
- **Impact:** Both actions immediately recalculate and update computed balances for the relevant categories and the overall month.

### 2.5 Monthly Budget Setup

- **Month Rollover:** When a new month begins and no `MonthlyBudget` records exist for that month, auto-copy budget limits from the previous month.
- **Inline Editing:** User can edit any category's budget limit at any time from the dashboard by tapping the budget amount on the category card (inline edit).
- **First-time Setup:** User configures their initial state via a 3-step onboarding flow:
  1. What's your current bank balance? (`opening_balance`)
  2. What is your salary this month? (Income for the current month)
  3. Define budget limits per category
