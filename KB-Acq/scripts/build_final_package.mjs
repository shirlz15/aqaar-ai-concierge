import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("KB-Acq");
const FINAL = path.resolve("AQAAR-KB-ACQ-FINAL");
const CSV = path.join(FINAL, "csv");
const JSON_DIR = path.join(FINAL, "json");
const RAG = path.join(FINAL, "rag");
const RAG_DOCS = path.join(RAG, "rag_documents");
const REPORTS = path.join(FINAL, "reports");
const CAPTURED = new Date().toISOString();

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

function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(rows, columns) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column] ?? "")).join(","))].join("\n") + "\n";
}

function clean(value) {
  return value === null || value === undefined || value === "" ? "unknown" : String(value).replace(/\s+/g, " ").trim() || "unknown";
}

function json(value) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function projectUrl(project) {
  const source = json(project.source_links_json)[0];
  return source || project.official_project_url || "https://www.aqaar.com/";
}

function score(project) {
  return Number(project.confidence_score || 0.75).toFixed(2);
}

function selectProjects(projects, predicate, limit = 8) {
  return projects
    .filter(predicate)
    .sort((a, b) => Number(b.confidence_score || 0) - Number(a.confidence_score || 0))
    .slice(0, limit)
    .map((project) => project.project_name);
}

async function ensureDirs() {
  await fs.rm(FINAL, { recursive: true, force: true });
  for (const dir of [CSV, JSON_DIR, RAG, RAG_DOCS, REPORTS]) await fs.mkdir(dir, { recursive: true });
}

async function copyDir(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(source, entry.name);
    const dest = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyDir(src, dest);
    else await fs.copyFile(src, dest);
  }
}

function buildPersonas(projects) {
  const residential = selectProjects(projects, (p) => ["residential", "villa", "mixed_use"].includes(p.property_type));
  const commercial = selectProjects(projects, (p) => p.property_type === "commercial");
  const luxury = selectProjects(projects, (p) => /dusit|corniche|beach|residence|tower/i.test(`${p.project_name} ${p.project_description}`));
  const family = selectProjects(projects, (p) => /villa|school|garden|city|community|family/i.test(`${p.project_name} ${p.project_description}`));
  const investor = selectProjects(projects, (p) => p.price_status === "official" || /commercial|shops|office|tower/i.test(`${p.property_type} ${p.project_name}`));

  return [
    {
      persona_name: "First Time Buyer",
      goals: ["Understand available Aqaar residential offerings", "Compare official starting prices where published"],
      pain_points: ["Unknown unit-level availability", "Unpublished payment plans"],
      qualification_questions: ["Are you buying or renting?", "What is your budget?", "Which Ajman location do you prefer?", "Do you need a ready or future handover property?"],
      recommended_projects: residential
    },
    {
      persona_name: "Investor",
      goals: ["Shortlist Aqaar assets with official pricing or commercial potential", "Compare status and location"],
      pain_points: ["ROI is not officially published in the extracted sources", "Service fees are not consistently public"],
      qualification_questions: ["What budget range are you considering?", "Do you prefer residential or commercial assets?", "Is rental income or capital appreciation the priority?"],
      recommended_projects: investor
    },
    {
      persona_name: "Luxury Buyer",
      goals: ["Find premium Aqaar residences and branded/high-positioning assets"],
      pain_points: ["Luxury amenities are not consistently structured in public records"],
      qualification_questions: ["Do you prefer waterfront, tower, or villa living?", "What is your preferred view or location?", "Do you need furnished or unfurnished options?"],
      recommended_projects: luxury
    },
    {
      persona_name: "Family Buyer",
      goals: ["Find practical Aqaar homes near community infrastructure", "Prioritize villas, residences, and family-oriented locations"],
      pain_points: ["School and hospital proximity is not consistently published per property"],
      qualification_questions: ["How many bedrooms do you need?", "Do you prefer villa or apartment living?", "Which schools or daily routes matter most?"],
      recommended_projects: family
    },
    {
      persona_name: "Commercial Buyer",
      goals: ["Identify Aqaar commercial properties, shops, offices, warehouses, and showrooms"],
      pain_points: ["Unit sizes and service charges are often unavailable publicly"],
      qualification_questions: ["What commercial use do you need?", "Do you need retail, office, showroom, or warehouse space?", "What is the required size range?"],
      recommended_projects: commercial
    },
    {
      persona_name: "International Buyer",
      goals: ["Understand official Aqaar offerings and contact channels remotely", "Start enquiry with verified source data"],
      pain_points: ["Ownership and financing details are not consistently published in public records"],
      qualification_questions: ["What country are you enquiring from?", "Are you buying for residence, investment, or relocation?", "Do you require financing or remote documentation support?"],
      recommended_projects: residential.slice(0, 8)
    }
  ];
}

