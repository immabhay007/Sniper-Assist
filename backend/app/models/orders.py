from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    DateTime,
    Numeric,
    Text,
    ForeignKey,
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    order_type = Column(
        String(50),
        nullable=False
    )

    subscription_plan_id = Column(
        BigInteger,
        nullable=True,
    )

    total_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    discount_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    final_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    status = Column(
        String(50),
        nullable=False
    )

    payment_status = Column(
        String(50),
        nullable=False
    )

    payment_method = Column(
        String(50),
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    customer_subscription_id = Column(
        BigInteger,
        nullable=True,
    )

    scheduled_date = Column(
        DateTime,
        nullable=True
    )

    scheduled_time = Column(
        String(50),
        nullable=True
    )

    service_address = Column(
        Text,
        nullable=True
    )

    tags = Column(
        String(255),
        nullable=True
    )

    admin_notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ---------------------------------------------------
    # RELATIONSHIPS
    # ---------------------------------------------------
    customer = relationship(
        "User",
        foreign_keys=[customer_id],
    )

    order_items = relationship(
        "OrderItem",
        back_populates="order"
    )