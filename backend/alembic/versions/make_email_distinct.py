"""
Make customers.email unique

Revision ID: 202606170006
Revises: 202606170005
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202606170006"
down_revision: Union[str, None] = "202606170005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Optional: clean up duplicate emails before adding the unique constraint
    # Uncomment the following block if you want to keep only the first occurrence
    # of each email and delete/update duplicates.
    #
    # connection = op.get_bind()
    # connection.execute(
    #     text("""
    #         WITH duplicates AS (
    #             SELECT id, email,
    #                    ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    #             FROM customers
    #             WHERE email IS NOT NULL
    #         )
    #         DELETE FROM customers
    #         WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
    #     """)
    # )

    # Create unique constraint on email (ignores NULLs; multiple NULLs are allowed)
    op.create_unique_constraint(
        "uq_customers_email",
        "customers",
        ["email"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_customers_email", "customers", type_="unique")