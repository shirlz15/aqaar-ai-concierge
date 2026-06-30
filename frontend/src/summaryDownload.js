import { showToast } from './toast.js';
import { state } from './state.js';

function safe(value, fallback = 'Not provided') {
  const text = String(value ?? '').trim();
  return text && !/^unknown$/i.test(text) ? text : fallback;
}

function slug(value) {
  return safe(value, state.sessionId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || state.sessionId;
}

function textFromMessages(messages = []) {
  return messages
    .slice(-10)
    .map((message) => `${message.role === 'user' ? 'User' : 'Aqaar AI'}: ${String(message.content || '').replace(/\s+/g, ' ').trim()}`)
    .filter(Boolean)
    .join('\n');
}

function shortlistedProperties(explicit = []) {
  const fromMessages = state.messages
    .flatMap((message) => Array.isArray(message.cards) ? message.cards : [])
    .map((card) => card.project || card.project_name || card.property_name)
    .filter(Boolean);
  return [...new Set([...(explicit || []), ...fromMessages])];
}

export function downloadLeadSummary(input = {}) {
  const lead = { ...state.lead, ...input };
  const properties = shortlistedProperties(input.shortlisted_properties || (input.propertyName ? [input.propertyName] : []));
  const timestamp = new Date().toISOString();
  const rows = [
    ['Lead name', safe(lead.name)],
    ['Phone', safe(lead.phone)],
    ['Email', safe(lead.email, 'Not provided')],
    ['Intent', safe(lead.intent || state.intent)],
    ['Budget', safe(lead.budget)],
    ['Location', safe(lead.location)],
    ['Preferred property type', safe(lead.property_type || lead.propertyType)],
    ['Shortlisted/saved properties', properties.length ? properties.join(', ') : 'Not provided'],
    ['Timestamp', timestamp],
  ];
  const conversationSummary = safe(input.conversation_summary || lead.message || textFromMessages(state.messages), 'No conversation summary available');
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aqaar Lead Summary</title>
  <style>
    body{font-family:Arial,sans-serif;color:#171717;margin:32px;line-height:1.5}
    h1{font-size:22px;margin:0 0 4px}
    .muted{color:#666;margin:0 0 24px}
    table{border-collapse:collapse;width:100%;margin:16px 0 24px}
    td{border:1px solid #ddd;padding:9px 10px;vertical-align:top}
    td:first-child{font-weight:700;background:#f7f7f7;width:32%}
    pre{white-space:pre-wrap;background:#f7f7f7;border:1px solid #ddd;padding:12px}
  </style>
</head>
<body>
  <h1>Aqaar Lead Summary</h1>
  <p class="muted">Generated from Aqaar AI Concierge</p>
  <table>${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('')}</table>
  <h2>Conversation Summary</h2>
  <pre>${escapeHtml(conversationSummary)}</pre>
</body>
</html>`;

  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aqaar-lead-summary-${slug(lead.name || state.sessionId)}.pdf`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast({ type: 'success', title: 'Summary downloaded', message: 'Lead summary file has been generated.', duration: 3000 });
    return true;
  } catch (error) {
    console.error('Lead summary download failed:', error);
    showToast({ type: 'error', title: 'Download blocked', message: 'Your browser blocked the summary download. Please allow downloads and try again.', duration: 5000 });
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
