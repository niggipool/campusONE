from datetime import datetime


def get_ticket_age(created_at: datetime) -> int:
    """
    Returns ticket age in hours.
    """
    now = datetime.utcnow()

    age = now - created_at

    return max(0, int(age.total_seconds() // 3600))


def get_sla_status(
    due_at: datetime | None,
    status: str,
) -> str:
    """
    Returns the current SLA state of a ticket.
    """

    if status in {"resolved", "closed"}:
        return "completed"

    if due_at is None:
        return "no_sla"

    now = datetime.utcnow()

    if now >= due_at:
        return "breached"

    remaining = due_at - now

    if remaining.total_seconds() <= 6 * 3600:
        return "at_risk"

    return "on_track"


def get_hours_remaining(
    due_at: datetime | None,
    status: str,
) -> float | None:

    if due_at is None:
        return None

    if status in {"resolved", "closed"}:
        return 0

    seconds = (
        due_at - datetime.utcnow()
    ).total_seconds()

    return round(
        max(0, seconds / 3600),
        2,
    )