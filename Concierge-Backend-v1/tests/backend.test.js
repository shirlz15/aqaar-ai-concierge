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

  it("returns recommendations from intelligence rules only", async () => {
    const result = await request("/recommend", { message: "waterfront lifestyle buyer" });
    assert.equal(result.validation.basis, "kb_recommendation_rules");
    assert.ok(result.recommendations.length > 0);
    assert.ok(result.recommendations.every((item) => item.matched_rule.kb_source));
  });

  it("returns unknown for unpublished lead scoring", async () => {
    const result = await request("/lead-score", { purpose: "buy", project_id: "unknown" });
    assert.equal(result.lead_score, "unknown");
    assert.equal(result.lead_grade, "unknown");
  });

  it("serves dashboard metrics from the intelligence package", async () => {
    const response = await fetch(`${baseUrl}/dashboard`);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.validation.basis, "kb_dashboard_metrics");
    assert.ok(result.metrics.length > 0);
  });

  it("qualifies using KB qualification trees", async () => {
    const result = await request("/qualify", { intent: "Buy Property" });
    assert.equal(result.validation.basis, "kb_qualification_tree");
    assert.ok(result.qualification_questions.length > 0);
  });
});
