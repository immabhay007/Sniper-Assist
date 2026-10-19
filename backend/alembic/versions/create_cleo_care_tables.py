"""Add cleo care tables

Revision ID: 202506110001
Revises: 202506030001
Create Date: 2025-06-11
"""

from typing import Sequence, Union 

from alembic import op
import sqlalchemy as sa

revision: str = "202506110001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # roles
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("role_name", sa.NVARCHAR(length=100), nullable=False, unique=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # permissions
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "permission_key",
            sa.NVARCHAR(length=150),
            nullable=False,
            unique=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # role_permissions
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "email",
            sa.NVARCHAR(length=255),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "password_hash",
            sa.NVARCHAR(length=255),
            nullable=False,
        ),
        sa.Column(
            "full_name",
            sa.NVARCHAR(length=255),
            nullable=False,
        ),
        sa.Column(
            "phone",
            sa.NVARCHAR(length=20),
            nullable=True,
        ),
        sa.Column(
            "role",
            sa.NVARCHAR(length=100),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # complaint_categories
    op.create_table(
        "complaint_categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("category_name", sa.NVARCHAR(length=150), nullable=False),
        sa.Column("sla_hours", sa.Integer(), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # enquiry_categories
    op.create_table(
        "enquiry_categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("category_name", sa.NVARCHAR(length=150), nullable=False),
        sa.Column("sla_hours", sa.Integer(), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # status_master
    op.create_table(
        "status_master",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("module_type", sa.NVARCHAR(length=50), nullable=False),
        sa.Column("status_name", sa.NVARCHAR(length=100), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # complaints
    op.create_table(
        "complaints",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "ticket_no",
            sa.NVARCHAR(length=50),
            nullable=False,
            unique=True,
        ),
        sa.Column("customer_user_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("assigned_to", sa.Integer(), nullable=True),

        # normal integer only
        sa.Column("order_id", sa.Integer(), nullable=True),

        sa.Column(
            "complaint_source",
            sa.NVARCHAR(length=50),
            nullable=False,
        ),
        sa.Column("schedule_booking_time", sa.DateTime(), nullable=True),
        sa.Column("services_booked", sa.NVARCHAR(length=255), nullable=True),
        sa.Column("complaint_details", sa.NVARCHAR(length=None), nullable=False),
        sa.Column("status_id", sa.Integer(), nullable=False),
        sa.Column("priority", sa.NVARCHAR(length=20), nullable=False),
        sa.Column("sla_deadline", sa.DateTime(), nullable=True),
        sa.Column("sla_status", sa.NVARCHAR(length=50), nullable=True),
        sa.Column("first_response_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),

        sa.ForeignKeyConstraint(
            ["customer_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["complaint_categories.id"],
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["assigned_to"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["status_id"],
            ["status_master.id"],
        ),
    )

    # enquiries
    op.create_table(
        "enquiries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "ticket_no",
            sa.NVARCHAR(length=50),
            nullable=False,
            unique=True,
        ),
        sa.Column("customer_user_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("assigned_to", sa.Integer(), nullable=True),

        # normal integer only
        sa.Column("order_id", sa.Integer(), nullable=True),

        sa.Column(
            "enquiry_source",
            sa.NVARCHAR(length=50),
            nullable=False,
        ),
        sa.Column("schedule_booking_time", sa.DateTime(), nullable=True),
        sa.Column("services_booked", sa.NVARCHAR(length=255), nullable=True),
        sa.Column("enquiry_details", sa.NVARCHAR(length=None), nullable=False),
        sa.Column("next_action_item", sa.NVARCHAR(length=None), nullable=True),
        sa.Column("next_followup_date", sa.DateTime(), nullable=True),
        sa.Column("status_id", sa.Integer(), nullable=False),
        sa.Column("sla_deadline", sa.DateTime(), nullable=True),
        sa.Column("sla_status", sa.NVARCHAR(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),

        sa.ForeignKeyConstraint(
            ["customer_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["enquiry_categories.id"],
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["assigned_to"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["status_id"],
            ["status_master.id"],
        ),
    )

    # attachments
    op.create_table(
        "attachments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("module_type", sa.NVARCHAR(length=50), nullable=False),
        sa.Column("module_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.NVARCHAR(length=255), nullable=True),
        sa.Column("file_url", sa.NVARCHAR(length=500), nullable=False),
        sa.Column("file_type", sa.NVARCHAR(length=100), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(), nullable=True),
        sa.Column("uploaded_by", sa.Integer(), nullable=False),

        sa.ForeignKeyConstraint(
            ["uploaded_by"],
            ["users.id"],
        ),
    )

    # ticket_notes
    op.create_table(
        "ticket_notes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("module_type", sa.NVARCHAR(length=50), nullable=False),
        sa.Column("module_id", sa.Integer(), nullable=False),
        sa.Column("note_text", sa.NVARCHAR(length=None), nullable=False),
        sa.Column("status_after_update", sa.Integer(), nullable=True),
        sa.Column("next_action_item", sa.NVARCHAR(length=None), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),

        sa.ForeignKeyConstraint(
            ["status_after_update"],
            ["status_master.id"],
            name="fk_ticket_notes_status_after_update",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
    )

    # indexes
    op.create_index(
        "ix_complaints_ticket_no",
        "complaints",
        ["ticket_no"],
    )

    op.create_index(
        "ix_complaints_customer_user_id",
        "complaints",
        ["customer_user_id"],
    )

    op.create_index(
        "ix_complaints_assigned_to",
        "complaints",
        ["assigned_to"],
    )

    op.create_index(
        "ix_complaints_status_id",
        "complaints",
        ["status_id"],
    )

    op.create_index(
        "ix_complaints_category_id",
        "complaints",
        ["category_id"],
    )

    op.create_index(
        "ix_enquiries_ticket_no",
        "enquiries",
        ["ticket_no"],
    )

    op.create_index(
        "ix_enquiries_customer_user_id",
        "enquiries",
        ["customer_user_id"],
    )

    op.create_index(
        "ix_enquiries_assigned_to",
        "enquiries",
        ["assigned_to"],
    )

    op.create_index(
        "ix_enquiries_status_id",
        "enquiries",
        ["status_id"],
    )

    op.create_index(
        "ix_enquiries_category_id",
        "enquiries",
        ["category_id"],
    )

    op.create_index(
        "ix_attachments_module",
        "attachments",
        ["module_type", "module_id"],
    )

    op.create_index(
        "ix_ticket_notes_module",
        "ticket_notes",
        ["module_type", "module_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_ticket_notes_module",
        table_name="ticket_notes",
    )

    op.drop_index(
        "ix_attachments_module",
        table_name="attachments",
    )

    op.drop_index(
        "ix_enquiries_category_id",
        table_name="enquiries",
    )

    op.drop_index(
        "ix_enquiries_status_id",
        table_name="enquiries",
    )

    op.drop_index(
        "ix_enquiries_assigned_to",
        table_name="enquiries",
    )

    op.drop_index(
        "ix_enquiries_customer_user_id",
        table_name="enquiries",
    )

    op.drop_index(
        "ix_enquiries_ticket_no",
        table_name="enquiries",
    )

    op.drop_index(
        "ix_complaints_category_id",
        table_name="complaints",
    )

    op.drop_index(
        "ix_complaints_status_id",
        table_name="complaints",
    )

    op.drop_index(
        "ix_complaints_assigned_to",
        table_name="complaints",
    )

    op.drop_index(
        "ix_complaints_customer_user_id",
        table_name="complaints",
    )

    op.drop_index(
        "ix_complaints_ticket_no",
        table_name="complaints",
    )

    op.drop_table("ticket_notes")
    op.drop_table("attachments")
    op.drop_table("enquiries")
    op.drop_table("complaints")
    op.drop_table("status_master")
    op.drop_table("enquiry_categories")
    op.drop_table("complaint_categories")
    op.drop_table("users")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("roles")