#!/bin/bash
# MBudget - Start everything with one command
cd "$(dirname "$0")"

# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
cd prototype
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "  MBudget is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo ""
echo "  Press Ctrl+C to stop everything."
echo ""

# Stop both when Ctrl+C is pressed
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
