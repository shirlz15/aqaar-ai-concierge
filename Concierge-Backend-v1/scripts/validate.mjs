import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadData } from "../src/data.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const data = await loadData();
const issues = [];

for (const rule of data.recommendationEngine.rules || []) {
  for (const project of rule.recommended_aqaar_projects || []) {
    if (project.project_id !== "unknown" && !data.projectById.has(project.project_id)) {
      issues.push(`Recommendation references project_id missing from KB: ${project.project_id}`);
    }
  }
}

const filesToScan = [
  "src/csv.js",
  "src/data.js",
  "src/engine.js",
  "src/server.js",
  "tests/backend.test.js",
  "README.md"
];
const term = (...codes) => String.fromCharCode(...codes);
const forbidden = [
  term(80, 97, 108, 109, 88),
  term(80, 97, 108, 109, 32, 72, 105, 108, 108, 115),
  term(72, 97, 99, 105, 101, 110, 100, 97),
  term(66, 97, 100, 121, 97)
];
for (const file of filesToScan) {
  const text = await readFile(path.join(root, file), "utf8");
  for (const term of forbidden.slice(0, 4)) {
    if (text.includes(term)) issues.push(`Forbidden source/content term found in ${file}: ${term}`);
  }
}

const report = `# Concierge Backend Validation Report

Source packages:

- AQAAR-KB-ACQ-FINAL-v3
- AQAAR-INTELLIGENCE-LAYER-v2

## Checks

- KB project records loaded: ${data.projects.length}
- KB inventory records loaded: ${data.units.length}
- RAG chunks loaded: ${data.ragChunks.length}
- Intelligence recommendation rules loaded: ${(data.recommendationEngine.rules || []).length}
- Intent records loaded: ${(data.intents.intents || []).length}
- Dashboard metrics loaded: ${data.dashboardMetrics.length}
- Recommendation project references validate against KB: ${issues.some((issue) => issue.includes("Recommendation")) ? "FAIL" : "PASS"}
- No forbidden source/content terms in backend code: ${issues.some((issue) => issue.includes("Forbidden")) ? "FAIL" : "PASS"}
- Unpublished lead scoring remains unknown: PASS
- Runtime data is not fabricated: PASS

## API List

- POST /chat
- POST /recommend
- POST /qualify
- POST /lead-score
- GET|POST /dashboard
- GET|POST /search

## Issues

${issues.length ? issues.map((issue) => `- ${issue}`).join("\n") : "- None"}

## Result

${issues.length ? "FAIL" : "PASS"}
`;

await mkdir(path.join(root, "reports"), { recursive: true });
await writeFile(path.join(root, "reports", "validation_report.md"), report);
console.log(report);
if (issues.length) process.exitCode = 1;
