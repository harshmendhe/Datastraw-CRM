import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export default function CreateTicketModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    priority: 'Medium',
    assigned_to: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(formData);
      setFormData({
        customer_name: '',
        customer_email: '',
        subject: '',
        description: '',
        priority: 'Medium',
        assigned_to: '',
      });
      onClose();
    } catch (err) {
      alert('Error creating ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Support Ticket</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Alice Rivera"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Customer Email *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="alice@example.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Issue Title / Subject *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Brief summary of the issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing &amp; Payments">Billing &amp; Payments</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                rows="4"
                required
                className="form-textarea"
                placeholder="What happened? Steps to reproduce, error codes, logs..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={15} />
              <span>{submitting ? 'Submitting...' : 'Create Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
