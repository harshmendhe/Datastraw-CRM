import React from 'react';
import { Search, Plus, ExternalLink, Inbox, Clock, Mail } from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateTime';
import { getStatusClass, getPriorityClass } from '../utils/statusBadges';

export default function TicketsView({
  tickets,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onOpenCreateModal,
  onSelectTicket,
  onSelectCustomer,
}) {


  return (
    <div className="tickets-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      <div className="controls-bar">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by ticket ID, customer, email, subject, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="controls-actions">
          <div className="tickets-count-label">
            Showing {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
          </div>
          <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
            <Plus size={16} />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      <div className="table-card">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Inbox size={32} />
            </div>
            <h3>No Support Tickets Found</h3>
            <p>Try adjusting your search criteria or status filter, or submit a new customer ticket.</p>
            <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
              <Plus size={16} />
              <span>Create New Ticket</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <colgroup>
                <col className="col-ticket-id" style={{ width: '100px' }} />
                <col className="col-customer" style={{ width: '190px' }} />
                <col className="col-subject" />
                <col className="col-priority" style={{ width: '110px' }} />
                <col className="col-status" style={{ width: '135px' }} />
                <col className="col-created" style={{ width: '160px' }} />
                <col className="col-updated" style={{ width: '160px' }} />
                <col className="col-actions" style={{ width: '115px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-ticket-id">TICKET ID</th>
                  <th className="col-customer">CUSTOMER</th>
                  <th className="col-subject">SUBJECT</th>
                  <th className="col-priority">PRIORITY</th>
                  <th className="col-status">STATUS</th>
                  <th className="col-created">CREATED DATE &amp; TIME</th>
                  <th className="col-updated">UPDATED DATE &amp; TIME</th>
                  <th className="col-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.ticket_id}
                    className="ticket-row"
                    onClick={() => onSelectTicket(t.ticket_id)}
                  >
                    <td className="col-ticket-id">
                      <span className="ticket-id-badge">{t.ticket_id}</span>
                    </td>
                    <td className="col-customer">
                      <div
                        className="customer-cell"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCustomer) {
                            onSelectCustomer({
                              name: t.customer_name,
                              email: t.customer_email,
                            });
                          }
                        }}
                        title={`Click to view ticket history for ${t.customer_name}`}
                      >
                        <div className="customer-name">{t.customer_name}</div>
                        <div className="customer-email">
                          <Mail size={12} className="customer-email-icon" />
                          <span className="customer-email-text">{t.customer_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="col-subject">
                      <div className="subject-cell">
                        <div className="subject-title" title={t.subject}>
                          {t.subject}
                        </div>
                        <div className="subject-desc" title={t.description}>
                          {t.description}
                        </div>
                      </div>
                    </td>
                    <td className="col-priority">
                      <span className={`priority-badge ${getPriorityClass(t.priority)}`}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${getStatusClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="col-created">
                      <div className="date-time-cell">
                        <div className="date-row">
                          <Clock size={13} className="date-icon" />
                          <span className="date-text">{formatDate(t.created_at)}</span>
                        </div>
                        <div className="time-text">{formatTime(t.created_at)}</div>
                      </div>
                    </td>
                    <td className="col-updated">
                      {t.updated_at ? (
                        <div className="date-time-cell">
                          <div className="date-row">
                            <Clock size={13} className="date-icon" />
                            <span className="date-text">{formatDate(t.updated_at)}</span>
                          </div>
                          <div className="time-text">{formatTime(t.updated_at)}</div>
                        </div>
                      ) : (
                        <span className="date-time-empty"></span>
                      )}
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="btn-manage"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.ticket_id);
                        }}
                      >
                        <span>Manage</span>
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
