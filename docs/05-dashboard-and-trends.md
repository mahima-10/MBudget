# FRD-05: Dashboard & Trends

**Status:** Draft
**Component:** P0 - Critical Core

## 1. Overview

The primary landing screen ("Dashboard") and the insights view for tracking trends over time.

## 2. Dashboard Interface

### 2.1 Month Selector

- User can navigate to previous months' dashboard views.
- Defaults to the current month.
- **Month Reset:** On a new month, the dashboard shows a clean slate with fresh budgets. Unspent balances do NOT rollover.

### 2.2 Global Overview

- **Total Balance:** The running total across all time (opening balance + total income - total expenses - total savings allocations). Answers "how much money do I actually have?" Shown prominently, visually distinct from the monthly cards.

### 2.3 Last Month Recap

Only shown on the current month's dashboard view, provided the previous month has transaction data and the user hasn't explicitly dismissed it. It appears at the very top of the dashboard below the Total Balance card.
Includes:

- Total spent last month vs the monthly spending limit
- Total income last month
- Net saved (income - expenses - savings allocations)
- Top spending category (name + amount)
- A one-liner verdict with personality based on % spent:
  - If <= 90%: "Not bad. You stayed under budget last month."
  - If 90-100%: "Close call... but you made it."
  - If > 100%: "Yeah... last month wasn't great. Let's do better."
- A "Dismiss" button to hide it. State resets on the 1st of every newly rolled over month.

### 2.4 Monthly Overview

- **Global Warning Banner:** A banner inserted between the Total Balance card and this Monthly Overview section displaying the exact custom severity warnings defined in FRD-03 related to the overall monthly limit.
- **Monthly Limit Gauge:** A progress bar/gauge showing total spent vs the overall `monthly_spending_limit`. Visually distinct from category budgets — this is the BIG number.
- **Total Income Added:** Sum of all `income` for the selected month.
- **Total Spent:** Sum of all `expense` across all categories for the selected month.
- **Remaining Budget:** Uses the Unassigned Balance computed field formula defined in FRD-01 (Total Income - Total Expenses - Total Savings Allocations).
- **Net Savings:** Money allocated to savings goals this month.

### 2.5 Category Grid

- A grid of cards, one for each active category with a budget set for the selected month.
- **Card Contents:**
  - Category Name & Icon
  - Spent / Monthly Budget Amount
  - Remaining Amount (Computed per FRD-01)
  - Progress Bar (Filled based on % spent)
  - Color coded based on FRD-03 thresholds (Normal, 80%, 90%, Over).
  - All buckets visible at once.

## 3. Trends & Insights

The trends view defaults to comparing current or recent data against historical periods.

### 3.1 Spending Breakdown

- **Type:** Donut chart.
- **Data:** Total spent grouped by category for the selected month.
- **Colors:** Matches category canonical colors.

### 3.2 Spending Trend

- **Type:** Line or Bar chart.
- **Data:** Total spent per month over the last 6 months.

### 3.3 Additional Insights

- Month-over-month (MoM) spending comparison (e.g., "5% less than last month"). Shows last month's summary for comparison.
- Category spending trends (e.g., "Food spending is higher this month").
- Average daily spend calculation (Total Spent / Days elapsed in month).
