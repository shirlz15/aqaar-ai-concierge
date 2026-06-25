/**
 * Aqaar AI Concierge — Chat Page (Pages 2, 3, 5, 6)
 */
import { chat, qualify, leadScore } from '../api.js';
import { openEnquiryModal } from '../components/modal.js';
import { showToast } from '../toast.js';
import { state, setIntent, resetSession } from '../state.js';

const INTENT_CHIPS = {
  buy: [
    'Show me 2-bedroom apartments',
    'What\'s the price range for villas?',
    'Which areas have freehold units?',
    'Tell me about payment plans',
  ],
  rent: [
    'Find studios under AED 25,000/year',
    'Which districts are near schools?',
    'What\'s included in the rent?',
    'Show me furnished apartments',
  ],
  invest: [
    'What are the best ROI projects?',
    'Tell me about off-plan opportunities',
    'Which projects are near handover?',
    'What\'s the minimum investment?',
  ],
  commercial: [
    'Show me office spaces in Ajman',
    'Retail units on main roads?',
    'What\'s the typical lease term?',
    'Available commercial floors',
  ],
};

const INTENT_WELCOME = {
  buy: 'Hello! I\'m your Aqaar AI Concierge. I\'m here to help you find the perfect property to buy in Ajman. Tell me what you\'re looking for — bedrooms, budget, location — and I\'ll search our verified listings.',
  rent: 'Welcome! I\'m your Aqaar AI Concierge for rentals. Share your requirements — size, budget, preferred area — and I\'ll find you the best rental options from Aqaar\'s verified inventory.',
  invest: 'Hello! Ready to invest in Ajman\'s real estate? I can guide you through Aqaar\'s highest-yield projects, off-plan opportunities, and handover-ready investments. What\'s your investment appetite?',
  commercial: 'Welcome! Looking for commercial space in Ajman? I can help you find offices, retail units, and commercial floors from Aqaar\'s verified portfolio. Tell me about your business requirements.',
};

let isAwaitingLead = false;
let isSending = false;

