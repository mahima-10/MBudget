import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.domain import MonthlyBudget, Category
from app.schemas.domain import MonthlyBudgetResponse, MonthlyBudgetUpdate, BulkBudgetCreateItem, RolloverRequest

router = APIRouter(prefix="/budgets", tags=["Monthly Budgets"])

@router.get("", response_model=List[MonthlyBudgetResponse])
async def get_budgets(month: str = Query(..., description="YYYY-MM"), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MonthlyBudget).where(MonthlyBudget.month == month))
    return result.scalars().all()

@router.put("/{category_id}/month/{month}", response_model=MonthlyBudgetResponse)
async def upsert_budget(category_id: uuid.UUID, month: str, budget_in: MonthlyBudgetUpdate, db: AsyncSession = Depends(get_db)):
    cat_res = await db.execute(select(Category).where(Category.id == category_id))
    if not cat_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")
    result = await db.execute(select(MonthlyBudget).where(
        MonthlyBudget.category_id == category_id,
        MonthlyBudget.month == month
    ))
    budget = result.scalar_one_or_none()
    
    if budget:
        budget.budget_limit = budget_in.budget_limit
    else:
        budget = MonthlyBudget(
            category_id=category_id,
            month=month,
            budget_limit=budget_in.budget_limit
        )
        db.add(budget)
        
    await db.commit()
    await db.refresh(budget)
    return budget

@router.delete("/{category_id}/month/{month}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(category_id: uuid.UUID, month: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MonthlyBudget).where(
        MonthlyBudget.category_id == category_id,
        MonthlyBudget.month == month
    ))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
    await db.commit()
    return None

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_upsert_budgets(items: List[BulkBudgetCreateItem], db: AsyncSession = Depends(get_db)):
    for item in items:
        result = await db.execute(select(MonthlyBudget).where(
            MonthlyBudget.category_id == item.category_id,
            MonthlyBudget.month == item.month
        ))
        budget = result.scalar_one_or_none()
        
        if budget:
            budget.budget_limit = item.budget_limit
        else:
            budget = MonthlyBudget(
                category_id=item.category_id,
                month=item.month,
                budget_limit=item.budget_limit
            )
            db.add(budget)
            
    await db.commit()
    return {"detail": "Bulk upsert completed"}

@router.post("/rollover", status_code=status.HTTP_201_CREATED)
async def rollover_budgets(req: RolloverRequest, db: AsyncSession = Depends(get_db)):
    # get from_month budgets
    from_res = await db.execute(select(MonthlyBudget).where(MonthlyBudget.month == req.from_month))
    from_budgets = from_res.scalars().all()
    
    # get to_month budgets to avoid overwriting
    to_res = await db.execute(select(MonthlyBudget).where(MonthlyBudget.month == req.to_month))
    to_budgets = to_res.scalars().all()
    to_cat_ids = {b.category_id for b in to_budgets}
    
    for fb in from_budgets:
        if fb.category_id not in to_cat_ids:
            new_b = MonthlyBudget(
                category_id=fb.category_id,
                month=req.to_month,
                budget_limit=fb.budget_limit
            )
            db.add(new_b)
            
    await db.commit()
    return {"detail": "Rollover completed"}
