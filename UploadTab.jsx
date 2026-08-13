import React, { useState } from 'react';
import { api } from '../api.js';

export default function UploadTab({ onDone }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const result = await api.createBatches(text);
      setStatus({
        type: 'success',
        message: `Created ${result.createdBatches} batch(es) from ${result.totalLeads} lead(s).`,
      });
      setText('');
      setTimeout(onDone, 900);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Paste your leads</h2>
      <p className="card-subtitle">
        One lead per line, format: <code>email, website</code>
      </p>

      <textarea
        className="upload-textarea"
        placeholder={'jane@acme.com, acme.com\njohn@example.com, example.com'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
      />

      <div className="card-actions">
        <button className="btn-primary" onClick={handleSubmit} disabled={loading || !text.trim()}>
          {loading ? 'Creating batches…' : 'Split into batches of 5'}
        </button>
      </div>

      {status && <p className={`status-line ${status.type}`}>{status.message}</p>}
    </section>
  );
}
