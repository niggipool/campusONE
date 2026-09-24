from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.ticket import Ticket
from app.models.user import User
from datetime import datetime, timedelta
from app.utils.sla import (
    get_hours_remaining,
    get_sla_status,
    get_ticket_age,
)

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def dashboard_summary(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    total = db.query(Ticket).count()

    open_count = (
        db.query(Ticket)
        .filter(Ticket.status == "open")
        .count()
    )

    in_progress = (
        db.query(Ticket)
        .filter(Ticket.status == "in_progress")
        .count()
    )

    pending = (
        db.query(Ticket)
        .filter(Ticket.status == "pending")
        .count()
    )

    resolved = (
        db.query(Ticket)
        .filter(Ticket.status == "resolved")
        .count()
    )

    closed = (
        db.query(Ticket)
        .filter(Ticket.status == "closed")
        .count()
    )

    active_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status.notin_(
                ["resolved", "closed"]
            )
        )
        .all()
    )

    overdue = 0
    at_risk = 0

    now = datetime.utcnow()

    for ticket in active_tickets:

        if ticket.due_at is None:
            continue

        if now >= ticket.due_at:
            overdue += 1

        elif (
            ticket.due_at - now
        ).total_seconds() <= 6 * 3600:
            at_risk += 1

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "pending": pending,
        "resolved": resolved,
        "closed": closed,
        "overdue": overdue,
        "at_risk": at_risk,
    }

@router.get("/by-priority")
def tickets_by_priority(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            Ticket.priority,
            func.count(Ticket.id).label("count"),
        )
        .group_by(Ticket.priority)
        .all()
    )

    return [
        {
            "priority": priority,
            "count": count,
        }
        for priority, count in results
    ]

@router.get("/by-status")
def tickets_by_status(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            Ticket.status,
            func.count(Ticket.id).label("count"),
        )
        .group_by(Ticket.status)
        .all()
    )

    return [
        {
            "status": status,
            "count": count,
        }
        for status, count in results
    ]

@router.get("/by-category")
def tickets_by_category(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            Ticket.category,
            func.count(Ticket.id).label("count"),
        )
        .group_by(Ticket.category)
        .order_by(
            func.count(Ticket.id).desc()
        )
        .all()
    )

    return [
        {
            "category": category,
            "count": count,
        }
        for category, count in results
    ]

@router.get("/sla")
def sla_overview(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status.notin_(
                ["resolved", "closed"]
            )
        )
        .all()
    )

    result = []

    for ticket in tickets:
        result.append(
            {
                "id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "title": ticket.title,
                "priority": ticket.priority,
                "status": ticket.status,
                "age_hours": get_ticket_age(
                    ticket.created_at
                ),
                "sla_status": get_sla_status(
                    ticket.due_at,
                    ticket.status,
                ),
                "hours_remaining": get_hours_remaining(
                    ticket.due_at,
                    ticket.status,
                ),
            }
        )

    return result

@router.get("/staff-workload")
def staff_workload(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    staff = (
        db.query(User)
        .filter(
            User.role.in_(["staff", "admin"])
        )
        .all()
    )

    result = []

    for member in staff:

        total = (
            db.query(Ticket)
            .filter(
                Ticket.assigned_to == member.id
            )
            .count()
        )

        active = (
            db.query(Ticket)
            .filter(
                Ticket.assigned_to == member.id,
                Ticket.status.notin_(
                    ["resolved", "closed"]
                ),
            )
            .count()
        )

        resolved = (
            db.query(Ticket)
            .filter(
                Ticket.assigned_to == member.id,
                Ticket.status.in_(
                    ["resolved", "closed"]
                ),
            )
            .count()
        )

        result.append(
            {
                "user_id": member.id,
                "name": member.name,
                "role": member.role,
                "total_assigned": total,
                "active": active,
                "resolved": resolved,
            }
        )

    return result

@router.get("/trends")
def ticket_trends(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    today = datetime.utcnow().date()

    result = []

    for days_ago in range(6, -1, -1):

        target_date = today - timedelta(
            days=days_ago
        )

        start = datetime.combine(
            target_date,
            datetime.min.time(),
        )

        end = start + timedelta(days=1)

        created = (
            db.query(Ticket)
            .filter(
                Ticket.created_at >= start,
                Ticket.created_at < end,
            )
            .count()
        )

        resolved = (
            db.query(Ticket)
            .filter(
                Ticket.updated_at >= start,
                Ticket.updated_at < end,
                Ticket.status.in_(
                    ["resolved", "closed"]
                ),
            )
            .count()
        )

        result.append(
            {
                "date": target_date.isoformat(),
                "created": created,
                "resolved": resolved,
            }
        )

    return result

@router.get("/resolution")
def resolution_statistics(
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    resolved_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status.in_(
                ["resolved", "closed"]
            )
        )
        .all()
    )

    if not resolved_tickets:
        return {
            "resolved_count": 0,
            "average_resolution_hours": 0,
        }

    total_hours = 0

    for ticket in resolved_tickets:
        duration = (
            ticket.updated_at
            - ticket.created_at
        )

        total_hours += (
            duration.total_seconds()
            / 3600
        )

    average = (
        total_hours
        / len(resolved_tickets)
    )

    return {
        "resolved_count": len(resolved_tickets),
        "average_resolution_hours": round(
            average,
            2,
        ),
    }