# FRD-11: Database Schema

**Status:** Draft
**Component:** P1 - Phase 2 (Backend)

## 1. Overview

This document maps the core data models defined in FRD-01 to a PostgreSQL schema. It outlines the full SQL statements, indexing strategies, primary/foreign keys, and constraints necessary to support the Phase 2 FastAPI and SQLAlchemy backend.

## 2. PostgreSQL Tables

### 2.1 App Settings

A single-row configuration table containing the global numerical boundaries set during onboarding or via the dashboard.

```sql
CREATE TABLE app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforces a single row globally
    opening_balance BIGINT NOT NULL, -- Stored in paise
    monthly_spending_limit BIGINT NOT NULL CHECK (monthly_spending_limit >= 0), -- Stored in paise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Categories

Represents the buckets of spending. Includes 10 predefined default categories.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    icon VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 Monthly Budgets

Represents the budget limit designated for a specific category within a specific month. Requires a unique constraint pairing the category and month.

```sql
CREATE TABLE monthly_budgets (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format 'YYYY-MM'
    budget_limit BIGINT NOT NULL CHECK (budget_limit > 0), -- Stored in paise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_monthly_budgets_category_month UNIQUE (category_id, month)
);
```

### 2.4 Transactions

The primary flow of money. Nullable `category_id` exists because `income` transactions typically aren't bucketed into expense categories.

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    type VARCHAR NOT NULL CHECK (type IN ('income', 'expense')),
    amount BIGINT NOT NULL CHECK (amount > 0), -- Stored in paise
    date DATE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_date ON transactions(category_id, date);
```

### 2.5 Savings Goals

User-defined goals to allocate money toward over time. Can be open-ended (omitting target amount or deadline).

```sql
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    target_amount BIGINT, -- Stored in paise, Nullable
    deadline DATE, -- Nullable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.6 Savings Allocations

Contributions towards, or withdrawals from, a savings goal. Deleting a Savings Goal cascades to delete all bound allocations.

```sql
CREATE TABLE savings_allocations (
    id UUID PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL, -- Stored in paise, negative for withdrawals
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_savings_allocations_goal_id ON savings_allocations(goal_id);
```

## 3. Computed Fields & Non-Stored Data

The following values are structurally derived and MUST NOT be stored in the database as static columns per FRD-01:

- **Total Balance:** Evaluated as `app_settings.opening_balance + sum(all incoming tx) - sum(all outgoing tx) - sum(all savings allocations)`.
- **Category Remaining:** `monthly_budgets.budget_limit - sum(expense tx for category/month)`.
- **Unassigned Balance:** `Total Income (month) - Total Expenses (month) - Total Savings Allocations (month)`.
- **Salary Detection:** Evaluates to `true` if any `income` transaction exists for the current month.
- **SavingsGoal Current Amount:** `sum(savings_allocations.amount)` dynamically aggregated by `goal_id`.

## 4. Migration & Seed Strategy

- **Alembic ORM Migrations:** The schema will be generated through a single initial baseline migration via Alembic parsing the SQLAlchemy 2.0 ORM models.
- **Seed Script (`/init`):** On fresh instances, the app must populate the `categories` table with the 10 predefined default categories (`is_custom = false`) and insert the single boundary row into `app_settings` (e.g., initialized to 0) via Python script or a one-time API trigger.
