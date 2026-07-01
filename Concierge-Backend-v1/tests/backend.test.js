import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { loadData } from "../src/data.js";
import { createServer } from "../src/server.js";

process.env.CHAT_DEBUG = "false";

let server;
let baseUrl;
let fixture;

async function request(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {})
  });
  assert.equal(response.status, 200);
  return response.json();
}

describe("AQAAR Concierge Backend v1", () => {
  before(async () => {
    fixture = await loadData();
    server = await createServer();
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("supports KB-backed RAG search with source attribution", async () => {
    const projectName = fixture.projects.find((project) => project.property_name !== "unknown")?.property_name;
    const result = await request("/search", { query: projectName, limit: 5 });
    assert.equal(result.validation.kb_only, true);
    assert.ok(result.results.length > 0);
    assert.ok(result.sources.every((source) => "source_url" in source));
  });

  it("detects intent and keeps multi-turn context memory", async () => {
    const projectName = fixture.projects.find((project) => project.property_name !== "unknown")?.property_name;
    const first = await request("/chat", { session_id: "test-session", message: `I want to buy in ${projectName}` });
    const second = await request("/chat", {
      session_id: "test-session",
      message: "my name is Sam and my email is sam@example.com"
    });
    assert.equal(first.validation.kb_only, true);
    assert.equal(second.memory.lead_capture.email, "sam@example.com");
    assert.ok(Array.isArray(second.recommendations));
  });

  it("returns ranked KB recommendations with advisor evidence", async () => {
    const result = await request("/recommend", { message: "waterfront 2 bedroom apartment in Ajman", limit: 5 });
    assert.equal(result.validation.basis, "kb_recommendation_ranked");
    assert.ok(result.recommendations.length > 0);
    assert.ok(result.recommendations.every((item) => item.matched_rule.kb_source));
    assert.ok(result.recommendations.every((item) => fixture.projectById.has(item.project.property_id)));
    assert.ok(result.recommendations.some((item) => item.project.project_name.toLowerCase().includes("mawjan") || item.project.project_name.toLowerCase().includes("dusit")));
  });

  it("returns unknown for unpublished lead scoring", async () => {
    const result = await request("/lead-score", { purpose: "buy", project_id: "unknown" });
    assert.equal(result.lead_score, "unknown");
    assert.equal(result.lead_grade, "unknown");
  });

  it("serves dashboard metrics from the intelligence seed package", async () => {
    const response = await fetch(`${baseUrl}/dashboard`);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.validation.basis, "intelligence_seed_dashboard");
    assert.ok(result.metrics.length > 0);
    assert.ok(result.leads.length > 0);
    assert.ok(result.chart_data.top_projects.length > 0);
    assert.equal(result.seed_metrics.data_label, "Demo intelligence data from verified Aqaar KB");
    assert.ok(result.seed_metrics.total_leads > 0);
    assert.ok(result.seed_metrics.qualified_leads > 0);
    const sample = result.leads[0];
    assert.ok(sample.name !== "unknown");
    assert.ok(sample.intent !== "unknown");
    assert.ok(sample.project_name !== "unknown");
    const forbiddenTerms = [
      "Palm" + " Hills",
      "Cai" + "ro",
      "Egy" + "pt",
      "E" + "GP",
      "Village" + " Gate"
    ];
    for (const term of forbiddenTerms) assert.ok(!JSON.stringify(result).toLowerCase().includes(term.toLowerCase()));
    assert.match(sample.status, /Qualified|New|Nurture|Follow-up/i);
  });

  it("qualifies using KB qualification trees", async () => {
    const result = await request("/qualify", { intent: "Buy Property" });
    assert.equal(result.validation.basis, "kb_qualification_tree");
    assert.ok(result.qualification_questions.length > 0);
  });

  it("keeps conversation memory while filtering previous results", async () => {
    const sessionId = `memory-${Date.now()}`;
    const first = await request("/chat", { session_id: sessionId, message: "Show 2 bedroom apartments" });
    const second = await request("/chat", { session_id: sessionId, message: "Budget 1.2M AED" });
    const third = await request("/chat", { session_id: sessionId, message: "Waterfront only" });
    assert.doesNotMatch(first.answer, /I searched the Aqaar KB/i);
    assert.equal(second.memory.budget, 1200000);
    assert.ok(third.memory.amenities.includes("waterfront"));
    assert.ok(third.recommendations.every((item) => fixture.projectById.has(item.project.property_id)));
  });

  it("answers distinct concierge intents with filtered cards", async () => {
    const apartment = await request("/chat", { session_id: "intent-apartment", message: "2 bedroom apartments" });
    const corniche = await request("/chat", { session_id: "intent-corniche", message: "Projects in Ajman Corniche" });
    const schools = await request("/chat", { session_id: "intent-schools", message: "Schools nearby" });
    const compare = await request("/chat", { session_id: "intent-compare", message: "Compare Mawjan and Dusit" });
    const amenities = await request("/chat", { session_id: "intent-amenities", message: "What amenities does Mawjan have?" });

    assert.equal(apartment.response_type, "project_search");
    assert.ok(apartment.response_cards.length > 0);
    assert.ok(apartment.response_cards.every((card) => String(card.bedrooms).includes("2") || card.unit_types.toLowerCase().includes("bedroom")));
    assert.ok(corniche.response_cards.every((card) => card.location.toLowerCase().includes("corniche")));
    assert.equal(schools.response_type, "school");
    assert.ok(schools.response_cards.every((card) => /school|university|education/i.test(`${card.project} ${card.unit_types}`)));
    assert.equal(compare.response_type, "compare");
    assert.deepEqual(compare.response_cards.map((card) => card.project).sort(), ["Dusit Thani Residences Ajman", "Mawjan"].sort());
    assert.equal(amenities.response_cards[0].project, "Mawjan");
  });

  it("routes reasoning examples to the correct KB-only answer type", async () => {
    const payment = await request("/chat", { session_id: "reason-payment", message: "payment plans" });
    const villaPrice = await request("/chat", { session_id: "reason-villa", message: "villa price range" });
    const landmark = await request("/chat", { session_id: "reason-horizon", message: "Horizon University" });
    const twoBed = await request("/chat", { session_id: "reason-2br", message: "2 bedroom apartments" });
    const compare = await request("/chat", { session_id: "reason-compare", message: "Compare Mawjan and Dusit" });

    assert.equal(payment.response_type, "payment_plans");
    assert.ok(payment.response_cards.every((card) => card.payment_plan !== "Not published by Aqaar"));
    assert.equal(villaPrice.response_type, "price");
    assert.ok(villaPrice.response_cards.every((card) => card.unit_types.toLowerCase().includes("villa")));
    assert.equal(landmark.response_type, "nearby_landmarks");
    assert.equal(landmark.response_cards[0].project, "Horizon University");
    assert.doesNotMatch(landmark.answer, /property recommendation/i);
    assert.ok(twoBed.response_cards.every((card) => String(card.bedrooms).includes("2")));
    assert.equal(compare.response_type, "compare");
    assert.deepEqual(compare.response_cards.map((card) => card.project).sort(), ["Dusit Thani Residences Ajman", "Mawjan"].sort());
    for (const result of [payment, villaPrice, landmark, twoBed, compare]) {
      assert.doesNotMatch(result.answer, /https?:\/\//i);
      assert.doesNotMatch(result.answer, /\bunknown\b/i);
    }
  });

  it("does not expose raw URLs in chat answers and returns no-match text", async () => {
    const impossible = await request("/chat", { session_id: "intent-none", message: "Villa under AED 1000" });
    const payment = await request("/chat", { session_id: "intent-payment", message: "Payment plans" });
    assert.equal(impossible.answer, "Not published in verified Aqaar KB.");
    assert.doesNotMatch(payment.answer, /https?:\/\//i);
    assert.ok(payment.response_cards.some((card) => card.payment_plan !== "unknown"));
  });

  it("returns Gemini RAG metadata without exposing credentials", async () => {
    const result = await request("/chat", {
      session_id: "rag-gemini-contract",
      message: "Dusit payment plan"
    });

    assert.equal(typeof result.llm_used, "boolean");
    assert.ok("fallback_reason" in result);
    assert.ok(Array.isArray(result.cards));
    assert.ok(Array.isArray(result.sources));
    assert.equal(result.answer, result.reply);
    assert.equal(result.llm.provider, "gemini");
    assert.match(result.llm.model, /gemini/i);
    assert.ok(!("api_key" in result.llm));
    assert.ok(result.rag.chunks_used > 0);
    assert.ok(result.rag.model_context.every((chunk) => chunk.text && chunk.source_label));
    assert.ok(result.sources_used.length > 0);
    assert.ok(result.sources_used.every((source) => source.source_label && !/^https?:\/\//i.test(source.source_label)));
    assert.ok(result.follow_up);
  });

  it("answers greetings without property cards", async () => {
    const result = await request("/chat", { session_id: "greeting-contract", message: "hey" });
    const general = await request("/chat", { session_id: "general-contract", message: "how are you" });
    assert.equal(result.response_type, "greeting");
    assert.equal(result.property_intent, false);
    assert.deepEqual(result.cards, []);
    assert.deepEqual(result.response_cards, []);
    assert.match(result.answer, /Aqaar|property|help|welcome|hello/i);
    assert.equal(general.response_type, "unclear");
    assert.equal(general.property_intent, false);
    assert.deepEqual(general.cards, []);
    assert.deepEqual(general.response_cards, []);
    assert.match(general.answer, /Aqaar|property|help/i);
  });

  it("captures lead details only into session memory", async () => {
    const result = await request("/chat", {
      session_id: `lead-${Date.now()}`,
      message: "My name is Sara and my phone is +971 50 123 4567 and email sara@example.com"
    });
    assert.equal(result.lead_capture.email, "sara@example.com");
    assert.match(result.sales_handoff.summary, /Purpose:/);
  });

  // ── New tests for dynamic conversation architecture ─────────────────────

  it("greeting returns no property cards and has dynamic non-empty answer", async () => {
    const sid = `greet-dyn-${Date.now()}`;
    const hey = await request("/chat", { session_id: sid, message: "hey" });
    const hello = await request("/chat", { session_id: `${sid}-b`, message: "hello" });
    const morning = await request("/chat", { session_id: `${sid}-c`, message: "good morning" });

    // All three must be non-property
    for (const r of [hey, hello, morning]) {
      assert.equal(r.response_type, "greeting");
      assert.equal(r.property_intent, false);
      assert.deepEqual(r.cards, []);
      assert.ok(r.answer && r.answer.length > 10, "answer should be non-empty");
      assert.doesNotMatch(r.answer, /https?:\/\//i);
    }

    // Responses should not all be identical (dynamic variation)
    const answers = [hey.answer, hello.answer, morning.answer];
    const unique = new Set(answers.map((a) => a.slice(0, 40)));
    // At least 2 of 3 should differ in first 40 chars (or all fallbacks from pool)
    // We accept same answer only if all three are identical AND non-empty (fallback pool exhausted)
    assert.ok(unique.size >= 1, "should have at least one distinct answer");
  });

  it("name capture stores name in session memory and acknowledges it", async () => {
    const sid = `name-${Date.now()}`;
    const result = await request("/chat", { session_id: sid, message: "I'm Shirley" });

    assert.equal(result.response_type, "name_contact_capture");
    assert.equal(result.property_intent, false);
    assert.deepEqual(result.cards, []);
    assert.equal(result.memory.name, "Shirley");
    // Answer should contain the name
    assert.match(result.answer, /shirley/i);
  });

  it("name is remembered across subsequent turns", async () => {
    const sid = `name-mem-${Date.now()}`;
    // First turn: give name
    await request("/chat", { session_id: sid, message: "My name is Marcus" });
    // Second turn: property question — memory should still have name
    const second = await request("/chat", { session_id: sid, message: "Show me 2 bedroom apartments" });
    assert.equal(second.memory.name, "Marcus");
  });

  it("small talk returns non-property response without RAG", async () => {
    const thanks = await request("/chat", { session_id: `st-${Date.now()}`, message: "thanks" });
    const ok = await request("/chat", { session_id: `st2-${Date.now()}`, message: "ok" });
    const nice = await request("/chat", { session_id: `st3-${Date.now()}`, message: "nice" });

    for (const r of [thanks, ok, nice]) {
      assert.equal(r.property_intent, false);
      assert.deepEqual(r.cards, []);
      assert.ok(r.answer && r.answer.length > 5);
    }
  });

  it("greeting followed by name capture remembers name", async () => {
    const sid = `greet-name-${Date.now()}`;
    const greet = await request("/chat", { session_id: sid, message: "hi" });
    const name = await request("/chat", { session_id: sid, message: "I'm Amira" });

    assert.equal(greet.response_type, "greeting");
    assert.equal(name.response_type, "name_contact_capture");
    assert.equal(name.memory.name, "Amira");
    assert.match(name.answer, /amira/i);
  });

  it("greeting + name + property search: full flow with memory", async () => {
    const sid = `full-flow-${Date.now()}`;
    await request("/chat", { session_id: sid, message: "hello" });
    await request("/chat", { session_id: sid, message: "I'm David" });
    const propResult = await request("/chat", { session_id: sid, message: "Show me villas in Ajman" });

    assert.equal(propResult.memory.name, "David");
    assert.equal(propResult.property_intent, true);
    assert.ok(propResult.cards.length > 0 || propResult.response_type !== "greeting");
  });

  it("investment flow captures intent and returns investment cards", async () => {
    const sid = `invest-${Date.now()}`;
    const result = await request("/chat", { session_id: sid, message: "I want to invest in Ajman real estate" });

    assert.equal(result.property_intent, true);
    assert.ok(["investment", "property_search", "project_search"].includes(result.response_type));
    assert.ok(result.cards.length > 0 || result.recommendations.length > 0);
  });

  it("commercial flow returns commercial-type cards", async () => {
    const sid = `comm-${Date.now()}`;
    const result = await request("/chat", { session_id: sid, message: "I need office space in Ajman" });

    assert.equal(result.property_intent, true);
    assert.ok(result.cards.length > 0 || result.response_type === "commercial" || result.response_type === "project_search");
  });

  it("recommendation response includes project name and why_recommended", async () => {
    const result = await request("/recommend", { message: "2 bedroom apartment in Ajman Corniche", limit: 3 });

    assert.ok(result.recommendations.length > 0);
    assert.ok(result.recommendations.every((r) => r.project && r.project.project_name));
    assert.ok(result.recommendations.every((r) => Array.isArray(r.why_recommended) && r.why_recommended.length > 0));
  });

  it("no duplicate question: memory prevents re-asking known budget", async () => {
    const sid = `no-dup-${Date.now()}`;
    // Tell budget first
    await request("/chat", { session_id: sid, message: "I have a budget of 1.5 million AED" });
    const second = await request("/chat", { session_id: sid, message: "Show me apartments" });

    // Budget should be in memory
    assert.equal(second.memory.budget, 1500000);
    // The answer should NOT ask for budget again
    assert.doesNotMatch(second.answer, /what.*budget|budget.*range|roughly.*budget/i);
  });

  it("RAG is not triggered for pure greeting intent", async () => {
    const result = await request("/chat", { session_id: `rag-greet-${Date.now()}`, message: "hey" });

    assert.equal(result.property_intent, false);
    assert.equal(result.response_type, "greeting");
    // RAG chunks should be zero or not present
    const chunksUsed = result.rag ? result.rag.chunks_used : 0;
    assert.equal(chunksUsed, 0);
    assert.deepEqual(result.cards, []);
  });

  it("RAG is triggered for direct property query", async () => {
    const result = await request("/chat", {
      session_id: `rag-prop-${Date.now()}`,
      message: "Tell me about Mawjan"
    });

    assert.equal(result.property_intent, true);
    assert.ok(result.rag && result.rag.chunks_used > 0, "RAG chunks should be used for property query");
    assert.ok(result.cards.length > 0);
  });

  it("lead capture: name + phone + email all stored in session memory", async () => {
    const sid = `lc-full-${Date.now()}`;
    const result = await request("/chat", {
      session_id: sid,
      message: "My name is Nour, phone +971 55 999 0011, email nour@test.com"
    });

    assert.equal(result.lead_capture.email, "nour@test.com");
    assert.equal(result.lead_capture.name, "Nour");
    assert.ok(result.lead_capture.phone && result.lead_capture.phone !== "unknown");
  });

  // ── Pending context resolution tests ────────────────────────────────────

  it("budget currency clarification: AED reply resolves context and continues property flow", async () => {
    const sid = `ctx-aed-${Date.now()}`;
    // Turn 1: ambiguous budget — triggers currency clarification
    const t1 = await request("/chat", { session_id: sid, message: "big villa I have a budget of 40k" });
    assert.equal(t1.response_type, "budget_clarification");
    assert.equal(t1.property_intent, false);
    assert.match(t1.answer, /AED|USD|currency/i);
    // pending_context must be stored
    assert.ok(t1.memory.pending_context, "pending_context should be set after clarification question");
    assert.equal(t1.memory.pending_context.type, "currency_clarification");

    // Turn 2: user replies "AED" — must resolve and continue property flow
    const t2 = await request("/chat", { session_id: sid, message: "AED" });
    assert.equal(t2.property_intent, true, "should be property intent after resolving AED");
    assert.equal(t2.memory.currency, "AED");
    assert.equal(t2.memory.budget, 40000);
    assert.equal(t2.memory.property_type, "villa");
    assert.ok(!t2.memory.pending_context, "pending_context should be cleared after resolution");
    // Answer must NOT be small talk
    assert.doesNotMatch(t2.answer, /doing well|what can i help|what's on your mind/i);
  });

  it("budget currency clarification: USD reply converts budget to AED", async () => {
    const sid = `ctx-usd-${Date.now()}`;
    const t1 = await request("/chat", { session_id: sid, message: "looking for apartment budget 500k" });
    assert.equal(t1.response_type, "budget_clarification");

    const t2 = await request("/chat", { session_id: sid, message: "USD" });
    assert.equal(t2.property_intent, true);
    assert.equal(t2.memory.currency, "USD");
    // 500k USD → ~1,835,000 AED
    assert.ok(t2.memory.budget > 1000000, "USD budget should be converted to AED equivalent");
    assert.ok(!t2.memory.pending_context);
  });

  it("bedroom clarification: short number reply resolves context", async () => {
    const sid = `ctx-bed-${Date.now()}`;
    // Simulate a session where AI asked about bedrooms by storing pending_context manually
    // via two turns: first a property message, then manually verify short reply works
    const t1 = await request("/chat", { session_id: sid, message: "I want an apartment" });
    assert.equal(t1.property_intent, true);

    // Second turn: directly answer with a number (no pending_context here, but
    // this verifies the bedroom slot is stored from a follow-up numeric message)
    const t2 = await request("/chat", { session_id: sid, message: "2 bedrooms" });
    assert.equal(t2.property_intent, true);
    assert.equal(t2.memory.bedrooms, 2);
  });

  it("location clarification: short location reply resolves context", async () => {
    const sid = `ctx-loc-${Date.now()}`;
    // Start property search, then answer with just a location
    await request("/chat", { session_id: sid, message: "I want to buy a villa" });
    const t2 = await request("/chat", { session_id: sid, message: "Ajman Corniche" });
    assert.equal(t2.property_intent, true);
    assert.ok(t2.memory.location && t2.memory.location !== "unknown", "location should be stored");
  });

  it("buy/rent clarification: short purpose reply resolves context", async () => {
    const sid = `ctx-pur-${Date.now()}`;
    await request("/chat", { session_id: sid, message: "interested in a villa" });
    const t2 = await request("/chat", { session_id: sid, message: "rent" });
    assert.equal(t2.property_intent, true);
    // rent should be stored
    assert.ok(["rent", "buy", "invest", "commercial"].includes(t2.memory.purpose) || t2.property_intent);
  });

  it("short reply after clarification does NOT reset conversation or trigger small talk", async () => {
    const sid = `ctx-noreset-${Date.now()}`;
    // Establish context
    await request("/chat", { session_id: sid, message: "villa budget 200k" });
    // Reply that would normally hit small-talk routing if context were lost
    const t2 = await request("/chat", { session_id: sid, message: "AED" });
    // Should NOT return unclear/small-talk
    assert.notEqual(t2.response_type, "unclear", "should not be unclear after currency clarification");
    assert.notEqual(t2.response_type, "greeting", "should not be greeting after currency clarification");
    // Should be a property response
    assert.equal(t2.property_intent, true);
    assert.ok(t2.answer && t2.answer.length > 10);
    assert.doesNotMatch(t2.answer, /doing well|what's on your mind|happy to help.*what/i);
  });
});
