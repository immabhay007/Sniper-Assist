from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    false,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class TicketNote(Base):
    __tablename__ = "ticket_notes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    module_type = Column(
        String(50),
        nullable=False,
    )

    module_id = Column(
        Integer,
        nullable=False,
    )

    ticket_no = Column(
        String(100),  # NVARCHAR(100) in MSSQL
        nullable=True,
    )

    note_text = Column(
        Text,
        nullable=False,
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    updated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    status_id = Column(
        Integer,
        ForeignKey("status_master.id"),
        nullable=True,
    )

    is_deleted = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    created_at = Column(
        DateTime,
        default=func.now(),
    )

    updated_at = Column(
        DateTime,
        default=func.now(),
        onupdate=func.now(),
    )

    # Relationships

    status = relationship(
        "StatusMaster",
        foreign_keys=[status_id],
    )

    assigned_user = relationship(
        "User",
        foreign_keys=[assigned_to],
    )

    created_user = relationship(
        "User",
        foreign_keys=[created_by],
    )

    updated_user = relationship(
        "User",
        foreign_keys=[updated_by],
    )