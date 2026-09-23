# Datastraw Support Ticket CRM

A full-stack Customer Support Ticket CRM for support teams to create, triage, and resolve customer issues — with status tracking, priority management, internal discussion notes, and a customer ticket history view.
The application is deployed as two Railway services: a React frontend and a FastAPI backend with persistent SQLite storage.

**Live App**: https://datastraw-crm-frontend-production.up.railway.app/
**Backend API**: https://datastraw-crm-production-02d7.up.railway.app/

---

## Architecture

```text
User
  ↓
React + Vite Frontend
  ↓ REST API
FastAPI Backend
  ↓ SQLAlchemy ORM
SQLite Database
  ↓
Railway Persistent Volume
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide React, Vanilla CSS |
| **Backend** | Python 3.12, FastAPI, Uvicorn |
| **Data** | SQLAlchemy ORM, Pydantic v2, SQLite |
| **Deployment** | Railway (backend + frontend), Procfile |

---

## Key Features

- **Sequential Ticket IDs**: Auto-generated `TKT-001`, `TKT-002`, ... with concurrency-safe locking.
- **Status & Priority Management**: Open, In Progress, Closed × Low, Medium, High, Urgent.
- **Internal Notes**: Append timestamped internal discussion notes when updating a ticket.
- **Live Search**: Full-text search across ticket ID, customer name, email, subject, and description.
- **Status Filter**: Filter the ticket list by status (All, Open, In Progress, Closed).
- **Customer History Modal**: View all tickets submitted by a given customer in one click.
- **Dashboard KPIs**: Live counts for total, open, in-progress, closed, and urgent tickets.
- **UTC Timestamps**: Backend stores and returns timestamps with an explicit UTC offset (`+00:00`). The frontend displays them converted to Asia/Kolkata (IST).
- **Security**: Strict production CORS, security headers (X-Frame-Options, CSP, HSTS), Swagger/docs disabled in production.

---

## Project Structure

```
Datastraw CRM/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Package initializer
│   │   ├── database.py          # SQLite engine, session factory, Railway volume support
│   │   ├── models.py            # Ticket and Note SQLAlchemy models
│   │   ├── schemas.py           # Pydantic request/response schemas with UTC serialization
│   │   ├── crud.py              # Ticket CRUD, sequential ID generation, search, notes
│   │   └── main.py              # FastAPI app, CORS, security headers, endpoints
│   ├── .env.example             # Backend environment variable template
│   ├── Procfile                 # Railway start command
│   ├── requirements.txt         # Python dependencies
│   ├── test_api.py              # End-to-end API verification
│   ├── test_timestamp_handling.py  # UTC → Asia/Kolkata timestamp tests
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # App header
│   │   │   ├── StatsSummary.jsx          # KPI cards
│   │   │   ├── TicketsView.jsx           # Search, filter, and tickets table
│   │   │   ├── CreateTicketModal.jsx     # New ticket form
│   │   │   ├── TicketDetailModal.jsx     # Ticket view, edit, and notes
│   │   │   └── CustomerHistoryModal.jsx  # All tickets per customer
│   │   ├── utils/
│   │   │   ├── dateTime.js               # UTC → Asia/Kolkata formatting
│   │   │   └── statusBadges.js           # Shared status/priority CSS class helpers
│   │   ├── api.js               # Fetch-based API client (VITE_API_BASE_URL)
│   │   ├── App.jsx              # Root component and application state
│   │   ├── index.css            # Design system (CSS variables, components)
│   │   └── main.jsx             # React entry point
│   ├── .env.example             # Frontend environment variable template
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── README.md
└── .gitignore
```

---

## Local Quickstart

### 1. Backend

```bash
cd backend

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- **API Root**: http://127.0.0.1:8000
- **Swagger Docs**: http://127.0.0.1:8000/docs *(development only — disabled in production)*

