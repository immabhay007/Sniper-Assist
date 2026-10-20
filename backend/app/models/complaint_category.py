from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Integer, true
from sqlalchemy.sql import func
from app.db.base import Base

class ComplaintCategory(Base):
    __tablename__ = "complaint_categories"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(150), nullable=False)
    category_icon = Column(String(150), nullable=False)
    color_code = Column(String(150), nullable=False)
    sla_hours = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default=true())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())