"""
Create customers table

Revision ID: 202606170003
Revises: 202606170002
Create Date: 2026-06-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202606170003"
down_revision: Union[str, None] = "202606170002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.NVARCHAR(length=255), nullable=False),
        sa.Column("email", sa.NVARCHAR(length=255), nullable=True),
        sa.Column("phone", sa.NVARCHAR(length=50), nullable=True),
        sa.Column("address", sa.NVARCHAR(length=500), nullable=True),
        sa.Column("city", sa.NVARCHAR(length=100), nullable=True),
        sa.Column("state", sa.NVARCHAR(length=100), nullable=True),
        sa.Column("is_new_customer", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("customers")