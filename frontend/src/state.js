/**
 * Aqaar AI Concierge — Global App State
 */

// Generate a unique session ID for chat
function makeSessionId() {
  return 'aqaar_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
}

export const state = {
  // Current page route
  page: 'landing',

  // Chat state
  sessionId: makeSessionId(),
  intent: 'buy', // buy | rent | invest | commercial
  messages: [],
  leadCaptured: false,
  lead: {
    name: '',
    phone: '',
    email: '',
    intent: 'buy',
    budget: '',
    message: '',
  },

  // Properties
  properties: [],
  selectedProperty: null,

  // Dashboard
  dashboardData: null,
  leads: [],
  selectedLead: null,
  contactedLeads: new Set(),

  // UI
  isTyping: false,
  isLoading: false,
  sortField: 'date',
  sortDir: 'desc',
  leadsFilter: '',
};

// Reset chat session
export function resetSession() {
  state.sessionId = makeSessionId();
  state.messages = [];
  state.leadCaptured = false;
  state.lead = { name: '', phone: '', email: '', intent: state.intent, budget: '', message: '' };
}

// Set intent and update lead
export function setIntent(intent) {
  state.intent = intent;
  state.lead.intent = intent;
}
