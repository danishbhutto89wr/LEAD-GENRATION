import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function DashboardTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const result = await api.getDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <p className="status-line error">{error}</p>;
  if (!data) return <p className="muted">Loading dashboard…</p>;

  const { stats, leads } = data;

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Total leads" value={stats.total} />
        <StatCard label="Sent" value={stats.sent} accent="sent" />
        <StatCard label="Opened" value={stats.opened} accent="opened" />
        <StatCard label="Clicked" value={stats.clicked} accent="clicked" />
        <StatCard label="Failed" value={stats.failed} accent="failed" />
      </div>

      <section className="card">
        <h2>All leads</h2>
        <table className="lead-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Website</th>
              <th>Status</th>
              <th>Opens</th>
              <th>Clicks</th>
              <th>Sent at</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.email}</td>
                <td>{lead.website}</td>
                <td>
                  <span className={`badge badge-${lead.status}`}>{lead.status}</span>
                </td>
                <td>{lead.open_count || 0}</td>
                <td>{lead.click_count || 0}</td>
                <td>{lead.sent_at ? new Date(lead.sent_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent ? `stat-${accent}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
