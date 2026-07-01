/**
 * Live conversation quality test — runs real turns through the engine
 * and prints each exchange to verify human-like responses.
 * Usage: node scripts/conv-test.mjs
 */
import { createServer } from "../src/server.js";

process.env.CHAT_DEBUG = "false";

const server = await createServer();
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

async function chat(msg, sid) {
  const r = await fetch(`${base}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: msg, session_id: sid }),
  });
  return r.json();
}

const SEP = "─".repeat(70);

async function runScenario(label, turns) {
  const sid = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  console.log("\n" + "═".repeat(70));
  console.log(`  SCENARIO: ${label}`);
  console.log("═".repeat(70));
  for (const msg of turns) {
    const res = await chat(msg, sid);
    const answer = res.answer || res.reply || "(empty)";
    console.log(`\nUSER  ❯  ${msg}`);
    console.log(`AI    ❯  ${answer}`);
    console.log(`       [type=${res.response_type} | property=${res.property_intent} | llm=${res.llm_used}]`);
    console.log(SEP);
  }
}

// ── Scenario 1: Greeting variations (separate sessions) ──────────────────
const greetings = ["heyy", "hello", "good morning", "hi!", "heyyy"];
console.log("\n" + "═".repeat(70));
console.log("  SCENARIO: Greeting Variation (5 separate sessions)");
console.log("═".repeat(70));
for (const g of greetings) {
  const sid = `greet-${Date.now()}-${g}`;
  const res = await chat(g, sid);
  console.log(`\nUSER  ❯  ${g}`);
  console.log(`AI    ❯  ${res.answer}`);
  console.log(`       [type=${res.response_type} | llm=${res.llm_used}]`);
  console.log(SEP);
}

// ── Scenario 2: Name capture + memory ────────────────────────────────────
await runScenario("Name Capture & Memory", [
  "hey",
  "I'm Shirley",
  "how are you?",
  "I want an apartment",
  "for investment",
  "my budget is around 1.2 million AED",
  "Ajman Corniche area",
  "tell me more about Mawjan",
]);

// ── Scenario 3: Small talk transitions ───────────────────────────────────
await runScenario("Small Talk Transitions", [
  "hello",
  "I'm Ahmed",
  "thanks",
  "ok",
  "nice",
  "I want to rent a villa",
  "budget 90k AED per year",
]);

// ── Scenario 4: Property deep-dive ───────────────────────────────────────
await runScenario("Property Deep Dive", [
  "hi",
  "My name is David",
  "looking to invest in Ajman real estate",
  "budget 1.5 to 2 million AED",
  "what payment plans are available?",
  "compare Mawjan and Dusit",
  "which one has better ROI?",
]);

// ── Scenario 5: Commercial enquiry ───────────────────────────────────────
await runScenario("Commercial Enquiry", [
  "hello",
  "I need office space in Ajman",
  "something around 1 million AED budget",
  "near the Corniche if possible",
  "what are the lease terms?",
]);

server.close();
process.exit(0);
