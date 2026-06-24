import fs from "node:fs/promises";
import path from "node:path";

const FINAL = path.resolve("KB-Acq");
const required = [
  "csv/aqaar_projects_master.csv",
  "csv/aqaar_properties_inventory.csv",
  "csv/aqaar_assets.csv",
  "csv/aqaar_locations.csv",
  "csv/aqaar_amenities.csv",
  "csv/aqaar_faqs.csv",
  "csv/aqaar_site_map.csv",
  "csv/aqaar_sources_audit.csv",
  "json/aqaar_personas.json",
  "json/aqaar_intents.json",
  "json/aqaar_recommendation_rules.json",
  "json/sales_conversation_flows.json",
  "rag/aqaar_rag_chunks.jsonl",
  "reports/coverage_report.md",
  "reports/validation_report.md"
];

async function main() {
  const findings = [];
  for (const file of required) {
    try {
      const stat = await fs.stat(path.join(FINAL, file));
      if (stat.size === 0) findings.push(`EMPTY ${file}`);
    } catch {
      findings.push(`MISSING ${file}`);
    }
  }

  for (const file of required.filter((item) => item.endsWith(".json"))) {
    JSON.parse(await fs.readFile(path.join(FINAL, file), "utf8"));
  }

  const allFiles = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else allFiles.push(full);
    }
  }
  await walk(FINAL);

  const forbidden = /localhost|127\.0\.0\.1|Palm Hills|palmhills|Bayut|Dubizzle|Property Finder|Wikipedia|Hacienda|Badya/i;
  for (const file of allFiles.filter((item) => /[\\\/](csv|json|rag|assets)[\\\/].*\.(csv|json|md|jsonl)$/i.test(item))) {
    const text = await fs.readFile(file, "utf8");
    if (forbidden.test(text)) {
      const rel = path.relative(FINAL, file);
      if (!/README\.md$|coverage_report\.md$|validation_report\.md$/.test(rel)) findings.push(`FORBIDDEN_TEXT ${rel}`);
    }
  }

  const ragLines = (await fs.readFile(path.join(FINAL, "rag", "aqaar_rag_chunks.jsonl"), "utf8")).trim().split(/\n+/);
  for (const [index, line] of ragLines.entries()) {
    try {
      JSON.parse(line);
    } catch {
      findings.push(`BAD_RAG_JSON line ${index + 1}`);
    }
  }

  const result = [
    `Validated final package at ${new Date().toISOString()}`,
    `Files checked: ${allFiles.length}`,
    `RAG chunks: ${ragLines.length}`,
    findings.length ? `Findings:\n${findings.map((finding) => `- ${finding}`).join("\n")}` : "Findings: none"
  ].join("\n\n");
  console.log(result);
  if (findings.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
