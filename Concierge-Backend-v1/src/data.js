import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, knownOrUnknown } from "./csv.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const repoRoot = path.resolve(backendRoot, "..");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readCsv(filePath) {
  return parseCsv(await readFile(filePath, "utf8"));
}

async function readJsonl(filePath) {
  const text = await readFile(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export async function loadData(options = {}) {
  const kbRoot = path.resolve(options.kbRoot || process.env.AQAAR_KB_ROOT || path.join(repoRoot, "KB-Acq"));
  const intelligenceRoot = path.resolve(
    options.intelligenceRoot || process.env.AQAAR_INTELLIGENCE_ROOT || path.join(repoRoot, "Intelligence-Layer-v2")
  );

  const [
    projects,
    units,
    amenities,
    locations,
    faqs,
    sourcesAudit,
    ragChunks,
    intents,
    personas,
    qualificationTrees,
    recommendationEngine,
    leadScoringRules,
    conversationFlows,
    salesPlaybook,
    objectionHandling,
    dashboardMetrics
  ] = await Promise.all([
    readCsv(path.join(kbRoot, "csv", "aqaar_projects_master.csv")),
    readCsv(path.join(kbRoot, "csv", "aqaar_properties_inventory.csv")),
    readCsv(path.join(kbRoot, "csv", "aqaar_amenities.csv")),
    readCsv(path.join(kbRoot, "csv", "aqaar_locations.csv")),
    readCsv(path.join(kbRoot, "csv", "aqaar_faqs.csv")),
    readCsv(path.join(kbRoot, "csv", "aqaar_sources_audit.csv")),
    readJsonl(path.join(kbRoot, "rag", "aqaar_rag_chunks.jsonl")),
    readJson(path.join(intelligenceRoot, "json", "intent_detection_rules.json")),
    readJson(path.join(intelligenceRoot, "json", "buyer_personas.json")),
    readJson(path.join(intelligenceRoot, "json", "qualification_trees.json")),
    readJson(path.join(intelligenceRoot, "json", "recommendation_engine.json")),
    readJson(path.join(intelligenceRoot, "json", "lead_scoring_rules.json")),
    readJson(path.join(intelligenceRoot, "json", "conversation_flows.json")),
    readJson(path.join(intelligenceRoot, "json", "sales_playbook.json")),
    readJson(path.join(intelligenceRoot, "json", "objection_handling.json")),
    readCsv(path.join(intelligenceRoot, "csv", "dashboard_metrics.csv"))
  ]);

  const projectById = new Map(projects.map((project) => [project.property_id, project]));
  const projectsByName = new Map(projects.map((project) => [knownOrUnknown(project.property_name).toLowerCase(), project]));
  const unitsByProject = new Map();
  for (const unit of units) {
    if (!unitsByProject.has(unit.property_id)) unitsByProject.set(unit.property_id, []);
    unitsByProject.get(unit.property_id).push(unit);
  }

  return {
    kbRoot,
    intelligenceRoot,
    projects,
    units,
    amenities,
    locations,
    faqs,
    sourcesAudit,
    ragChunks,
    intents,
    personas,
    qualificationTrees,
    recommendationEngine,
    leadScoringRules,
    conversationFlows,
    salesPlaybook,
    objectionHandling,
    dashboardMetrics,
    projectById,
    projectsByName,
    unitsByProject
  };
}
