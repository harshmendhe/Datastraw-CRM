# Datastraw Support Ticket CRM

A modern, high-performance Customer Support Ticket CRM built for support teams to triage, manage, and resolve customer issues with real-time status tracking, priority prioritization, and internal discussion notes.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy ORM, Pydantic, Uvicorn
- **Database**: SQLite (embedded, auto-created tables; demo seed data gated behind SEED_DEMO_DATA=true for local testing)
- **Frontend**: React 19, Vite, Lucide Icons, Pure CSS Design System
- **Deployment Ready**: Procfile, environment-aware API URL, Railway & Cloud ready

---

## 📁 Project Structure

```
Datastraw CRM/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Package initializer
│   │   ├── database.py          # SQLite connection and session management
│   │   ├── models.py            # Ticket and Note SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas (TicketCreate, TicketUpdate, etc.)
│   │   ├── crud.py              # Sequential ticket ID generation (TKT-001, TKT-002, etc.), search, filter, notes logic
│   │   └── main.py              # FastAPI endpoints & CORS
│   ├── .env.example             # Backend environment template
│   ├── Procfile                 # Railway / production deployment process
│   ├── requirements.txt         # Backend Python dependencies
│   ├── test_api.py              # Automated end-to-end API test suite
│   ├── test_timestamp_handling.py # UTC/Asia:Kolkata timestamp tests
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg          # Application favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Support CRM branding & header
│   │   │   ├── StatsSummary.jsx      # KPI summary (Total, Open, In Progress, Closed, Urgent)
│   │   │   ├── TicketsView.jsx       # Real-time search, status filter & tickets table
│   │   │   ├── CreateTicketModal.jsx # New ticket submission modal
│   │   │   ├── TicketDetailModal.jsx # Ticket detail view, status/priority edit, discussion notes
│   │   │   └── CustomerHistoryModal.jsx # Customer historical tickets modal
│   │   ├── utils/
│   │   │   ├── dateTime.js           # Shared UTC to Asia/Kolkata date/time formatting
│   │   │   └── statusBadges.js       # Shared status & priority badge CSS helpers
│   │   ├── api.js               # API client with VITE_API_BASE_URL support
│   │   ├── App.jsx              # Main application orchestration & state
│   │   ├── index.css            # Support desk design system
│   │   └── main.jsx             # React entry point
│   ├── .env.example             # Production API URL template
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── README.md
└── .gitignore
```

---

## 🚀 Local Quickstart

### 1. Backend (FastAPI + SQLite)

Open a terminal in the project root:

```bash
# Navigate to backend
cd backend

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```

- **API Root**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

*Note: On startup, the database automatically initializes tables in `crm.db`. Demo seed data is never seeded in production and requires `SEED_DEMO_DATA=true` in local development.*

### 2. Run Automated API Verification

To verify that all backend endpoints, auto ID generation, notes appending, and search/filter work:

```bash
cd backend
python test_api.py
```

### 3. Frontend (React + Vite)

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

- **Support CRM Web Application**: [http://localhost:5173](http://localhost:5173)

---

## 🔌 API Endpoints Specification

### 1. `GET /api/stats` (Optional / KPI)
Returns summary counts for dashboard metrics.
**Response**:
```json
{
  "total_tickets": 5,
  "open_tickets": 2,
  "in_progress_tickets": 2,
  "closed_tickets": 1,
  "urgent_tickets": 1
}
```

### 2. `GET /api/tickets`
List tickets with optional query parameters.
- `?status=Open` (Filter: `All`, `Open`, `In Progress`, `Closed`)
- `?search=query` (Live search across Ticket ID, customer name, email, subject, description)

### 3. `POST /api/tickets`
Creates a ticket with auto-generated sequential ID (`TKT-001`, `TKT-002`, ...).
**Request Body**:
```json
{
  "customer_name": "Alice Rivera",
  "customer_email": "alice@example.com",
  "subject": "Webhook failing with 401",
  "description": "Payloads are failing authentication after credential rotation.",
  "priority": "Urgent"
}
```

### 4. `GET /api/tickets/{ticket_id}`
Retrieve a specific ticket and its complete notes thread by ticket identifier (e.g., `/api/tickets/TKT-001`).
**Response**:
```json
{
  "id": 1,
  "ticket_id": "TKT-001",
  "customer_name": "Alice Rivera",
  "customer_email": "alice@example.com",
  "subject": "Webhook failing with 401",
  "description": "Payloads are failing...",
  "status": "In Progress",
  "priority": "Urgent",
  "created_at": "2026-09-18T14:30:00Z",
  "updated_at": "2026-09-18T14:35:00Z",
  "notes": [
    {
      "id": 1,
      "ticket_id": "TKT-001",
      "note_text": "Customer updated OAuth secrets.",
      "created_at": "2026-09-18T14:35:00Z"
    }
  ]
}
```

### 5. `PUT /api/tickets/{ticket_id}`
Updates ticket status, priority, and optionally appends an internal note via the `notes` field.
**Request Body**:
```json
{
  "status": "In Progress",
  "priority": "High",
  "notes": "Assigned engineer to investigate log traces."
}
```

---

## 🌐 Deployment Verification Guide

### Phase 1: Deploy FastAPI Backend to Railway

1. **Create Railway Project**:
   - Log in to [Railway.app](https://railway.app).
   - Click **New Project** → **Deploy from GitHub repo** (or use Railway CLI `railway init`).
   - Select the `backend` folder as the Root Directory (or deploy from repository root with Root Directory set to `backend`).

2. **Configure Environment & Start Command**:
   - The repository includes [`backend/Procfile`](file:///c:/Users/asus/Downloads/Datastraw%20CRM/backend/Procfile):
     ```
     web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
     ```
   - Railway will automatically detect Python and install packages from `requirements.txt`.
   - In Railway **Settings** → **Networking**, click **Generate Domain** (e.g. `https://datastraw-backend-production.up.railway.app`).

3. **Verify Public API URL**:
   - Open `https://<your-railway-domain>/docs` in your browser.
   - Verify that Swagger UI loads and `/api/tickets` returns `HTTP 200`.

---

### Phase 2: Deploy Frontend & Configure API URL

1. **Configure API Base URL**:
   - The frontend API client in [`frontend/src/api.js`](file:///c:/Users/asus/Downloads/Datastraw%20CRM/frontend/src/api.js) automatically reads `import.meta.env.VITE_API_BASE_URL`.
   - Set this environment variable in your frontend hosting provider (Vercel, Netlify, or Railway):
     ```env
     VITE_API_BASE_URL=https://<your-railway-domain>/api
     ```

2. **Deploy to Vercel / Netlify**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_API_BASE_URL = https://<your-railway-domain>/api`

---

### Phase 3: End-to-End Verification on Deployed App

- [x] **Dashboard KPI**: Verify total, open, in progress, closed, and urgent ticket counts display accurately.
- [x] **Create Ticket**: Submit a new ticket through the modal; confirm it receives a formatted `TKT-xxx` identifier.
- [x] **Live Search**: Type into the search bar and verify instantaneous filtering across ticket ID, customer name, email, and subject.
- [x] **Status Filter**: Toggle between `All`, `Open`, `In Progress`, and `Closed` to confirm filtering.
- [x] **Detail & Notes**: Click a ticket row, change its status/priority, write an internal note, and click **Update Ticket**. Confirm the note is appended to the discussion thread and the status updates across the UI.
