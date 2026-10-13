"""
Remove customer_name and add customer_id referencing customers.id

Revision ID: 202606170004
Revises: 202606170003
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202606170004"
down_revision: Union[str, None] = "202606170003"   # ← must match the customers table migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add customer_id columns (nullable initially, will be set as FK)
    op.add_column("enquiries", sa.Column("customer_id", sa.Integer(), nullable=True))
    op.add_column("complaints", sa.Column("customer_id", sa.Integer(), nullable=True))

    # 2. Create foreign key constraints
    op.create_foreign_key(
        "fk_enquiries_customer_id",
        "enquiries",
        "customers",
        ["customer_id"],
        ["id"],
        ondelete="SET NULL",   # optional: choose appropriate behavior
    )
    op.create_foreign_key(
        "fk_complaints_customer_id",
        "complaints",
        "customers",
        ["customer_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 3. Drop the old customer_name columns
    op.drop_column("enquiries", "customer_name")
    op.drop_column("complaints", "customer_name")


def downgrade() -> None:
    # 1. Restore customer_name columns (with nullable=True, as before)
    op.add_column("enquiries", sa.Column("customer_name", sa.NVARCHAR(length=255), nullable=True))
    op.add_column("complaints", sa.Column("customer_name", sa.NVARCHAR(length=255), nullable=True))

    # 2. Drop foreign keys
    op.drop_constraint("fk_enquiries_customer_id", "enquiries", type_="foreignkey")
    op.drop_constraint("fk_complaints_customer_id", "complaints", type_="foreignkey")

    # 3. Drop customer_id columns
    op.drop_column("enquiries", "customer_id")
    op.drop_column("complaints", "customer_id")