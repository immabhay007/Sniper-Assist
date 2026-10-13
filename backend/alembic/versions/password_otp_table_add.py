"""
Add password_reset_otps table

Revision ID: 20260617011
Revises: 20260617010        # change this to your actual head revision ID
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260617011"
down_revision: Union[str, None] = "20260617010"   
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_otps",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.NVARCHAR(length=255), nullable=False),
        sa.Column("otp", sa.NVARCHAR(length=10), nullable=False),
        sa.Column("expiry", sa.DateTime(), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("ip_address", sa.NVARCHAR(length=45), nullable=True),
        sa.Column("user_agent", sa.NVARCHAR(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )

    # Indexes for performance
    op.create_index("ix_password_reset_otps_email", "password_reset_otps", ["email"])
    op.create_index("ix_password_reset_otps_expiry", "password_reset_otps", ["expiry"])
    op.create_index("ix_password_reset_otps_otp", "password_reset_otps", ["otp"])


def downgrade() -> None:
    op.drop_index("ix_password_reset_otps_otp", table_name="password_reset_otps")
    op.drop_index("ix_password_reset_otps_expiry", table_name="password_reset_otps")
    op.drop_index("ix_password_reset_otps_email", table_name="password_reset_otps")
    op.drop_table("password_reset_otps")