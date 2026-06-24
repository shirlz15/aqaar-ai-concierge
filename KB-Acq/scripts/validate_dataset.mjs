import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("KB-Acq");
const OUT = path.join(ROOT, "outputs");
const KNOWLEDGE = path.join(ROOT, "knowledge");
const RAG = path.join(ROOT, "rag");
const LOGS = path.join(ROOT, "logs");

const requiredFiles = [
  "outputs/aqaar_projects_master.csv",
  "outputs/aqaar_projects_buyer_kb.csv",
  "outputs/aqaar_properties_inventory.csv",
  "outputs/aqaar_faqs.csv",
  "outputs/aqaar_assets.csv",
  "outputs/aqaar_sources_audit.csv",
  "outputs/aqaar_site_map.csv",
  "outputs/aqaar_developers.csv",
  "outputs/aqaar_locations.csv",
  "outputs/aqaar_amenities.csv",
  "knowledge/aqaar_acquisition_manifest.json",
  "knowledge/aqaar_source_catalog.json",
  "knowledge/aqaar_data_dictionary.json",
  "rag/aqaar_rag_chunks.jsonl",
  "logs/crawl_log.txt",
  "logs/coverage_report.md"
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}

async function main() {
  const findings = [];
  for (const file of requiredFiles) {
    try {
      const stat = await fs.stat(path.join(ROOT, file));
      if (stat.size === 0) findings.push(`EMPTY ${file}`);
    } catch {
      findings.push(`MISSING ${file}`);
    }
  }

  const projects = parseCsv(await fs.readFile(path.join(OUT, "aqaar_projects_master.csv"), "utf8"));
  const audit = parseCsv(await fs.readFile(path.join(OUT, "aqaar_sources_audit.csv"), "utf8"));
  const assets = parseCsv(await fs.readFile(path.join(OUT, "aqaar_assets.csv"), "utf8"));
  const ids = new Set();
  const duplicateProjects = [];
  for (const project of projects) {
    if (ids.has(project.project_id)) duplicateProjects.push(project.project_id);
    ids.add(project.project_id);
  }
  if (duplicateProjects.length) findings.push(`DUPLICATE_PROJECTS ${duplicateProjects.join(", ")}`);

  const assetUrls = new Set();
  const duplicateAssets = [];
  for (const asset of assets) {
    if (assetUrls.has(asset.url)) duplicateAssets.push(asset.url);
    assetUrls.add(asset.url);
  }
  if (duplicateAssets.length) findings.push(`DUPLICATE_ASSETS ${duplicateAssets.length}`);

  for (const file of [
    path.join(KNOWLEDGE, "aqaar_acquisition_manifest.json"),
    path.join(KNOWLEDGE, "aqaar_source_catalog.json"),
    path.join(KNOWLEDGE, "aqaar_data_dictionary.json")
  ]) {
    JSON.parse(await fs.readFile(file, "utf8"));
  }

  const chunks = (await fs.readFile(path.join(RAG, "aqaar_rag_chunks.jsonl"), "utf8")).trim().split(/\n+/);
  for (const [index, line] of chunks.entries()) {
    try {
      JSON.parse(line);
    } catch {
      findings.push(`MALFORMED_RAG_LINE ${index + 1}`);
    }
  }

  const auditEntities = new Set(audit.map((row) => row.entity_id));
  const missingAudit = projects.filter((project) => !auditEntities.has(project.project_id)).map((project) => project.project_id);
  if (missingAudit.length) findings.push(`MISSING_PROJECT_AUDIT ${missingAudit.join(", ")}`);

  const summary = [
    `Validated at ${new Date().toISOString()}`,
    `Projects: ${projects.length}`,
    `Audit rows: ${audit.length}`,
    `Assets: ${assets.length}`,
    `RAG chunks: ${chunks.length}`,
    findings.length ? `Findings:\n${findings.map((finding) => `- ${finding}`).join("\n")}` : "Findings: none"
  ].join("\n\n");

  await fs.writeFile(path.join(LOGS, "validation_log.txt"), summary + "\n");
  console.log(summary);
  if (findings.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
