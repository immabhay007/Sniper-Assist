"""
Make status_master.module_type nullable

Revision ID: 202606170002
Revises: 202606170001
Create Date: 2026-06-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "202606170002"
down_revision: Union[str, None] = "202506110001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "status_master",
        "module_type",
        existing_type=sa.NVARCHAR(length=50),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "status_master",
        "module_type",
        existing_type=sa.NVARCHAR(length=50),
        nullable=False,
    )