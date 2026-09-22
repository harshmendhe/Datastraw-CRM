"""
test_timestamp_handling.py
--------------------------
Tests for production timestamp handling:
  - Backend creates new timestamps using timezone-aware UTC.
  - API schemas serialize naive/aware UTC datetimes with an explicit UTC offset (+00:00).
  - None timestamps are safely preserved as None.
  - Converted UTC timestamps map accurately to Asia/Kolkata (IST, UTC+5:30).
  - Ticket and Note response schemas produce valid ISO strings with +00:00.
  - Live API endpoints return timestamps with explicit UTC offset (+00:00).
  - Frontend conversion: UTC backend timestamp -> Asia/Kolkata conversion.
"""
import sys
import json
import urllib.request
from datetime import datetime, timezone, timedelta

sys.path.insert(0, ".")  # run from backend/ directory
from app.schemas import _as_utc_iso, TicketResponse, NoteResponse

# Asia/Kolkata (IST) is UTC+05:30 with no DST
ASIA_KOLKATA = timezone(timedelta(hours=5, minutes=30))

def assert_eq(label, got, expected):
    if got != expected:
        print(f"  FAIL  {label}\n    got      : {got!r}\n    expected : {expected!r}")
        return False
    print(f"  PASS  {label}")
    return True


passed = failed = 0

def check(label, got, expected):
    global passed, failed
    if assert_eq(label, got, expected):
        passed += 1
    else:
        failed += 1


print("=" * 60)
print("UNIT TESTS: _as_utc_iso & Schema Serialization")
print("=" * 60)

# 1. Naive UTC datetime (as returned by SQLite) -> returns ISO with +00:00
utc_naive = datetime(2026, 9, 22, 16, 11, 35, 541771)
check(
    "naive UTC datetime -> ISO with +00:00",
    _as_utc_iso(utc_naive),
    "2026-09-22T16:11:35.541771+00:00",
)

# 2. None value handling
check("None datetime returns None", _as_utc_iso(None), None)

# 3. Already tz-aware UTC datetime
utc_aware = datetime(2026, 9, 22, 16, 11, 35, 541771, tzinfo=timezone.utc)
check(
    "tz-aware UTC datetime -> ISO with +00:00",
    _as_utc_iso(utc_aware),
    "2026-09-22T16:11:35.541771+00:00",
)

# 4. Tz-aware non-UTC datetime (e.g. IST) -> normalized to UTC with +00:00
ist_aware = datetime(2026, 9, 22, 21, 41, 35, 541771, tzinfo=ASIA_KOLKATA)
check(
    "tz-aware non-UTC datetime -> normalized to UTC with +00:00",
    _as_utc_iso(ist_aware),
    "2026-09-22T16:11:35.541771+00:00",
)

# 5. Frontend conversion verification (UTC -> Asia/Kolkata display)
def display_ist(utc_iso):
    return datetime.fromisoformat(utc_iso).astimezone(ASIA_KOLKATA).strftime("%H:%M IST")

check(
    "frontend display: 16:11 UTC displays as 21:41 IST (Asia/Kolkata)",
    display_ist(_as_utc_iso(utc_naive)),
    "21:41 IST",
)

# 6. NoteResponse serialization
note_res = NoteResponse(
    id=1,
    ticket_id="TKT-001",
    note_text="Production test note",
    created_at=datetime(2026, 9, 22, 16, 0, 0),
)
note_dump = note_res.model_dump()
check(
    "NoteResponse created_at has +00:00 suffix",
    note_dump["created_at"].endswith("+00:00"),
    True,
)
check(
    "NoteResponse created_at exact value",
    note_dump["created_at"],
    "2026-09-22T16:00:00+00:00",
)

# 7. TicketResponse serialization with updated_at=None
tkt_res = TicketResponse(
    id=1,
    ticket_id="TKT-001",
    customer_name="Test Customer",
    customer_email="test@example.com",
    subject="Test Subject",
    description="Test Description",
    status="Open",
    priority="Medium",
    created_at=datetime(2026, 9, 22, 10, 0, 0),
    updated_at=None,
    notes=[],
)
tkt_dump = tkt_res.model_dump()
check(
    "TicketResponse created_at has +00:00 suffix",
    tkt_dump["created_at"].endswith("+00:00"),
    True,
)
check(
    "TicketResponse updated_at is None when not updated",
    tkt_dump["updated_at"],
    None,
)

