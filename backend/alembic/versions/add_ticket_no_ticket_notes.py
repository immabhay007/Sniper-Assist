"""
Add ticket_no to ticket_notes

Revision ID: 20260617009
Revises: 20260617008
Create Date: 2026-06-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260617009"
down_revision: Union[str, None] = "20260617008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ticket_notes",
        sa.Column(
            "ticket_no",
            sa.Unicode(100),  # NVARCHAR(100)
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "ticket_notes",
        "ticket_no",
    )