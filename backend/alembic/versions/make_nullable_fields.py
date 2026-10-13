"""
Make columns nullable in enquiries and complaints tables

Revision ID: 202606170005
Revises: 202606170004
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202606170005"
down_revision: Union[str, None] = "202606170004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Enquiries table ---
    op.alter_column(
        "enquiries",
        "created_by",
        existing_type=sa.Integer(),
        nullable=True,
    )
    op.alter_column(
        "enquiries",
        "enquiry_source",
        existing_type=sa.NVARCHAR(length=100),   # adjust length if different
        nullable=True,
    )
    op.alter_column(
        "enquiries",
        "enquiry_details",
        existing_type=sa.NVARCHAR(length=2000),  # or sa.Text()
        nullable=True,
    )

    # --- Complaints table ---
    op.alter_column(
        "complaints",
        "complaint_source",
        existing_type=sa.NVARCHAR(length=100),
        nullable=True,
    )
    op.alter_column(
        "complaints",
        "complaint_details",
        existing_type=sa.NVARCHAR(length=2000),
        nullable=True,
    )
    op.alter_column(
        "complaints",
        "priority",
        existing_type=sa.NVARCHAR(length=50),
        nullable=True,
    )


def downgrade() -> None:
    # Revert to NOT NULL (restore original state)
    # Enquiries
    op.alter_column(
        "enquiries",
        "created_by",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.alter_column(
        "enquiries",
        "enquiry_source",
        existing_type=sa.NVARCHAR(length=100),
        nullable=False,
    )
    op.alter_column(
        "enquiries",
        "enquiry_details",
        existing_type=sa.NVARCHAR(length=2000),
        nullable=False,
    )

    # Complaints
    op.alter_column(
        "complaints",
        "complaint_source",
        existing_type=sa.NVARCHAR(length=100),
        nullable=False,
    )
    op.alter_column(
        "complaints",
        "complaint_details",
        existing_type=sa.NVARCHAR(length=2000),
        nullable=False,
    )
    op.alter_column(
        "complaints",
        "priority",
        existing_type=sa.NVARCHAR(length=50),
        nullable=False,
    )