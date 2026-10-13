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
class ServiceType(Base):
    __tablename__ = "service_types"

    id = Column(    
        BigInteger,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    category_id = Column(
        BigInteger,
        nullable=False,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    base_price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    property_type = Column(
        String(100),
        nullable=True
    )

    duration_minutes = Column(
        Integer,
        nullable=True
    )

    is_active = Column(
        Integer,
        nullable=False,
        default=1
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

    # Relationships
    order_items = relationship(
        "OrderItem",
        back_populates="service_type"
    )