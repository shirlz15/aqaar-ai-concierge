import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "../../Concierge-Backend-v1/src/server.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(root, "index.html"), "utf8");
const js = await readFile(path.join(root, "src", "app.js"), "utf8");
const css = await readFile(path.join(root, "src", "styles.css"), "utf8");

const modules = [
  "Landing / intro page",
  "AI Concierge chat",
  "Guided buyer flow",
  "Buy / Rent / Invest / Commercial intent flows",
  "Property recommendation results",
  "Project comparison view",
  "Lead capture form",
  "Lead summary card",
  "Sales handoff message",
  "Admin dashboard",
  "Lead intelligence dashboard",
  "Lead table",
  "Lead detail drawer",
  "Runtime activity/events section",
  "Download guide/brochure",
  "Toast notifications"
];

for (const module of modules) {
  assert.ok(html.includes(module), `Missing module marker: ${module}`);
}

for (const endpoint of ["/chat", "/recommend", "/qualify", "/lead-score", "/dashboard", "/search"]) {
  assert.ok(js.includes(endpoint), `Frontend does not call ${endpoint}`);
}

for (const action of ["export-csv", "open-lead-modal", "ask-ai", "enquire-project", "download-guide", "search-example"]) {
  assert.ok(html.includes(action) || js.includes(action), `Missing button/action wiring: ${action}`);
}

assert.ok(css.includes("--accent: #d9ff3f"), "Missing Aqaar lime accent token");
assert.ok(css.includes("--bg: #080908"), "Missing dark Aqaar background token");
assert.ok(js.includes("text.length <= 2"), "Partial-word search support missing");
assert.ok(js.includes("Contact Aqaar for details."), "Unknown fallback missing");

const server = await createServer();
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function post(pathname, body) {
  const response = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {})
  });
  assert.equal(response.status, 200, `${pathname} did not return 200`);
  return response.json();
}

try {
  const dashboard = await fetch(`${base}/dashboard`).then((response) => response.json());
  assert.ok(dashboard.metrics.length > 0, "Dashboard API is empty");

  const recommend = await post("/recommend", {});
  assert.ok(recommend.recommendations.length > 0, "Recommendation API is empty");

  const search = await post("/search", { query: "2 bedroom", limit: 5 });
  assert.equal(search.validation.kb_only, true, "Search response is not KB validated");

  const chat = await post("/chat", { session_id: "frontend-test", message: "I want to buy a property" });
  assert.equal(chat.validation.kb_only, true, "Chat response is not KB validated");

  const qualify = await post("/qualify", { intent: "Buy Property" });
  assert.ok(qualify.qualification_questions.length > 0, "Qualification API is empty");

  const leadScore = await post("/lead-score", { purpose: "Buy Property" });
  assert.equal(leadScore.lead_score, "unknown", "Lead score should remain unknown");
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log("Frontend tests passed.");
