from sqlalchemy import Column, BigInteger, String, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class EnquiryCategory(Base):
    __tablename__ = "enquiry_categories"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(150), nullable=False)
    category_icon = Column(String(150), nullable=False)
    color_code = Column(String(150), nullable=False)
    sla_hours = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())