import { readFileSync } from "node:fs";
import path from "node:path";
import { readCsv, type CsvRow } from "./csv";

export type KnowledgeBase = {
  projects: CsvRow[];
  projectsMaster: CsvRow[];
  personas: CsvRow[];
  faqs: CsvRow[];
  locations: CsvRow[];
  investmentSignals: CsvRow[];
  salesLanguage: {
    greetings: string[];
    follow_ups: string[];
    property_recommendations: string[];
    investment_recommendations: string[];
    lead_capture_messages: string[];
    closing_messages: string[];
    objection_handling: Record<string, string>;
  };
};

let cached: KnowledgeBase | null = null;

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "..", file), "utf8")) as T;
}

export function getKnowledgeBase(): KnowledgeBase {
  if (cached) return cached;
  cached = {
    projects: readCsv("csv/projects.csv"),
    projectsMaster: readCsv("csv/projects_master.csv"),
    personas: readCsv("csv/buyer_personas.csv"),
    faqs: readCsv("csv/faqs.csv"),
    locations: readCsv("csv/locations.csv"),
    investmentSignals: readCsv("csv/investment_signals.csv"),
    salesLanguage: readJson("data/sales_language.json"),
  };
  return cached;
}
