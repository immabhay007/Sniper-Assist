"""
Add is_deleted bit field to enquiries and complaints tables

Revision ID: 20260617012
Revises: 20260617011
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260617012"
down_revision: Union[str, None] = "20260617011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_deleted column to enquiries
    op.add_column(
        "enquiries",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("0"))
    )
    # Add is_deleted column to complaints
    op.add_column(
        "complaints",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("0"))
    )


def downgrade() -> None:
    op.drop_column("enquiries", "is_deleted")
    op.drop_column("complaints", "is_deleted")