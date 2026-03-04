import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.domain import AppSettings, Category

CATEGORIES = [
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

async def seed_data():
    async with AsyncSessionLocal() as session:
        # Check and seed categories
        for cat_data in CATEGORIES:
            result = await session.execute(select(Category).where(Category.name == cat_data["name"]))
            category = result.scalar_one_or_none()
            if not category:
                new_cat = Category(
                    name=cat_data["name"],
                    icon=cat_data["icon"],
                    color=cat_data["color"],
                    is_custom=False
                )
                session.add(new_cat)
        
        # Check and seed app_settings
        result = await session.execute(select(AppSettings).where(AppSettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            new_settings = AppSettings(
                id=1,
                opening_balance=0,
                monthly_spending_limit=0
            )
            session.add(new_settings)
            
        await session.commit()
        print("Database seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_data())
