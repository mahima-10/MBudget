# FRD-09: API Specification

**Status:** Draft
**Component:** P1 - Phase 2 (Backend)

## 1. Overview

This document specifies the REST API endpoints required to power MBudget moving into Phase 2. The backend is implemented with FastAPI.

- **Base URL:** `http://localhost:8000/api/v1`
- **Authentication:** None. All endpoints are open for the single user.
- **Error Format:** Standardization on `{ "detail": "error message" }` coupled with appropriate HTTP status codes (e.g., 400 Bad Request, 404 Not Found).

## 2. Endpoints by Resource

### 2.1 App Settings

Manages global metadata defined during onboarding. The database ensures only a single row exists.

#### `GET /settings`

- **Response:** `200 OK`

```json
{
  "opening_balance": 5000000,
  "monthly_spending_limit": 3000000,
  "created_at": "...",
  "updated_at": "..."
}
```

#### `PUT /settings`

- **Request Body:**

```json
{
  "opening_balance": 5000000,
  "monthly_spending_limit": 3000000
}
```

- **Response:** `200 OK` (returns the updated object).

### 2.2 Categories

#### `GET /categories`

- **Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "name": "Food",
    "icon": "🍔",
    "color": "#FF0000",
    "is_custom": false,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

#### `POST /categories`

- **Request Body:**

```json
{
  "name": "Hobbies",
  "icon": "🎨",
  "color": "#00FF00"
}
```

- **Response:** `201 Created` (returns category object, `is_custom` forcefully set to `true`).

#### `PUT /categories/{id}`

- **Request Body:** Permitted edits for `name`, `icon`, `color`.
- **Response:** `200 OK`

#### `DELETE /categories/{id}`

- **Response:** `204 No Content`. Returns a `400` error if `is_custom` is `false` (predefined categories cannot be deleted).

### 2.3 Monthly Budgets

#### `GET /budgets`

- **Query Params:** `month=YYYY-MM` (required)
- **Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "category_id": "uuid",
    "month": "2026-03",
    "budget_limit": 1500000,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

#### `PUT /budgets/{category_id}/month/{month}`

- **Description:** Upserts the category budget limit for a given month.
- **Request Body:**

```json
{
  "budget_limit": 2000000
}
```

- **Response:** `200 OK`

#### `POST /budgets/bulk`

- **Description:** Sets multiple budgets at once (e.g., onboarding).
- **Request Body:**

```json
[
  {
    "category_id": "uuid",
    "month": "2026-03",
    "budget_limit": 1000000
  }
]
```

- **Response:** `201 Created`

#### `POST /budgets/rollover`

- **Description:** Copies all category budget limits from a historical month to a new month.
- **Request Body:**

```json
{
  "from_month": "2026-02",
  "to_month": "2026-03"
}
```

- **Response:** `201 Created`

### 2.4 Transactions

#### `GET /transactions`

- **Query Params (all optional):**
  - `month` (e.g. `2026-03`)
  - `category_id` (UUID)
  - `type` (`income` | `expense`)
  - `search` (string, matches against notes)
  - `sort_by` (`date` | `amount`)
  - `sort_order` (`asc` | `desc`)
- **Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "type": "expense",
    "amount": 25000,
    "date": "2026-03-01",
    "category_id": "uuid",
    "category": {
      "name": "Food",
      "icon": "🍔"
    },
    "notes": "Lunch",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

#### `POST /transactions`

- **Request Body:**

```json
{
  "type": "expense",
  "amount": 25000,
  "date": "2026-03-01",
  "category_id": "uuid",
  "notes": "Lunch"
}
```

- **Response:** `201 Created`

#### `PUT /transactions/{id}`

- **Request Body:** Partial or full replacement fields.
- **Response:** `200 OK`

#### `DELETE /transactions/{id}`

- **Response:** `204 No Content`

### 2.5 Savings Goals

#### `GET /savings-goals`

- **Description:** Returns goals including their dynamically summed progress.
- **Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "name": "New Laptop",
    "target_amount": 10000000,
    "deadline": "2026-12-01",
    "current_amount": 2500000,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

#### `POST /savings-goals`

- **Request Body:** Check NULL conditions per FRD-01.

```json
{
  "name": "Travel Fund",
  "target_amount": 5000000,
  "deadline": "2027-01-01"
}
```

- **Response:** `201 Created`

#### `PUT /savings-goals/{id}`

- **Response:** `200 OK`

#### `DELETE /savings-goals/{id}`

- **Description:** Flushes the goal and cascades to delete all child allocations, returning funds effectively into unassigned.
- **Response:** `204 No Content`

### 2.6 Savings Allocations

#### `GET /savings-allocations`

- **Query Params:** `goal_id={uuid}` (required)
- **Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "goal_id": "uuid",
    "amount": 500000,
    "date": "2026-03-01",
    "created_at": "..."
  }
]
```

#### `POST /savings-allocations`

- **Request Body:** Allows negative amounts representing a withdrawal.

```json
{
  "goal_id": "uuid",
  "amount": -100000,
  "date": "2026-03-05"
}
```

- **Response:** `201 Created`

#### `DELETE /savings-allocations/{id}`

- **Response:** `204 No Content`

### 2.7 Dashboard / Computed Data

#### `GET /dashboard/{month}`

- **Description:** A monolithic payload to avoid N+1 requests on the dashboard homepage. Combines mathematical computations. `previous_month_recap` may be `null` if no prior data exists.
- **Response:** `200 OK`

```json
{
  "total_balance": 18000000,
  "opening_balance": 5000000,
  "total_income": 15000000,
  "total_expenses": 4500000,
  "net_saved": 10500000,
  "unassigned_balance": 10000000,
  "salary_added": true,
  "categories": [
    {
      "category_name": "Food",
      "category_icon": "🍔",
      "category_color": "#FF0000",
      "spent": 200000,
      "budget_limit": 500000,
      "remaining": 300000,
      "percentage": 40
    }
  ],
  "overall_limit": {
    "spent_vs_limit": 4500000,
    "limit": 3000000,
    "percentage": 75,
    "warning_tier": "amber"
  },
  "previous_month_recap": {
    "total_spent": 4000000,
    "total_income": 15000000,
    "net_saved": 11000000,
    "top_category": {
      "name": "Entertainment",
      "amount": 1000000
    },
    "verdict_text": "Not bad. You stayed under budget last month."
  }
}
```

### 2.8 Trends

#### `GET /trends`

- **Query Params:**
  - `months=6` (default 6)
  - `month=YYYY-MM` (defaults to current month, provides context for category totals and daily spend)
- **Response:** `200 OK`

```json
{
  "per_month_spending": [
    { "month": "2026-02", "total": 4500000 },
    { "month": "2026-03", "total": 2000000 }
  ],
  "category_totals": [
    { "category_name": "Food", "amount": 1200000, "color": "#FF0000" }
  ],
  "mom_comparison": {
    "percentage_diff": -5.2,
    "direction": "down"
  },
  "average_daily_spend": 125000
}
```

### 2.9 Initialization

#### `POST /init`

- **Description:** A one-time trigger endpoint to inject immutable data components into the database. Creates the 10 predefined categories if they don't yet exist and sets `app_settings` baseline if null.
- **Response:** `200 OK`

```json
{
  "detail": "System initialized successfully."
}
```
