"""
CRUD operations for Support Ticket CRM.
Sequential ticket ID generation (TKT-001, TKT-002, etc.), search, filter, and notes logic.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from .models import Ticket, Note
from .schemas import TicketCreate, TicketUpdate

def generate_ticket_id(db: Session) -> str:
    """Sequential ticket ID generation (TKT-001, TKT-002, etc.)."""
    last_ticket = db.query(Ticket).order_by(Ticket.id.desc()).first()
    next_num = (last_ticket.id + 1) if last_ticket else 1
    return f"TKT-{next_num:03d}"

def get_tickets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    customer_email: Optional[str] = None
) -> List[Ticket]:
    query = db.query(Ticket)

    if customer_email and customer_email.strip():
        query = query.filter(func.lower(Ticket.customer_email) == customer_email.strip().lower())

    if status and status.strip().lower() != "all":
        # Case-insensitive comparison for status
        query = query.filter(func.lower(Ticket.status) == status.strip().lower())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.ticket_id.ilike(term),
                Ticket.customer_name.ilike(term),
                Ticket.customer_email.ilike(term),
                Ticket.subject.ilike(term),
                Ticket.description.ilike(term),
            )
        )

    return query.order_by(Ticket.id.desc()).offset(skip).limit(limit).all()

def get_ticket_by_ticket_id(db: Session, ticket_id: str) -> Optional[Ticket]:
    """Strictly look up a ticket by its human-readable ticket_id (e.g., TKT-001)."""
    return db.query(Ticket).filter(func.upper(Ticket.ticket_id) == ticket_id.strip().upper()).first()

def get_tickets_by_customer_email(db: Session, customer_email: str) -> List[Ticket]:
    """Retrieve all tickets belonging to a customer by email (open, in progress, closed)."""
    return (
        db.query(Ticket)
        .filter(func.lower(Ticket.customer_email) == customer_email.strip().lower())
        .order_by(Ticket.id.desc())
        .all()
    )

def create_ticket(db: Session, ticket_data: TicketCreate) -> Ticket:
    tkt_id = generate_ticket_id(db)
    new_ticket = Ticket(
        ticket_id=tkt_id,
        customer_name=ticket_data.customer_name.strip(),
        customer_email=ticket_data.customer_email.strip(),
        subject=ticket_data.subject.strip(),
        description=ticket_data.description.strip(),
        priority=ticket_data.priority or "Medium",
        assigned_to=ticket_data.assigned_to,
        status="Open",
        created_at=datetime.now(),
        updated_at=None,
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

def update_ticket(db: Session, ticket_id: str, update_data: TicketUpdate) -> Optional[Ticket]:
    ticket = get_ticket_by_ticket_id(db, ticket_id)
    if not ticket:
        return None

    if update_data.status is not None:
        ticket.status = update_data.status.strip()

    if update_data.priority is not None:
        ticket.priority = update_data.priority.strip()

    if update_data.assigned_to is not None:
        ticket.assigned_to = update_data.assigned_to.strip() if update_data.assigned_to else None

    # If 'notes' field has content, append a new internal note to the ticket
    if update_data.notes and update_data.notes.strip():
        note_entry = Note(
            ticket_id=ticket.ticket_id,
            note_text=update_data.notes.strip()
        )
        db.add(note_entry)

    ticket.updated_at = datetime.now()
    db.commit()
    db.refresh(ticket)
    return ticket

def get_stats(db: Session) -> dict:
    total = db.query(Ticket).count()
    open_count = db.query(Ticket).filter(func.lower(Ticket.status) == "open").count()
    in_prog_count = db.query(Ticket).filter(func.lower(Ticket.status) == "in progress").count()
    closed_count = db.query(Ticket).filter(func.lower(Ticket.status) == "closed").count()
    urgent_count = db.query(Ticket).filter(
        func.lower(Ticket.priority) == "urgent",
        func.lower(Ticket.status) != "closed"
    ).count()

    return {
        "total_tickets": total,
        "open_tickets": open_count,
        "in_progress_tickets": in_prog_count,
        "closed_tickets": closed_count,
        "urgent_tickets": urgent_count,
    }

def seed_initial_tickets(db: Session):
    """Seed realistic support tickets on first launch if empty."""
    if db.query(Ticket).count() > 0:
        return

    sample_tickets = [
        Ticket(
            ticket_id="TKT-001",
            customer_name="Alice Rivera",
            customer_email="alice.r@nexuscad.com",
            subject="Webhook integration failing with 401 Unauthorized",
            description="Our production webhook listener started receiving 401 errors after the OAuth certificate update this morning. Payloads are currently queueing up.",
            status="In Progress",
            priority="Urgent",
        ),
        Ticket(
            ticket_id="TKT-002",
            customer_name="Brian Vance",
            customer_email="bvance@cloudfrontier.io",
            subject="Unable to export monthly usage CSV",
            description="When clicking the 'Download CSV' button on the billing analytics view, the spinner runs indefinitely and no file download is initiated.",
            status="Open",
            priority="High",
        ),
        Ticket(
            ticket_id="TKT-003",
            customer_name="Clara Oswald",
            customer_email="clara@tardis-tech.org",
            subject="Question regarding Single Sign-On (SAML) setup",
            description="We are preparing our Okta migration and would like to clarify if Just-In-Time (JIT) provisioning is supported for custom roles.",
            status="Open",
            priority="Medium",
        ),
        Ticket(
            ticket_id="TKT-004",
            customer_name="Daniel Kim",
            customer_email="dkim@strivelabs.co",
            subject="Domain verification record expired",
            description="Our sending domain TXT record was marked as unverified after our DNS provider refreshed. We have updated DNS and need it re-checked.",
            status="Closed",
            priority="Low",
        ),
    ]

    db.add_all(sample_tickets)
    db.commit()

    # Seed sample notes for TKT-001 and TKT-004
    sample_notes = [
        Note(
            ticket_id="TKT-001",
            note_text="Investigated API gateway logs: customer regenerated client secret but didn't update their webhook header config."
        ),
        Note(
            ticket_id="TKT-001",
            note_text="Contacted Alice with updated header signatures instructions. Awaiting confirmation."
        ),
        Note(
            ticket_id="TKT-004",
            note_text="DNS TXT record verified successfully via dig command. Ticket resolved."
        ),
    ]
    db.add_all(sample_notes)
    db.commit()
