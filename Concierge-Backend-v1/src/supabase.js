import { isKnown, knownOrUnknown } from "./csv.js";

const DEFAULT_TIMEOUT_MS = 3500;

function config() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = isKnown(serviceRoleKey) && !String(serviceRoleKey).includes("YOUR_") ? serviceRoleKey : anonKey;
  const testRuntime = process.execArgv.includes("--test")
    || process.env.NODE_ENV === "test"
    || process.env.npm_lifecycle_event === "test"
    || process.argv.some((arg) => /tests[\\/].+\.test\.js$/.test(arg));
  const configured = isKnown(url)
    && isKnown(key)
    && !String(url).includes("YOUR_PROJECT_ID")
    && !String(key).includes("YOUR_")
    && !testRuntime;
  return {
    configured,
    url: String(url || "").replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, ""),
    key,
    anonConfigured: isKnown(anonKey) && !String(anonKey).includes("YOUR_"),
    serviceRoleConfigured: isKnown(serviceRoleKey) && !String(serviceRoleKey).includes("YOUR_"),
    keyType: isKnown(serviceRoleKey) && !String(serviceRoleKey).includes("YOUR_") ? "service_role" : "anon",
    testRuntime
  };
}

export function supabaseStatus() {
  const cfg = config();
  return {
    configured: cfg.configured,
    url_configured: isKnown(cfg.url),
    anon_key_configured: cfg.anonConfigured,
    service_role_key_configured: cfg.serviceRoleConfigured,
    key_type: cfg.configured ? cfg.keyType : "unavailable",
    test_runtime_disabled: cfg.testRuntime
  };
}

