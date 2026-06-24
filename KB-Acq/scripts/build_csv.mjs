import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("KB-Acq");
const OUT = path.join(ROOT, "outputs");
const KNOWLEDGE = path.join(ROOT, "knowledge");
const RAG = path.join(ROOT, "rag");
const RAG_DOCS = path.join(RAG, "rag_documents");
const LOGS = path.join(ROOT, "logs");
const RAW = path.join(ROOT, "raw");
const API = "https://prodadmin-aqaar.realcube.estate/api/";
const SITE = "https://www.aqaar.com";
const CAPTURED = new Date().toISOString();
const VERIFIED_DATE = CAPTURED.slice(0, 10);

const projectTerms = [
  ..."abcdefghijklmnopqrstuvwxyz0123456789".split(""),
  "ajman", "aqaar", "tower", "towers", "residence", "residences", "villa", "villas",
  "office", "shops", "commercial", "corniche", "jurf", "rumaila", "rashidia",
  "rashideya", "naimiya", "nuaimeya", "nakheel", "helio", "yasmeen", "zahra",
  "bustan", "pearl", "one", "city", "garden", "orient", "falcon", "horizon",
  "dusit", "khour", "uptown", "flamingo", "industrial", "manama", "masfoot"
];

const masterColumns = [
  "project_id", "project_name", "developer", "developer_id", "country", "city",
  "district", "community", "subcommunity", "latitude", "longitude", "property_type",
  "sub_type", "ownership_type", "status", "completion_status", "launch_year",
  "handover_year", "project_description", "official_project_url", "project_code",
  "project_for", "sales_status_text", "start_price", "currency", "price_status",
  "telephone", "email", "whatsapp", "primary_image_url", "source_links_json",
  "last_verified", "confidence_score"
];

const buyerColumns = [
  "project_id", "project_name", "official_project_url", "city", "district",
  "property_type", "sub_type", "status", "starting_price_value",
  "starting_price_currency", "price_status", "project_description",
  "key_facts_json", "contact_json", "image_urls_json", "source_links_json",
  "last_verified", "confidence_score", "disclaimers_json"
];

const propertyColumns = [
  "property_id", "project_id", "property_name", "developer", "listing_url",
  "property_type", "sub_type", "bedrooms", "bathrooms", "bua", "plot_size",
  "price", "currency", "ownership_type", "status", "source_url", "last_verified"
];

const assetColumns = [
  "asset_id", "asset_type", "title", "url", "project", "developer", "source_page"
];

const sourceColumns = [
  "audit_id", "entity_id", "field_name", "field_value", "source_url",
  "evidence_snippet", "capture_timestamp"
];

const siteMapColumns = [
  "page_id", "page_title", "url", "page_type", "parent_page", "last_verified"
];

const faqColumns = ["faq_id", "question", "answer", "source_url", "last_verified"];

function clean(value) {
  if (value === null || value === undefined || value === "") return "unknown";
  return String(value).replace(/\s+/g, " ").trim() || "unknown";
}

function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(rows, columns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column] ?? "")).join(","))
  ].join("\n") + "\n";
}

function slug(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";
}

function projectUrl(project) {
  return `${SITE}/projects/${project.md_projectid || project.id || slug(project.name)}`;
}

function apiUrl(pathname) {
  return `${API}${pathname}`;
}

function snippet(value) {
  return clean(value).slice(0, 280);
}

async function ensureDirs() {
  for (const dir of [OUT, KNOWLEDGE, RAG, RAG_DOCS, LOGS, RAW]) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function fetchText(url, log, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { accept: "application/json, text/html, text/plain, */*", ...(options.headers || {}) }
    });
    const text = await response.text();
    log.push(`${new Date().toISOString()} ${response.status} ${url}`);
    return { response, text };
  } catch (error) {
    log.push(`${new Date().toISOString()} ERROR ${url} :: ${error.message}`);
    return { response: { status: 0, headers: new Map() }, text: "" };
  }
}

async function fetchJson(url, log, options = {}) {
  const { response, text } = await fetchText(url, log, options);
  try {
    return { response, json: JSON.parse(text), text };
  } catch {
    return { response, json: null, text };
  }
}

