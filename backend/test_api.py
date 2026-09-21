import urllib.request
import json
import time
import subprocess
import sys

def main():
    print("Starting uvicorn test server...")
    proc = subprocess.Popen(
        ['.\\venv\\Scripts\\uvicorn.exe', 'app.main:app', '--port', '8000'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(2.5)

    try:
        # 1. GET /api/stats
        stats_res = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/stats').read().decode('utf-8'))
        print('1. GET /api/stats:', stats_res)
        assert 'total_tickets' in stats_res, "Missing total_tickets in stats"

        # 2. GET /api/tickets
        tickets_list = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/tickets').read().decode('utf-8'))
        print(f'2. GET /api/tickets returned {len(tickets_list)} tickets')
        assert len(tickets_list) >= 1, "Expected seeded tickets"

        # 3. POST /api/tickets (dynamic ID)
        post_payload = json.dumps({
            'customer_name': 'Samantha Reed',
            'customer_email': 'samantha@vertexai.io',
            'subject': 'Database connection pool timeout in EU cluster',
            'description': 'Intermittent 504 gateway errors when querying aggregated customer analytics.',
            'priority': 'Urgent'
        }).encode('utf-8')

        req = urllib.request.Request(
            'http://127.0.0.1:8000/api/tickets',
            data=post_payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        created_ticket = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        captured_id = created_ticket['ticket_id']
        print(f'3. POST /api/tickets created ticket with dynamic ID: {captured_id}')
        assert captured_id.startswith('TKT-'), f"Invalid ticket_id: {captured_id}"

        # 4. GET /api/tickets/{captured_id}
        detail_res = json.loads(urllib.request.urlopen(f'http://127.0.0.1:8000/api/tickets/{captured_id}').read().decode('utf-8'))
        cust_name = detail_res['customer_name']
        print(f'4. GET /api/tickets/{captured_id} retrieved successfully: customer={cust_name}')
        assert detail_res['ticket_id'] == captured_id

        # 5. PUT /api/tickets/{captured_id} with notes field
        put_payload = json.dumps({
            'status': 'In Progress',
            'priority': 'Urgent',
            'notes': 'Diagnosed connection leak in worker thread pool. Patch deployed to staging.'
        }).encode('utf-8')

        put_req = urllib.request.Request(
            f'http://127.0.0.1:8000/api/tickets/{captured_id}',
            data=put_payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        updated_ticket = json.loads(urllib.request.urlopen(put_req).read().decode('utf-8'))
        print(f'5. PUT /api/tickets/{captured_id} updated status={updated_ticket["status"]}, notes count={len(updated_ticket["notes"])}')
        assert updated_ticket['status'] == 'In Progress'
        assert len(updated_ticket['notes']) >= 1
        assert updated_ticket.get('updated_at') is not None
        print(f'   -> Ticket updated_at timestamp: {updated_ticket["updated_at"]}')

        # 6. Search verification
        search_res = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/tickets?search=vertexai').read().decode('utf-8'))
        print(f'6. GET /api/tickets?search=vertexai matched {len(search_res)} ticket(s)')
        assert any(t['ticket_id'] == captured_id for t in search_res)

        # 7. Status filtering verification
        open_res = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/tickets?status=Open').read().decode('utf-8'))
        print(f'7. GET /api/tickets?status=Open matched {len(open_res)} ticket(s)')
        assert all(t['status'].lower() == 'open' for t in open_res)

        # 8. Customer ticket history verification (customer_email filter)
        cust_history = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/tickets?customer_email=samantha@vertexai.io').read().decode('utf-8'))
        print(f'8. Customer history for samantha@vertexai.io returned {len(cust_history)} ticket(s)')
        assert len(cust_history) >= 1
        assert all(t['customer_email'].lower() == 'samantha@vertexai.io' for t in cust_history)
        print('   -> Verified customer ticket history returns all customer tickets')

        print('\n======================================================')
        print('>>> ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! <<<')
        print('======================================================\n')
    finally:
        proc.terminate()

if __name__ == '__main__':
    main()