export function renderConcierge() {
  const content = document.getElementById('page-content');
  if (!content) return;

  isAwaitingLead = false;
  isSending = false;

  content.innerHTML = `
    <div class="chat-page" id="chat-page">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-header-inner">
          <div class="concierge-bubble-chat" aria-hidden="true">🤖</div>
          <div class="chat-header-info">
            <h2>Aqaar AI Concierge</h2>
            <p id="chat-status">● Online — Powered by verified Aqaar data</p>
          </div>
          <div class="chat-intent-tabs" role="tablist" aria-label="Property intent">
            ${['buy','rent','invest','commercial'].map(intent => `
              <button
                class="chat-intent-tab ${state.intent === intent ? 'active' : ''}"
                data-intent="${intent}"
                role="tab"
                id="chat-tab-${intent}"
                aria-selected="${state.intent === intent}"
              >${intent.charAt(0).toUpperCase() + intent.slice(1)}</button>
            `).join('')}
          </div>
          <div style="margin-left:12px;display:flex;gap:8px;">
            <button class="btn btn-ghost btn-sm" id="reset-chat-btn" title="Reset conversation" aria-label="Reset conversation">↺</button>
            <button class="btn btn-outline btn-sm" id="enquire-from-chat-btn" aria-label="Open enquiry form">Enquire</button>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        <div class="chat-messages-inner" id="messages-inner"></div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="chat-input-inner">
          <div class="chat-quick-chips" id="quick-chips" role="group" aria-label="Quick suggestions"></div>
          <div class="chat-input-row">
            <textarea
              class="chat-input"
              id="chat-input"
              placeholder="Ask me about Aqaar properties…"
              rows="1"
              aria-label="Chat message input"
            ></textarea>
            <button class="chat-send-btn" id="send-btn" aria-label="Send message">
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Init ───────────────────────────────────────────────────
  // Check for query param
  const hash = window.location.hash;
  const queryMatch = hash.match(/query=([^&]+)/);
  const preQuery = queryMatch ? decodeURIComponent(queryMatch[1]) : null;

  // Bind intent tabs
  document.querySelectorAll('.chat-intent-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const intent = tab.dataset.intent;
      setIntent(intent);
      document.querySelectorAll('.chat-intent-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.intent === intent);
        t.setAttribute('aria-selected', t.dataset.intent === intent);
      });
      renderChips();
      showToast({ type: 'info', title: `Switched to ${intent.charAt(0).toUpperCase() + intent.slice(1)} mode`, duration: 2000 });
    });
  });

  // Reset button
  document.getElementById('reset-chat-btn')?.addEventListener('click', () => {
    resetSession();
    renderMessages();
    appendAIMessage(INTENT_WELCOME[state.intent]);
    renderChips();
    showToast({ type: 'info', title: 'Chat reset', message: 'New conversation started.', duration: 2500 });
  });

  // Enquire button
  document.getElementById('enquire-from-chat-btn')?.addEventListener('click', () => openEnquiryModal());

  // Send button
  document.getElementById('send-btn')?.addEventListener('click', sendMessage);

  // Enter key (Shift+Enter = newline)
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  document.getElementById('chat-input')?.addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  });

  // ── Initial render ─────────────────────────────────────────
  renderMessages();

  if (state.messages.length === 0) {
    appendAIMessage(INTENT_WELCOME[state.intent]);
  } else {
    // Re-render existing messages
    state.messages.forEach(msg => appendRenderedMessage(msg));
  }

  renderChips();

  // Auto-send pre-query
  if (preQuery) {
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) { input.value = preQuery; sendMessage(); }
    }, 800);
  }
}

function renderMessages() {
  const inner = document.getElementById('messages-inner');
  if (inner) inner.innerHTML = '';
}

function renderChips() {
  const chips = document.getElementById('quick-chips');
  if (!chips) return;
  const suggestions = INTENT_CHIPS[state.intent] || INTENT_CHIPS.buy;
  chips.innerHTML = suggestions.map(s => `
    <button class="chat-chip" data-msg="${s}" aria-label="Quick: ${s}">${s}</button>
  `).join('');
  chips.querySelectorAll('.chat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      if (input) { input.value = chip.dataset.msg; sendMessage(); }
    });
  });
}

function appendRenderedMessage({ role, content, time, cards, sources, followUp }) {
  const inner = document.getElementById('messages-inner');
  if (!inner) return;
  const isUser = role === 'user';
  const avatar = isUser ? '👤' : '🤖';
  const timeStr = time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = `message ${isUser ? 'user' : 'ai'}`;
  div.innerHTML = `
    <div class="message-avatar" aria-hidden="true">${avatar}</div>
    <div>
      <div class="message-bubble">${formatMessage(content)}${renderResponseCards(cards)}${renderSources(sources)}${renderFollowUp(followUp)}</div>
      <div class="message-time">${timeStr}</div>
    </div>
  `;
  inner.appendChild(div);
  scrollToBottom();
}

function appendAIMessage(text, cards = [], sources = [], followUp = '') {
  const msg = { role: 'ai', content: text, cards, sources, followUp, time: now() };
  if (state.messages.length === 0 || state.messages[state.messages.length - 1]?.content !== text) {
    state.messages.push(msg);
  }
  appendRenderedMessage(msg);
}

function appendUserMessage(text) {
  const msg = { role: 'user', content: text, time: now() };
  state.messages.push(msg);
  appendRenderedMessage(msg);
}

function showTyping() {
  const inner = document.getElementById('messages-inner');
  if (!inner) return;
  const typing = document.createElement('div');
  typing.className = 'message ai';
  typing.id = 'typing-indicator';
  typing.innerHTML = `
    <div class="message-avatar" aria-hidden="true">🤖</div>
    <div class="message-bubble typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  inner.appendChild(typing);
  scrollToBottom();
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

async function sendMessage() {
  if (isSending) return;
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const text = input?.value.trim();
  if (!text) return;

  isSending = true;
  input.value = '';
  input.style.height = 'auto';
  if (sendBtn) sendBtn.disabled = true;

  appendUserMessage(text);
  showTyping();

  try {
    // Check if this is a lead capture response
    if (isAwaitingLead) {
      await handleLeadCapture(text);
    } else {
      // Normal chat
      const res = await chat({
        message: text,
        sessionId: state.sessionId,
        intent: state.intent,
      });

      hideTyping();

      const reply = res?.reply || res?.response || res?.message || 'This is not published in the verified Aqaar KB.';
      appendAIMessage(reply, res?.response_cards || [], res?.sources_used || [], res?.follow_up || '');

      // Check if AI is asking for contact details
      const lowerReply = reply.toLowerCase();
      if (
        !state.leadCaptured &&
        (lowerReply.includes('name') || lowerReply.includes('phone') || lowerReply.includes('contact') || lowerReply.includes('details'))
        && state.messages.length >= 4
      ) {
        showLeadCaptureCard();
      }
    }
  } catch (err) {
    hideTyping();
    const errMsg = err.message?.includes('fetch') || err.message?.includes('Failed')
      ? 'Could not reach the Aqaar backend. Please ensure the server is running on port 8080.'
      : `Backend error: ${err.message}`;
    appendAIMessage(errMsg);
    console.error('Chat error:', err);
  } finally {
    isSending = false;
    if (sendBtn) sendBtn.disabled = false;
    input?.focus();
  }
}

function showLeadCaptureCard() {
  const inner = document.getElementById('messages-inner');
  if (!inner || document.getElementById('lead-capture-card')) return;

  const card = document.createElement('div');
  card.id = 'lead-capture-card';
  card.className = 'lead-capture-card';
  card.innerHTML = `
    <h3>📋 Share Your Contact Details</h3>
    <p>To connect you with an Aqaar consultant and save your preferences, please provide your contact info.</p>
    <div class="lead-capture-grid">
      <div class="form-group">
        <label class="form-label" for="lc-name">Full Name *</label>
        <input class="form-input" id="lc-name" type="text" placeholder="Your name" value="${state.lead.name}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="lc-phone">Phone *</label>
        <input class="form-input" id="lc-phone" type="tel" placeholder="+971 50 000 0000" value="${state.lead.phone}" />
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label" for="lc-email">Email</label>
        <input class="form-input" id="lc-email" type="email" placeholder="you@email.com" value="${state.lead.email}" />
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button class="btn btn-primary btn-sm" id="lc-submit-btn">Save & Continue Chat</button>
      <button class="btn btn-ghost btn-sm" id="lc-skip-btn">Skip for now</button>
    </div>
  `;
  inner.appendChild(card);
  scrollToBottom();

  document.getElementById('lc-submit-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('lc-name')?.value.trim();
    const phone = document.getElementById('lc-phone')?.value.trim();
    const email = document.getElementById('lc-email')?.value.trim();
    if (!name || !phone) {
      showToast({ type: 'error', title: 'Required fields missing', message: 'Please enter your name and phone number.', duration: 3000 });
      return;
    }
    state.lead = { ...state.lead, name, phone, email };
    state.leadCaptured = true;
    card.remove();
    isAwaitingLead = false;

    try {
      await Promise.allSettled([
        qualify(state.lead),
        leadScore(state.lead),
      ]);
    } catch (_) {}

    appendAIMessage(`Thank you, ${name}! Your details have been saved. A sales representative will contact you at ${phone} shortly. How else can I help you find your perfect property?`);
    showToast({ type: 'success', title: 'Details saved!', message: `${name}, your Aqaar consultant will call you soon.`, duration: 5000 });
  });

  document.getElementById('lc-skip-btn')?.addEventListener('click', () => {
    card.remove();
    state.leadCaptured = true;
    appendAIMessage('No problem! Feel free to continue exploring. You can always click "Enquire" above to save your details later.');
  });
}

