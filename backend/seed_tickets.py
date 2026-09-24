from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.models.ticket import Ticket
from app.models.user import User


TICKETS = [
    {
        "title": "Wi-Fi not working in hostel",
        "description": "The Wi-Fi connection is not working in the hostel room.",
        "category": "IT Support",
        "priority": "high",
        "status": "open",
    },
    {
        "title": "Unable to access student portal",
        "description": "The student portal shows an authentication error when logging in.",
        "category": "IT Support",
        "priority": "urgent",
        "status": "in_progress",
    },
    {
        "title": "Fee payment not reflected",
        "description": "The semester fee was paid but the payment status is still pending.",
        "category": "Fees",
        "priority": "high",
        "status": "pending",
    },
    {
        "title": "Request for hostel room change",
        "description": "Requesting a room change due to personal circumstances.",
        "category": "Hostel",
        "priority": "medium",
        "status": "open",
    },
    {
        "title": "Library card not working",
        "description": "The library card is not being recognized at the entrance.",
        "category": "Library",
        "priority": "low",
        "status": "resolved",
    },
    {
        "title": "Incorrect attendance percentage",
        "description": "Attendance for one of the subjects is showing incorrectly.",
        "category": "Academic",
        "priority": "medium",
        "status": "in_progress",
    },
    {
        "title": "Exam timetable clarification",
        "description": "Need clarification regarding the examination timetable.",
        "category": "Academic",
        "priority": "low",
        "status": "closed",
    },
    {
        "title": "AC not working in hostel room",
        "description": "The air conditioner has stopped working since yesterday.",
        "category": "Hostel",
        "priority": "high",
        "status": "open",
    },
    {
        "title": "Scholarship application issue",
        "description": "Unable to submit the scholarship application through the portal.",
        "category": "Administration",
        "priority": "urgent",
        "status": "in_progress",
    },
    {
        "title": "ID card replacement request",
        "description": "My student ID card was damaged and needs replacement.",
        "category": "Administration",
        "priority": "low",
        "status": "resolved",
    },
    {
        "title": "Course registration problem",
        "description": "Unable to register for one of the required courses.",
        "category": "Academic",
        "priority": "high",
        "status": "pending",
    },
    {
        "title": "Cafeteria food complaint",
        "description": "Reporting an issue with the quality of food served in the cafeteria.",
        "category": "Cafeteria",
        "priority": "medium",
        "status": "open",
    },
    {
        "title": "Internet connection unstable",
        "description": "Internet connection frequently disconnects during the evening.",
        "category": "IT Support",
        "priority": "medium",
        "status": "resolved",
    },
    {
        "title": "Hostel maintenance request",
        "description": "Bathroom plumbing requires maintenance.",
        "category": "Hostel",
        "priority": "low",
        "status": "closed",
    },
    {
        "title": "Urgent examination issue",
        "description": "There is an urgent issue regarding examination registration.",
        "category": "Academic",
        "priority": "urgent",
        "status": "open",
    },
    {
        "title": "Refund not received",
        "description": "The approved refund has not been credited yet.",
        "category": "Fees",
        "priority": "high",
        "status": "resolved",
    },
    {
        "title": "Library book availability issue",
        "description": "The system shows a book as available but it cannot be located.",
        "category": "Library",
        "priority": "low",
        "status": "open",
    },
    {
        "title": "Student portal loading slowly",
        "description": "The student portal takes a long time to load.",
        "category": "IT Support",
        "priority": "medium",
        "status": "in_progress",
    },
    {
        "title": "Transport pass renewal",
        "description": "Unable to renew the campus transportation pass.",
        "category": "Transport",
        "priority": "medium",
        "status": "pending",
    },
    {
        "title": "Hostel electricity issue",
        "description": "Power supply is frequently interrupted in the hostel block.",
        "category": "Hostel",
        "priority": "urgent",
        "status": "open",
    },
]


def generate_ticket_number(ticket_id):
    return f"TKT-{ticket_id:04d}"


def main():
    db = SessionLocal()

    try:
        # Get a student to own the tickets
        student = (
            db.query(User)
            .filter(User.role == "student")
            .first()
        )

        if not student:
            print("No student found. Run your user seed first.")
            return

        # Get staff/admin users for assignments
        staff_users = (
            db.query(User)
            .filter(User.role.in_(["staff", "admin"]))
            .all()
        )

        if not staff_users:
            print("No staff/admin users found.")
            return

        existing_count = db.query(Ticket).count()

        created = 0

        for index, data in enumerate(TICKETS, start=1):

            ticket_id = existing_count + index

            # Different creation dates make the dashboard/trends
            # more realistic.
            created_at = datetime.utcnow() - timedelta(
                days=(index % 14),
                hours=(index % 8),
            )

            # SLA duration based on priority
            sla_hours = {
                "low": 72,
                "medium": 48,
                "high": 24,
                "urgent": 8,
            }[data["priority"]]

            due_at = created_at + timedelta(hours=sla_hours)

            # Resolved/closed tickets are assigned to staff/admin
            assigned_to = None

            if data["status"] in {"in_progress", "pending", "resolved", "closed"}:
                assigned_to = staff_users[index % len(staff_users)].id

            ticket = Ticket(
                ticket_number=generate_ticket_number(ticket_id),
                title=data["title"],
                description=data["description"],
                category=data["category"],
                priority=data["priority"],
                status=data["status"],
                student_id=student.id,
                assigned_to=assigned_to,
                created_at=created_at,
                updated_at=created_at,
                due_at=due_at,
            )

            db.add(ticket)
            created += 1

        db.commit()

        print(f"Successfully created {created} tickets.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    main()