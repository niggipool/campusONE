from datetime import datetime

from pydantic import BaseModel, Field


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    category: str = Field(..., min_length=2, max_length=100)
    priority: str = "medium"


class TicketUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=200)
    description: str | None = Field(None, min_length=5)
    category: str | None = Field(None, min_length=2, max_length=100)
    priority: str | None = None
    status: str | None = None
    assigned_to: int | None = None


class ActivityResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    content: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserSummary(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class SLASummary(BaseModel):
    status: str
    age_hours: int
    hours_remaining: float | None

class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    category: str
    priority: str
    status: str

    student: UserSummary
    assigned_to: UserSummary | None

    created_at: datetime
    updated_at: datetime
    due_at: datetime | None

    class Config:
        from_attributes = True

class TicketDetailResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    category: str
    priority: str
    status: str

    student: UserSummary
    assigned_to: UserSummary | None

    created_at: datetime
    updated_at: datetime
    due_at: datetime | None

    sla: SLASummary

class TicketListResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    student: UserSummary
    assigned_to: UserSummary | None
    created_at: datetime
    updated_at: datetime
    due_at: datetime | None
    sla: SLASummary


class ActivityCreate(BaseModel):
    content: str = Field(..., min_length=1)