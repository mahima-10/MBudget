from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.domain import AppSettings
from app.schemas.domain import AppSettingsResponse, AppSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=AppSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

@router.put("", response_model=AppSettingsResponse)
async def update_settings(settings_in: AppSettingsUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
        
    if settings_in.opening_balance is not None:
        settings.opening_balance = settings_in.opening_balance
    if settings_in.monthly_spending_limit is not None:
        settings.monthly_spending_limit = settings_in.monthly_spending_limit
    
    await db.commit()
    await db.refresh(settings)
    
    return settings
