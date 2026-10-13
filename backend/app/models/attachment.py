from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    module_type = Column(String(50), nullable=False)  # 'complaint', 'enquiry'
    module_id = Column(BigInteger, nullable=False)
    file_name = Column(String(255), nullable=True)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime, default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship
    uploader = relationship("User")