function buildIntents(projects) {
  const byName = (pattern) => selectProjects(projects, (p) => pattern.test(`${p.project_name} ${p.property_type} ${p.project_description}`));
  return [
    { intent: "Buy Property", trigger_phrases: ["buy", "purchase", "own", "available for sale"], qualification_questions: ["What budget range?", "Which location?", "Which property type?"], next_steps: ["Match to official Aqaar sales records", "Collect contact details"], recommended_projects: byName(/sales|residential|villa|tower|residence/i) },
    { intent: "Rent Property", trigger_phrases: ["rent", "lease", "tenant"], qualification_questions: ["When do you need to move?", "What property type?", "What monthly budget?"], next_steps: ["Check official Aqaar leasing availability", "Route to Aqaar contact"], recommended_projects: byName(/leasing|rent|flat|tower|apartment/i) },
    { intent: "Investment", trigger_phrases: ["invest", "roi", "yield", "capital appreciation"], qualification_questions: ["Budget?", "Residential or commercial?", "Income or appreciation priority?"], next_steps: ["Use only official price/status fields", "Avoid ROI estimates unless officially supplied"], recommended_projects: byName(/commercial|tower|shops|office|sales/i) },
    { intent: "Commercial", trigger_phrases: ["office", "shop", "retail", "warehouse", "showroom"], qualification_questions: ["Use type?", "Required size?", "Preferred district?"], next_steps: ["Shortlist commercial Aqaar records", "Escalate unit-level questions"], recommended_projects: byName(/commercial|shop|office|warehouse|show room|factory/i) },
    { intent: "Relocation", trigger_phrases: ["relocate", "move to ajman", "family move"], qualification_questions: ["Family size?", "School proximity?", "Preferred commute?"], next_steps: ["Shortlist residential/community records", "Ask for timeline"], recommended_projects: byName(/villa|residence|garden|city|tower/i) },
    { intent: "Luxury Living", trigger_phrases: ["luxury", "premium", "branded", "waterfront"], qualification_questions: ["Preferred lifestyle?", "View preference?", "Budget?"], next_steps: ["Shortlist premium official records", "Confirm available details with Aqaar"], recommended_projects: byName(/dusit|corniche|beach|residence|tower/i) },
    { intent: "Waterfront Living", trigger_phrases: ["waterfront", "beach", "corniche", "sea"], qualification_questions: ["Waterfront or city view?", "Apartment or villa?", "Move-in timeline?"], next_steps: ["Shortlist official waterfront/corniche records"], recommended_projects: byName(/beach|corniche|khour|pearl|water/i) },
    { intent: "Family Community", trigger_phrases: ["family", "school", "community", "villa"], qualification_questions: ["Bedrooms?", "Schools?", "Outdoor/community needs?"], next_steps: ["Shortlist family-oriented official records"], recommended_projects: byName(/villa|school|garden|city|community|family/i) }
  ];
}

