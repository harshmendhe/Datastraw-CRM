import React from 'react';
import { Ticket, AlertCircle, Clock, CheckCircle2, Flame } from 'lucide-react';
export default function StatsSummary({ stats }) {
  return (
    <section className="stats-grid">
      <div className="stat-card">
        <div className="stat-info">
          <h4>Total Tickets</h4>
          <div className="stat-value">{stats.total_tickets ?? 0}</div>
        </div>
        <div className="stat-icon indigo">
          <Ticket size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <h4>Open</h4>
          <div className="stat-value">{stats.open_tickets ?? 0}</div>
        </div>
        <div className="stat-icon sky">
          <AlertCircle size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <h4>In Progress</h4>
          <div className="stat-value">{stats.in_progress_tickets ?? 0}</div>
        </div>
        <div className="stat-icon amber">
          <Clock size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <h4>Closed</h4>
          <div className="stat-value">{stats.closed_tickets ?? 0}</div>
        </div>
        <div className="stat-icon emerald">
          <CheckCircle2 size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <h4>Urgent</h4>
          <div className="stat-value" style={{ color: stats.urgent_tickets > 0 ? '#dc2626' : 'inherit' }}>
            {stats.urgent_tickets ?? 0}
          </div>
        </div>
        <div className="stat-icon rose">
          <Flame size={24} />
        </div>
      </div>
    </section>
  );
}
