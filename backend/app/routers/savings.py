import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.domain import SavingsGoal, SavingsAllocation
from app.schemas.domain import (
    SavingsGoalResponse, 
    SavingsGoalCreate, 
    SavingsGoalUpdate,
    SavingsAllocationResponse,
    SavingsAllocationCreate
)

router = APIRouter(tags=["Savings"])

@router.get("/savings-goals", response_model=List[SavingsGoalResponse])
async def get_savings_goals(db: AsyncSession = Depends(get_db)):
    # Calculate current_amount dynamically: COALESCE(SUM(allocations.amount), 0)
    stmt = (
        select(
            SavingsGoal,
            func.coalesce(func.sum(SavingsAllocation.amount), 0).label("current_amount")
        )
        .outerjoin(SavingsAllocation, SavingsGoal.id == SavingsAllocation.goal_id)
        .group_by(SavingsGoal.id)
    )
    result = await db.execute(stmt)
    
    rows = result.all()
    # Map back to dicts to satisfy Pydantic response_model
    responses = []
    for goal, current_amount in rows:
        goal_dict = {
            "id": goal.id,
            "name": goal.name,
            "target_amount": goal.target_amount,
            "deadline": goal.deadline,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at,
            "current_amount": int(current_amount)
        }
        responses.append(goal_dict)
        
    return responses

@router.post("/savings-goals", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_goal(goal_in: SavingsGoalCreate, db: AsyncSession = Depends(get_db)):
    goal = SavingsGoal(
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        deadline=goal_in.deadline
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    
    goal_dict = {
        "id": goal.id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "deadline": goal.deadline,
        "created_at": goal.created_at,
        "updated_at": goal.updated_at,
        "current_amount": 0
    }
    return goal_dict

@router.put("/savings-goals/{goal_id}", response_model=SavingsGoalResponse)
async def update_savings_goal(goal_id: uuid.UUID, goal_in: SavingsGoalUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SavingsGoal).where(SavingsGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    if goal_in.name is not None:
        goal.name = goal_in.name
    if goal_in.target_amount is not None:
        goal.target_amount = goal_in.target_amount
    if goal_in.deadline is not None:
        goal.deadline = goal_in.deadline
        
    await db.commit()
    await db.refresh(goal)
    
    # Needs current_amount for response output
    curr_res = await db.execute(
        select(func.coalesce(func.sum(SavingsAllocation.amount), 0))
        .where(SavingsAllocation.goal_id == goal.id)
    )
    current_amount = curr_res.scalar_one()
    
    goal_dict = {
        "id": goal.id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "deadline": goal.deadline,
        "created_at": goal.created_at,
        "updated_at": goal.updated_at,
        "current_amount": int(current_amount)
    }
    return goal_dict

@router.delete("/savings-goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SavingsGoal).where(SavingsGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    # Cascade handled by DB ON DELETE CASCADE if configured in Alembic,
    # or by SQLAlchemy if relationship mapped correctly in async. 
    # Calling delete directly.
    await db.delete(goal)
    await db.commit()
    return None

@router.get("/savings-allocations", response_model=List[SavingsAllocationResponse])
async def get_savings_allocations(goal_id: uuid.UUID = Query(..., description="Goal ID is required"), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SavingsAllocation).where(SavingsAllocation.goal_id == goal_id))
    return result.scalars().all()

@router.post("/savings-allocations", response_model=SavingsAllocationResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_allocation(alloc_in: SavingsAllocationCreate, db: AsyncSession = Depends(get_db)):
    # Validate goal exists (optional but good practice)
    g_res = await db.execute(select(SavingsGoal).where(SavingsGoal.id == alloc_in.goal_id))
    if not g_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Parent goal not found")

    allocation = SavingsAllocation(
        goal_id=alloc_in.goal_id,
        amount=alloc_in.amount,
        date=alloc_in.date
    )
    db.add(allocation)
    await db.commit()
    await db.refresh(allocation)
    return allocation

@router.delete("/savings-allocations/{alloc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_allocation(alloc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SavingsAllocation).where(SavingsAllocation.id == alloc_id))
    alloc = result.scalar_one_or_none()
    
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
        
    await db.delete(alloc)
    await db.commit()
    return None
