import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsSummary from './components/StatsSummary';
import TicketsView from './components/TicketsView';
import CreateTicketModal from './components/CreateTicketModal';
import TicketDetailModal from './components/TicketDetailModal';
import CustomerHistoryModal from './components/CustomerHistoryModal';
import {
  fetchStats,
  fetchTickets,
  fetchCustomerTickets,
  fetchTicket,
  createTicket,
  updateTicket,
} from './api';

export default function App() {
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    closed_tickets: 0,
    urgent_tickets: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [backendError, setBackendError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [loadingCustomerTickets, setLoadingCustomerTickets] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.warn('Backend stats error:', err.message);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setBackendError(null);
    try {
      const data = await fetchTickets(search, statusFilter);
      setTickets(data);
    } catch {
      setBackendError(
        'Unable to connect to the FastAPI Support backend. Please verify the backend is running.'
      );
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setIsCustomerHistoryOpen(true);
    setLoadingCustomerTickets(true);
    try {
      const tickets = await fetchCustomerTickets(customer.email);
      setCustomerTickets(tickets);
    } catch (err) {
      alert('Error fetching customer tickets: ' + err.message);
      setCustomerTickets([]);
    } finally {
      setLoadingCustomerTickets(false);
    }
  };

  const handleSelectTicket = async (ticketId) => {
    try {
      const ticket = await fetchTicket(ticketId);
      setSelectedTicketDetail(ticket);
      setIsDetailModalOpen(true);
    } catch (err) {
      alert('Error fetching ticket details: ' + err.message);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    const created = await createTicket(ticketData);
    await loadTickets();
    await loadStats();
    return created;
  };

  const handleUpdateTicket = async (ticketId, updateData) => {
    const updated = await updateTicket(ticketId, updateData);
    setSelectedTicketDetail(updated);
    await loadTickets();
    await loadStats();
    // If customer history is open, also refresh customer tickets
    if (selectedCustomer && selectedCustomer.email) {
      fetchCustomerTickets(selectedCustomer.email)
        .then((t) => setCustomerTickets(t))
        .catch(() => { });
    }
    return updated;
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-wrapper">
        <StatsSummary stats={stats} />

        {backendError && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#b91c1c',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{backendError}</span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => {
                loadStats();
                loadTickets();
              }}
            >
              Retry Connection
            </button>
          </div>
        )}

        <TicketsView
          tickets={tickets}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onSelectTicket={handleSelectTicket}
          onSelectCustomer={handleSelectCustomer}
        />
      </main>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTicket}
      />

      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTicketDetail(null);
        }}
        ticket={selectedTicketDetail}
        onUpdate={handleUpdateTicket}
      />

      <CustomerHistoryModal
        isOpen={isCustomerHistoryOpen}
        onClose={() => {
          setIsCustomerHistoryOpen(false);
          setSelectedCustomer(null);
          setCustomerTickets([]);
        }}
        customer={selectedCustomer}
        tickets={customerTickets}
        loading={loadingCustomerTickets}
        onSelectTicket={handleSelectTicket}
      />
    </div>
  );
}