async function handleLeadCapture(text) {
  hideTyping();
  state.lead.message = text;
  state.leadCaptured = true;
  isAwaitingLead = false;
  appendAIMessage(`Thank you! I've noted your details. An Aqaar consultant will contact you shortly. Is there anything else you'd like to know?`);
}

function formatMessage(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function renderResponseCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return '';
  return `
    <div class="chat-result-cards">
      ${cards.map(card => `
        <article class="chat-result-card">
          <div class="chat-result-title">${escapeHtml(displayCardValue(card.project))}</div>
          <div class="chat-result-grid">
            <span>Location</span><strong>${escapeHtml(displayCardValue(card.location))}</strong>
            <span>Price</span><strong>${escapeHtml(displayCardValue(card.price))}</strong>
            <span>Unit types</span><strong>${escapeHtml(displayCardValue(card.unit_types))}</strong>
            <span>Bedrooms</span><strong>${escapeHtml(displayCardValue(card.bedrooms))}</strong>
            <span>Amenities</span><strong>${escapeHtml(displayCardValue(card.amenities))}</strong>
            <span>Payment plan</span><strong>${escapeHtml(displayCardValue(card.payment_plan))}</strong>
            <span>Status</span><strong>${escapeHtml(displayCardValue(card.status))}</strong>
          </div>
          <p class="chat-result-why">${escapeHtml(card.why_recommended || 'published in Aqaar KB')}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return '';
  const labels = [...new Set(sources.map(source => cleanSourceLabel(source)).filter(Boolean))].slice(0, 5);
  if (!labels.length) return '';
  return `
    <div class="chat-source-list" aria-label="Sources used">
      <span>Sources:</span>
      ${labels.map(label => `<strong>${escapeHtml(label)}</strong>`).join('')}
    </div>
  `;
}

function renderFollowUp(followUp) {
  if (!followUp) return '';
  return `<div class="chat-follow-up">${formatMessage(followUp)}</div>`;
}

function cleanSourceLabel(source) {
  const raw = typeof source === 'string'
    ? source
    : (source?.source_label || source?.entity_name || source?.source_url || '');
  const value = String(raw || '').replace(/\\/g, '/');
  const lower = value.toLowerCase();
  if (lower.includes('mawjan')) return 'Mawjan brochure';
  if (lower.includes('dusit')) return 'Dusit Thani brochure';
  if (lower.includes('aqaar_projects_master')) return 'Aqaar projects master';
  if (lower.includes('aqaar_properties_inventory')) return 'Aqaar properties inventory';
  if (lower.includes('aqaar_locations')) return 'Aqaar locations';
  if (lower.includes('aqaar_amenities')) return 'Aqaar amenities';
  if (lower.startsWith('http')) return 'Aqaar official KB';
  return value || 'Verified Aqaar KB';
}

function displayCardValue(value) {
  if (value === undefined || value === null || value === '' || String(value).toLowerCase() === 'unknown') {
    return 'Available on enquiry';
  }
  return value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scrollToBottom() {
  const msgs = document.getElementById('chat-messages');
  if (msgs) {
    requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
  }
}

function now() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
