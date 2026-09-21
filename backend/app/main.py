from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import Ticket, Note
from .schemas import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    StatsResponse,
)
from .crud import (
    get_tickets,
    get_ticket_by_ticket_id,
    create_ticket,
    update_ticket,
    get_stats,
    seed_initial_tickets,
)

# Initialize tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    with next(get_db()) as db:
        seed_initial_tickets(db)
    yield

app = FastAPI(
    title="Datastraw Support Ticket CRM API",
    description="Backend API for Datastraw Support Ticket CRM",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "app": "Datastraw Support Ticket CRM API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# --- Stats / KPI Endpoint ---

@app.get("/api/stats", response_model=StatsResponse, tags=["Stats"])
def read_stats(db: Session = Depends(get_db)):
    """Retrieve ticket counts by status and priority metrics."""
    return get_stats(db)


# --- Tickets Endpoints ---

@app.get("/api/tickets", response_model=List[TicketResponse], tags=["Tickets"])
def list_tickets(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status (All, Open, In Progress, Closed)"),
    search: Optional[str] = Query(None, description="Search across ticket ID, customer name, email, subject, description"),
    customer_email: Optional[str] = Query(None, description="Filter all tickets by customer email"),
    db: Session = Depends(get_db)
):
    """List tickets with optional status filtering, search, and customer email filtering."""
    return get_tickets(db, skip=skip, limit=limit, status=status, search=search, customer_email=customer_email)


@app.post("/api/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Tickets"])
def add_ticket(ticket_data: TicketCreate, db: Session = Depends(get_db)):
    """Create a new ticket with auto-generated ID (e.g., TKT-001)."""
    if not ticket_data.customer_name or not ticket_data.customer_email or not ticket_data.subject or not ticket_data.description:
        raise HTTPException(status_code=400, detail="Missing required ticket fields.")
    return create_ticket(db, ticket_data)


@app.get("/api/tickets/{ticket_id}", response_model=TicketResponse, tags=["Tickets"])
def read_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Look up a ticket by its ticket_id (e.g., TKT-001) including its notes history."""
    ticket = get_ticket_by_ticket_id(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found."
        )
    return ticket


@app.put("/api/tickets/{ticket_id}", response_model=TicketResponse, tags=["Tickets"])
def edit_ticket(ticket_id: str, update_data: TicketUpdate, db: Session = Depends(get_db)):
    """Update ticket status, priority, and optionally add an internal note."""
    ticket = update_ticket(db, ticket_id, update_data)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found."
        )
    return ticket