async function supabaseFetch(path, { method = "GET", body, query = "", timeoutMs = DEFAULT_TIMEOUT_MS, label = path } = {}) {
  const cfg = config();
  const rows = Array.isArray(body) ? body.length : (body ? 1 : 0);
  logSupabase("attempt", { label, method, path, rows, configured: cfg.configured, key_type: cfg.keyType, url_configured: isKnown(cfg.url) });
  if (!cfg.configured) {
    const skipped = { ok: false, skipped: true, reason: "supabase_not_configured" };
    logSupabase("skipped", { label, reason: skipped.reason, status: supabaseStatus() });
    return skipped;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${cfg.url}/rest/v1/${path}${query}`, {
      method,
      signal: controller.signal,
      headers: {
        apikey: cfg.key,
        authorization: `Bearer ${cfg.key}`,
        "content-type": "application/json",
        prefer: "return=minimal,resolution=merge-duplicates"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      logSupabase("failure", { label, status: response.status, reason: text || response.statusText });
      return { ok: false, status: response.status, reason: text || response.statusText };
    }
    if (response.status === 204) {
      logSupabase("success", { label, status: response.status, rows });
      return { ok: true, data: [] };
    }
    const text = await response.text();
    logSupabase("success", { label, status: response.status, rows });
    return { ok: true, data: text ? JSON.parse(text) : [] };
  } catch (error) {
    const reason = error.name === "AbortError" ? "supabase_timeout" : error.message;
    logSupabase("failure", { label, reason });
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

export async function persistChatExchange({ input = {}, result = {} } = {}) {
  const status = supabaseStatus();
  if (!status.configured) return { persisted: false, reason: "supabase_not_configured" };

  const sessionId = knownOrUnknown(result.session_id || input.session_id || "default");
  const memory = result.memory || {};
  const lead = result.lead_capture || memory.lead_capture || {};
  const cards = Array.isArray(result.cards) ? result.cards : [];
  const now = new Date().toISOString();

  const sessionWrite = await supabaseFetch("chat_sessions?on_conflict=session_id", {
    method: "POST",
    label: "chat_sessions",
    body: [{
      session_id: sessionId,
      memory,
      intent: knownOrUnknown(result.intent),
      lead_name: knownOrUnknown(lead.name),
      lead_phone: knownOrUnknown(lead.phone),
      lead_email: knownOrUnknown(lead.email),
      updated_at: now
    }]
  });
  if (!sessionWrite.ok) return { persisted: false, reason: sessionWrite.reason || "supabase_session_write_failed" };

  const writes = await Promise.allSettled([
    supabaseFetch("chat_messages", {
      method: "POST",
      label: "chat_messages",
      body: [{
        session_id: sessionId,
        role: "user",
        content: knownOrUnknown(input.message),
        metadata: { images_attached: Array.isArray(input.images) ? input.images.length : 0 },
        created_at: now
      }, {
        session_id: sessionId,
        role: "assistant",
        content: knownOrUnknown(result.answer),
        metadata: {
          intent: result.intent,
          llm_used: result.llm_used,
          fallback_reason: result.fallback_reason,
          cards: cards.map((card) => card.project)
        },
        created_at: now
      }]
    }),
    hasLead(lead) ? supabaseFetch("leads", {
      method: "POST",
      label: "leads",
      body: [{
        session_id: sessionId,
        name: knownOrUnknown(lead.name),
        phone: knownOrUnknown(lead.phone),
        email: knownOrUnknown(lead.email),
        intent: knownOrUnknown(memory.purpose || result.intent),
        budget: knownOrUnknown(memory.budget),
        location: knownOrUnknown(memory.location || memory.business_location),
        project: cards[0]?.project || knownOrUnknown(memory.project),
        timeline: knownOrUnknown(memory.timeline),
        source: "aqaar_ai_concierge",
        status: "new",
        created_at: now
      }]
    }) : Promise.resolve({ ok: true, skipped: true }),
    cards.length ? supabaseFetch("saved_properties", {
      method: "POST",
      label: "saved_properties",
      body: cards.slice(0, 5).map((card) => ({
        session_id: sessionId,
        project_name: knownOrUnknown(card.project),
        property_id: knownOrUnknown(card.property_id),
        reason: knownOrUnknown(card.why_recommended),
        metadata: card,
        created_at: now
      }))
    }) : Promise.resolve({ ok: true, skipped: true }),
    supabaseFetch("dashboard_events", {
      method: "POST",
      label: "dashboard_events",
      body: [{
        session_id: sessionId,
        event_type: "chat_response",
        intent: knownOrUnknown(result.intent),
        project_name: cards[0]?.project || "unknown",
        metadata: {
          llm_used: result.llm_used,
          cards_count: cards.length,
          sources_count: Array.isArray(result.sources) ? result.sources.length : 0
        },
        created_at: now
      }]
    })
  ]);

  const failures = writes
    .map((item) => item.status === "fulfilled" ? item.value : { ok: false, reason: item.reason?.message })
    .filter((item) => !item.ok && !item.skipped);
  return failures.length
    ? { persisted: false, reason: failures[0].reason || "supabase_write_failed" }
    : { persisted: true };
}

export async function loadDashboardAnalytics() {
  const status = supabaseStatus();
  if (!status.configured) return { available: false, reason: "supabase_not_configured" };

  const [events, leads, messages] = await Promise.all([
    supabaseFetch("dashboard_events?select=*&order=created_at.desc&limit=500"),
    supabaseFetch("leads?select=*&order=created_at.desc&limit=200"),
    supabaseFetch("chat_messages?select=metadata,created_at&role=eq.assistant&order=created_at.desc&limit=500")
  ]);
  if (!events.ok && !leads.ok && !messages.ok) {
    return { available: false, reason: events.reason || leads.reason || messages.reason || "supabase_unavailable" };
  }
  return {
    available: true,
    events: events.ok ? events.data : [],
    leads: leads.ok ? leads.data : [],
    messages: messages.ok ? messages.data : []
  };
}

function hasLead(lead = {}) {
  return isKnown(lead.name) || isKnown(lead.phone) || isKnown(lead.email);
}

function logSupabase(stage, payload = {}) {
  console.log(`[supabase:${stage}] ${JSON.stringify(payload)}`);
}
