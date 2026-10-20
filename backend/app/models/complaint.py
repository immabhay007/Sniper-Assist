from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, Text, ForeignKey, false
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.user import User
from app.models.orders import Order
from app.models.complaint_category import ComplaintCategory
from app.models.status_master import StatusMaster



class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    ticket_no = Column(String(50), unique=True, nullable=False, index=True)

    customer_id = Column(BigInteger, nullable=True)

    category_id = Column(BigInteger, ForeignKey("complaint_categories.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    complaint_source = Column(String(50), nullable=False)

    complaint_details = Column(Text, nullable=False)

    schedule_booking_time = Column(DateTime, nullable=True)
    services_booked = Column(String(255), nullable=True)

    status_id = Column(BigInteger, ForeignKey("status_master.id"), nullable=False, index=True)
    priority = Column(String(20), nullable=False)

    sla_deadline = Column(DateTime, nullable=True)
    sla_status = Column(String(50), nullable=True)

    first_response_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, nullable=False, server_default=false())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    next_action_item = Column(Text, nullable=True)
    
    # Relationships
    category = relationship(ComplaintCategory)
    creator = relationship(User, foreign_keys=[created_by])
    assignee = relationship(User, foreign_keys=[assigned_to])
    status = relationship(StatusMaster)