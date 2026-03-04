import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, BigInteger, ForeignKey, Text, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class AppSettings(Base):
    __tablename__ = "app_settings"
    __table_args__ = (
        CheckConstraint('id = 1', name='chk_app_settings_single_row'),
        CheckConstraint('monthly_spending_limit >= 0', name='chk_monthly_spending_limit_non_negative')
    )

    id = Column(Integer, primary_key=True, default=1)
    opening_balance = Column(BigInteger, nullable=False)
    monthly_spending_limit = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    icon = Column(String, nullable=False)
    color = Column(String, nullable=False)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class MonthlyBudget(Base):
    __tablename__ = "monthly_budgets"
    __table_args__ = (
        UniqueConstraint('category_id', 'month', name='uq_monthly_budgets_category_month'),
        CheckConstraint('budget_limit > 0', name='chk_budget_limit_positive')
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    month = Column(String(7), nullable=False)
    budget_limit = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("type IN ('income', 'expense')", name='chk_transaction_type'),
        CheckConstraint('amount > 0', name='chk_amount_positive'),
        Index('idx_transactions_date', 'date'),
        Index('idx_transactions_category_date', 'category_id', 'date')
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    amount = Column(BigInteger, nullable=False)
    date = Column(Date, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    category = relationship("Category", lazy="joined")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    target_amount = Column(BigInteger, nullable=True)
    deadline = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SavingsAllocation(Base):
    __tablename__ = "savings_allocations"
    __table_args__ = (
        Index('idx_savings_allocations_goal_id', 'goal_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey('savings_goals.id', ondelete='CASCADE'), nullable=False)
    amount = Column(BigInteger, nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
