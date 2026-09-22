import React from 'react';
import { X, User, Mail, Calendar, ExternalLink, Inbox } from 'lucide-react';
import { formatDate } from '../utils/dateTime';

export default function CustomerHistoryModal({
  isOpen,
  onClose,
  customer,
  tickets = [],
  loading = false,
  onSelectTicket,
}) {
  if (!isOpen || !customer) return null;

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'status-open';
      case 'in progress':
        return 'status-in-progress';
      case 'closed':
        return 'status-closed';
      default:
        return 'status-open';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: '#eff6ff',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Customer Ticket History
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All previous and current tickets
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Customer Profile Card */}
          <div
            style={{
              background: 'var(--bg-main)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {customer.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  marginTop: '2px',
                }}
              >
                <Mail size={13} color="var(--text-muted)" />
                <a
                  href={`mailto:${customer.email}`}
                  style={{ color: 'var(--primary)', textDecoration: 'none' }}
                >
                  {customer.email}
                </a>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.825rem',
                background: 'var(--bg-surface)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Total Tickets:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{tickets.length}</strong>
            </div>
          </div>

          {/* Tickets List */}
          <div style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginBottom: '0.6rem',
              }}
            >
              All Tickets ({tickets.length})
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading customer tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)',
                }}
              >
                <Inbox size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  No tickets found for this customer
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tickets.map((t) => (
                  <div
                    key={t.ticket_id}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <span className="ticket-id-badge">
                          {t.ticket_id}
                        </span>
                        <span className={`status-badge ${getStatusClass(t.status)}`}>
                          {t.status}
                        </span>
                        <span className={`priority-badge ${getPriorityClass(t.priority)}`}>
                          {t.priority || 'Medium'}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {t.subject}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Calendar size={12} />
                        <span>Created: {formatDate(t.created_at)}</span>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          onClose();
                          if (onSelectTicket) onSelectTicket(t.ticket_id);
                        }}
                      >
                        <span>Manage</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Back to Tickets
          </button>
        </div>
      </div>
    </div>
  );
}
