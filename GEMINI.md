# MBudget — Personal Budget Tracker

## Project Overview

A personal budget tracking app for managing expenses, income, category budgets, savings goals, and recurring transactions — with visual dashboards and spending trends.

## Core Vision

One place to see where money goes, stay within budgets, and track progress toward savings goals. Built for a single user (me), so no auth needed.

## Key Objectives

- **User Goal:** Effortlessly log transactions, see monthly budget health at a glance, track savings progress
- **System Goal:** Clean data model, fast queries, useful visualizations

## Target Users

1. **Mahi** (sole user) — Wants to track personal spending, set category budgets, monitor savings goals, and spot trends over time

## Technology Stack

### Frontend (Prototype → Production)

- Framework: Next.js 14+ (App Router) + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- State (prototype): Zustand
- State (production): React Query (TanStack Query)
- Charts: Recharts

### Backend (Phase 2)

- Runtime: Python 3.11+
- Framework: FastAPI
- ORM: SQLAlchemy 2.0
- Database: PostgreSQL
- Migrations: Alembic

## Project Structure

```
MBudget/
├── GEMINI.md                    # Project vision & rules
├── docs/                        # FRDs
│   ├── GEMINI.md
│   ├── 00-INDEX.md
│   ├── 01-core-data-models.md
│   ├── 02-XX through 08-XX
│   └── 10-prototype-specifications.md
├── prototype/                   # Phase 1 (Zustand + mock data)
│   ├── GEMINI.md
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/                     # Phase 2 (FastAPI + PostgreSQL)
│   ├── GEMINI.md
│   ├── app/
│   ├── tests/
│   └── alembic/
└── frontend/                    # Phase 3 (Next.js + React Query)
    ├── GEMINI.md
    └── ...
```

## Phase Map

- Phase 0: Specs → GEMINI.md + FRDs in docs/
- Phase 1: Prototype → Frontend with mock data (Zustand, no backend)
- Phase 2: Backend → FastAPI + PostgreSQL + tests
- Phase 3: Integration → Replace Zustand with React Query + real API
- Phase 4: Polish → Visual dashboards, trends, recurring transaction automation

## Design Notes

- **No authentication** — single user, skip JWT/login entirely
- **Dark mode preferred** — budget apps should be easy on the eyes
- **Mobile-responsive** — should work well on phone browser too
- Currency: INR (₹) as default, but store as integers (paise) to avoid float issues
