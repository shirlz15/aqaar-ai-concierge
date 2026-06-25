/**
 * Aqaar AI Concierge - API Client
 * All calls proxy through Vite's /api route to the local Aqaar backend.
 */

const BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }
  const url = body && method === 'GET'
    ? `${BASE}${path}?${new URLSearchParams(body)}`
    : `${BASE}${path}`;

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
