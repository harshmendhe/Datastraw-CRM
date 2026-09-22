from datetime import datetime, timezone
from typing import Literal, Optional, List
from pydantic import BaseModel, EmailStr, Field, field_serializer


def _as_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    """Return an ISO-8601 string with explicit UTC offset (+00:00)."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).isoformat()
    return dt.replace(tzinfo=timezone.utc).isoformat()


# --- Note Schemas ---
class NoteResponse(BaseModel):
    id: int
    ticket_id: str
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True

    @field_serializer("created_at")
    def serialize_created_at(self, dt: Optional[datetime]) -> Optional[str]:
        return _as_utc_iso(dt)


# --- Ticket Schemas ---
class TicketCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str = Field(..., max_length=200)
    description: str = Field(..., max_length=5000)
    priority: Optional[str] = "Medium"
    assigned_to: Optional[str] = None


class TicketUpdate(BaseModel):
    status: Optional[Literal["Open", "In Progress", "Closed"]] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None  # Text for internal note to append during update


class TicketResponse(BaseModel):
    id: int
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    priority: str
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    notes: List[NoteResponse] = []

    class Config:
        from_attributes = True

    @field_serializer("created_at")
    def serialize_created_at(self, dt: Optional[datetime]) -> Optional[str]:
        return _as_utc_iso(dt)

    @field_serializer("updated_at")
    def serialize_updated_at(self, dt: Optional[datetime]) -> Optional[str]:
        return _as_utc_iso(dt)


# --- Stats Schema ---
class StatsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    closed_tickets: int
    urgent_tickets: int
