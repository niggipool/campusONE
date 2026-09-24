from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_user,
    require_roles,
)
from app.models.activity import Activity
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.ticket import (
    ActivityCreate,
    ActivityResponse,
    TicketCreate,
    TicketDetailResponse,
    TicketListResponse,
    TicketResponse,
    TicketUpdate,
)
from app.utils.sla import (
    get_hours_remaining,
    get_sla_status,
    get_ticket_age,
)


router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"],
)


VALID_PRIORITIES = {
    "low",
    "medium",
    "high",
    "urgent",
}

VALID_STATUSES = {
    "open",
    "in_progress",
    "pending",
    "resolved",
    "closed",
}


def generate_ticket_number(db: Session) -> str:
    last_ticket = (
        db.query(Ticket)
        .order_by(Ticket.id.desc())
        .first()
    )

    next_id = 1 if last_ticket is None else last_ticket.id + 1

    return f"TKT-{next_id:04d}"


def calculate_due_date(priority: str) -> datetime:
    """
    Simple SLA rules.

    low     -> 72 hours
    medium  -> 48 hours
    high    -> 24 hours
    urgent  -> 8 hours
    """

    hours = {
        "low": 72,
        "medium": 48,
        "high": 24,
        "urgent": 8,
    }

    return datetime.utcnow() + timedelta(
        hours=hours[priority]
    )


# ---------------------------------------------------------
# CREATE TICKET
# ---------------------------------------------------------

@router.post(
    "",
    response_model=TicketResponse,
)
def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    priority = data.priority.lower()

    if priority not in VALID_PRIORITIES:
        raise HTTPException(
            status_code=400,
            detail="Invalid priority",
        )

    ticket = Ticket(
        ticket_number=generate_ticket_number(db),
        title=data.title,
        description=data.description,
        category=data.category,
        priority=priority,
        status="open",
        student_id=current_user.id,
        due_at=calculate_due_date(priority),
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    activity = Activity(
        ticket_id=ticket.id,
        user_id=current_user.id,
        content="Ticket created",
        is_internal=False,
    )

    db.add(activity)
    db.commit()

    return ticket


# ---------------------------------------------------------
# LIST TICKETS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[TicketListResponse],
)
def get_tickets(
    status: str | None = Query(None),
    priority: str | None = Query(None),
    category: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.student),
            joinedload(Ticket.assignee),
        )
    )

    # Students can only see their own tickets
    if current_user.role == "student":
        query = query.filter(
            Ticket.student_id == current_user.id
        )

    if status:
        status = status.lower()

        if status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Invalid status",
            )

        query = query.filter(
            Ticket.status == status
        )

    if priority:
        priority = priority.lower()

        if priority not in VALID_PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail="Invalid priority",
            )

        query = query.filter(
            Ticket.priority == priority
        )

    if category:
        query = query.filter(
            Ticket.category == category
        )

    tickets = (
        query
        .order_by(Ticket.created_at.desc())
        .all()
    )

    return [
        {
            "id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "title": ticket.title,
            "description": ticket.description,
            "category": ticket.category,
            "priority": ticket.priority,
            "status": ticket.status,

            "student": {
                "id": ticket.student.id,
                "name": ticket.student.name,
                "email": ticket.student.email,
            },

            "assigned_to": (
                {
                    "id": ticket.assignee.id,
                    "name": ticket.assignee.name,
                    "email": ticket.assignee.email,
                }
                if ticket.assignee
                else None
            ),

            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
            "due_at": ticket.due_at,

            "sla": {
                "status": get_sla_status(
                    ticket.due_at,
                    ticket.status,
                ),
                "age_hours": get_ticket_age(
                    ticket.created_at,
                ),
                "hours_remaining": get_hours_remaining(
                    ticket.due_at,
                    ticket.status,
                ),
            },
        }
        for ticket in tickets
    ]

# ---------------------------------------------------------
# GET SINGLE TICKET
# ---------------------------------------------------------

@router.get(
    "/{ticket_id}",
    response_model=TicketDetailResponse,
)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    # Students can only access their own tickets
    if (
        current_user.role == "student"
        and ticket.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this ticket",
        )

    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "title": ticket.title,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,

        "student": {
            "id": ticket.student.id,
            "name": ticket.student.name,
            "email": ticket.student.email,
        },

        "assigned_to": (
            {
                "id": ticket.assignee.id,
                "name": ticket.assignee.name,
                "email": ticket.assignee.email,
            }
            if ticket.assignee
            else None
        ),

        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "due_at": ticket.due_at,

        "sla": {
            "status": get_sla_status(
                ticket.due_at,
                ticket.status,
            ),
            "age_hours": get_ticket_age(
                ticket.created_at,
            ),
            "hours_remaining": get_hours_remaining(
                ticket.due_at,
                ticket.status,
            ),
        },
    }



