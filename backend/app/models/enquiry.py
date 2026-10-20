from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, Text, ForeignKey, false
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.user import User
from app.models.orders import Order
from app.models.enquiry_category import EnquiryCategory
from app.models.status_master import StatusMaster

class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    ticket_no = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(BigInteger, nullable=True)
    category_id = Column(BigInteger, ForeignKey("enquiry_categories.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    enquiry_source = Column(String(50), nullable=False)
    schedule_booking_time = Column(DateTime, nullable=True)
    services_booked = Column(String(255), nullable=True)
    enquiry_details = Column(String(50), nullable=False)
    enquiry_details = Column(Text, nullable=False)
    next_action_item = Column(Text, nullable=True)
    next_followup_date = Column(DateTime, nullable=True)
    status_id = Column(BigInteger, ForeignKey("status_master.id"), nullable=False, index=True)
    sla_deadline = Column(DateTime, nullable=True)
    sla_status = Column(String(50), nullable=True)
    is_deleted = Column(Boolean, nullable=False, server_default=false())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    category = relationship(EnquiryCategory)
    creator = relationship(User, foreign_keys=[created_by])
    assignee = relationship(User, foreign_keys=[assigned_to])
    status = relationship(StatusMaster)