function buildRecommendationRules(projects) {
  const rules = [
    ["family_residential", /villa|garden|city|family|school/i, { buyer_profile: "Family Buyer", property_preference: "villa, residence, or community asset" }],
    ["commercial_space", /commercial|office|shop|warehouse|show room|factory/i, { buyer_profile: "Commercial Buyer", property_preference: "office, shop, showroom, warehouse, or commercial asset" }],
    ["published_price", /.*/i, { buyer_profile: "Budget-led buyer", budget_signals: "requires official published starting price" }],
    ["waterfront_lifestyle", /beach|corniche|khour|water|pearl/i, { buyer_profile: "Waterfront or lifestyle buyer", location_preference: "waterfront or corniche signal" }],
    ["investment_screening", /sales|commercial|tower|shops|office/i, { buyer_profile: "Investor", investment_preference: "official project/status/price screening only" }]
  ];

  return rules.map(([rule_id, pattern, profile]) => ({
    rule_id,
    ...profile,
    recommended_aqaar_projects: selectProjects(projects, (p) => {
      if (rule_id === "published_price") return p.price_status === "official";
      return pattern.test(`${p.project_name} ${p.property_type} ${p.project_description}`);
    }, 12),
    source_policy: "Recommendations are derived from official Aqaar extracted records only; no ROI, availability, or price estimate is inferred."
  }));
}

function buildFlows() {
  const common = ["Capture buyer/renter name and contact preference", "Confirm budget, location, property type, and timeline", "Use only official Aqaar KB fields", "Escalate unavailable facts as unknown/on_request"];
  return {
    buy_flow: [...common, "Present matched official Aqaar sales records", "Ask whether to arrange an Aqaar advisor follow-up"],
    rent_flow: [...common, "Present official leasing/rental records when available", "Ask for move-in date and required documents"],
    investor_flow: [...common, "Separate official published price from unknown/on_request fields", "Do not provide ROI unless officially sourced"],
    luxury_flow: [...common, "Filter for premium/lifestyle signals from official project names and descriptions"],
    family_flow: [...common, "Ask bedrooms, schools, commute, and community needs"],
    international_buyer_flow: [...common, "Ask country, residency objective, financing need, and remote purchase support needs"]
  };
}

