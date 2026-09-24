from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)

    ticket_number = Column(
        String(30),
        unique=True,
        index=True,
        nullable=False,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=False,
    )

    priority = Column(
        String(20),
        nullable=False,
        default="medium",
    )

    status = Column(
        String(30),
        nullable=False,
        default="open",
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    due_at = Column(
        DateTime,
        nullable=True,
    )

    student = relationship(
        "User",
        foreign_keys=[student_id],
        back_populates="tickets",
    )

    assignee = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_tickets",
    )

    activities = relationship(
        "Activity",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )