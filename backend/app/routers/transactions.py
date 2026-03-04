import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract, desc, asc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.domain import Transaction, Category
from app.schemas.domain import TransactionResponse, TransactionCreate, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    category_id: Optional[uuid.UUID] = None,
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    search: Optional[str] = None,
    sort_by: str = Query("date", pattern="^(date|amount)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Transaction)
    
    if month:
        try:
            year, m = month.split('-')
            stmt = stmt.where(extract('year', Transaction.date) == int(year))
            stmt = stmt.where(extract('month', Transaction.date) == int(m))
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid month format, expected YYYY-MM")
        
    if category_id:
        stmt = stmt.where(Transaction.category_id == category_id)
        
    if type:
        stmt = stmt.where(Transaction.type == type)
        
    if search:
        stmt = stmt.where(Transaction.notes.ilike(f"%{search}%"))
        
    order_col = Transaction.amount if sort_by == 'amount' else Transaction.date
    if sort_order == 'asc':
        stmt = stmt.order_by(asc(order_col))
    else:
        stmt = stmt.order_by(desc(order_col))

    result = await db.execute(stmt)
    # The models use lazy="joined" for category, but we can utilize unique() on the result
    return result.scalars().unique().all()

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(tx_in: TransactionCreate, db: AsyncSession = Depends(get_db)):
    if tx_in.category_id:
        cat_res = await db.execute(select(Category).where(Category.id == tx_in.category_id))
        if not cat_res.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Category not found")
    tx = Transaction(
        type=tx_in.type,
        amount=tx_in.amount,
        date=tx_in.date,
        category_id=tx_in.category_id,
        notes=tx_in.notes
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    
    # We must await lazy loads or rely on the joined load which refresh doesn't always populate well in async context
    # Let's cleanly fetch it to guarantee the joined relationship is populated
    stmt = select(Transaction).where(Transaction.id == tx.id)
    result = await db.execute(stmt)
    return result.scalar_one()

@router.put("/{tx_id}", response_model=TransactionResponse)
async def update_transaction(tx_id: uuid.UUID, tx_in: TransactionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    tx = result.scalar_one_or_none()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if tx_in.type is not None:
        tx.type = tx_in.type
    if tx_in.amount is not None:
        tx.amount = tx_in.amount
    if tx_in.date is not None:
        tx.date = tx_in.date
    if tx_in.category_id is not None:
        tx.category_id = tx_in.category_id
    if tx_in.notes is not None:
        tx.notes = tx_in.notes
        
    await db.commit()
    
    # Refresh logic using select to fetch the fully loaded object
    stmt = select(Transaction).where(Transaction.id == tx.id)
    result = await db.execute(stmt)
    return result.scalar_one()

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(tx_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    tx = result.scalar_one_or_none()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    await db.delete(tx)
    await db.commit()
    return None