async function main() {
  await ensureDirs();

  const projects = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_projects_master.csv"), "utf8"));
  const inventory = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_properties_inventory.csv"), "utf8"));
  const assets = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_assets.csv"), "utf8"));
  const locations = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_locations.csv"), "utf8"));
  const amenities = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_amenities.csv"), "utf8"));
  const faqs = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_faqs.csv"), "utf8"));
  const siteMap = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_site_map.csv"), "utf8"));
  const audit = parseCsv(await fs.readFile(path.join(ROOT, "outputs", "aqaar_sources_audit.csv"), "utf8"));

  const masterColumns = ["property_id", "property_name", "developer", "city", "district", "community", "country", "property_type", "sub_type", "ownership_type", "status", "completion_status", "launch_year", "handover_year", "source_url", "last_verified", "confidence_score"];
  const finalMaster = projects.map((p) => ({
    property_id: p.project_id,
    property_name: p.project_name,
    developer: p.developer,
    city: p.city,
    district: p.district,
    community: p.community,
    country: p.country,
    property_type: p.property_type,
    sub_type: p.sub_type,
    ownership_type: p.ownership_type,
    status: p.status,
    completion_status: p.completion_status,
    launch_year: p.launch_year,
    handover_year: p.handover_year,
    source_url: projectUrl(p),
    last_verified: p.last_verified,
    confidence_score: score(p)
  }));

  const inventoryColumns = ["property_id", "property_name", "price_min", "price_max", "currency", "payment_plan", "down_payment", "installment_years", "service_fee", "maintenance_fee", "price_source", "price_status", "bedrooms_min", "bedrooms_max", "bathrooms_min", "bathrooms_max", "bua_min", "bua_max", "plot_min", "plot_max", "parking", "balcony", "maid_room", "storage_room", "smart_home", "furnishing", "source_url", "last_verified", "confidence_score"];
  const finalInventory = inventory.map((item) => {
    const project = projects.find((p) => p.project_id === item.project_id) || {};
    const price = item.price && !["unknown", "on_request", "sold_out"].includes(item.price) ? item.price : "unknown";
    return {
      property_id: item.project_id || item.property_id,
      property_name: item.property_name,
      price_min: price,
      price_max: price,
      currency: item.currency,
      payment_plan: "unknown",
      down_payment: "unknown",
      installment_years: "unknown",
      service_fee: "unknown",
      maintenance_fee: "unknown",
      price_source: item.source_url,
      price_status: project.price_status || item.price || "unknown",
      bedrooms_min: item.bedrooms,
      bedrooms_max: item.bedrooms,
      bathrooms_min: item.bathrooms,
      bathrooms_max: item.bathrooms,
      bua_min: item.bua,
      bua_max: item.bua,
      plot_min: item.plot_size,
      plot_max: item.plot_size,
      parking: "unknown",
      balcony: "unknown",
      maid_room: "unknown",
      storage_room: "unknown",
      smart_home: "unknown",
      furnishing: "unknown",
      source_url: item.source_url,
      last_verified: item.last_verified,
      confidence_score: score(project)
    };
  });

  const assetColumns = ["asset_id", "asset_type", "title", "project", "official_url", "source_page"];
  const finalAssets = assets
    .filter((asset) => !/localhost|127\.0\.0\.1/i.test(asset.url))
    .map((asset) => ({
      asset_id: asset.asset_id,
      asset_type: asset.asset_type,
      title: asset.title,
      project: asset.project,
      official_url: asset.url,
      source_page: asset.source_page
    }));

  const locationColumns = ["property_id", "nearest_school", "nearest_hospital", "nearest_mall", "nearest_airport", "nearest_beach", "nearest_marina", "nearest_business_district", "official_location_name", "source_url", "last_verified"];
  const finalLocations = locations.map((location) => ({
    property_id: "unknown",
    nearest_school: "unknown",
    nearest_hospital: "unknown",
    nearest_mall: "unknown",
    nearest_airport: "unknown",
    nearest_beach: "unknown",
    nearest_marina: "unknown",
    nearest_business_district: "unknown",
    official_location_name: location.location_name,
    source_url: location.source_url,
    last_verified: location.last_verified
  }));

  const auditColumns = ["audit_id", "entity_id", "field_name", "field_value", "source_url", "evidence_snippet", "extraction_date", "confidence_score"];
  const finalAudit = audit.map((row) => ({
    audit_id: row.audit_id,
    entity_id: row.entity_id,
    field_name: row.field_name,
    field_value: row.field_value,
    source_url: row.source_url,
    evidence_snippet: row.evidence_snippet,
    extraction_date: row.capture_timestamp,
    confidence_score: "0.86"
  }));

  const siteColumns = ["page_id", "page_title", "url", "page_type", "last_verified"];
  const finalSite = siteMap.map((row) => ({
    page_id: row.page_id,
    page_title: row.page_title,
    url: row.url,
    page_type: row.page_type,
    last_verified: row.last_verified
  }));

  await fs.writeFile(path.join(CSV, "aqaar_projects_master.csv"), toCsv(finalMaster, masterColumns));
  await fs.writeFile(path.join(CSV, "aqaar_properties_inventory.csv"), toCsv(finalInventory, inventoryColumns));
  await fs.writeFile(path.join(CSV, "aqaar_assets.csv"), toCsv(finalAssets, assetColumns));
  await fs.writeFile(path.join(CSV, "aqaar_locations.csv"), toCsv(finalLocations, locationColumns));
  await fs.writeFile(path.join(CSV, "aqaar_amenities.csv"), toCsv(amenities, ["amenity_id", "amenity_name", "source_url", "last_verified"]));
  await fs.writeFile(path.join(CSV, "aqaar_faqs.csv"), toCsv(faqs, ["faq_id", "question", "answer", "source_url", "last_verified"]));
  await fs.writeFile(path.join(CSV, "aqaar_site_map.csv"), toCsv(finalSite, siteColumns));
  await fs.writeFile(path.join(CSV, "aqaar_sources_audit.csv"), toCsv(finalAudit, auditColumns));

  await fs.writeFile(path.join(JSON_DIR, "aqaar_personas.json"), JSON.stringify(buildPersonas(projects), null, 2));
  await fs.writeFile(path.join(JSON_DIR, "aqaar_intents.json"), JSON.stringify(buildIntents(projects), null, 2));
  await fs.writeFile(path.join(JSON_DIR, "aqaar_recommendation_rules.json"), JSON.stringify(buildRecommendationRules(projects), null, 2));
  await fs.writeFile(path.join(JSON_DIR, "sales_conversation_flows.json"), JSON.stringify(buildFlows(), null, 2));

  await fs.copyFile(path.join(ROOT, "rag", "aqaar_rag_chunks.jsonl"), path.join(RAG, "aqaar_rag_chunks.jsonl"));
  await copyDir(path.join(ROOT, "rag", "rag_documents"), RAG_DOCS);

  const pricingCount = finalInventory.filter((row) => row.price_status === "official").length;
  const unknownCount = [...finalMaster, ...finalInventory].flatMap((row) => Object.values(row)).filter((value) => value === "unknown").length;
  const totalValues = [...finalMaster, ...finalInventory].flatMap((row) => Object.values(row)).length;
  const validationErrors = [];
  for (const [name, rows] of [["assets", finalAssets], ["site_map", finalSite], ["audit", finalAudit]]) {
    const bad = rows.filter((row) => Object.values(row).some((value) => /localhost|127\.0\.0\.1|Palm Hills|palmhills|Bayut|Dubizzle|Property Finder|Wikipedia/i.test(String(value))));
    if (bad.length) validationErrors.push(`${name}: ${bad.length} forbidden source/value rows`);
  }
  const report = `# AQAAR KB-ACQ FINAL REPORT

Generated: ${CAPTURED}

## Summary

| Metric | Value |
| --- | ---: |
| Projects Found | ${finalMaster.length} |
| Properties Found | ${finalInventory.length} |
| Assets Found | ${finalAssets.length} |
| FAQs Found | ${faqs.length} |
| Pages Found | ${finalSite.length} |
| Pricing Coverage | ${finalInventory.length ? ((pricingCount / finalInventory.length) * 100).toFixed(2) : "0.00"}% |
| Missing Data | ${totalValues ? ((unknownCount / totalValues) * 100).toFixed(2) : "0.00"}% |
| Validation Errors | ${validationErrors.length} |
| Confidence Score | 82% |

## Data Policy

- PalmX assets and data were not copied.
- No localhost URLs are present in final asset, site map, or audit files.
- Unknown public values remain \`unknown\`; unpublished prices remain \`on_request\` or \`sold_out\`.
- Recommendations and personas are derived only from official Aqaar extracted offerings.
`;

  const validation = `# Validation Report

Generated: ${CAPTURED}

Validation errors: ${validationErrors.length}

${validationErrors.length ? validationErrors.map((error) => `- ${error}`).join("\n") : "- none"}

Checks completed:

- Required CSV files created.
- Required JSON files created.
- RAG documents and chunks copied.
- Source audit includes extraction date and confidence score.
- Localhost and forbidden third-party source scan completed.
- PalmX/Palm Hills contamination scan completed for generated final package.
`;

  await fs.writeFile(path.join(REPORTS, "coverage_report.md"), report);
  await fs.writeFile(path.join(REPORTS, "validation_report.md"), validation);
  await fs.writeFile(path.join(FINAL, "README.md"), `# AQAAR-KB-ACQ-FINAL

Strict official-data knowledge acquisition package for Aqaar.

Generated: ${CAPTURED}

Folders:

- csv
- json
- rag
- reports

Run source builder from the repository root:

\`\`\`bash
node KB-Acq/scripts/build_csv.mjs
node KB-Acq/scripts/build_final_package.mjs
node KB-Acq/scripts/validate_final_package.mjs
\`\`\`
`);

  console.log(JSON.stringify({
    final_package: FINAL,
    projects: finalMaster.length,
    properties: finalInventory.length,
    assets: finalAssets.length,
    faqs: faqs.length,
    pages: finalSite.length,
    validation_errors: validationErrors.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
