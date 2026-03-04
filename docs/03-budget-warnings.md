# FRD-03: Budget Warnings & Notifications

**Status:** Draft
**Component:** P0 - Critical Core

## 1. Overview

In-app notifications and category-specific budget warnings to keep the user aware of their spending velocity. No push notifications.

## 2. In-App Reminders (Salary)

- **Salary Detection:** The system checks for any `Transaction` with `type=income` in the current `YYYY-MM`.
- **1st of Month:** If false, show banner: "Time to add your salary for [Month]!"
- **3rd of Month:** If false, show stronger banner: "Reminder: You haven't added your salary yet."

## 3. Category Budget Warnings

Triggered dynamically as expenses are logged against a category's monthly budget limit.

### 3.1 80% Threshold

- **Condition:** (`spent` / `budget_limit`) >= 0.80 AND < 0.90
- **UI Treatment:** Warning banner/box on the category card.
- **Copy:** "You've spent ₹X of ₹Y on [Category] this month. ₹Z left."
- **Visuals:** Moderate warning colors (e.g., Amber/Yellow).

### 3.2 90% Threshold

- **Condition:** (`spent` / `budget_limit`) >= 0.90 AND <= 1.00
- **UI Treatment:** Urgent warning banner on the category card.
- **Copy:** Emphasize the short runway remaining.
- **Visuals:** Strong warning colors (e.g., Orange/Red).

### 3.3 Exceeded (> 100%)

- **Condition:** (`spent` / `budget_limit`) > 1.00
- **UI Treatment:** Clearly marked as over-budget. Over-budget amount highlighted.
- **Rules:** DO NOT block adding new expenses. Allow the user to go over budget but show the negative remaining balance clearly.

### 3.4 Pre-Save Inline Warnings

- **Trigger:** When adding a new expense, if the entered amount would push the category past the 80% or 90% threshold for the month.
- **UI Treatment:** Show an inline warning on the add-expense screen before saving.
- **Rules:** This is NOT a blocking popup. It is just a visible warning; the user can still proceed to save immediately.

## 4. Overall Monthly Limit Warnings

Triggered dynamically based on total monthly expenses vs the overall `monthly_spending_limit`. Displayed as a banner on the Dashboard between the Total Balance card and the Monthly Overview section.

- **50% Threshold:** "1/2 spent... slow down..." (Subtle styling)
- **75% Threshold:** "₹X left for the month... maybe stop now...?" (Amber styling)
- **90% Threshold:** "okay now you need to Stop for real." (Orange styling)
- **100%+ Exceeded:** "well... look at that. now you have no choice but to stop UNLESS YOU WANT TO BE BROKE FOREVER." (Red styling)
