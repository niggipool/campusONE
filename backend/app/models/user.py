from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(String(255), nullable=False)

    role = Column(
        String(20),
        nullable=False,
        default="student",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    tickets = relationship(
        "Ticket",
        back_populates="student",
        foreign_keys="Ticket.student_id",
    )

    assigned_tickets = relationship(
        "Ticket",
        back_populates="assignee",
        foreign_keys="Ticket.assigned_to",
    )

    activities = relationship(
        "Activity",
        back_populates="user",
    )