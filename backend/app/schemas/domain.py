from typing import Optional, List
from datetime import datetime, date as DateType
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

# --- AppSettings ---
class AppSettingsBase(BaseModel):
    opening_balance: int
    monthly_spending_limit: int

class AppSettingsResponse(AppSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AppSettingsUpdate(BaseModel):
    opening_balance: Optional[int] = None
    monthly_spending_limit: Optional[int] = None

# --- Category ---
class CategoryBase(BaseModel):
    name: str = Field(..., description="Unique category name")
    icon: str
    color: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: UUID
    is_custom: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- MonthlyBudget ---
class MonthlyBudgetBase(BaseModel):
    budget_limit: int = Field(..., gt=0)

class MonthlyBudgetCreate(MonthlyBudgetBase):
    pass

class MonthlyBudgetUpdate(MonthlyBudgetBase):
    pass

class MonthlyBudgetResponse(MonthlyBudgetBase):
    id: UUID
    category_id: UUID
    month: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BulkBudgetCreateItem(MonthlyBudgetBase):
    category_id: UUID
    month: str
    
class RolloverRequest(BaseModel):
    from_month: str
    to_month: str

# --- Transaction ---
class TransactionBase(BaseModel):
    type: str = Field(..., pattern="^(income|expense)$")
    amount: int = Field(..., gt=0)
    date: DateType
    category_id: Optional[UUID] = None
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    amount: Optional[int] = Field(None, gt=0)
    date: Optional[DateType] = None
    category_id: Optional[UUID] = None
    notes: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: UUID
    category: Optional[CategoryResponse] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- SavingsGoal ---
class SavingsGoalBase(BaseModel):
    name: str
    target_amount: Optional[int] = None
    deadline: Optional[DateType] = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[int] = None
    deadline: Optional[DateType] = None

class SavingsGoalResponse(SavingsGoalBase):
    id: UUID
    current_amount: int = 0
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- SavingsAllocation ---
class SavingsAllocationBase(BaseModel):
    goal_id: UUID
    amount: int
    date: DateType

class SavingsAllocationCreate(SavingsAllocationBase):
    pass

class SavingsAllocationResponse(SavingsAllocationBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Dashboard ---
class DashboardTopCategory(BaseModel):
    name: str
    amount: int

class DashboardCategoryItem(BaseModel):
    category_id: UUID
    category_name: str
    category_icon: str
    category_color: str
    spent: int
    budget_limit: int
    remaining: int
    percentage: int

class DashboardOverallLimit(BaseModel):
    spent_vs_limit: int
    limit: int
    percentage: int
    warning_tier: Optional[str] = None

class DashboardPreviousRecap(BaseModel):
    total_spent: int
    total_income: int
    net_saved: int
    top_category: DashboardTopCategory
    verdict_text: str

class DashboardResponse(BaseModel):
    total_balance: int
    opening_balance: int
    total_income: int
    total_expenses: int
    net_saved: int
    unassigned_balance: int
    salary_added: bool
    categories: List[DashboardCategoryItem]
    overall_limit: DashboardOverallLimit
    previous_month_recap: Optional[DashboardPreviousRecap] = None

# --- Trends ---
class TrendsPerMonthItem(BaseModel):
    month: str
    total: int

class TrendsCategoryTotal(BaseModel):
    category_name: str
    amount: int
    color: str

class TrendsMomComparison(BaseModel):
    percentage_diff: float
    direction: str

class TrendsResponse(BaseModel):
    per_month_spending: List[TrendsPerMonthItem]
    category_totals: List[TrendsCategoryTotal]
    mom_comparison: TrendsMomComparison
    average_daily_spend: int