# ---------------------------------------------------------
# UPDATE TICKET
# ---------------------------------------------------------

@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    changes = []

    if data.title is not None:
        ticket.title = data.title

    if data.description is not None:
        ticket.description = data.description

    if data.category is not None:
        ticket.category = data.category

    if data.priority is not None:
        priority = data.priority.lower()

        if priority not in VALID_PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail="Invalid priority",
            )

        ticket.priority = priority
        ticket.due_at = calculate_due_date(priority)

        changes.append(
            f"Priority changed to {priority}"
        )

    if data.status is not None:
        if data.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Invalid status",
            )

        ticket.status = data.status

        changes.append(
            f"Status changed to {data.status}"
        )

    if data.assigned_to is not None:
        staff = (
            db.query(User)
            .filter(User.id == data.assigned_to)
            .first()
        )

        if not staff:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found",
            )

        if staff.role not in {"staff", "admin"}:
            raise HTTPException(
                status_code=400,
                detail="Ticket can only be assigned to staff or admin",
            )

        ticket.assigned_to = staff.id

        changes.append(
            f"Ticket assigned to {staff.name}"
        )

    db.commit()
    db.refresh(ticket)

    for change in changes:
        activity = Activity(
            ticket_id=ticket.id,
            user_id=current_user.id,
            content=change,
            is_internal=False,
        )

        db.add(activity)

    db.commit()

    return {
    "id": ticket.id,
    "ticket_number": ticket.ticket_number,
    "title": ticket.title,
    "description": ticket.description,
    "category": ticket.category,
    "priority": ticket.priority,
    "status": ticket.status,
    "student": {
        "id": ticket.student.id,
        "name": ticket.student.name,
        "email": ticket.student.email,
    },
    "assigned_to": (
        {
            "id": ticket.assignee.id,
            "name": ticket.assignee.name,
            "email": ticket.assignee.email,
        }
        if ticket.assignee
        else None
    ),
    "created_at": ticket.created_at,
    "updated_at": ticket.updated_at,
    "due_at": ticket.due_at,
    "sla": {
        "status": get_sla_status(
            ticket.due_at,
            ticket.status,
        ),
        "age_hours": get_ticket_age(
            ticket.created_at,
        ),
        "hours_remaining": get_hours_remaining(
            ticket.due_at,
            ticket.status,
        ),
    },
}


# ---------------------------------------------------------
# DELETE TICKET
# ---------------------------------------------------------

@router.delete(
    "/{ticket_id}",
)
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    db.delete(ticket)
    db.commit()

    return {
        "message": "Ticket deleted successfully"
    }


# ---------------------------------------------------------
# PUBLIC REPLY
# ---------------------------------------------------------

@router.post(
    "/{ticket_id}/replies",
    response_model=ActivityResponse,
)
def add_reply(
    ticket_id: int,
    data: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    # Students can reply only to their own tickets
    if (
        current_user.role == "student"
        and ticket.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this ticket",
        )

    activity = Activity(
        ticket_id=ticket.id,
        user_id=current_user.id,
        content=data.content,
        is_internal=False,
    )

    db.add(activity)

    # Automatically reopen a resolved ticket if student replies
    if (
        current_user.role == "student"
        and ticket.status == "resolved"
    ):
        ticket.status = "open"

    db.commit()
    db.refresh(activity)

    return activity


# ---------------------------------------------------------
# INTERNAL NOTE
# ---------------------------------------------------------

@router.post(
    "/{ticket_id}/notes",
    response_model=ActivityResponse,
)
def add_internal_note(
    ticket_id: int,
    data: ActivityCreate,
    current_user: User = Depends(
        require_roles("staff", "admin")
    ),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    activity = Activity(
        ticket_id=ticket.id,
        user_id=current_user.id,
        content=data.content,
        is_internal=True,
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


# ---------------------------------------------------------
# ACTIVITY TIMELINE
# ---------------------------------------------------------

@router.get(
    "/{ticket_id}/activity",
    response_model=list[ActivityResponse],
)
def get_activity(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    if (
        current_user.role == "student"
        and ticket.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this ticket",
        )

    query = db.query(Activity).filter(
        Activity.ticket_id == ticket_id
    )

    # Students must not see internal notes
    if current_user.role == "student":
        query = query.filter(
            Activity.is_internal.is_(False)
        )

    return (
        query
        .order_by(Activity.created_at.asc())
        .all()
    )