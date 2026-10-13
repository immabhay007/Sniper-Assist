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


# =========================================================
# SERVICE TYPES MODEL
# =========================================================
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    order_id = Column(
        BigInteger,
        ForeignKey("orders.id"),
        nullable=False,
        index=True
    )

    service_type_id = Column(
        BigInteger,
        ForeignKey("service_types.id"),
        nullable=False,
        index=True
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=1
    )

    price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
    )

    # Relationships
    order = relationship(
        "Order",
        back_populates="order_items"
    )

    service_type = relationship(
        "ServiceType",
        back_populates="order_items"
    )