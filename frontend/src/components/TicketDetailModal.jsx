import React, { useState, useEffect } from 'react';
import { X, Mail, Clock, MessageSquare, Plus, Check } from 'lucide-react';

export default function TicketDetailModal({ isOpen, onClose, ticket, onUpdate }) {
  const [status, setStatus] = useState('Open');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showUpdatedPopup, setShowUpdatedPopup] = useState(false);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status || 'Open');
      setPriority(ticket.priority || 'Medium');
      setAssignedTo(ticket.assigned_to || '');
      setNewNote('');
      setShowUpdatedPopup(false);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(ticket.ticket_id, {
        status,
        priority,
        assigned_to: assignedTo || null,
        notes: newNote.trim() || undefined,
      });
      setNewNote('');
      setShowUpdatedPopup(true);
      setTimeout(() => setShowUpdatedPopup(false), 2500);
    } catch (err) {
      alert('Error updating ticket: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const safeParseDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const str = String(val).trim();
    if (!str) return null;
    const normalized = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (isoString) => {
    const d = safeParseDate(isoString);
    if (!d) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        {showUpdatedPopup && (
          <div className="non-blocking-toast">
            <Check size={16} />
            <span>Updated</span>
          </div>
        )}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="ticket-id-badge" style={{ fontSize: '0.85rem' }}>
              {ticket.ticket_id}
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Ticket Details
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Title & Customer Information */}
            <div
              style={{
                background: 'var(--bg-main)',
                padding: '1.1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {ticket.subject}
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  <strong>Customer:</strong> {ticket.customer_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} color="var(--text-muted)" />
                  <a href={`mailto:${ticket.customer_email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    {ticket.customer_email}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="var(--text-muted)" />
                  <span><strong>Created:</strong> {formatDate(ticket.created_at)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="var(--text-muted)" />
                  <span><strong>Updated:</strong> {ticket.updated_at ? formatDate(ticket.updated_at) : <span style={{ color: 'var(--text-muted)' }}>Not yet updated</span>}</span>
                </div>
                <div>
                  <strong>Assigned To:</strong>{' '}
                  {ticket.assigned_to ? (
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{ticket.assigned_to}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Customer Description
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Quick Status, Priority & Assignment Controls */}
            <div className="form-row">
              <div className="form-group">
                <label>Ticket Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ticket Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned To</label>
                <select
                  className="form-select"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing & Payments">Billing & Payments</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
            </div>

            {/* Internal Notes History */}
            <div style={{ marginTop: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.6rem',
                }}
              >
                <MessageSquare size={14} />
                <span>Internal Discussion Notes ({ticket.notes?.length || 0})</span>
              </div>

              {(!ticket.notes || ticket.notes.length === 0) ? (
                <div
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)',
                  }}
                >
                  No internal notes yet. Use the field below to add an update.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {ticket.notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.3rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Support Team</span>
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                        {note.note_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Internal Note Field */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Add Internal Note</label>
              <textarea
                rows="2"
                className="form-textarea"
                placeholder="Type note to append upon update (e.g. customer replied, waiting for engineering review)..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Check size={16} />
              <span>{saving ? 'Updating...' : 'Update Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
