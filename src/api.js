const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  createBatches: (text) =>
    request('create-batches', { method: 'POST', body: JSON.stringify({ text }) }),
  getBatches: () => request('get-batches'),
  sendBatch: (batch_id) =>
    request('send-batch', { method: 'POST', body: JSON.stringify({ batch_id }) }),
  getDashboard: () => request('get-dashboard'),
};