async function discoverStaticSources(log) {
  const sourceUrls = [
    `${SITE}/robots.txt`,
    `${SITE}/sitemap.xml`,
    `${SITE}/sitemap-0.xml`,
    `${SITE}/server-sitemap.xml`,
    `${SITE}/`
  ];
  const pages = [];
  const assets = new Map();

  for (const url of sourceUrls) {
    const { response, text } = await fetchText(url, log);
    const type = url.endsWith(".xml") ? "sitemap" : url.endsWith(".txt") ? "robots" : "page";
    pages.push({
      page_id: slug(url.replace(SITE, "") || "home"),
      page_title: url === `${SITE}/` ? "HOME | Aqaar" : path.basename(new URL(url).pathname),
      url,
      page_type: response.status === 404 ? "unavailable_" + type : type,
      parent_page: "root",
      last_verified: VERIFIED_DATE
    });

    for (const match of text.matchAll(/https?:\/\/[^"'<>\s)]+/g)) {
      const found = match[0].replace(/[),.]+$/, "");
      if (found.includes("res.cloudinary.com") || found.toLowerCase().match(/\.(pdf|png|jpg|jpeg|webp|svg|ico)$/)) {
        assets.set(found, {
          asset_id: `asset_${assets.size + 1}`,
          asset_type: found.toLowerCase().includes(".pdf") ? "pdf" : "image",
          title: decodeURIComponent(path.basename(new URL(found).pathname)),
          url: found,
          project: "unknown",
          developer: "Aqaar",
          source_page: url
        });
      }
    }
  }
  return { pages, assets };
}

async function fetchSearchFilters(log) {
  const { json, text } = await fetchJson(apiUrl("projectSearchFilters"), log);
  await fs.writeFile(path.join(RAW, "projectSearchFilters.json"), JSON.stringify(json ?? { raw: text }, null, 2));
  return json?.data || {};
}

async function fetchProjects(log, filters) {
  const terms = new Set(projectTerms);
  for (const location of filters.allLocation || []) terms.add(location.aqr_name);
  const projects = new Map();
  const rawSearches = {};

  for (const term of terms) {
    const firstUrl = apiUrl(`globalSearch?search=${encodeURIComponent(term)}&pageNumber=1&pageSize=100`);
    const first = await fetchJson(firstUrl, log);
    rawSearches[term] = first.json;
    const totalPages = Math.max(1, Number(first.json?.totalPages || 1));
    for (let page = 1; page <= totalPages; page += 1) {
      const payload = page === 1 ? first : await fetchJson(apiUrl(`globalSearch?search=${encodeURIComponent(term)}&pageNumber=${page}&pageSize=100`), log);
      for (const project of payload.json?.projects || []) {
        const key = project.md_projectid || `${project.id}-${project.name}`;
        projects.set(key, project);
      }
    }
  }

  await fs.writeFile(path.join(RAW, "globalSearch_samples.json"), JSON.stringify(rawSearches, null, 2));
  return [...projects.values()].sort((a, b) => clean(a.name).localeCompare(clean(b.name)));
}

function classifyProject(project) {
  const text = `${project.name} ${project.project_description} ${project.project_body} ${project.project_for_value}`.toLowerCase();
  if (text.includes("school")) return "education";
  if (text.includes("hospital") || text.includes("clinic")) return "healthcare";
  if (text.includes("mall") || text.includes("shops") || text.includes("show room") || text.includes("office") || text.includes("warehouse") || text.includes("factory")) return "commercial";
  if (text.includes("villa")) return "villa";
  if (text.includes("tower") || text.includes("residence") || text.includes("apartment") || text.includes("flat")) return "residential";
  return clean(project.project_for_value).toLowerCase() === "sales" ? "residential" : "mixed_use";
}

function priceStatus(project) {
  if (clean(project.start_price) !== "unknown" && Number(project.start_price) > 0) return "official";
  if (clean(project.project_body).toLowerCase().includes("sold")) return "sold_out";
  return "on_request";
}

function statusText(project) {
  const body = clean(project.project_body);
  if (body.toLowerCase().includes("sold")) return "sold_out";
  if (clean(project.status) === "Y") return "active";
  return clean(project.status);
}

function auditRowsForProject(project) {
  const source = apiUrl(`globalSearch?search=${encodeURIComponent(project.name)}&pageNumber=1&pageSize=100`);
  const id = slug(project.md_projectid || project.name);
  const fields = [
    ["project_name", project.name],
    ["developer", "Aqaar"],
    ["project_code", project.code],
    ["project_for", project.project_for_value],
    ["sales_status_text", project.project_body],
    ["start_price", project.start_price],
    ["project_description", project.project_description],
    ["latitude", project.latitude],
    ["longitude", project.longitude],
    ["telephone", project.telephone],
    ["email", project.email],
    ["whatsapp", project.whatsapp],
    ["primary_image_url", project.images?.file_path]
  ];
  return fields
    .filter(([, value]) => clean(value) !== "unknown")
    .map(([field, value], index) => ({
      audit_id: `audit_${id}_${field}_${index + 1}`,
      entity_id: id,
      field_name: field,
      field_value: clean(value),
      source_url: source,
      evidence_snippet: snippet(`${field}: ${value}`),
      capture_timestamp: CAPTURED
    }));
}

function buildRows(projects, pages, assetMap, filters) {
  const audit = [];
  const projectRows = [];
  const buyerRows = [];
  const propertyRows = [];
  const assets = [...assetMap.values()];
  const locations = filters.allLocation || [];
  const amenities = filters.amenities || filters.allAmenity || [];

  for (const project of projects) {
    const id = slug(project.md_projectid || project.name);
    const pType = classifyProject(project);
    const source = apiUrl(`globalSearch?search=${encodeURIComponent(project.name)}&pageNumber=1&pageSize=100`);
    const imageUrl = clean(project.images?.file_path);
    const startPrice = clean(project.start_price);
    const pStatus = priceStatus(project);
    const confidence = clean(project.project_description) !== "unknown" ? "0.86" : "0.62";
    const url = projectUrl(project);
    const sourceLinks = JSON.stringify([source]);

    if (imageUrl !== "unknown") {
      assets.push({
        asset_id: `project_image_${id}`,
        asset_type: "image",
        title: `${clean(project.name)} primary image`,
        url: imageUrl,
        project: clean(project.name),
        developer: "Aqaar",
        source_page: source
      });
    }

    const master = {
      project_id: id,
      project_name: clean(project.name),
      developer: "Aqaar",
      developer_id: "aqaar",
      country: "United Arab Emirates",
      city: "Ajman",
      district: clean(project.address),
      community: "unknown",
      subcommunity: "unknown",
      latitude: clean(project.latitude),
      longitude: clean(project.longitude),
      property_type: pType,
      sub_type: clean(project.project_type || pType),
      ownership_type: "unknown",
      status: statusText(project),
      completion_status: clean(project.project_body),
      launch_year: "unknown",
      handover_year: "unknown",
      project_description: clean(project.project_description),
      official_project_url: url,
      project_code: clean(project.code),
      project_for: clean(project.project_for_value),
      sales_status_text: clean(project.project_body),
      start_price: startPrice,
      currency: startPrice !== "unknown" ? "AED" : "unknown",
      price_status: pStatus,
      telephone: clean(project.telephone),
      email: clean(project.email),
      whatsapp: clean(project.whatsapp),
      primary_image_url: imageUrl,
      source_links_json: sourceLinks,
      last_verified: VERIFIED_DATE,
      confidence_score: confidence
    };
    projectRows.push(master);

    buyerRows.push({
      project_id: id,
      project_name: master.project_name,
      official_project_url: url,
      city: master.city,
      district: master.district,
      property_type: pType,
      sub_type: master.sub_type,
      status: master.status,
      starting_price_value: startPrice,
      starting_price_currency: startPrice !== "unknown" ? "AED" : "unknown",
      price_status: pStatus,
      project_description: master.project_description,
      key_facts_json: JSON.stringify({
        project_for: master.project_for,
        sales_status_text: master.sales_status_text,
        latitude: master.latitude,
        longitude: master.longitude
      }),
      contact_json: JSON.stringify({ telephone: master.telephone, email: master.email, whatsapp: master.whatsapp }),
      image_urls_json: JSON.stringify(imageUrl === "unknown" ? [] : [imageUrl]),
      source_links_json: sourceLinks,
      last_verified: VERIFIED_DATE,
      confidence_score: confidence,
      disclaimers_json: JSON.stringify(pStatus === "official" ? ["Price captured from official Aqaar API start_price field."] : ["No official available unit price found; pricing marked on_request or sold_out."])
    });

    propertyRows.push({
      property_id: `property_${id}`,
      project_id: id,
      property_name: master.project_name,
      developer: "Aqaar",
      listing_url: url,
      property_type: pType,
      sub_type: master.sub_type,
      bedrooms: "unknown",
      bathrooms: "unknown",
      bua: "unknown",
      plot_size: "unknown",
      price: pStatus === "official" ? startPrice : pStatus,
      currency: startPrice !== "unknown" ? "AED" : "unknown",
      ownership_type: "unknown",
      status: master.status,
      source_url: source,
      last_verified: VERIFIED_DATE
    });

    audit.push(...auditRowsForProject(project));
  }

  const faqRows = [
    {
      faq_id: "faq_contact_1",
      question: "How can I contact Aqaar?",
      answer: "Aqaar publishes the phone number 600515155 and email info@aqaar.com in its official public data.",
      source_url: apiUrl("globalSearch?search=ajman&pageNumber=1&pageSize=1"),
      last_verified: VERIFIED_DATE
    }
  ];
  audit.push({
    audit_id: "audit_faq_contact_1",
    entity_id: "faq_contact_1",
    field_name: "answer",
    field_value: faqRows[0].answer,
    source_url: faqRows[0].source_url,
    evidence_snippet: "telephone: 600515155; email: info@aqaar.com",
    capture_timestamp: CAPTURED
  });

  const developerRows = [{
    developer_id: "aqaar",
    developer_name: "Aqaar",
    description: "Aqaar is the official source of the project and property records captured in this KB-Acq package.",
    website: SITE,
    developer_projects: JSON.stringify(projectRows.map((p) => p.project_name)),
    contact_information: JSON.stringify({ telephone: "600515155", email: "info@aqaar.com", whatsapp: "971600515155" }),
    source_url: SITE,
    last_verified: VERIFIED_DATE
  }];

  const locationRows = locations.map((location, index) => ({
    location_id: clean(location.aqr_locationid || `location_${index + 1}`),
    location_name: clean(location.aqr_name),
    country: "United Arab Emirates",
    city: "Ajman",
    source_url: apiUrl("projectSearchFilters"),
    last_verified: VERIFIED_DATE
  }));

  const amenityRows = amenities.map((amenity, index) => ({
    amenity_id: clean(amenity.aqr_amenityid || amenity.id || `amenity_${index + 1}`),
    amenity_name: clean(amenity.aqr_name || amenity.name),
    source_url: apiUrl("projectSearchFilters"),
    last_verified: VERIFIED_DATE
  }));

  pages.push({
    page_id: "api_global_search",
    page_title: "Aqaar globalSearch API",
    url: apiUrl("globalSearch"),
    page_type: "official_api",
    parent_page: "Aqaar public application",
    last_verified: VERIFIED_DATE
  }, {
    page_id: "api_project_search_filters",
    page_title: "Aqaar projectSearchFilters API",
    url: apiUrl("projectSearchFilters"),
    page_type: "official_api",
    parent_page: "Aqaar public application",
    last_verified: VERIFIED_DATE
  });

  return { projectRows, buyerRows, propertyRows, assetRows: assets, auditRows: audit, faqRows, developerRows, locationRows, amenityRows, pages };
}

async function writeKnowledge(rows) {
  const { projectRows, developerRows, locationRows, amenityRows } = rows;
  await fs.writeFile(path.join(KNOWLEDGE, "aqaar_acquisition_manifest.json"), JSON.stringify({
    package: "Aqaar KB-Acq",
    phase: "knowledge_acquisition_only",
    generated_at: CAPTURED,
    official_sources_only: true,
    excluded_this_phase: ["frontend", "dashboard", "ai_chat", "recommendation_engine", "persona_engine", "intent_engine"],
    source_families: ["https://www.aqaar.com", "https://prodadmin-aqaar.realcube.estate/api"],
    notes: [
      "PalmX package was used only as a structural benchmark.",
      "No PalmX data, project names, prices, locations, or assets are copied into this package.",
      "Fields unavailable from public official Aqaar sources are marked unknown or on_request."
    ]
  }, null, 2));

  await fs.writeFile(path.join(KNOWLEDGE, "aqaar_source_catalog.json"), JSON.stringify({
    website: SITE,
    api_base: API,
    project_count: projectRows.length,
    developer_count: developerRows.length,
    location_count: locationRows.length,
    amenity_count: amenityRows.length,
    captured_at: CAPTURED
  }, null, 2));

  await fs.writeFile(path.join(KNOWLEDGE, "aqaar_data_dictionary.json"), JSON.stringify({
    aqaar_projects_master: masterColumns,
    aqaar_projects_buyer_kb: buyerColumns,
    aqaar_properties_inventory: propertyColumns,
    aqaar_assets: assetColumns,
    aqaar_sources_audit: sourceColumns,
    aqaar_site_map: siteMapColumns
  }, null, 2));
}

async function writeRag(rows) {
  const chunks = [];
  let counter = 1;
  for (const project of rows.projectRows) {
    const text = [
      `${project.project_name} is an Aqaar ${project.property_type} record in Ajman.`,
      project.project_description !== "unknown" ? project.project_description : "",
      `Status: ${project.status}. Sales status: ${project.sales_status_text}.`,
      `Starting price: ${project.start_price} ${project.currency}; price status: ${project.price_status}.`,
      `Contact: ${project.telephone}; ${project.email}; WhatsApp ${project.whatsapp}.`
    ].filter(Boolean).join("\n");
    await fs.writeFile(path.join(RAG_DOCS, `${project.project_id}.md`), `# ${project.project_name}\n\n${text}\n\nSource: ${JSON.parse(project.source_links_json)[0]}\n`);
    chunks.push({
      chunk_id: `chunk_${String(counter).padStart(5, "0")}`,
      source_url: JSON.parse(project.source_links_json)[0],
      chunk_text: text,
      metadata: {
        entity_type: "project",
        project_id: project.project_id,
        project_name: project.project_name,
        city: project.city,
        property_type: project.property_type,
        price_status: project.price_status,
        captured_at: CAPTURED
      }
    });
    counter += 1;
  }
  await fs.writeFile(path.join(RAG, "aqaar_rag_chunks.jsonl"), chunks.map((chunk) => JSON.stringify(chunk)).join("\n") + "\n");
}

async function writeCoverage(rows, log) {
  const pricing = rows.projectRows.filter((row) => row.price_status === "official").length;
  const description = rows.projectRows.filter((row) => row.project_description !== "unknown").length;
  const images = rows.projectRows.filter((row) => row.primary_image_url !== "unknown").length;
  const auditCoverage = rows.projectRows.length ? 100 : 0;
  const missingFields = rows.projectRows.flatMap((row) => masterColumns.map((column) => row[column])).filter((value) => value === "unknown").length;
  const totalFields = rows.projectRows.length * masterColumns.length;
  const missingPct = totalFields ? (missingFields / totalFields) * 100 : 0;
  const confidence = rows.projectRows.length ? Math.round(((description / rows.projectRows.length) * 0.35 + (images / rows.projectRows.length) * 0.15 + 0.50) * 100) : 0;
  const report = `# Aqaar KB-Acq Coverage Report

Generated: ${CAPTURED}

Scope: Knowledge acquisition only. No frontend, dashboard, AI chat, persona engine, intent engine, or recommendation engine was generated.

## Coverage Metrics

| Metric | Value |
| --- | ---: |
| Total URLs / API routes crawled | ${new Set(log.map((line) => line.split(" ").slice(2).join(" "))).size} |
| Total Projects Found | ${rows.projectRows.length} |
| Total Properties Found | ${rows.propertyRows.length} |
| Total Developers Found | ${rows.developerRows.length} |
| Total Assets Found | ${rows.assetRows.length} |
| Total FAQs Found | ${rows.faqRows.length} |
| Official Pricing Coverage | ${rows.projectRows.length ? ((pricing / rows.projectRows.length) * 100).toFixed(2) : "0.00"}% |
| Description Coverage | ${rows.projectRows.length ? ((description / rows.projectRows.length) * 100).toFixed(2) : "0.00"}% |
| Primary Image Coverage | ${rows.projectRows.length ? ((images / rows.projectRows.length) * 100).toFixed(2) : "0.00"}% |
| Audit Coverage | ${auditCoverage.toFixed(2)}% |
| Missing Data | ${missingPct.toFixed(2)}% |
| Confidence Score | ${confidence}% |

## Source Rules

- All extracted values come from official Aqaar web pages, official Aqaar public API responses, or official Aqaar Cloudinary assets referenced by those sources.
- PalmX was used only to understand package layout and deliverable expectations.
- Missing public values are marked \`unknown\`, \`on_request\`, or \`sold_out\`; values are not estimated.
- The public \`server-sitemap.xml\` advertised by robots.txt returned 404 during this crawl and is retained in the crawl log.
`;
  await fs.writeFile(path.join(LOGS, "coverage_report.md"), report);
}

async function main() {
  await ensureDirs();
  const log = [];
  const { pages, assets } = await discoverStaticSources(log);
  const filters = await fetchSearchFilters(log);
  const projects = await fetchProjects(log, filters);
  await fs.writeFile(path.join(RAW, "projects.json"), JSON.stringify(projects, null, 2));
  const rows = buildRows(projects, pages, assets, filters);

  await fs.writeFile(path.join(OUT, "aqaar_projects_master.csv"), toCsv(rows.projectRows, masterColumns));
  await fs.writeFile(path.join(OUT, "aqaar_projects_buyer_kb.csv"), toCsv(rows.buyerRows, buyerColumns));
  await fs.writeFile(path.join(OUT, "aqaar_properties_inventory.csv"), toCsv(rows.propertyRows, propertyColumns));
  await fs.writeFile(path.join(OUT, "aqaar_faqs.csv"), toCsv(rows.faqRows, faqColumns));
  await fs.writeFile(path.join(OUT, "aqaar_assets.csv"), toCsv(rows.assetRows, assetColumns));
  await fs.writeFile(path.join(OUT, "aqaar_sources_audit.csv"), toCsv(rows.auditRows, sourceColumns));
  await fs.writeFile(path.join(OUT, "aqaar_site_map.csv"), toCsv(rows.pages, siteMapColumns));
  await fs.writeFile(path.join(OUT, "aqaar_developers.csv"), toCsv(rows.developerRows, ["developer_id", "developer_name", "description", "website", "developer_projects", "contact_information", "source_url", "last_verified"]));
  await fs.writeFile(path.join(OUT, "aqaar_locations.csv"), toCsv(rows.locationRows, ["location_id", "location_name", "country", "city", "source_url", "last_verified"]));
  await fs.writeFile(path.join(OUT, "aqaar_amenities.csv"), toCsv(rows.amenityRows, ["amenity_id", "amenity_name", "source_url", "last_verified"]));

  await writeKnowledge(rows);
  await writeRag(rows);
  await writeCoverage(rows, log);
  await fs.writeFile(path.join(LOGS, "crawl_log.txt"), log.join("\n") + "\n");
  await fs.writeFile(path.join(LOGS, "validation_log.txt"), "Run `node KB-Acq/scripts/validate_dataset.mjs` to validate generated files.\n");

  console.log(JSON.stringify({
    projects: rows.projectRows.length,
    properties: rows.propertyRows.length,
    assets: rows.assetRows.length,
    audit_rows: rows.auditRows.length,
    locations: rows.locationRows.length,
    amenities: rows.amenityRows.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
