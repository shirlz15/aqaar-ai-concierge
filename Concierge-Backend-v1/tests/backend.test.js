import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { loadData } from "../src/data.js";
import { createServer } from "../src/server.js";

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
    assert.ok(sample.status.includes("Demo intelligence data"));
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
    assert.equal(impossible.answer, "Not published in the verified Aqaar KB.");
    assert.doesNotMatch(payment.answer, /https?:\/\//i);
    assert.ok(payment.response_cards.some((card) => card.payment_plan !== "unknown"));
  });

  it("captures lead details only into session memory", async () => {
    const result = await request("/chat", {
      session_id: `lead-${Date.now()}`,
      message: "My name is Sara and my phone is +971 50 123 4567 and email sara@example.com"
    });
    assert.equal(result.lead_capture.email, "sara@example.com");
    assert.match(result.sales_handoff.summary, /Purpose:/);
  });
});