The database (`crm.db`) is created automatically on first startup. Demo seed data is **disabled by default** and **never runs in production**. To load sample tickets locally, set `SEED_DEMO_DATA=true` in your environment.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- **CRM UI**: http://localhost:5173

Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL` if the backend is running on a different port or host.

---

## API Reference

### `GET /api/stats`
Returns live ticket counts for the dashboard.

```json
{
  "total_tickets": 10,
  "open_tickets": 4,
  "in_progress_tickets": 3,
  "closed_tickets": 3,
  "urgent_tickets": 2
}
```

---

### `GET /api/tickets`
List tickets with optional filters.

| Parameter | Description |
| :--- | :--- |
| `?status=Open` | Filter by status: `All`, `Open`, `In Progress`, `Closed` |
| `?search=query` | Full-text search across ticket ID, name, email, subject, description |
| `?customer_email=alice@example.com` | Return all tickets for a specific customer |

---

### `POST /api/tickets`
Create a new ticket. A sequential `ticket_id` is assigned automatically.

```json
{
  "customer_name": "Alice Rivera",
  "customer_email": "alice@example.com",
  "subject": "Webhook failing with 401 Unauthorized",
  "description": "Payloads are failing after credential rotation.",
  "priority": "Urgent"
}
```

---

### `GET /api/tickets/{ticket_id}`
Retrieve a ticket and its full notes thread (e.g. `/api/tickets/TKT-001`).

```json
{
  "id": 1,
  "ticket_id": "TKT-001",
  "customer_name": "Alice Rivera",
  "customer_email": "alice@example.com",
  "subject": "Webhook failing with 401 Unauthorized",
  "description": "Payloads are failing after credential rotation.",
  "status": "In Progress",
  "priority": "Urgent",
  "assigned_to": "Technical Support",
  "created_at": "2026-09-22T10:30:00+00:00",
  "updated_at": "2026-09-22T11:15:00+00:00",
  "notes": [
    {
      "id": 1,
      "ticket_id": "TKT-001",
      "note_text": "Customer regenerated client secret but did not update webhook header.",
      "created_at": "2026-09-22T11:15:00+00:00"
    }
  ]
}
```

---

### `PUT /api/tickets/{ticket_id}`
Update ticket status, priority, or assigned team. Optionally append an internal note.

```json
{
  "status": "In Progress",
  "priority": "High",
  "assigned_to": "Technical Support",
  "notes": "Reproduced issue in staging. Fix deployed."
}
```

---

## Testing

### End-to-End API Test

Verifies stats, ticket creation, update, search, and customer history filter:

```bash
cd backend
python test_api.py
```

### Timestamp Tests

Verifies UTC backend timestamps correctly convert to Asia/Kolkata in both unit and live API scenarios:

```bash
cd backend
python test_timestamp_handling.py
```

### Frontend Lint & Build

```bash
cd frontend
npm run lint
npm run build
```

---

## Deployment

The application is deployed on [Railway](https://railway.app) with two services:

| Service | URL |
| :--- | :--- |
| **Frontend** | https://datastraw-crm-frontend-production.up.railway.app/ |
| **Backend API** | https://datastraw-crm-production-02d7.up.railway.app/ |

**Backend** is deployed from the `backend/` root directory using the `Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

**Required Railway environment variables** (backend):

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | `sqlite:////data/crm.db` (Railway persistent volume) |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | Frontend Railway domain (for CORS) |

**Frontend** is deployed from the `frontend/` root directory:
- Build command: `npm run build`
- Start command: `npm run start` (`serve --single --listen $PORT dist`)
- Environment variable: `VITE_API_BASE_URL=https://datastraw-crm-production-02d7.up.railway.app/api`

> **Note**: Swagger UI (`/docs`) and OpenAPI (`/openapi.json`) are disabled when `ENVIRONMENT=production`.

---

## AI-Assisted Development

AI tools were used as supporting tools throughout development for brainstorming, debugging, documentation, and exploring implementation approaches. I reviewed, adapted, tested, and integrated the resulting code and was responsible for the final application decisions and implementation.

AI assistance was used for areas such as:

- Exploring CRUD patterns
- Debugging and refining UTC timestamp handling and Asia/Kolkata display
- Exploring React component structure and UI improvements
- Troubleshooting SQLite persistence
- Assisting with test cases and debugging failing scenarios
- Reviewing and simplifying code during final cleanup
