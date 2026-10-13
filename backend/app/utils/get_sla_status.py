from datetime import datetime
from typing import Optional


def get_sla_status(
    sla_deadline: datetime,
    created_at: datetime,
) -> str:
    """
    Returns SLA status based on deadline and created_at.

    Status:
    - On Track      → > 20% SLA time remaining
    - Approaching   → ≤ 20% SLA time remaining (but not Breached)
    - Breached      → current time > sla_deadline
    """

    now = datetime.utcnow()

    # 1. Breached check
    if now > sla_deadline:
        return "Breached"

    # 2. Validate time range
    total_duration = (sla_deadline - created_at).total_seconds()
    remaining_duration = (sla_deadline - now).total_seconds()

    if total_duration <= 0:
        return "Breached"

    # 3. Remaining percentage
    remaining_ratio = remaining_duration / total_duration

    # 4. Status mapping
    if remaining_ratio <= 0.2:
        return "Approaching"

    return "On Track"