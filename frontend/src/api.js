/**
 * Aqaar AI Concierge - API Client
 * All calls use the deployed Aqaar backend unless VITE_API_BASE_URL overrides it.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://aqaar-ai-concierge.onrender.com";

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }
  const url = body && method === 'GET'
    ? `${API_BASE_URL}${path}?${new URLSearchParams(body)}`
    : `${API_BASE_URL}${path}`;

  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${method} ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function chat({ message, sessionId, intent = 'buy' }) {
  return request('POST', '/chat', { message, session_id: sessionId, intent });
}

export async function recommend({ intent = 'buy', filters = {}, limit = 6 } = {}) {
  return request('POST', '/recommend', { intent, filters, limit });
}

export async function qualify(lead) {
  return request('POST', '/qualify', lead);
}

export async function leadScore(lead) {
  return request('POST', '/lead-score', lead);
}

export async function getDashboard() {
  return request('GET', '/dashboard');
}

export async function search({ query, limit = 6 } = {}) {
  return request('POST', '/search', { query, limit });
}
