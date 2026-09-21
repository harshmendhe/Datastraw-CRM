const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error("Failed to fetch ticket stats");
  return res.json();
}

export async function fetchTickets(search = "", status = "", customerEmail = "") {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append("search", search.trim());
  if (status && status !== "All") params.append("status", status);
  if (customerEmail && customerEmail.trim()) params.append("customer_email", customerEmail.trim());

  const url = `${API_BASE}/tickets${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function fetchCustomerTickets(customerEmail) {
  return fetchTickets("", "", customerEmail);
}

export async function fetchTicket(ticketId) {
  const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(ticketId)}`);
  if (!res.ok) throw new Error(`Failed to fetch ticket ${ticketId}`);
  return res.json();
}

export async function createTicket(ticketData) {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticketData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create ticket");
  }
  return res.json();
}

export async function updateTicket(ticketId, updateData) {
  // updateData shape: { status, priority, notes }
  const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(ticketId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update ticket ${ticketId}`);
  }
  return res.json();
}
