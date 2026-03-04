import uuid
from datetime import datetime, date
from typing import List, Optional
from dateutil.relativedelta import relativedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, and_, desc

from app.database import get_db
from app.models.domain import AppSettings, Transaction, SavingsAllocation, MonthlyBudget, Category
from app.schemas.domain import (
    DashboardResponse,
    DashboardCategoryItem,
    DashboardOverallLimit,
    DashboardPreviousRecap,
    DashboardTopCategory
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_warning_tier(percentage: int) -> Optional[str]:
    if percentage >= 100:
        return "red"
    if percentage >= 90:
        return "orange"
    if percentage >= 75:
        return "amber"
    if percentage >= 50:
        return "yellow"
    return None

def get_previous_month(month_str: str) -> str:
    # month_str is "YYYY-MM"
    dt = datetime.strptime(month_str, "%Y-%m")
    prev = dt - relativedelta(months=1)
    return prev.strftime("%Y-%m")

@router.get("/{month}", response_model=DashboardResponse)
async def get_dashboard(month: str, db: AsyncSession = Depends(get_db)):
    try:
        yr, mo = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format, expected YYYY-MM")

    # 1. AppSettings
    res = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = res.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="App settings not found. Please complete onboarding first.")

    # 2. Global Aggregates (all time)
    # Income
    res = await db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.type == 'income'))
    total_income_ever = res.scalar_one()

    # Expense
    res = await db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.type == 'expense'))
    total_expense_ever = res.scalar_one()

    # Savings Allocations
    res = await db.execute(select(func.coalesce(func.sum(SavingsAllocation.amount), 0)))
    total_savings_ever = res.scalar_one()

    total_balance = settings.opening_balance + total_income_ever - total_expense_ever - total_savings_ever

    # 3. Current Month Aggregates
    month_filter = and_(
        extract('year', Transaction.date) == yr,
        extract('month', Transaction.date) == mo
    )
    
    # Income this month
    res = await db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.type == 'income', month_filter
    ))
    total_income_month = res.scalar_one()

    # Expense this month
    res = await db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.type == 'expense', month_filter
    ))
    total_expense_month = res.scalar_one()

    # Savings this month
    savings_month_filter = and_(
        extract('year', SavingsAllocation.date) == yr,
        extract('month', SavingsAllocation.date) == mo
    )
    res = await db.execute(select(func.coalesce(func.sum(SavingsAllocation.amount), 0)).where(
        savings_month_filter
    ))
    total_savings_month = res.scalar_one()

    net_saved = total_income_month - total_expense_month
    unassigned_balance = total_income_month - total_expense_month - total_savings_month
    salary_added = total_income_month > 0

    # 4. Categories
    # Get budgets for this month joined with category
    stmt = (
        select(MonthlyBudget, Category)
        .join(Category, MonthlyBudget.category_id == Category.id)
        .where(MonthlyBudget.month == month)
    )
    budget_res = await db.execute(stmt)
    
    categories_list = []
    for budget, category in budget_res.all():
        # calculate spent for this category this month
        cat_spent_res = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                Transaction.category_id == category.id,
                Transaction.type == 'expense',
                month_filter
            )
        )
        spent = cat_spent_res.scalar_one()
        limit = budget.budget_limit
        remaining = max(0, limit - spent)
        perc = min(100, int((spent / limit) * 100)) if limit > 0 else 0
        
        categories_list.append(DashboardCategoryItem(
            category_id=category.id,
            category_name=category.name,
            category_icon=category.icon,
            category_color=category.color,
            spent=spent,
            budget_limit=limit,
            remaining=remaining,
            percentage=perc
        ))
        
    # 5. Overall Limit
    limit = settings.monthly_spending_limit
    perc = int((total_expense_month / limit) * 100) if limit > 0 else 0
    warning = get_warning_tier(perc) if limit > 0 else None
    
    overall_limit_data = DashboardOverallLimit(
        spent_vs_limit=total_expense_month,
        limit=limit,
        percentage=perc,
        warning_tier=warning
    )
    
    # 6. Previous Month Recap
    prev_month = get_previous_month(month)
    p_yr, p_mo = map(int, prev_month.split("-"))
    prev_filter = and_(
        extract('year', Transaction.date) == p_yr,
        extract('month', Transaction.date) == p_mo
    )
    
    # Check if any transactions exist for previous month
    res = await db.execute(select(Transaction.id).where(prev_filter).limit(1))
    has_prev_tx = res.scalar_one_or_none() is not None
    
    recap = None
    if has_prev_tx:
        # Income
        res = await db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == 'income', prev_filter
        ))
        p_inc = res.scalar_one()

        # Expense
        res = await db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == 'expense', prev_filter
        ))
        p_exp = res.scalar_one()
        
        p_net = p_inc - p_exp
        verdict = "Not bad. You stayed under budget last month." if p_net > 0 else "You overspent last month. Let's do better this time."
        
        # Top Category
        top_cat_stmt = (
            select(Category.name, func.sum(Transaction.amount).label("cat_spent"))
            .join(Category, Transaction.category_id == Category.id)
            .where(Transaction.type == 'expense', prev_filter)
            .group_by(Category.name)
            .order_by(desc("cat_spent"))
            .limit(1)
        )
        res = await db.execute(top_cat_stmt)
        top_cat_row = res.first()
        
        # In case there were expenses but no category linked or something
        if top_cat_row:
            top_cat_name, top_cat_amount = top_cat_row
            top_cat = DashboardTopCategory(name=top_cat_name, amount=int(top_cat_amount))
        else:
            top_cat = DashboardTopCategory(name="None", amount=0)
            
        recap = DashboardPreviousRecap(
            total_spent=p_exp,
            total_income=p_inc,
            net_saved=p_net,
            top_category=top_cat,
            verdict_text=verdict
        )

    return DashboardResponse(
        total_balance=total_balance,
        opening_balance=settings.opening_balance,
        total_income=total_income_month,
        total_expenses=total_expense_month,
        net_saved=net_saved,
        unassigned_balance=unassigned_balance,
        salary_added=salary_added,
        categories=categories_list,
        overall_limit=overall_limit_data,
        previous_month_recap=recap
    )
