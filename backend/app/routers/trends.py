from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from typing import Optional
from datetime import datetime, date
import calendar
from dateutil.relativedelta import relativedelta

from app.database import get_db
from app.models.domain import Transaction, Category
from app.schemas.domain import TrendsResponse, TrendsPerMonthItem, TrendsCategoryTotal, TrendsMomComparison

router = APIRouter(tags=["Trends"])

@router.get("/trends", response_model=TrendsResponse)
async def get_trends(
    months: int = Query(6, ge=1, le=12),
    month: Optional[str] = Query(None, description="YYYY-MM"),
    db: AsyncSession = Depends(get_db)
):
    if not month:
        target_date = date.today()
        month = target_date.strftime("%Y-%m")
    else:
        target_date = datetime.strptime(month, "%Y-%m").date()
        
    yr, mo = target_date.year, target_date.month

    # 1. per_month_spending
    spending_history = []
    for i in range(months - 1, -1, -1):
        dt = target_date - relativedelta(months=i)
        y, m = dt.year, dt.month
        month_str = f"{y}-{m:02d}"
        
        res = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                Transaction.type == 'expense',
                extract('year', Transaction.date) == y,
                extract('month', Transaction.date) == m
            )
        )
        total = res.scalar_one()
        spending_history.append(TrendsPerMonthItem(month=month_str, total=total))

    # 2. category_totals
    stmt = (
        select(Category.name, func.sum(Transaction.amount).label('total_amount'), Category.color)
        .join(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.type == 'expense',
            extract('year', Transaction.date) == yr,
            extract('month', Transaction.date) == mo
        )
        .group_by(Category.name, Category.color)
        .having(func.sum(Transaction.amount) > 0)
    )
    res = await db.execute(stmt)
    cat_totals = []
    for name, amount, color in res.all():
        cat_totals.append(TrendsCategoryTotal(category_name=name, amount=int(amount), color=color))

    # 3. mom_comparison
    current_total = spending_history[-1].total if spending_history and spending_history[-1].month == month else 0
    
    prev_dt = target_date - relativedelta(months=1)
    prev_month_str = f"{prev_dt.year}-{prev_dt.month:02d}"
    
    prev_total = None
    for item in spending_history:
        if item.month == prev_month_str:
            prev_total = item.total
            break
            
    if prev_total is None:
        p_res = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                Transaction.type == 'expense',
                extract('year', Transaction.date) == prev_dt.year,
                extract('month', Transaction.date) == prev_dt.month
            )
        )
        prev_total = p_res.scalar_one()
        
    if prev_total == 0:
        perc_diff = 0.0
    else:
        perc_diff = round(((current_total - prev_total) / prev_total) * 100, 1)
        
    if current_total > prev_total:
        direction = "up"
    elif current_total < prev_total:
        direction = "down"
    else:
        direction = "flat"
        
    mom = TrendsMomComparison(percentage_diff=perc_diff, direction=direction)

    # 4. average_daily_spend
    today = date.today()
    if today.year == yr and today.month == mo:
        days_elapsed = today.day
    else:
        days_elapsed = calendar.monthrange(yr, mo)[1]
        
    if days_elapsed == 0 or current_total == 0:
        avg_spend = 0
    else:
        avg_spend = int(round(current_total / days_elapsed))
        
    return TrendsResponse(
        per_month_spending=spending_history,
        category_totals=cat_totals,
        mom_comparison=mom,
        average_daily_spend=avg_spend
    )
