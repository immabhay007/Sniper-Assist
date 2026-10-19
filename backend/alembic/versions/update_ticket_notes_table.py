"""
Update ticket_notes table structure

Revision ID: 202606170007
Revises: 202606170006
Create Date: 2026-06-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202606170007"
down_revision: Union[str, None] = "202606170006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # Drop existing FK on status_after_update
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    for fk in inspector.get_foreign_keys("ticket_notes"):
        if fk["constrained_columns"] == ["status_after_update"]:
            op.drop_constraint(fk["name"], "ticket_notes", type_="foreignkey")
            break

    # Remove old columns
    op.drop_column("ticket_notes", "status_after_update")
    op.drop_column("ticket_notes", "next_action_item")

    # Add new columns
    op.add_column(
        "ticket_notes",
        sa.Column("assigned_to", sa.Integer(), nullable=True),
    )

    op.add_column(
        "ticket_notes",
        sa.Column("updated_by", sa.Integer(), nullable=True),
    )

    op.add_column(
        "ticket_notes",
        sa.Column("status_id", sa.Integer(), nullable=True),
    )

    op.add_column(
        "ticket_notes",
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # Foreign Keys
    op.create_foreign_key(
        "fk_ticket_notes_assigned_to",
        "ticket_notes",
        "users",
        ["assigned_to"],
        ["id"],
    )

    op.create_foreign_key(
        "fk_ticket_notes_updated_by",
        "ticket_notes",
        "users",
        ["updated_by"],
        ["id"],
    )

    op.create_foreign_key(
        "fk_ticket_notes_status_id",
        "ticket_notes",
        "status_master",
        ["status_id"],
        ["id"],
    )

    # Indexes
    op.create_index(
        "ix_ticket_notes_assigned_to",
        "ticket_notes",
        ["assigned_to"],
    )

    op.create_index(
        "ix_ticket_notes_status_id",
        "ticket_notes",
        ["status_id"],
    )


def downgrade() -> None:

    # Drop indexes
    op.drop_index(
        "ix_ticket_notes_status_id",
        table_name="ticket_notes",
    )

    op.drop_index(
        "ix_ticket_notes_assigned_to",
        table_name="ticket_notes",
    )

    # Drop new FKs
    op.drop_constraint(
        "fk_ticket_notes_status_id",
        "ticket_notes",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_ticket_notes_updated_by",
        "ticket_notes",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_ticket_notes_assigned_to",
        "ticket_notes",
        type_="foreignkey",
    )

    # Remove new columns
    op.drop_column("ticket_notes", "updated_at")
    op.drop_column("ticket_notes", "status_id")
    op.drop_column("ticket_notes", "updated_by")
    op.drop_column("ticket_notes", "assigned_to")

    # Restore old columns
    op.add_column(
        "ticket_notes",
        sa.Column(
            "status_after_update",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "ticket_notes",
        sa.Column(
            "next_action_item",
            sa.NVARCHAR(length=None),
            nullable=True,
        ),
    )

    # Restore original FK
    op.create_foreign_key(
        "FK__ticket_no__statu__367C1819",
        "ticket_notes",
        "status_master",
        ["status_after_update"],
        ["id"],
    )