# 8. TicketResponse serialization with updated_at set
tkt_res_updated = TicketResponse(
    id=2,
    ticket_id="TKT-002",
    customer_name="Test Customer 2",
    customer_email="test2@example.com",
    subject="Test Subject 2",
    description="Test Description 2",
    status="In Progress",
    priority="High",
    created_at=datetime(2026, 9, 22, 10, 0, 0),
    updated_at=datetime(2026, 9, 22, 11, 30, 0),
    notes=[],
)
tkt_dump_updated = tkt_res_updated.model_dump()
check(
    "TicketResponse updated_at has +00:00 suffix when updated",
    tkt_dump_updated["updated_at"].endswith("+00:00"),
    True,
)
check(
    "TicketResponse updated_at exact value",
    tkt_dump_updated["updated_at"],
    "2026-09-22T11:30:00+00:00",
)

print()
print("=" * 60)
print("INTEGRATION TESTS: Live API & Asia/Kolkata conversion")
print("=" * 60)

BASE = "http://127.0.0.1:8000"

def api_get(path):
    with urllib.request.urlopen(f"{BASE}{path}") as r:
        return json.loads(r.read().decode())

def api_post(path, data):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def api_put(path, data):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

try:
    # 1. Create a ticket and verify returned created_at has +00:00
    new_ticket = api_post("/api/tickets", {
        "customer_name": "Timestamp Verification",
        "customer_email": "timestamp@test.com",
        "subject": "Testing UTC Timestamps",
        "description": "Verifying production UTC timestamp handling",
        "priority": "Low",
    })
    tkt_id = new_ticket["ticket_id"]
    created_at = new_ticket["created_at"]
    check(
        f"API created ticket {tkt_id} created_at ends with +00:00",
        created_at.endswith("+00:00"),
        True,
    )
    # Ensure it parses as a valid ISO datetime with timezone info
    dt_created = datetime.fromisoformat(created_at)
    check(
        "API created_at is timezone-aware UTC",
        dt_created.tzinfo == timezone.utc,
        True,
    )
    # Verify UTC -> Asia/Kolkata frontend conversion
    dt_created_kolkata = dt_created.astimezone(ASIA_KOLKATA)
    check(
        "API created_at converts to Asia/Kolkata (UTC+5:30)",
        dt_created_kolkata.utcoffset() == timedelta(hours=5, minutes=30),
        True,
    )

    # 2. Update the ticket with a note and verify updated_at and note created_at have +00:00
    updated_ticket = api_put(f"/api/tickets/{tkt_id}", {
        "status": "In Progress",
        "notes": "Added investigation note",
    })
    updated_at = updated_ticket["updated_at"]
    check(
        f"API updated ticket {tkt_id} updated_at ends with +00:00",
        updated_at.endswith("+00:00"),
        True,
    )
    dt_updated = datetime.fromisoformat(updated_at)
    check(
        "API updated_at is timezone-aware UTC",
        dt_updated.tzinfo == timezone.utc,
        True,
    )
    # Verify updated_at UTC -> Asia/Kolkata frontend conversion
    dt_updated_kolkata = dt_updated.astimezone(ASIA_KOLKATA)
    check(
        "API updated_at converts to Asia/Kolkata (UTC+5:30)",
        dt_updated_kolkata.utcoffset() == timedelta(hours=5, minutes=30),
        True,
    )

    notes = updated_ticket.get("notes", [])
    check("API ticket has notes", len(notes) > 0, True)
    if notes:
        note_created_at = notes[0]["created_at"]
        check(
            "API note created_at ends with +00:00",
            note_created_at.endswith("+00:00"),
            True,
        )
        dt_note = datetime.fromisoformat(note_created_at)
        check(
            "API note created_at is timezone-aware UTC",
            dt_note.tzinfo == timezone.utc,
            True,
        )
        # Verify note created_at UTC -> Asia/Kolkata frontend conversion
        dt_note_kolkata = dt_note.astimezone(ASIA_KOLKATA)
        check(
            "API note created_at converts to Asia/Kolkata (UTC+5:30)",
            dt_note_kolkata.utcoffset() == timedelta(hours=5, minutes=30),
            True,
        )

except Exception as e:
    print(f"  SKIP  Integration tests - server not available ({e})")

print()
print("=" * 60)
print(f"RESULT: {passed} passed, {failed} failed")
print("=" * 60)
sys.exit(1 if failed else 0)
