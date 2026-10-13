"""
Remove roles, permissions, role_permissions; add menus and user_permissions.

Revision ID: 20260617010
Revises: 20260617009
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260617010"
down_revision: Union[str, None] = "20260617009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------ Drop old tables (reverse order of dependencies) ------------------
    # 1. Drop role_permissions (foreign keys to roles and permissions)
    op.drop_table("role_permissions")
    # 2. Drop roles
    op.drop_table("roles")
    # 3. Drop permissions
    op.drop_table("permissions")

    # ------------------ Create new tables ------------------
    # 1. menus
    op.create_table(
        "menus",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("menu_name", sa.NVARCHAR(length=255), nullable=False),
        sa.Column("menu_key", sa.NVARCHAR(length=100), nullable=False, unique=True),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True, onupdate=sa.func.now()),
    )

    # 2. user_permissions (replaces role_permissions)
    op.create_table(
        "user_permissions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("menu_id", sa.Integer(), nullable=False),
        sa.Column("can_view", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("can_create", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("can_edit", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("can_delete", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("can_export", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("can_upload", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        # Foreign keys
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["menu_id"], ["menus.id"], ondelete="CASCADE"),
        # Ensure one permission set per user per menu
        sa.UniqueConstraint("user_id", "menu_id", name="uq_user_permissions_user_menu"),
    )


def downgrade() -> None:
    # ------------------ Reverse: drop new tables, recreate old ones ------------------
    # 1. Drop user_permissions
    op.drop_table("user_permissions")
    # 2. Drop menus
    op.drop_table("menus")

    # 3. Recreate permissions
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("permission_key", sa.NVARCHAR(length=150), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # 4. Recreate roles
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("role_name", sa.NVARCHAR(length=100), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # 5. Recreate role_permissions
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )