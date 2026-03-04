# MBudget

A personal budget tracking app for managing expenses, income, category budgets, savings goals, and recurring transactions — with visual dashboards and spending trends.

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend  | Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic |

## Project Structure

```
MBudget/
├── prototype/     # Next.js frontend (Zustand + mock data)
├── backend/       # FastAPI + PostgreSQL API
├── docs/          # Feature requirement documents
└── start.sh       # Start both servers with one command
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL

### Run the app

```bash
# Option 1: Start everything at once
./start.sh

# Option 2: Run individually

# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend
cd prototype
npm run dev
```

The frontend runs at **http://localhost:3000** and the backend at **http://localhost:8000**.

## Development Phases

- **Phase 1** — Prototype: Frontend with mock data (Zustand, no backend)
- **Phase 2** — Backend: FastAPI + PostgreSQL + tests
- **Phase 3** — Integration: Replace Zustand with React Query + real API
- **Phase 4** — Polish: Dashboards, trends, recurring transaction automation

## Design Decisions

- **No authentication** — single-user app
- **Dark mode preferred**
- **Mobile-responsive**
- **Currency:** INR (₹), stored as integers (paise) to avoid float issues
