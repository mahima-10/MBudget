from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.domain import Category, AppSettings, Transaction, SavingsAllocation, SavingsGoal, MonthlyBudget

router = APIRouter(tags=["Init"])

PREDEFINED_CATEGORIES = [
    {"name": "Food", "icon": "🍔", "color": "#fbbf24"},
    {"name": "People", "icon": "👥", "color": "#f87171"},
    {"name": "Gifts", "icon": "🎁", "color": "#c084fc"},
    {"name": "Myself", "icon": "🛒", "color": "#38bdf8"},
    {"name": "Bills & Utilities", "icon": "⚡", "color": "#94a3b8"},
    {"name": "Transport", "icon": "🚗", "color": "#facc15"},
    {"name": "Entertainment", "icon": "🎬", "color": "#f472b6"},
    {"name": "Subscriptions", "icon": "🔁", "color": "#a78bfa"},
    {"name": "Health", "icon": "⚕️", "color": "#4ade80"},
    {"name": "Education", "icon": "📚", "color": "#60a5fa"},
]

@router.post("/init")
async def init_system(db: AsyncSession = Depends(get_db)):
    # 1. Upsert Categories
    for cat_data in PREDEFINED_CATEGORIES:
        # Check if exists by name
        res = await db.execute(select(Category).where(Category.name == cat_data["name"]))
        existing = res.scalar_one_or_none()
        if not existing:
            cat = Category(
                name=cat_data["name"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                is_custom=False
            )
            db.add(cat)
            
    # 2. Init AppSettings
    res = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = res.scalar_one_or_none()
    if not settings:
        new_settings = AppSettings(
            opening_balance=0,
            monthly_spending_limit=0
        )
        db.add(new_settings)
        
    await db.commit()
    
    return {"detail": "System initialized successfully."}

@router.post("/reset")
async def reset_data(db: AsyncSession = Depends(get_db)):
    # 1. Clear all user generated data tables
    await db.execute(delete(Transaction))
    await db.execute(delete(SavingsAllocation))
    await db.execute(delete(SavingsGoal))
    await db.execute(delete(MonthlyBudget))
    
    # 2. Reset AppSettings back to defaults without wiping the row completely
    res = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = res.scalar_one_or_none()
    if settings:
        settings.opening_balance = 0
        settings.monthly_spending_limit = 0
        
    await db.commit()
    return {"detail": "All data reset successfully."}
