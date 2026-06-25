/**
 * Aqaar AI Concierge — API Client
 * All calls proxy through Vite's /api → localhost:3000
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

/**
 * POST /chat — multi-turn concierge conversation
 * @param {string} message - user message
 * @param {string} sessionId - conversation session ID
 * @param {string} intent - buy|rent|invest|commercial
 */
export async function chat({ message, sessionId, intent = 'buy' }) {
  return request('POST', '/chat', { message, session_id: sessionId, intent });
}

/**
 * POST /recommend — KB-validated property recommendations
 * @param {string} intent - buy|rent|invest|commercial
 * @param {object} filters - optional filters (bedrooms, budget, location)
 */
export async function recommend({ intent = 'buy', filters = {}, limit = 6 } = {}) {
  return request('POST', '/recommend', { intent, filters, limit });
}

/**
 * POST /qualify — buyer qualification tree
 * @param {object} lead - lead data (name, phone, email, intent, budget, etc.)
 */
export async function qualify(lead) {
  return request('POST', '/qualify', lead);
}

/**
 * POST /lead-score — score a lead
 * @param {object} lead - lead data
 */
export async function leadScore(lead) {
  return request('POST', '/lead-score', lead);
}

/**
 * GET /dashboard — intelligence metrics and lead data
 */
export async function getDashboard() {
  return request('GET', '/dashboard');
}

/**
 * POST /search — KB/RAG retrieval
 * @param {string} query - search query
 * @param {number} limit - max results
 */
export async function search({ query, limit = 6 } = {}) {
  return request('POST', '/search', { query, limit });
}
