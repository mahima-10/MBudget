# FRD-01: Core Data Models

**Status:** Draft
**Component:** P0 - Critical Core

## 1. Overview

Defines the foundational data structures for MBudget. All monetary values are strictly stored as integers (paise) to avoid floating-point errors.
The global app state should store two additional key pieces of data, set during onboarding:

- `opening_balance` (Integer, paise): The user's bank balance when they first start using MBudget.
- `monthly_spending_limit` (Integer, paise): Total spending cap across ALL categories for the month. Editable from dashboard.

## 2. Models

### 2.1 Category

Represents a bucket of spending.

- `id` (UUID)
- `name` (String, e.g., "Food", "Entertainment")
- `icon` (String/Emoji)
- `color` (String, hex code)
- `is_custom` (Boolean, false for predefined)
- `created_at` (Timestamp)

_Predefined Categories:_
Food, People (treating others, splitting), Gifts, Myself (personal treats, shopping), Bills & Utilities, Transport, Entertainment, Subscriptions, Health, Education.

### 2.2 MonthlyBudget

Represents a category's budget limit for a specific month.

- `id` (UUID)
- `category_id` (UUID)
- `month` (String, "YYYY-MM")
- `budget_limit` (Integer, paise)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 2.3 Transaction

Represents a single flow of money (income or expense).

- `id` (UUID)
- `type` (Enum: `income`, `expense`)
- `amount` (Integer, in paise)
- `date` (Date)
- `category_id` (UUID, nullable if income)
- `notes` (String, optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 2.4 Savings Goal

Represents an objective to save money towards.

- `id` (UUID)
- `name` (String, e.g., "New Laptop")
- `target_amount` (Integer, paise, optional for general "save more" goals)
- `deadline` (Date, optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 2.5 SavingsAllocation

Represents an individual contribution towards or withdrawal from a savings goal.

- `id` (UUID)
- `goal_id` (UUID)
- `amount` (Integer, paise. Negative for withdrawals)
- `date` (Date)
- `created_at` (Timestamp)

## 3. Computed Fields

These values are calculated dynamically rather than stored statically:

- **Total Balance:** `opening_balance` + sum(all income transactions) - sum(all expense transactions) - sum(all savings allocations). This represents the user's actual current bank balance.
- **Category Remaining:** `MonthlyBudget.budget_limit` - sum of expenses for that category in that `YYYY-MM` month.
- **Unassigned Balance:** Total Income (month) - Total Expenses (month) - Total Savings Allocations (month).
- **Salary Added This Month:** Boolean, `true` if any `Transaction` with `type=income` exists for the current `YYYY-MM`.
- **SavingsGoal Current Amount:** Sum of `SavingsAllocation.amount` where `goal_id` matches the specific goal.
