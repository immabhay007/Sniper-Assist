"""
Add next_action_item column to complaints table

Revision ID: 20260617014
Revises: 20260617013
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260617014"
down_revision: Union[str, None] = "20260617013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "complaints",
        sa.Column("next_action_item", sa.NVARCHAR(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("complaints", "next_action_item")