"""
Add category_icon and color_code to complaint_categories and enquiry_categories

Revision ID: 20260617013
Revises: 20260617012
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260617013"
down_revision: Union[str, None] = "20260617012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to complaint_categories
    op.add_column(
        "complaint_categories",
        sa.Column("category_icon", sa.NVARCHAR(length=255), nullable=True)
    )
    op.add_column(
        "complaint_categories",
        sa.Column("color_code", sa.NVARCHAR(length=50), nullable=True)
    )

    # Add columns to enquiry_categories
    op.add_column(
        "enquiry_categories",
        sa.Column("category_icon", sa.NVARCHAR(length=255), nullable=True)
    )
    op.add_column(
        "enquiry_categories",
        sa.Column("color_code", sa.NVARCHAR(length=50), nullable=True)
    )


def downgrade() -> None:
    # Drop columns from complaint_categories
    op.drop_column("complaint_categories", "category_icon")
    op.drop_column("complaint_categories", "color_code")

    # Drop columns from enquiry_categories
    op.drop_column("enquiry_categories", "category_icon")
    op.drop_column("enquiry_categories", "color_code")