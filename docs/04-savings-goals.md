# FRD-04: Savings Goals

**Status:** Draft
**Component:** P0 - Critical Core

## 1. Overview

Ability to create named savings goals and allocate money towards them to track progress. Tracks specific targets or general savings.

## 2. Managing Goals

### 2.1 Goal Types & Creation

- **Specific Target:** User defines a `name`, `target_amount` (in absolute ₹, stored as paise), and optional `deadline` (Date).
- **General "Save More":** User defines a `name` without a specific target amount. Just tracks total saved over time.

### 2.2 Funding & Withdrawing (SavingsAllocations)

- **Contributions:** User allocates money towards a goal from their unassigned balance. This creates a `SavingsAllocation` record.
- **Withdrawals:** User can move money from a goal back to their unassigned balance (creates a negative `SavingsAllocation` or similar reversal).
- **Unassigned Balance:** Explicit formula: Total Income (month) - Total Expenses (month) - Total Savings Allocations (month) (Reference FRD-01 Computed Fields).

### 2.3 Edit / Delete Goals

- **Edit:** User can rename the goal, change the target amount, or change the deadline.
- **Delete:** User can delete the goal entirely (handling of associated allocated funds should be returning them to the unassigned balance).

## 3. Visualization

- Goals are displayed as cards.
- **Data Points:**
  - Name
  - `current_amount` / `target_amount` (if specific)
  - Progress bar (0% to 100%)
  - Time remaining (if deadline is set)
- **Interactions:** Quick "Add Funds" button directly on the goal card.
- **Completed State:** When a specific goal reaches 100%, show a "completed" visual treatment (e.g., success colors, confetti icon), but keep the goal visible.
