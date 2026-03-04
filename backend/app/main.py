from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MBudget API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import settings, categories, budgets, transactions, savings, dashboard, trends, init

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}

app.include_router(settings.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(budgets.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(savings.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(trends.router, prefix="/api/v1")
app.include_router(init.router, prefix="/api/v1")
