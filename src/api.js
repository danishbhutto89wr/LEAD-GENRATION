const BASE = '/api';
const STORAGE_KEY = 'lg_app_password';

export function getStoredPassword() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredPassword(password) {
  try {
    localStorage.setItem(STORAGE_KEY, password);
  } catch {
    // ignore
  }
}

export function clearStoredPassword() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getStoredPassword(),
    },
    ...options,
  });

  if (res.status === 401) {
    clearStoredPassword();
    const err = new Error('Session expired — please enter the password again.');
    err.unauthorized = true;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  verifyPassword: (password) =>
    fetch(`${BASE}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Incorrect password.');
      return data;
    }),
  createBatches: (text) =>
    request('create-batches', { method: 'POST', body: JSON.stringify({ text }) }),
  getBatches: () => request('get-batches'),
  sendBatch: (batch_id) =>
    request('send-batch-background', { method: 'POST', body: JSON.stringify({ batch_id }) }),
  getDashboard: () => request('get-dashboard'),
};
