const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.details?.[0]?.message ? `${data.error}: ${data.details[0].field} ${data.details[0].message}` : data.error || 'Request failed');
  return data;
}

export const createOrder = (payload, idempotencyKey) =>
  request('/api/payments/create-order', { method: 'POST', body: JSON.stringify(payload), headers: { 'Idempotency-Key': idempotencyKey } });

export const verifyPayment = (payload) =>
  request('/api/payments/verify', { method: 'POST', body: JSON.stringify(payload) });

export const getStatus = (orderId) => request(`/api/payments/status/${orderId}`);
