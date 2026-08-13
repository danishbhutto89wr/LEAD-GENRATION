import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_LABEL = {
  pending: 'Pending',
  sending: 'Sending…',
  sent: 'Sent',
  partial: 'Partially sent',
  failed: 'Failed',
};

export default function BatchesTab() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getBatches();
      setBatches(data.batches || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSend = async (batchId) => {
    setSendingId(batchId);
    try {
      await api.sendBatch(batchId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) return <p className="muted">Loading batches…</p>;
  if (error) return <p className="status-line error">{error}</p>;
  if (batches.length === 0) {
    return <p className="muted">No batches yet — upload some leads first.</p>;
  }

  return (
    <div className="batch-list">
      {batches.map((batch) => (
        <section className="card batch-card" key={batch.id}>
          <div className="batch-header">
            <div>
              <h3>Batch #{batch.batch_number}</h3>
              <span className={`badge badge-${batch.status}`}>
                {STATUS_LABEL[batch.status] || batch.status}
              </span>
            </div>
            <button
              className="btn-primary"
              onClick={() => handleSend(batch.id)}
              disabled={sendingId === batch.id || batch.status === 'sending'}
            >
              {sendingId === batch.id ? 'Sending…' : 'Send'}
            </button>
          </div>

          <table className="lead-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Website</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batch.leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.email}</td>
                  <td>{lead.website}</td>
                  <td>
                    <span className={`badge badge-${lead.status}`}>
                      {STATUS_LABEL[lead.status] || lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
