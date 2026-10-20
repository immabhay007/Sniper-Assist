from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, true
from sqlalchemy.sql import func
from app.db.base import Base

class StatusMaster(Base):
    __tablename__ = "status_master"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    module_type = Column(String(50), nullable=False)
    status_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default=true())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())