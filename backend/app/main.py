import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
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

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    with next(get_db()) as db:
        seed_initial_tickets(db)
    yield

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT in ("production", "prod")

app = FastAPI(
    title="Datastraw Support Ticket CRM API",
    description="Backend API for Datastraw Support Ticket CRM",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "connect-src 'self' *; "
            "frame-ancestors 'none';"
        )
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS
dev_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

allowed_origins = [] if IS_PRODUCTION else list(dev_origins)

FRONTEND_URL_ENV = os.getenv("FRONTEND_URL") or os.getenv("ALLOWED_ORIGINS")
if FRONTEND_URL_ENV:
    for orig in FRONTEND_URL_ENV.split(","):
        cleaned = orig.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=None if IS_PRODUCTION else r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    data = {
        "status": "online",
        "app": "Datastraw Support Ticket CRM API",
        "version": "1.0.0",
    }
    if not IS_PRODUCTION:
        data["docs"] = "/docs"
    return data


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
