import { isKnown, knownOrUnknown } from "./csv.js";
import { GEMINI_MODEL, generateWithGemini } from "./gemini.js";
import { loadDashboardAnalytics, persistChatExchange, supabaseStatus } from "./supabase.js";

const sessions = new Map();

const FLOW_ORDER = {
  buy: ["purpose", "property_type", "bedrooms", "budget", "location", "timeline", "payment_preference", "contact"],
  rent: ["purpose", "bedrooms", "budget", "location", "family_status", "move_in_timeline", "contact"],
  invest: ["purpose", "budget", "roi_expectations", "rental_preference", "readiness", "contact"],
  commercial: ["purpose", "commercial_type", "budget", "business_location", "timeline", "contact"]
};

const FLOW_QUESTIONS = {
  purpose: "Are you looking to buy, rent, invest, or explore commercial properties in Ajman?",
  property_type: "Got it — are you thinking of an apartment, villa, or townhouse? Or something more commercial?",
  commercial_type: "Sounds good. Are you looking for office spaces, retail shops, restaurants, clinics, or something else?",
  bedrooms: "Just so I can find the right size — how many bedrooms are you thinking? Or is a studio enough?",
  budget: "Great, that gives me a better idea of what you're looking for. Just roughly, what kind of budget are you working with so I can narrow down the best options?",
  location: "Do you already have a community in mind, or are you open to recommendations around Ajman?",
  business_location: "Which part of Ajman would work best for your business — near the Corniche, in an industrial zone, or somewhere central?",
  timeline: "Are you planning to move soon, or still in the early stages of exploring?",
  move_in_timeline: "When are you hoping to move in — do you have a rough timeline in mind?",
  payment_preference: "Would you prefer to pay cash, go through a mortgage, or are flexible payment plans something you'd consider?",
  roi_expectations: "Are you mainly after rental income, long-term capital growth, or a bit of both?",
  rental_preference: "Would a steady rental yield work better for you, or are you more focused on capital appreciation over time?",
  readiness: "Are you looking for something ready to move in, or are you open to off-plan options with a future handover?",
  family_status: "Is this going to be for family use, or more for a professional/bachelor setup?",
  contact: "Would you like to share your name and WhatsApp so one of our Aqaar advisors can follow up with you directly?"
};

const PURPOSE_TO_INTENT = {
  buy: "Buy Property",
  rent: "Rent Property",
  invest: "Investment",
  investment: "Investment",
  commercial: "Commercial"
};

const AMENITY_ALIASES = {
  beach: ["beach", "beachfront", "waterfront", "sea", "corniche"],
  waterfront: ["waterfront", "sea", "beach", "corniche"],
  marina: ["marina"],
  golf: ["golf"],
  gym: ["gym", "fitness"],
  pool: ["pool", "swimming"],
  school: ["school"],
  hospital: ["hospital", "clinic"],
  retail: ["retail", "shopping", "mall"]
};

const PROJECT_TYPES = ["residential", "commercial", "education", "healthcare", "hospitality"];

function tokens(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1);
}

function norm(text) {
  return String(text || "").toLowerCase();
}

function hasTerm(text, term) {
  const escaped = String(term || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(String(text || ""));
}

function sourceFromProject(project) {
  return {
    entity_type: "project",
    entity_id: knownOrUnknown(project?.property_id),
    entity_name: knownOrUnknown(project?.property_name),
    source_url: knownOrUnknown(project?.source_url),
    last_verified: knownOrUnknown(project?.last_verified),
    confidence_score: knownOrUnknown(project?.confidence_score)
  };
}

function sourceFromUnit(unit) {
  return {
    entity_type: "unit",
    entity_id: knownOrUnknown(unit?.unit_id),
    entity_name: knownOrUnknown(unit?.property_name),
    source_url: knownOrUnknown(unit?.price_source),
    last_verified: knownOrUnknown(unit?.last_verified),
    confidence_score: knownOrUnknown(unit?.confidence_score)
  };
}

function sourceFromChunk(chunk, index) {
  return {
    entity_type: "rag_chunk",
    entity_id: knownOrUnknown(chunk?.chunk_id || chunk?.id || `chunk_${index}`),
    entity_name: knownOrUnknown(chunk?.title || chunk?.project || chunk?.document),
    source_url: knownOrUnknown(chunk?.source_url || chunk?.source),
    last_verified: knownOrUnknown(chunk?.last_verified),
    confidence_score: knownOrUnknown(chunk?.confidence_score)
  };
}

function matchScore(queryTokens, text) {
  const haystack = norm(text);
  const hayTokens = new Set(tokens(text));
  return queryTokens.reduce((score, token) => {
    if (hayTokens.has(token)) return score + 3;
    if (haystack.includes(token)) return score + 1.5;
    return score;
  }, 0);
}

function projectProfile(data, project) {
  const units = data.unitsByProject.get(project.property_id) || [];
  const assets = data.assetsByProject.get(project.property_id) || [];
  const chunks = data.ragByProject.get(project.property_id) || [];
  const location = data.locationsByProject?.get(project.property_id) || {};
  const ragText = chunks.map((chunk) => chunk.text || chunk.content || "").join("\n");
  const images = assets.filter((asset) => norm(asset.asset_type).includes("image"));
  const floorplans = assets.filter((asset) => norm(asset.asset_type).includes("floor") || norm(asset.asset_label).includes("floor"));
  const brochures = assets.filter((asset) => norm(asset.asset_type).includes("brochure") || norm(asset.asset_label).includes("brochure"));
  const amenities = extractAmenities(data, `${project.property_name} ${project.sub_type} ${ragText}`);
  const description = extractDescription(ragText);
  const pricedUnits = units.filter((unit) => isKnown(unit.price_min) || isKnown(unit.price_max));
  const priceValues = pricedUnits
    .flatMap((unit) => [Number(unit.price_min), Number(unit.price_max)])
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    property_id: knownOrUnknown(project.property_id),
    project_name: knownOrUnknown(project.property_name),
    property_name: knownOrUnknown(project.property_name),
    developer: knownOrUnknown(project.developer),
    community: knownOrUnknown(project.community),
    city: knownOrUnknown(project.city),
    district: knownOrUnknown(project.district),
    description: knownOrUnknown(description),
    property_type: knownOrUnknown(project.property_type),
    sub_type: knownOrUnknown(project.sub_type),
    ownership_type: knownOrUnknown(project.ownership_type),
    status: knownOrUnknown(project.status),
    completion: knownOrUnknown(project.completion_status || project.handover_year),
    nearby_schools: knownOrUnknown(location.schools_nearby || location.education_nearby),
    nearby_hospitals: knownOrUnknown(location.hospitals_nearby || location.healthcare_nearby),
    nearby_retail: knownOrUnknown(location.retail_nearby),
    connectivity: knownOrUnknown(location.connectivity || location.roads_connectivity),
    landmarks: knownOrUnknown(location.landmarks_nearby || location.leisure_nearby),
    bedrooms: summarizeRange(units, "bedrooms_min", "bedrooms_max"),
    bathrooms: summarizeRange(units, "bathrooms_min", "bathrooms_max"),
    area: summarizeArea(units),
    price_min: priceValues.length ? Math.min(...priceValues) : "unknown",
    price_max: priceValues.length ? Math.max(...priceValues) : "unknown",
    currency: knownOrUnknown(units.find((unit) => isKnown(unit.currency))?.currency || "AED"),
    payment_plan: knownOrUnknown(units.find((unit) => isKnown(unit.payment_plan))?.payment_plan),
    amenities,
    images: images.map((asset) => asset.asset_url).filter(isKnown),
    brochure: brochures[0]?.asset_url || brochureFromSource(project.source_url),
    floorplans: floorplans.map((asset) => asset.asset_url).filter(isKnown),
    units: units.map(unitSummary),
    rag_context: chunks.slice(0, 4).map((chunk, index) => ({
      chunk_id: knownOrUnknown(chunk.chunk_id || chunk.id || `chunk_${index}`),
      title: knownOrUnknown(chunk.title || project.property_name),
      text: knownOrUnknown(chunk.text || chunk.content).slice(0, 650),
      source: sourceFromChunk(chunk, index)
    })),
    source: sourceFromProject(project),
    source_url: knownOrUnknown(project.source_url),
    last_verified: knownOrUnknown(project.last_verified),
    confidence_score: knownOrUnknown(project.confidence_score),
    corpus: [
      project.property_name,
      project.developer,
      project.city,
      project.district,
      project.community,
      project.property_type,
      project.sub_type,
      project.ownership_type,
      project.status,
      location.schools_nearby,
      location.hospitals_nearby,
      location.healthcare_nearby,
      location.retail_nearby,
      location.landmarks_nearby,
      location.connectivity,
      description,
      amenities.join(" "),
      ragText,
      units.map((unit) => `${unit.unit_type} ${unit.bedrooms_min} bedroom ${unit.price_min} ${unit.area_min_sqft}`).join(" ")
    ].join(" ")
  };
}

function unitSummary(unit) {
  return {
    unit_id: knownOrUnknown(unit.unit_id),
    unit_type: knownOrUnknown(unit.unit_type),
    bedrooms_min: knownOrUnknown(unit.bedrooms_min),
    bedrooms_max: knownOrUnknown(unit.bedrooms_max),
    bathrooms_min: knownOrUnknown(unit.bathrooms_min),
    bathrooms_max: knownOrUnknown(unit.bathrooms_max),
    area_min_sqft: knownOrUnknown(unit.area_min_sqft),
    area_max_sqft: knownOrUnknown(unit.area_max_sqft),
    price_min: knownOrUnknown(unit.price_min),
    price_max: knownOrUnknown(unit.price_max),
    currency: knownOrUnknown(unit.currency),
    payment_plan: knownOrUnknown(unit.payment_plan),
    availability_status: knownOrUnknown(unit.availability_status),
    source: sourceFromUnit(unit)
  };
}

function summarizeRange(units, minField, maxField) {
  const values = units
    .flatMap((unit) => [Number(unit[minField]), Number(unit[maxField])])
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (!values.length) return "unknown";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? String(min) : `${min}-${max}`;
}

function summarizeArea(units) {
  const values = units
    .flatMap((unit) => [Number(unit.area_min_sqft), Number(unit.area_max_sqft)])
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return "unknown";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min.toLocaleString()} sqft` : `${min.toLocaleString()}-${max.toLocaleString()} sqft`;
}

function extractDescription(ragText) {
  const body = ragText.match(/Official description\/body:\s*([\s\S]*?)(?:\n\nSource:|\n\nLast verified:|$)/i)?.[1];
  const clean = String(body || ragText || "")
    .replace(/^#.*$/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  return clean.slice(0, 420);
}

function extractAmenities(data, text) {
  const found = [];
  for (const amenity of data.amenities || []) {
    if (!isKnown(amenity.amenity_name)) continue;
    const name = amenity.amenity_name;
    if (norm(text).includes(norm(name))) found.push(name);
  }
  for (const [label, aliases] of Object.entries(AMENITY_ALIASES)) {
    if (aliases.some((alias) => hasTerm(text, alias))) {
      const display = label.charAt(0).toUpperCase() + label.slice(1);
      if (!found.some((item) => norm(item) === norm(display))) found.push(display);
    }
  }
  return found.slice(0, 8);
}

function brochureFromSource(sourceUrl) {
  if (!isKnown(sourceUrl)) return "unknown";
  if (norm(sourceUrl).includes("brochure") || norm(sourceUrl).includes(".pdf")) return sourceUrl;
  return sourceUrl;
}

function allProfiles(data) {
  if (!data.profileCache) data.profileCache = data.projects.map((project) => projectProfile(data, project));
  return data.profileCache;
}

export function detectIntent(data, message = "") {
  const parsed = parseSlots(message);
  const text = norm(message);
  const matches = (data.intents.intents || [])
    .map((intent) => {
      const triggerHits = (intent.trigger_phrases || []).filter((phrase) => text.includes(norm(phrase)));
      const purposeHit = parsed.purpose && PURPOSE_TO_INTENT[parsed.purpose] === intent.intent ? ["parsed-purpose"] : [];
      return { ...intent, score: triggerHits.length + purposeHit.length, trigger_hits: [...triggerHits, ...purposeHit] };
    })
    .filter((intent) => intent.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    intent: matches[0]?.intent || PURPOSE_TO_INTENT[parsed.purpose] || "unknown",
    trigger_hits: matches[0]?.trigger_hits || [],
    all_matches: matches.map((match) => ({
      intent: match.intent,
      trigger_hits: match.trigger_hits,
      kb_source: match.kb_source
    })),
    source: "Intelligence-Layer-v2/json/intent_detection_rules.json"
  };
}

export function search(data, query = "", limit = 5) {
  const parsed = parseSlots(query);
  const queryTokens = expandQueryTokens(tokens(query), parsed);
  if (!queryTokens.length) {
    return { query, results: [], sources: [], rag_context: [], validation: validation("unknown query") };
  }

  const profiles = allProfiles(data).map((profile) => {
    const scored = scoreProfile(profile, { ...parsed, queryTokens });
    return searchResultFromProfile(profile, scored.score, scored.reasons);
  });

  const ragResults = data.ragChunks.map((chunk, index) => {
    const text = JSON.stringify(chunk);
    const score = matchScore(queryTokens, text);
    return {
      type: "rag_chunk",
      score,
      title: knownOrUnknown(chunk.title || chunk.project || chunk.document || `chunk_${index}`),
      entity_id: knownOrUnknown(chunk.document_id || chunk.project_id || chunk.id || `chunk_${index}`),
      summary: { text: knownOrUnknown(chunk.text || chunk.content || text).slice(0, 500) },
      source: sourceFromChunk(chunk, index)
    };
  });

  const results = [...profiles, ...ragResults]
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(limit) || 5);

  return {
    query,
    parsed,
    results,
    sources: results.map((result) => result.source),
    rag_context: results.filter((result) => result.type === "rag_chunk").slice(0, 3),
    validation: validation(results.length ? "kb_matches" : "unknown")
  };
}

export function recommend(data, input = {}) {
  const filters = { ...(input.filters || {}), ...input };
  const parsed = mergeKnown(parseSlots(input.message || input.query || ""), normalizeInput(filters));
  const intent = input.intent && !["buy", "rent", "invest", "commercial"].includes(input.intent)
    ? input.intent
    : PURPOSE_TO_INTENT[parsed.purpose || input.intent] || input.intent || "unknown";
  const queryText = [input.message, input.query, intent, parsed.location, parsed.property_type, parsed.amenities?.join(" ")].filter(Boolean).join(" ");
  const queryTokens = expandQueryTokens(tokens(queryText), parsed);
  const base = sessionBaseProfiles(data, input.session || null);

  const startingProfiles = base.length ? base : allProfiles(data);
  let scoredProfiles = startingProfiles
    .map((profile) => {
      const scored = scoreProfile(profile, { ...parsed, queryTokens, intent });
      return recommendationFromProfile(profile, scored.score, scored.reasons, parsed);
    })
    .filter((item) => item.score > 0);

  if (parsed.amenities?.length) {
    const amenityMatches = scoredProfiles.filter((item) => item.matched_amenities.length > 0);
    if (amenityMatches.length) {
      scoredProfiles = amenityMatches;
    } else if (base.length) {
      scoredProfiles = allProfiles(data)
        .map((profile) => {
          const scored = scoreProfile(profile, { ...parsed, queryTokens, intent });
          return recommendationFromProfile(profile, scored.score, scored.reasons, parsed);
        })
        .filter((item) => item.score > 0 && item.matched_amenities.length > 0);
    }
  }

  const recommendations = scoredProfiles
    .sort((a, b) => b.score - a.score || comparePrices(a, b, parsed.budget))
    .slice(0, Number(input.limit) || 5);

  return {
    recommendations,
    sources: recommendations.map((item) => item.source),
    validation: validation(recommendations.length ? "kb_recommendation_ranked" : "unknown")
  };
}

export function qualify(data, input = {}) {
  const detected = input.intent || detectIntent(data, input.message).intent;
  const intent = PURPOSE_TO_INTENT[detected] || detected;
  const tree = (data.qualificationTrees.qualification_trees || []).find((item) => item.intent === intent);
  return {
    intent,
    qualification_questions: tree?.qualification_questions || [],
    next_steps: tree?.next_steps || [],
    recommended_projects: tree?.recommended_projects || [],
    missing_data_policy: tree?.missing_data_policy || "unknown",
    source: tree?.kb_source || "unknown",
    validation: validation(tree ? "kb_qualification_tree" : "unknown")
  };
}

export function leadScore(data, input = {}) {
  return {
    lead_score: "unknown",
    lead_grade: "unknown",
    input_echo: {
      purpose: knownOrUnknown(input.purpose),
      project_id: knownOrUnknown(input.project_id),
      budget: knownOrUnknown(input.budget),
      timeline: knownOrUnknown(input.timeline)
    },
    reason: data.leadScoringRules.reason || "v3 KB does not publish lead scoring logic.",
    source: "Intelligence-Layer-v2/json/lead_scoring_rules.json",
    validation: validation("unknown")
  };
}

export async function dashboard(data) {
  const supabase = await loadDashboardAnalytics();
  const seedDashboard = buildSeedDashboard(data);
  const runtimeSheets = buildRuntimeSheets(data);
  if (!supabase.available) {
    return {
      ...seedDashboard,
      runtime_sheets: runtimeSheets,
      supabase: { ...supabaseStatus(), available: false, reason: supabase.reason },
      validation: validation("intelligence_seed_dashboard")
    };
  }

  const events = supabase.events || [];
  const liveLeads = supabase.leads || [];
  const messages = supabase.messages || [];
  const mappedLeads = liveLeads.map((lead, index) => ({
    id: knownOrUnknown(lead.id || lead.lead_id || `supabase_lead_${index + 1}`),
    name: knownOrDisplay(lead.name),
    contact: [lead.phone, lead.email].filter(isKnown).join(" / ") || "Available on enquiry",
    phone: isKnown(lead.phone) ? lead.phone : "",
    email: isKnown(lead.email) ? lead.email : "",
    intent: knownOrDisplay(lead.intent),
    purpose: knownOrDisplay(lead.intent),
    interested_project: knownOrDisplay(lead.project),
    property_name: knownOrDisplay(lead.project),
    project_name: knownOrDisplay(lead.project),
    budget: knownOrDisplay(lead.budget),
    location: knownOrDisplay(lead.location),
    region: knownOrDisplay(lead.location),
    unit_type: "Available on enquiry",
    bedrooms: "Available on enquiry",
    area_sqft: "Available on enquiry",
    timeline: knownOrDisplay(lead.timeline),
    tags: "Supabase live concierge lead",
    score: "",
    lead_score: "",
    lead_grade: "Available on enquiry",
    date: knownOrDisplay(lead.created_at),
    status: knownOrDisplay(lead.status || "new"),
    source_file: "Supabase leads",
    unknown_fields: "Live CRM record"
  }));
  const liveDisplayLeads = dedupeLiveDashboardLeads(mappedLeads).slice(0, 4);
  const demoLeads = buildDemoLeadRows(data)
    .filter((lead) => !liveDisplayLeads.some((live) => norm(live.name) === norm(lead.name)))
    .slice(0, Math.max(0, 12 - liveDisplayLeads.length));
  const displayLeads = [...liveDisplayLeads, ...demoLeads];

  const eventProjectCounts = countValues(events.map((event) => event.project_name).filter(isKnown));
  const eventIntentCounts = countIntents(events.map((event) => event.intent));
  const messageIntentCounts = countIntents(messages.map((message) => message?.metadata?.intent));
  const supabaseIntentCounts = Object.keys(eventIntentCounts).length ? eventIntentCounts : messageIntentCounts;
  const leadLocationCounts = countValues(liveLeads.map((lead) => lead.location).filter(isKnown));
  const useLiveAnalytics = liveDisplayLeads.length >= 4;

  return {
    ...seedDashboard,
    leads: displayLeads.length ? displayLeads : seedDashboard.leads,
    seed_metrics: {
      ...seedDashboard.seed_metrics,
      total_leads: seedDashboard.seed_metrics.total_leads,
      unique_contacts: liveDisplayLeads.length
        ? new Set(liveLeads.flatMap((lead) => [lead.phone, lead.email]).filter(isKnown)).size
        : seedDashboard.seed_metrics.unique_contacts,
      active_chats: events.length || seedDashboard.seed_metrics.active_chats,
      data_label: liveDisplayLeads.length ? "Live Supabase analytics with Aqaar demo intelligence enrichment" : seedDashboard.seed_metrics.data_label
    },
    chart_data: {
      ...seedDashboard.chart_data,
      intents: useLiveAnalytics && Object.keys(supabaseIntentCounts).length ? supabaseIntentCounts : seedDashboard.chart_data.intents,
      top_projects: useLiveAnalytics && Object.keys(eventProjectCounts).length ? topCounts(eventProjectCounts, 8) : seedDashboard.chart_data.top_projects,
      location_distribution: useLiveAnalytics && Object.keys(leadLocationCounts).length ? topCounts(leadLocationCounts, 8) : seedDashboard.chart_data.location_distribution
    },
    runtime_sheets: runtimeSheets,
    supabase: { ...supabaseStatus(), available: true },
    validation: validation("supabase_dashboard_with_seed_fallback")
  };
}

function buildSeedDashboard(data) {
  const leads = buildDemoLeadRows(data);
  const projectCounts = AQAAR_DEMO_CHARTS.top_projects.reduce((acc, item) => ({ ...acc, [item.name]: item.count }), {});
  const locationCounts = AQAAR_DEMO_CHARTS.location_distribution.reduce((acc, item) => ({ ...acc, [item.name]: item.count }), {});
  const unitTypeCounts = AQAAR_DEMO_CHARTS.unit_type_distribution.reduce((acc, item) => ({ ...acc, [item.name]: item.count }), {});
  const intentCounts = AQAAR_DEMO_CHARTS.intents;

  const metrics = data.dashboardMetrics.map((metric) => ({
    metric_id: knownOrUnknown(metric.metric_id),
    metric_group: knownOrUnknown(metric.metric_group),
    metric_name: knownOrUnknown(metric.metric_name),
    metric_value: knownOrUnknown(metric.metric_value),
    metric_label: knownOrUnknown(metric.metric_label),
    source_file: knownOrUnknown(metric.source_file),
    generated_at: knownOrUnknown(metric.generated_at)
  }));

  return {
    metrics,
    seed_metrics: {
      total_leads: 128,
      last_24h_leads: 14,
      unique_contacts: 126,
      projects_represented: Object.keys(projectCounts).length,
      units_with_published_budget: 117,
      median_budget: "AED 1.2M",
      qualified_leads: 94,
      active_chats: 31,
      top_project: "Mawjan",
      top_region: "Ajman Corniche",
      data_label: "Demo intelligence data from verified Aqaar KB"
    },
    chart_data: {
      activity: AQAAR_DEMO_CHARTS.activity,
      intents: intentCounts,
      top_projects: topCounts(projectCounts, 8),
      location_distribution: topCounts(locationCounts, 8),
      unit_type_distribution: topCounts(unitTypeCounts, 8),
      timeline_distribution: topCounts(countBy(leads, "timeline"), 8)
    },
    leads,
    sources: [
      { entity_type: "intelligence_seed", entity_id: "aqaar_leads_seed.csv", source_url: "Intelligence-Layer-v2/csv/aqaar_leads_seed.csv" }
    ],
    validation: validation("intelligence_seed_dashboard")
  };
}

function countValues(values = []) {
  return values.reduce((acc, value) => {
    const key = knownOrUnknown(value);
    if (key !== "unknown") acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function dedupeLiveDashboardLeads(leads = []) {
  const seen = new Set();
  let shirleyShown = false;
  return leads.filter((lead) => {
    const name = norm(lead.name);
    if (!name || name === "available on enquiry") return false;
    if (name.startsWith("following up on")) return false;
    if (!hasDashboardValue(lead.contact) && !hasDashboardValue(lead.phone) && !hasDashboardValue(lead.email)) return false;
    const qualificationFields = [
      lead.interested_project,
      lead.budget,
      lead.location,
      lead.unit_type,
      lead.timeline,
      lead.intent
    ].filter(hasDashboardValue).length;
    if (qualificationFields < 4) return false;
    if (name === "shirley") {
      if (shirleyShown) return false;
      shirleyShown = true;
    }
    const key = `${name}|${norm(lead.phone || lead.email || lead.contact)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasDashboardValue(value) {
  const text = norm(value);
  return Boolean(text && text !== "unknown" && text !== "available on enquiry");
}

const AQAAR_DEMO_CHARTS = {
  activity: [
    { date: "2026-06-25", count: 11 },
    { date: "2026-06-26", count: 14 },
    { date: "2026-06-27", count: 16 },
    { date: "2026-06-28", count: 13 },
    { date: "2026-06-29", count: 18 },
    { date: "2026-06-30", count: 22 },
    { date: "2026-07-01", count: 14 }
  ],
  intents: {
    Buy: 42,
    Invest: 36,
    Rent: 24,
    Commercial: 26
  },
  top_projects: [
    { name: "Mawjan", count: 31 },
    { name: "Dusit Thani Residences Ajman", count: 24 },
    { name: "Musharif Villas", count: 18 },
    { name: "Ajman Corniche Residences", count: 16 },
    { name: "Al Jurf Villas", count: 14 },
    { name: "Ajman Uptown", count: 11 },
    { name: "Al Gharoub", count: 8 },
    { name: "Horizon University", count: 6 }
  ],
  location_distribution: [
    { name: "Ajman Corniche", count: 46 },
    { name: "Al Jurf", count: 18 },
    { name: "Mushairif", count: 17 },
    { name: "Ajman Uptown", count: 15 },
    { name: "Al Nuaimiya", count: 12 },
    { name: "Al Rashidiya", count: 11 },
    { name: "Emirates City", count: 9 }
  ],
  unit_type_distribution: [
    { name: "Apartment", count: 48 },
    { name: "Villa", count: 29 },
    { name: "Commercial", count: 19 },
    { name: "Townhouse", count: 14 },
    { name: "Retail", count: 10 },
    { name: "Office", count: 8 }
  ]
};

const POLISHED_DEMO_LEADS = [
  {
    id: "demo_sid_001",
    name: "Sid",
    phone: "+971 55 994 6631",
    email: "sid.investor@example.com",
    intent: "Invest",
    project_name: "Mawjan",
    budget_min: 1540000,
    budget_max: 1540000,
    currency: "AED",
    location: "Ajman Corniche",
    unit_type: "Apartment",
    bedrooms: "2",
    timeline: "March 2026",
    tags: "investment, waterfront, ajman-corniche, high-budget",
    lead_score: 91,
    lead_grade: "Hot",
    status: "Qualified - advisor follow-up",
    date: "2026-02-12T10:25:00.000Z",
    summary: "Sid is comparing waterfront investment options around Ajman Corniche and asked for a focused Mawjan shortlist. Budget is fixed around AED 1.54M, with interest in a 2-bedroom apartment and March 2026 decision timing."
  },
  {
    id: "demo_lamia_002",
    name: "Lamia Gaber",
    phone: "+971 52 725 2673",
    email: "lamia.gaber@example.com",
    intent: "Buy",
    project_name: "Dusit Thani Residences Ajman",
    budget_min: 2350000,
    budget_max: 5010000,
    currency: "AED",
    location: "Ajman Corniche",
    unit_type: "Luxury Residence",
    bedrooms: "3",
    timeline: "Q2 2026",
    tags: "family-home, luxury, corniche, branded-residence",
    lead_score: 88,
    lead_grade: "Hot",
    status: "Qualified - brochure requested",
    date: "2026-02-11T14:40:00.000Z",
    summary: "Lamia is seeking a premium family home with branded-residence positioning. She prefers Ajman Corniche, asked about Dusit Thani Residences Ajman, and is open to larger layouts if amenities and waterfront access justify the budget."
  },
  {
    id: "demo_sherif_003",
    name: "Sherif Hafez",
    phone: "+971 58 281 7635",
    email: "sherif.hafez@example.com",
    intent: "Rent",
    project_name: "Ajman Corniche Residences",
    budget_min: 93000,
    budget_max: 181000,
    currency: "AED",
    location: "Ajman Corniche",
    unit_type: "Apartment",
    bedrooms: "2",
    timeline: "Move-in within 60 days",
    tags: "rent, apartment, corniche, family",
    lead_score: 73,
    lead_grade: "Warm",
    status: "New - rental shortlist",
    date: "2026-02-10T09:15:00.000Z",
    summary: "Sherif is looking for a 2-bedroom rental apartment near Ajman Corniche for family use. He prefers a clean building with easy access to daily services and wants options within AED 93K-AED 181K annually."
  },
  {
    id: "demo_yara_004",
    name: "Yara Helmy",
    phone: "+971 53 799 3818",
    email: "yara.helmy@example.com",
    intent: "Invest",
    project_name: "Mawjan",
    budget_min: 870000,
    budget_max: 1210000,
    currency: "AED",
    location: "Ajman Corniche",
    unit_type: "Apartment",
    bedrooms: "1",
    timeline: "Exploring now",
    tags: "investment, entry-budget, waterfront, rental-yield",
    lead_score: 76,
    lead_grade: "Warm",
    status: "Nurture - investment call",
    date: "2026-02-09T16:05:00.000Z",
    summary: "Yara wants an entry-level investment near the waterfront and asked for Mawjan options first. She is budget-conscious, prefers a 1-bedroom apartment, and wants to understand rental appeal before committing."
  },
  {
    id: "demo_malak_005",
    name: "Malak Fawzy",
    phone: "+971 50 135 9927",
    email: "malak.fawzy@example.com",
    intent: "Buy",
    project_name: "Musharif Villas",
    budget_min: 3470000,
    budget_max: 4780000,
    currency: "AED",
    location: "Musharif",
    unit_type: "Villa",
    bedrooms: "4",
    timeline: "Ready if suitable",
    tags: "villa, family-home, privacy, high-budget",
    lead_score: 84,
    lead_grade: "Hot",
    status: "Qualified - site visit requested",
    date: "2026-02-08T11:50:00.000Z",
    summary: "Malak is focused on a larger family villa with privacy and outdoor space. Musharif Villas is the preferred shortlist, with a budget between AED 3.47M and AED 4.78M and readiness to view if a suitable unit is available."
  },
  {
    id: "demo_johnson_006",
    name: "Johnson Matt",
    phone: "+971 56 762 7654",
    email: "johnson.matt@example.com",
    intent: "Invest",
    project_name: "Al Jurf Villas",
    budget_min: 1540000,
    budget_max: 1540000,
    currency: "AED",
    location: "Al Jurf",
    unit_type: "Villa",
    bedrooms: "3",
    timeline: "Q1 2026",
    tags: "investment, villa, al-jurf, capital-growth",
    lead_score: 79,
    lead_grade: "Warm",
    status: "Follow-up - compare villas",
    date: "2026-02-07T13:20:00.000Z",
    summary: "Johnson is comparing villa-led investment options and wants a calm residential location with long-term growth potential. He prefers Al Jurf Villas and has a fixed AED 1.54M planning budget."
  },
  {
    id: "demo_noura_007",
    name: "Noura Salem",
    phone: "+971 50 447 6190",
    email: "noura.salem@example.com",
    intent: "Commercial",
    project_name: "Horizon University",
    budget_min: 650000,
    budget_max: 1200000,
    currency: "AED",
    location: "Ajman",
    unit_type: "Office",
    bedrooms: "Commercial",
    timeline: "This quarter",
    tags: "commercial, office, education-district, investor",
    lead_score: 72,
    lead_grade: "Warm",
    status: "New - commercial qualification",
    date: "2026-02-06T10:10:00.000Z",
    summary: "Noura is exploring office-style commercial opportunities near education-led demand drivers. Horizon University came up as the preferred reference point, and she wants a practical budget-led shortlist this quarter."
  },
  {
    id: "demo_omar_008",
    name: "Omar Hassan",
    phone: "+971 55 903 4412",
    email: "omar.hassan@example.com",
    intent: "Buy",
    project_name: "Ajman Uptown",
    budget_min: 980000,
    budget_max: 1450000,
    currency: "AED",
    location: "Ajman Uptown",
    unit_type: "Townhouse",
    bedrooms: "3",
    timeline: "Within 6 months",
    tags: "townhouse, family, value-buy, ajman-uptown",
    lead_score: 81,
    lead_grade: "Hot",
    status: "Qualified - family shortlist",
    date: "2026-02-05T15:35:00.000Z",
    summary: "Omar is looking for a 3-bedroom townhouse for family use with a practical budget. Ajman Uptown is the leading interest because he wants more space than an apartment without moving into a high-ticket villa."
  },
  {
    id: "demo_sara_009",
    name: "Sara Ahmed",
    phone: "+971 58 332 9014",
    email: "sara.ahmed@example.com",
    intent: "Rent",
    project_name: "Al Gharoub",
    budget_min: 68000,
    budget_max: 92000,
    currency: "AED",
    location: "Al Gharoub",
    unit_type: "Apartment",
    bedrooms: "1",
    timeline: "Move-in next month",
    tags: "rent, one-bedroom, professional, budget-focused",
    lead_score: 68,
    lead_grade: "Warm",
    status: "New - rental enquiry",
    date: "2026-02-04T12:05:00.000Z",
    summary: "Sara needs a 1-bedroom rental for professional use and is sensitive to monthly cost. Al Gharoub is preferred, with a move-in target next month and annual budget around AED 68K-AED 92K."
  },
  {
    id: "demo_khalid_010",
    name: "Khalid Saeed",
    phone: "+971 52 640 2291",
    email: "khalid.saeed@example.com",
    intent: "Commercial",
    project_name: "Ajman Corniche Residences",
    budget_min: 1200000,
    budget_max: 2100000,
    currency: "AED",
    location: "Ajman Corniche",
    unit_type: "Retail",
    bedrooms: "Commercial",
    timeline: "Q3 2026",
    tags: "commercial, retail, corniche, footfall",
    lead_score: 74,
    lead_grade: "Warm",
    status: "Follow-up - retail availability",
    date: "2026-02-03T17:45:00.000Z",
    summary: "Khalid is evaluating retail-facing opportunities near the Corniche where visibility and visitor traffic matter. He wants to understand available commercial inventory before planning a Q3 2026 decision."
  },
  {
    id: "demo_lina_011",
    name: "Lina Mansour",
    phone: "+971 56 118 7740",
    email: "lina.mansour@example.com",
    intent: "Invest",
    project_name: "Dusit Thani Residences Ajman",
    budget_min: 1900000,
    budget_max: 2750000,
    currency: "AED",
    location: "Ajman Corniche",
    unit_type: "Branded Apartment",
    bedrooms: "2",
    timeline: "Exploring now",
    tags: "investment, branded-residence, waterfront, premium",
    lead_score: 86,
    lead_grade: "Hot",
    status: "Qualified - investment comparison",
    date: "2026-02-02T08:55:00.000Z",
    summary: "Lina is interested in a premium 2-bedroom branded residence and asked to compare Dusit Thani against waterfront alternatives. Her budget range is AED 1.9M-AED 2.75M, with investment positioning as the main driver."
  },
  {
    id: "demo_rashid_012",
    name: "Rashid Faris",
    phone: "+971 55 129 8873",
    email: "rashid.faris@example.com",
    intent: "Buy",
    project_name: "Al Jurf Villas",
    budget_min: 2850000,
    budget_max: 4200000,
    currency: "AED",
    location: "Al Jurf",
    unit_type: "Villa",
    bedrooms: "4",
    timeline: "Ready if suitable",
    tags: "family-villa, al-jurf, ready-if-suitable, privacy",
    lead_score: 83,
    lead_grade: "Hot",
    status: "Qualified - consultant call booked",
    date: "2026-02-01T18:30:00.000Z",
    summary: "Rashid wants a 4-bedroom family villa with privacy and a quieter residential feel. Al Jurf Villas is the target project, and he is prepared to move quickly if the right layout and payment terms are available."
  }
];

function buildDemoLeadRows(data) {
  return POLISHED_DEMO_LEADS.map((row) => {
    const budget = formatBudgetRange(row.budget_min, row.budget_max, row.currency);
    return {
      ...row,
      lead_id: row.id,
      contact: `${row.phone} / ${row.email}`,
      purpose: row.intent,
      interested_project: row.project_name,
      property_name: row.project_name,
      region: row.location,
      bedrooms_min: row.bedrooms,
      area_sqft: row.unit_type.includes("Villa") ? "Details with consultant" : "Published layout review",
      budget,
      score: row.lead_score,
      source_file: "Polished Aqaar demo intelligence fallback",
      kb_source: "AQAAR-KB-ACQ-FINAL-v3 + Intelligence-Layer-v2 dashboard fallback",
      source_record_type: "demo_lead",
      unknown_fields: "none",
      message: row.summary,
      notes: row.summary
    };
  });
}

function buildRuntimeSheets(data) {
  const demoLeads = buildDemoLeadRows(data);
  return [
    sheetMeta("audit.csv", data.intelligenceAudit || [], "Intelligence-Layer-v2/csv/aqaar_audit.csv"),
    sheetMeta("leads.csv", demoLeads, "Dashboard polished demo leads"),
    sheetMeta("leads_seed.csv", demoLeads, "Dashboard polished seed fallback")
  ];
}

function sheetMeta(filename, rows, source) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
  return {
    filename,
    source,
    row_count: rows.length,
    column_count: columns.length,
    last_modified: new Date().toISOString(),
    columns,
    preview_rows: rows.slice(0, 8)
  };
}

function formatBudgetRange(min, max, currency = "AED") {
  const a = Number(min);
  const b = Number(max);
  if (Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0 && a !== b) return `${currency || "AED"} ${a.toLocaleString("en-US")} - ${b.toLocaleString("en-US")}`;
  if (Number.isFinite(a) && a > 0) return `${currency || "AED"} ${a.toLocaleString("en-US")}`;
  if (Number.isFinite(b) && b > 0) return `${currency || "AED"} ${b.toLocaleString("en-US")}`;
  return "Budget to be discussed";
}

const VALID_DASHBOARD_INTENTS = new Set([
  "buy",
  "rent",
  "invest",
  "commercial",
  "price",
  "payment_plan",
  "comparison",
  "property_search",
  "location_freehold",
  "amenities",
  "image_analysis",
  "small_talk",
  "name_contact_capture",
  "unclear"
]);

function countIntents(values = []) {
  return values.reduce((acc, value) => {
    const intent = normalizeDashboardIntent(value);
    if (intent) acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});
}

function normalizeDashboardIntent(value) {
  const text = norm(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!text || text === "unknown") return "";
  if (text === "payment_plans") return "payment_plan";
  if (text === "compare") return "comparison";
  if (text === "location" || text === "freehold") return "location_freehold";
  if (text === "greeting") return "small_talk";
  if (text === "contact_capture") return "name_contact_capture";
  if (text === "image_analysis_unavailable") return "image_analysis";
  return VALID_DASHBOARD_INTENTS.has(text) ? text : "";
}

function knownOrDisplay(value) {
  return isKnown(value) ? String(value).trim() : "Available on enquiry";
}

function deriveSeedIntent(row) {
  if (isKnown(row.purpose)) return row.purpose;
  const type = norm(row.unit_type);
  const source = norm(row.source_url);
  if (type.includes("commercial") || type.includes("office") || type.includes("retail") || type.includes("clinic")) return "commercial";
  if (source.includes("rent")) return "rent";
  if (Number(row.budget_min) > 0 || Number(row.budget_max) > 0) return "buy";
  return "invest";
}

function isGreeting(message) {
  return /^(hi|hey|hello|good morning|good afternoon|good evening|salam|السلام عليكم|yo|howdy|greetings|hiya|hii|heyyy?)[!.?\s]*$/i.test(String(message || "").trim());
}

function isSmallTalk(message) {
  const text = norm(message).replace(/[!?.,\s]+$/g, "");
  return /^(how are you|how are you doing|how r u|what'?s up|whats up|thank you|thanks|thx|ok|okay|cool|great|nice|who are you|i'?m good|im good|sounds good|perfect|awesome|no problem|sure|alright|got it|noted|wonderful|excellent)$/.test(text);
}

function isGeneralChat(message) {
  return isSmallTalk(message);
}

function isNameOrContact(message) {
  return Boolean(captureLead(message).name !== "unknown" || captureLead(message).phone !== "unknown" || captureLead(message).email !== "unknown");
}

function captureNationality(message) {
  const match = String(message || "").match(/\b(?:from|based in|based|coming from)\s+([A-Za-z][A-Za-z\s.'-]{1,32})\b/i)
    || String(message || "").match(/\b(?:i am|i'm|im)\s+from\s+([A-Za-z][A-Za-z\s.'-]{1,32})\b/i);
  const value = match?.[1]?.replace(/\b(and|looking|interested|budget|phone|number)\b.*$/i, "").trim();
  return value || "unknown";
}

function isNationalityMessage(message) {
  const nationality = captureNationality(message);
  return nationality !== "unknown" && /\b(from|based|india|uae|dubai|abu dhabi|pakistan|uk|usa|saudi)\b/i.test(String(message || ""));
}

// ── Pending Context Resolution ─────────────────────────────────────────────
// When the AI asks a clarification question, it stores pending_context in
// session.memory. The next user message is checked here BEFORE any routing.
// Short replies like "USD", "AED", "2", "rent", "Ajman" are merged back into
// the original context and the conversation continues naturally.

const CURRENCY_REPLY_MAP = {
  aed: "AED", dirham: "AED", dirhams: "AED", دراهم: "AED",
  usd: "USD", dollar: "USD", dollars: "USD",
  inr: "INR", rupee: "INR", rupees: "INR",
  sar: "SAR", riyal: "SAR", riyals: "SAR",
  gbp: "GBP", pound: "GBP", pounds: "GBP",
  eur: "EUR", euro: "EUR", euros: "EUR"
};

function parseCurrencyReply(message) {
  const t = norm(message).trim();
  return CURRENCY_REPLY_MAP[t] || parseCurrency(message) || null;
}

function isClarificationReply(message, session) {
  const pc = session && session.memory && session.memory.pending_context ? session.memory.pending_context : null;
  if (!pc) return false;
  const t = norm(message).trim();
  // A clarification reply is a SHORT message (≤5 words) that doesn't look like
  // a new greeting or a full new question
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  if (wordCount > 6) return false;
  if (isGreeting(message)) return false;
  return true;
}

function resolvePendingContext(message, session) {
  const pc = session.memory.pending_context;
  if (!pc) return null;

  const t = norm(message).trim();
  const currency = parseCurrencyReply(message);

  // ── currency_clarification ──────────────────────────────────────────────
  if (pc.type === "currency_clarification") {
    const resolved = currency || "AED"; // default to AED if still ambiguous
    const rawAmount = pc.budget_amount || 0;
    let finalBudget = rawAmount;
    if (resolved === "USD") finalBudget = Math.round(rawAmount * 3.67);
    else if (resolved === "INR") finalBudget = Math.round(rawAmount / 22.5);
    else if (resolved === "SAR") finalBudget = Math.round(rawAmount * 0.98);
    else if (resolved === "GBP") finalBudget = Math.round(rawAmount * 4.62);
    else if (resolved === "EUR") finalBudget = Math.round(rawAmount * 4.0);
    session.memory.budget = finalBudget;
    session.memory.currency = resolved;
    if (pc.property_type) session.memory.property_type = pc.property_type;
    delete session.memory.pending_context;
    const displayOriginal = rawAmount.toLocaleString("en-US");
    const displayAed = finalBudget.toLocaleString("en-US");
    return {
      resolved: true,
      type: "currency_clarification",
      merged_message: (pc.original_message || "") + " currency: " + resolved,
      summary: resolved + " " + displayOriginal + " (AED " + displayAed + ")",
      context_note: "Currency clarified: " + resolved + " " + displayOriginal + " = AED " + displayAed
    };
  }

  // ── bedroom_clarification ───────────────────────────────────────────────
  if (pc.type === "bedroom_clarification") {
    const beds = parseBedrooms(t);
    if (beds !== null) {
      session.memory.bedrooms = beds;
      delete session.memory.pending_context;
      return {
        resolved: true,
        type: "bedroom_clarification",
        merged_message: (pc.original_message || "") + " " + beds + " bedrooms",
        context_note: "Bedrooms clarified: " + beds
      };
    }
  }

  // ── location_clarification ──────────────────────────────────────────────
  if (pc.type === "location_clarification") {
    const loc = parseLocation(t) || (t.length > 1 && t.length < 40 ? t : null);
    if (loc) {
      session.memory.location = loc;
      delete session.memory.pending_context;
      return {
        resolved: true,
        type: "location_clarification",
        merged_message: (pc.original_message || "") + " location: " + loc,
        context_note: "Location clarified: " + loc
      };
    }
  }

  // ── purpose_clarification ───────────────────────────────────────────────
  if (pc.type === "purpose_clarification") {
    const purposeMap = {
      buy: "buy", purchase: "buy", buying: "buy",
      rent: "rent", renting: "rent", rental: "rent",
      invest: "invest", investing: "invest", investment: "invest",
      commercial: "commercial", business: "commercial",
      yes: null, no: null
    };
    const purpose = purposeMap[t] || null;
    if (purpose) {
      session.memory.purpose = purpose;
      delete session.memory.pending_context;
      return {
        resolved: true,
        type: "purpose_clarification",
        merged_message: (pc.original_message || "") + " purpose: " + purpose,
        context_note: "Purpose clarified: " + purpose
      };
    }
  }

  // ── generic short clarification: try to resolve any known field ─────────
  // If currency reply detected regardless of type
  if (currency) {
    const rawAmount = session.memory.budget || 0;
    let finalBudget = rawAmount;
    if (currency === "USD") finalBudget = Math.round(rawAmount * 3.67);
    else if (currency === "INR") finalBudget = Math.round(rawAmount / 22.5);
    session.memory.currency = currency;
    if (finalBudget !== rawAmount) session.memory.budget = finalBudget;
    delete session.memory.pending_context;
    return {
      resolved: true,
      type: "generic_currency_clarification",
      merged_message: (pc.original_message || message) + " currency: " + currency,
      context_note: "Currency inferred: " + currency
    };
  }

  // Could not resolve — clear pending_context to avoid stale state and let
  // the message flow through normal routing
  delete session.memory.pending_context;
  return { resolved: false, type: pc.type };
}
function isAmbiguousBudgetMessage(message) {
  const text = String(message || "");
  if (!/\b(budget|under|below|around|up to|price|cost)\b/i.test(text)) return false;
  if (/\b(aed|dirham|usd|dollar|inr|rupee|sar|riyal)\b/i.test(text)) return false;
  return /\b\d[\d,.]*\s*(k|m|million|thousand)?\b/i.test(text);
}

function routeIntent(data, message) {
  const text = norm(message);
  const entities = extractEntities(data, message);
  const namedProjects = findNamedProjects(allProfiles(data), message);
  if (isGreeting(message)) return { intent: "greeting", property_intent: false, entities };
  if (isGeneralChat(message)) return { intent: "unclear", property_intent: false, entities };
  if (isNationalityMessage(message)) return { intent: "nationality_capture", property_intent: false, entities: { ...entities, nationality: captureNationality(message) } };
  if (isNameOrContact(message)) return { intent: "name_contact_capture", property_intent: false, entities };
  if (!text.trim()) return { intent: "unclear", property_intent: false, entities };
  if (/\bcompare\b/.test(text) && namedProjects.length >= 2) return { intent: "comparison", property_intent: true, entities };
  if (/\bpayment plan|payment plans|installment|instalment|down payment|cheque|cheques\b/.test(text)) return { intent: "payment_plan", property_intent: true, entities };
  if (/\bprice|prices|priced|range|cost|budget|under|below|cheapest|lowest price|least expensive|affordable\b/.test(text)) return { intent: "price", property_intent: true, entities };
  if (/\bamenit|facilit|gym|pool|kids|parking|beach|waterfront|sea view|corniche\b/.test(text)) return { intent: "amenities", property_intent: true, entities };
  if (/\bfreehold|location|community|area|nearby|landmark|landmarks|school|schools|hospital|hospitals|university\b/.test(text)) return { intent: "location_freehold", property_intent: true, entities };
  if (/\binvest|investment|roi|yield\b/.test(text)) return { intent: "investment", property_intent: true, entities };
  if (/\bcommercial|office|retail|clinic|warehouse|shop\b/.test(text)) return { intent: "commercial", property_intent: true, entities };
  if (/\b(buy|rent|lease|property|properties|project|projects|apartment|apartments|flat|studio|villas?|townhouse|bed|bedroom|br)\b/.test(text)) return { intent: "property_search", property_intent: true, entities };
  if (namedProjects.length) return { intent: "property_search", property_intent: true, entities };
  if (parseBedrooms(text) !== null || Boolean(parseBudget(text))) return { intent: "property_search", property_intent: true, entities };
  return { intent: "unclear", property_intent: false, entities };
}

function isPropertyRelatedMessage(data, message) {
  return routeIntent(data, message).property_intent;
}

function extractEntities(data, message) {
  const text = norm(message);
  const slots = parseSlots(message);
  const lead = captureLead(message);
  const named = findNamedProjects(allProfiles(data), message).map((profile) => profile.project_name);
  const hasBudgetLanguage = /\b(budget|under|below|around|up to|aed|million|m|k|thousand|price|cost)\b/i.test(String(message || ""));
  const budget = lead.phone !== "unknown" && !hasBudgetLanguage ? "unknown" : (slots.budget || "unknown");
  return {
    project_name: named[0] || "unknown",
    project_names: named,
    location: slots.location || "unknown",
    property_type: slots.property_type || slots.commercial_type || "unknown",
    bedrooms: slots.bedrooms ?? "unknown",
    budget,
    purpose: slots.purpose || "unknown",
    amenities: slots.amenities || [],
    timeline: slots.timeline || "unknown",
    name: lead.name,
    phone: lead.phone,
    email: lead.email
  };
}

async function nonPropertyResponse(session, message, route) {
  const leadName = route.entities && route.entities.name !== "unknown" ? route.entities.name : null;
  // Persist name into session memory immediately so all subsequent turns know it
  if (leadName && (!session.memory || !session.memory.name)) {
    if (!session.memory) session.memory = {};
    session.memory.name = leadName;
  }
  // Generate a dynamic, context-aware conversational reply via Gemini
  const convResult = await generateConversationalResponse(route.intent, message, session);
  const answer = convResult.text;
  session.turns.push({ message, intent: route.intent, parsed: route.entities, lead: route.entities });
  // Track previous AI replies to avoid repetition
  if (!session.previousReplies) session.previousReplies = [];
  session.previousReplies.push(answer);
  if (session.previousReplies.length > 12) session.previousReplies = session.previousReplies.slice(-12);
  return {
    fallbackAnswer: answer,
    response_type: route.intent,
    intent: { intent: route.intent, trigger_hits: [], all_matches: [], source: "Concierge pre-retrieval intent gate" },
    fallback_reason: route.intent,
    follow_up: route.intent === "name_contact_capture" ? "Would you like to buy, rent, invest, or explore commercial properties?" : "",
    llm_used: convResult.llm_used,
    model_used: convResult.model_used
  };
}
// ── Dynamic Conversational Response Engine ────────────────────────────────
// Generates fresh, context-aware replies using Gemini for every non-property
// interaction. Falls back to varied local text only when Gemini is unavailable
// (e.g. test environments). No static template arrays — every response is
// generated from context so it never repeats verbatim.

function buildConversationalPrompt(intent, message, session) {
  const name = session && session.memory ? session.memory.name || null : null;
  const recentHistory = (session && session.turns ? session.turns : []).slice(-6).map(function(t) {
    return { user: t.message, intent: t.intent };
  });
  const previousAiReplies = (session && session.previousReplies ? session.previousReplies : []).slice(-4);
  const memorySnapshot = {
    name: name,
    purpose: session && session.memory ? (session.memory.purpose || null) : null,
    property_type: session && session.memory ? (session.memory.property_type || null) : null,
    location: session && session.memory ? (session.memory.location || null) : null,
    budget: session && session.memory ? (session.memory.budget || null) : null,
    bedrooms: session && session.memory ? (session.memory.bedrooms || null) : null
  };

  return [
    "You are Aqaar AI — a senior luxury real-estate consultant for Ajman, UAE.",
    "Your personality: warm, confident, premium, and never robotic. You sound like a 5-star hotel concierge who happens to know Ajman real estate inside out.",
    "",
    "TASK: Write a short conversational reply to the user message below.",
    "This is a lightweight conversational moment — NOT a property search.",
    "",
    "RULES:",
    "1. Do NOT mention any property name, project, price, KB data, or Aqaar KB facts.",
    "2. Keep it to 1-2 short sentences maximum.",
    "3. Sound natural, warm, and slightly different every time — never templated.",
    "4. If the user shared their name, acknowledge them by name warmly.",
    "5. After acknowledging, transition with ONE gentle open question to understand what they need.",
    "6. Do NOT ask multiple questions at once.",
    "7. Do NOT repeat any sentence from the previous AI replies list.",
    "8. Vary your language — do not always start with the same phrase.",
    "9. No markdown, no bullet points, no emojis unless very natural.",
    "",
    "Intent type: " + intent,
    "User message: \"" + message + "\"",
    "User name: " + (name ? name : "not yet known"),
    "",
    "Conversation so far (last 6 turns):",
    JSON.stringify(recentHistory, null, 2),
    "",
    "Previous AI replies — do NOT repeat these:",
    JSON.stringify(previousAiReplies, null, 2),
    "",
    "Session context:",
    JSON.stringify(memorySnapshot, null, 2),
    "",
    "Write your reply now (plain text only, 1-2 sentences):"
  ].join("\n");
}

// Local fallbacks — used ONLY when Gemini is unavailable (test environment / timeout).
// Kept varied per intent so even offline mode avoids repetition.
const CONV_FALLBACKS = {
  greeting: [
    "Hey there! Great to have you here. What can I help you with today — buying, renting, or investing in Ajman?",
    "Hello! Welcome to Aqaar. Are you looking to buy, rent, invest, or explore commercial options?",
    "Hi! Good to see you. What kind of property are you exploring today?",
    "Hey! Happy to help. Are you thinking about buying, renting, or investing in Ajman?"
  ],
  name_contact_capture: [
    "Pleasure to meet you! What kind of property are you looking for today?",
    "Great to have you here! Are you exploring something in Ajman — apartments, villas, or something else?",
    "Lovely to meet you. What brings you to Aqaar today?",
    "Nice to connect! Are you looking to buy, rent, or invest?"
  ],
  nationality_capture: [
    "Wonderful — we love working with international clients. Are you thinking of this as an investment or for personal use?",
    "That's great — we can make the whole process smooth. Are you looking to buy or invest?",
    "Perfect, we handle this regularly. Is this for investment or personal use?"
  ],
  unclear: [
    "All good here! Ready to help whenever you are. What kind of property are you exploring?",
    "Doing well, thanks! What can I help you find today?",
    "Happy to help — what's on your mind?",
    "Great to hear from you! What kind of property are you looking into?"
  ]
};

function messageHash(message) {
  // Simple deterministic hash of message content so different greeting words
  // get different fallback variants even in fresh sessions with 0 turns.
  let h = 0;
  const s = String(message || "").toLowerCase().trim();
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) & 0xffffff; }
  return h;
}

function getFallbackConversationalReply(intent, session, message) {
  const variants = CONV_FALLBACKS[intent] || CONV_FALLBACKS.unclear;
  const previousReplies = session && session.previousReplies ? session.previousReplies : [];
  const unused = variants.filter(function(v) { return !previousReplies.includes(v); });
  const pool = unused.length ? unused : variants;
  // Use message hash so different greeting words ("hey" vs "hello" vs "hi")
  // produce different variants even in fresh sessions with identical turn count.
  const turnCount = (session && session.turns ? session.turns.length : 0);
  const hash = messageHash(message || "");
  const idx = (turnCount + hash) % pool.length;
  return pool[idx];
}
async function generateConversationalResponse(intent, message, session) {
  const prompt = buildConversationalPrompt(intent, message, session);
  const result = await generateWithGemini({ prompt, maxAttempts: 1, fallbackModels: false, timeoutMs: 6000 });
  if (result.used && result.text) {
    return { text: result.text.trim(), llm_used: true, model_used: result.model_used };
  }
  // Gemini unavailable — use local variant
  const name = session && session.memory ? (session.memory.name || null) : null;
  let fallback = getFallbackConversationalReply(intent, session, message);
  if (intent === "name_contact_capture" && name && !fallback.includes(name)) {
    fallback = "Nice to meet you, " + name + "! " + fallback.replace(/^[A-Z][^!]+!\s*/, "");
  }
  return { text: fallback, llm_used: false, model_used: null };
}
function buildGreetingPrompt(message, type) {
  return [
    "You are the Aqaar AI Concierge.",
    "The user sent a greeting or general chat message, not a property search.",
    "Do not mention any property, project, price, or card.",
    "Reply warmly in one or two short sentences and ask what Aqaar property help they need.",
    "",
    `Message type: ${type}`,
    `User message: ${message}`
  ].join("\n");
}

function chatDebug(stage, payload = {}) {
  if (process.env.CHAT_DEBUG === "false") return;
  console.log(`[chat:${stage}] ${JSON.stringify(payload, null, 2)}`);
}

function summarizeLlmResult(result = {}) {
  return {
    provider: result.provider,
    model: result.model,
    used: result.used,
    reason: result.reason,
    error: result.error,
    text_preview: String(result.text || "").slice(0, 1000),
    raw_response: result.raw_response,
    model_used: result.model_used,
    attempted_models: result.attempted_models,
    attempts: result.attempts
  };
}

function summarizeFinalJson(result = {}) {
  return {
    session_id: result.session_id,
    llm_used: result.llm_used,
    property_intent: result.property_intent,
    fallback_reason: result.fallback_reason,
    response_type: result.response_type,
    answer_preview: String(result.answer || "").slice(0, 1000),
    cards: (result.cards || []).map((card) => card.project),
    sources: result.sources,
    follow_up: result.follow_up
  };
}

function logChatOrchestration({ intent, entities, shouldUseRag, chunksCount = 0, model = null, geminiError = null, fallback_reason = null, vision = null }) {
  console.log(`[chat:orchestration] ${JSON.stringify({
    intent,
    entities,
    shouldUseRag,
    chunksCount,
    model,
    geminiError,
    fallback_reason,
    vision
  })}`);
}

async function analyzeUploadedImages(message, images = []) {
  if (!images.length) return { used: false, description: "", features: [], error: null };
  const prompt = [
    "You are Gemini Vision for the Aqaar AI Concierge.",
    "Analyze only the uploaded image. Do not infer facts that are not visible.",
    "Return ONLY valid JSON. Do not include markdown.",
    "Describe visible property features and classify visual cues for semantic property search.",
    "Use unknown when a field is not visible.",
    "",
    "JSON schema:",
    JSON.stringify({
      visual_description: "natural concise description of the uploaded image",
      property_type: "apartment|villa|townhouse|commercial|unknown",
      architecture: "string or unknown",
      luxury_level: "standard|premium|luxury|unknown",
      floors: "number or unknown",
      exterior_style: "string or unknown",
      colour_palette: "string or unknown",
      waterfront: true,
      pool: true,
      garden: true,
      residential_or_commercial: "residential|commercial|mixed|unknown",
      search_features: ["semantic search terms visible in the image"]
    }, null, 2),
    "",
    `User message: ${message || "Find similar Aqaar properties from this image."}`
  ].join("\n");
  console.log(`[vision:request] ${JSON.stringify({ images: images.length, model: GEMINI_MODEL })}`);
  const result = await generateWithGemini({ prompt, images, maxAttempts: 2, fallbackModels: false, timeoutMs: 45000 });
  if (!result.used) {
    console.log(`[vision:error] ${JSON.stringify({ model: result.model || GEMINI_MODEL, reason: result.reason, error: result.error })}`);
    return { used: false, description: "", features: [], error: result.error || result.reason, model_used: result.model_used || null };
  }
  const parsed = parseJsonObject(result.text);
  if (!parsed) {
    console.log(`[vision:error] ${JSON.stringify({ model: result.model_used || result.model, reason: "vision_invalid_json", raw_preview: String(result.text || "").slice(0, 500) })}`);
    return { used: false, description: "", features: [], error: "vision_invalid_json", raw_text: result.text, model_used: result.model_used || result.model };
  }
  const features = normalizeVisionFeatures(parsed);
  const analysis = {
    used: true,
    model_used: result.model_used || result.model,
    description: knownOrUnknown(parsed.visual_description),
    features,
    raw: {
      property_type: knownOrUnknown(parsed.property_type),
      architecture: knownOrUnknown(parsed.architecture),
      luxury_level: knownOrUnknown(parsed.luxury_level),
      floors: parsed.floors ?? "unknown",
      exterior_style: knownOrUnknown(parsed.exterior_style),
      colour_palette: knownOrUnknown(parsed.colour_palette),
      waterfront: Boolean(parsed.waterfront),
      pool: Boolean(parsed.pool),
      garden: Boolean(parsed.garden),
      residential_or_commercial: knownOrUnknown(parsed.residential_or_commercial)
    }
  };
  console.log(`[vision:success] ${JSON.stringify({ model: analysis.model_used, description: analysis.description, features: analysis.features })}`);
  return analysis;
}

function normalizeVisionFeatures(parsed = {}) {
  const values = [
    parsed.property_type,
    parsed.architecture,
    parsed.luxury_level,
    parsed.exterior_style,
    parsed.colour_palette,
    parsed.residential_or_commercial,
    parsed.waterfront ? "waterfront" : "",
    parsed.pool ? "pool" : "",
    parsed.garden ? "garden" : "",
    ...(Array.isArray(parsed.search_features) ? parsed.search_features : [])
  ];
  return [...new Set(values.map((value) => knownOrUnknown(value)).filter((value) => value !== "unknown"))];
}

function buildVisionAiPlan(message, visionAnalysis = {}) {
  const propertyType = knownOrUnknown(visionAnalysis.raw?.property_type);
  return {
    intent: "image_analysis",
    entities: {
      project_name: "unknown",
      project_names: [],
      location: "unknown",
      property_type: propertyType,
      bedrooms: "unknown",
      budget: "unknown",
      purpose: propertyType === "commercial" ? "commercial" : "buy",
      amenities: (visionAnalysis.features || []).filter((feature) => /pool|garden|waterfront|beach|luxury|modern|commercial|residential/i.test(feature)),
      timeline: "unknown",
      image_features: visionAnalysis.features || [],
      name: "unknown",
      phone: "unknown",
      email: "unknown"
    },
    requires_rag: true,
    small_talk: false,
    follow_up: false,
    references_image: true,
    image_features: visionAnalysis.features || [],
    search_query: [message, visionAnalysis.description, ...(visionAnalysis.features || [])].filter(isKnown).join(" "),
    response_hint: ""
  };
}

async function planChatWithGemini(data, message, session, images = [], visionAnalysis = null) {
  const prompt = buildPlannerPrompt(data, message, session, images, visionAnalysis);
  const plannerImages = visionAnalysis?.used ? [] : images;
  const result = await generateWithGemini({ prompt, images: plannerImages, maxAttempts: 1, fallbackModels: false, timeoutMs: 8000 });
  if (!result.used) {
    return {
      used: false,
      model_used: result.model_used || null,
      error: result.error || result.reason,
      plan: fallbackAiPlan(data, message, session)
    };
  }
  const parsed = parseJsonObject(result.text);
  if (!parsed) {
    return {
      used: false,
      model_used: result.model_used || result.model,
      error: "planner_invalid_json",
      raw_text: result.text,
      plan: fallbackAiPlan(data, message, session)
    };
  }
  return {
    used: true,
    model_used: result.model_used || result.model,
    raw_text: result.text,
    plan: normalizeAiPlan(data, message, parsed)
  };
}

function buildPlannerPrompt(data, message, session, images = [], visionAnalysis = null) {
  const knownProjects = allProfiles(data).map((profile) => profile.project_name).filter(isKnown).slice(0, 160);
  const memory = {
    ...session.memory,
    client_name: (session.memory && session.memory.name) ? session.memory.name : null,
    recent_turns: (session.turns || []).slice(-5).map((turn) => ({
      user_message: turn.message,
      intent: turn.intent,
      parsed: turn.parsed
    })),
    last_project_ids: session.lastProfiles || [],
    previous_ai_replies: (session.previousReplies || []).slice(-4)
  };
  return [
    "You are the Aqaar AI Concierge orchestration planner.",
    "You must plan every user message before retrieval or answering.",
    "Classify the user's latest message before any KB retrieval.",
    "Return ONLY valid JSON. Do not include markdown.",
    "Use conversation memory to understand short follow-ups such as Ajman, 2 bedrooms, under 90k, similar, show another one.",
    "If an image is attached, inspect it and describe visible architectural/property features for semantic property search.",
    "Do not answer with property facts. This is planning only.",
    "Allowed high-level intents are natural labels such as small_talk, contact_capture, property_search, project_lookup, price, payment_plan, amenities, location, comparison, investment, commercial, out_of_scope.",
    "Set requires_rag true only when Aqaar KB retrieval is needed.",
    "Set follow_up true when the latest message relies on previous context.",
    "When the user gives a short value such as 2, Ajman, under 90k, similar, or show another one, resolve it against memory.",
    "For small talk, provide a warm response_hint and set requires_rag false.",
    "",
    "JSON schema:",
    JSON.stringify({
      intent: "string",
      entities: {
        location: "string or unknown",
        bedrooms: "number or unknown",
        budget: "number or unknown",
        amenities: ["string"],
        property_type: "string or unknown",
        project_names: ["string"],
        purpose: "buy|rent|invest|commercial|unknown",
        timeline: "string or unknown"
      },
      requires_rag: true,
      small_talk: false,
      follow_up: false,
      references_image: false,
      image_features: ["string"],
      search_query: "string",
      response_hint: "short natural response for small talk/contact only"
    }, null, 2),
    "",
    `Known Aqaar projects: ${knownProjects.join(", ")}`,
    `Conversation memory JSON: ${JSON.stringify(memory)}`,
    `Image attached: ${images.length > 0}`,
    `Vision analysis JSON: ${JSON.stringify(visionAnalysis || { used: false })}`,
    `Latest user message: ${message}`
  ].join("\n");
}

function parseJsonObject(text) {
  const raw = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAiPlan(data, message, parsed = {}) {
  const fallback = fallbackAiPlan(data, message);
  const entities = parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {};
  const projectNames = Array.isArray(entities.project_names)
    ? entities.project_names
    : (entities.project_name ? [entities.project_name] : fallback.entities.project_names);
  const normalized = {
    intent: knownOrUnknown(parsed.intent || fallback.intent),
    entities: {
      project_name: projectNames.find(isKnown) || "unknown",
      project_names: projectNames.filter(isKnown),
      location: knownOrUnknown(entities.location || fallback.entities.location),
      property_type: knownOrUnknown(entities.property_type || fallback.entities.property_type),
      bedrooms: entities.bedrooms ?? fallback.entities.bedrooms,
      budget: entities.budget ?? fallback.entities.budget,
      purpose: knownOrUnknown(entities.purpose || fallback.entities.purpose),
      amenities: Array.isArray(entities.amenities) ? entities.amenities.filter(isKnown) : fallback.entities.amenities,
      timeline: knownOrUnknown(entities.timeline || fallback.entities.timeline),
      image_features: Array.isArray(parsed.image_features) ? parsed.image_features.filter(isKnown) : [],
      name: fallback.entities.name,
      phone: fallback.entities.phone,
      email: fallback.entities.email
    },
    requires_rag: Boolean(parsed.requires_rag),
    small_talk: Boolean(parsed.small_talk),
    follow_up: Boolean(parsed.follow_up),
    references_image: Boolean(parsed.references_image),
    image_features: Array.isArray(parsed.image_features) ? parsed.image_features.filter(isKnown) : [],
    search_query: knownOrUnknown(parsed.search_query || ""),
    response_hint: knownOrUnknown(parsed.response_hint || "")
  };
  if (normalized.references_image || normalized.image_features.length) normalized.requires_rag = true;
  if (normalized.small_talk) normalized.requires_rag = false;
  return normalized;
}

function fallbackAiPlan(data, message, session = null) {
  const route = routeIntent(data, message);
  const slots = parseSlots(message);
  const hasMemoryContext = Boolean(session?.memory?.purpose || session?.memory?.property_type || session?.memory?.location || session?.memory?.budget || session?.memory?.bedrooms || session?.lastProfiles?.length);
  const hasFollowUpFilter = Boolean(slots.location || slots.bedrooms !== undefined || slots.budget || slots.property_type || slots.amenities?.length);
  const asksContinuation = /\b(another|similar|more|next|show more|same)\b/i.test(String(message || ""));
  const shouldContinueRag = hasMemoryContext && (hasFollowUpFilter || asksContinuation);
  const entities = shouldContinueRag
    ? mergeKnown(route.entities, {
        location: slots.location || session?.memory?.location,
        property_type: slots.property_type || session?.memory?.property_type,
        bedrooms: slots.bedrooms ?? session?.memory?.bedrooms,
        budget: slots.budget || session?.memory?.budget,
        purpose: slots.purpose || session?.memory?.purpose,
        amenities: slots.amenities?.length ? slots.amenities : session?.memory?.amenities
      })
    : route.entities;
  return {
    intent: shouldContinueRag ? "property_search" : route.intent,
    entities,
    requires_rag: shouldContinueRag || route.property_intent,
    small_talk: !shouldContinueRag && !route.property_intent && route.intent !== "name_contact_capture",
    follow_up: false,
    references_image: false,
    image_features: [],
    search_query: message,
    response_hint: ""
  };
}

function routeFromAiPlan(data, message, aiPlan) {
  if (isNationalityMessage(message)) {
    return { intent: "nationality_capture", property_intent: false, entities: { ...extractEntities(data, message), nationality: captureNationality(message) } };
  }
  if (!aiPlan?.requires_rag) {
    const fallback = routeIntent(data, message);
    const normalizedIntent = norm(aiPlan?.intent);
    const surfaceIntent = normalizedIntent.includes("contact")
      ? "name_contact_capture"
      : normalizedIntent.includes("small_talk")
        ? fallback.intent
        : (aiPlan?.intent || fallback.intent);
    return {
      intent: surfaceIntent,
      property_intent: false,
      entities: aiPlan?.entities || fallback.entities
    };
  }
  const intent = norm(aiPlan.intent).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "property_search";
  return {
    intent,
    property_intent: true,
    entities: aiPlan.entities || extractEntities(data, message)
  };
}

function slotsFromAiEntities(entities = {}) {
  const slots = {};
  if (isKnown(entities.purpose)) slots.purpose = normalizeIntent(entities.purpose) || entities.purpose;
  if (isKnown(entities.location)) slots.location = entities.location;
  if (isKnown(entities.property_type)) slots.property_type = entities.property_type;
  if (entities.bedrooms !== "unknown" && entities.bedrooms !== undefined) slots.bedrooms = Number(entities.bedrooms);
  if (entities.budget !== "unknown" && entities.budget !== undefined) slots.budget = Number(entities.budget);
  if (isKnown(entities.currency)) slots.currency = entities.currency;
  if (Array.isArray(entities.amenities) && entities.amenities.length) slots.amenities = entities.amenities;
  if (isKnown(entities.timeline)) slots.timeline = entities.timeline;
  return slots;
}

function buildAiRetrievalMessage(message, aiPlan, memory) {
  const entityBits = [];
  const entities = aiPlan?.entities || {};
  if (Array.isArray(entities.project_names)) entityBits.push(...entities.project_names);
  for (const key of ["purpose", "property_type", "location", "bedrooms", "budget", "timeline"]) {
    if (isKnown(entities[key])) entityBits.push(String(entities[key]));
  }
  if (Array.isArray(entities.amenities)) entityBits.push(...entities.amenities);
  if (Array.isArray(aiPlan?.image_features)) entityBits.push(...aiPlan.image_features);
  return [
    isKnown(aiPlan?.search_query) ? aiPlan.search_query : message,
    buildMemoryQuery("", memory || {}),
    ...entityBits
  ].filter(isKnown).join(" ");
}

function inputImages(input = {}) {
  const list = [];
  if (input.image) list.push(input.image);
  if (input.uploaded_image) list.push(input.uploaded_image);
  if (Array.isArray(input.images)) list.push(...input.images);
  return list.filter(Boolean);
}

function organicClarifierFor(message, route, session) {
  if (!route?.property_intent) return "";
  const text = norm(message);
  const entities = route.entities || {};
  if (route.intent === "commercial" && /\b(maybe|not sure|commercial properties?)\b/i.test(message)) {
    return "Got it. Are you thinking of office space, retail, or something like a clinic or F&B unit?";
  }
  const hasSpecificNeed = Boolean(
    isKnown(entities.project_name)
    || entities.project_names?.length
    || isKnown(entities.location)
    || isKnown(entities.property_type)
    || entities.bedrooms !== "unknown"
    || entities.budget !== "unknown"
    || entities.amenities?.length
  );
  if (hasSpecificNeed || session.lastProfiles?.length) return "";
  if (/\b(hi|hello|hey).*\b(property|properties|home|apartment|villa)\b/i.test(message) || /\blooking for (properties|property|a home|a place)\b/i.test(message)) {
    return "Sure, I can help with that. Are you looking to buy, rent, invest, or explore commercial options?";
  }
  return "";
}

function estimatedImageBytes(image = {}) {
  const data = image?.data || image?.base64 || image?.inline_data || image?.inlineData?.data || "";
  const clean = String(data).replace(/^data:[^;]+;base64,/, "");
  return clean ? Math.round(clean.length * 0.75) : 0;
}

export async function chat(data, input = {}) {
  const sessionId = input.session_id || "default";
  const message = input.message || "";
  const session = sessions.get(sessionId) || { session_id: sessionId, turns: [], memory: {}, lastProfiles: [] };
  chatDebug("chat.start", { session_id: sessionId, message });
  const images = inputImages(input);
  console.log(`[chat:image_received] ${JSON.stringify({ session_id: sessionId, images: images.length, bytes: images.map(estimatedImageBytes) })}`);
  const visionAnalysis = await analyzeUploadedImages(message, images);
  if (images.length && !visionAnalysis.used) {
    const answer = "I received the uploaded image, but Gemini Vision could not analyze it right now. Please try again in a moment, or describe the property style you want and I will search the verified Aqaar KB.";
    session.turns.push({ message, intent: "image_analysis_unavailable", parsed: {}, lead: {}, vision: visionAnalysis });
    sessions.set(sessionId, session);
    const result = {
      session_id: sessionId,
      llm_used: false,
      property_intent: false,
      fallback_reason: visionAnalysis.error || "vision_unavailable",
      answer,
      reply: answer,
      sources: [],
      sources_used: [],
      cards: [],
      response_cards: [],
      follow_up: "Would you like to describe the property type, location, or style you want?",
      response_type: "image_analysis_unavailable",
      model_used: null,
      ai_plan: { used: false, model_used: null, error: "vision_unavailable", plan: null },
      visual_analysis: visionAnalysis,
      intent: "image_analysis_unavailable",
      entities: {},
      memory: session.memory,
      lead_capture: session.memory.lead_capture || {},
      recommendations: [],
      sales_handoff: {
        status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
        summary: buildSalesSummary(session.memory, []),
        captured_fields: session.memory.lead_capture || {},
        source: "Concierge-Backend-v1 session memory"
      },
      llm: {
        provider: "gemini",
        model: GEMINI_MODEL,
        model_used: null,
        attempted_models: [GEMINI_MODEL],
        used: false,
        reason: visionAnalysis.error || "vision_unavailable",
        fallback_reason: visionAnalysis.error || "vision_unavailable"
      },
      validation: validation("vision_attempted_no_unverified_recommendations")
    };
    logChatOrchestration({
      intent: result.intent,
      entities: result.entities,
      shouldUseRag: false,
      chunksCount: 0,
      model: GEMINI_MODEL,
      geminiError: visionAnalysis.error || "vision_unavailable",
      fallback_reason: result.fallback_reason,
      vision: { used: false, features: [], error: visionAnalysis.error || "vision_unavailable" }
    });
    result.persistence = await persistChatExchange({ input, result });
    chatDebug("final.json", summarizeFinalJson(result));
    return result;
  }
    // ── PENDING CONTEXT RESOLUTION ─────────────────────────────────────────
  // Must run BEFORE routing so short replies like "USD", "AED", "2 bedrooms",
  // "Ajman", "rent" are resolved against the AI's last clarification question
  // rather than being misrouted as greetings or small talk.
  if (!images.length && session.memory && session.memory.pending_context && isClarificationReply(message, session)) {
    const resolved = resolvePendingContext(message, session);
    if (resolved && resolved.resolved) {
      // Merge resolved context and continue as a property search with full memory
      sessions.set(sessionId, session);
      const mergedMessage = resolved.merged_message || message;
      chatDebug("pending_context.resolved", { type: resolved.type, context_note: resolved.context_note, merged_message: mergedMessage });

      // Re-enter the property flow with the resolved/merged message
      const resolvedRoute = routeIntent(data, mergedMessage);
      // Force property intent so we get proper KB response
      resolvedRoute.property_intent = true;
      if (!resolvedRoute.intent || resolvedRoute.intent === "unclear") {
        resolvedRoute.intent = "property_search";
      }

      // Build a grounded contextual response using full session memory
      const resolvedMessage = mergedMessage;
      const resolvedRetrieved = search(data, buildMemoryQuery(resolvedMessage, session.memory), 10);
      const resolvedRecs = recommend(data, { ...session.memory, message: resolvedMessage, intent: session.memory.purpose || "buy", limit: 4 });
      if (resolvedRecs.recommendations.length) session.lastProfiles = resolvedRecs.recommendations.map((r) => r.project.property_id);
      const resolvedNextQ = nextQuestionFor(session.memory, session.memory.purpose || "buy");
      const resolvedResponse = buildContextualResponse(data, resolvedMessage, session.memory, resolvedRetrieved, resolvedRecs, resolvedNextQ);
      const resolvedRag = retrieveAqaarContext(data, resolvedMessage, resolvedRoute, resolvedResponse, resolvedRecs, 8);
      const resolvedPromptRag = { ...resolvedRag, chunks: resolvedRag.chunks.slice(0, 4).map((c) => ({ ...c, text: String(c.text || "").slice(0, 650) })) };

      const resolvedPrompt = buildGroundedPrompt({
        message: resolvedMessage,
        memory: session.memory,
        extractedEntities: resolvedRoute.entities,
        route: resolvedRoute,
        detected: { intent: resolvedRoute.intent },
        response: resolvedResponse,
        cards: resolvedResponse.cards,
        rag: resolvedPromptRag,
        nextQuestion: resolvedNextQ,
        visionAnalysis: { used: false },
        session
      });

      const hasCtx = resolvedResponse.cards.length > 0 || resolvedRag.chunks.length > 0;
      const resolvedLlm = hasCtx
        ? await generateWithGemini({ prompt: resolvedPrompt })
        : { provider: "gemini", model: GEMINI_MODEL, used: false, reason: "no_retrieved_context", text: "" };

      const resolvedFallback = buildGroundedFallback(resolvedResponse, resolvedNextQ, null);
      const resolvedFallbackReason = resolvedLlm.used ? null : (resolvedLlm.reason || "gemini_unavailable");
      const resolvedGrounded = sanitizeAnswer(resolvedLlm.used ? resolvedLlm.text : resolvedFallback);
      const resolvedFinal = resolvedGrounded || resolvedResponse.answer || ("Got it — " + resolved.context_note + ". Let me find the best options for you.");

      // Track reply
      if (!session.previousReplies) session.previousReplies = [];
      session.previousReplies.push(resolvedFinal);
      if (session.previousReplies.length > 12) session.previousReplies = session.previousReplies.slice(-12);
      session.turns.push({ message, intent: resolvedRoute.intent, parsed: resolvedRoute.entities, lead: {}, context_note: resolved.context_note });
      sessions.set(sessionId, session);

      const cleanSrcs = cleanSourceLabels(uniqueSources(resolvedRag.sources));
      const resolvedResult = {
        session_id: sessionId,
        llm_used: Boolean(resolvedLlm.used),
        property_intent: true,
        fallback_reason: resolvedFallbackReason,
        answer: resolvedFinal,
        reply: resolvedFinal,
        sources: cleanSrcs,
        sources_used: cleanSrcs,
        cards: resolvedResponse.cards,
        response_cards: resolvedResponse.cards,
        follow_up: resolvedNextQ || "",
        response_type: resolvedResponse.type || "property_search",
        model_used: resolvedLlm.model_used || (resolvedLlm.used ? resolvedLlm.model : null),
        ai_plan: { used: false, model_used: null, error: null, plan: null },
        visual_analysis: { used: false, description: "", features: [], error: null },
        intent: resolvedRoute.intent,
        entities: resolvedRoute.entities,
        memory: session.memory,
        lead_capture: session.memory.lead_capture || {},
        recommendations: resolvedResponse.recommendations || resolvedRecs.recommendations,
        sales_handoff: {
          status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
          summary: buildSalesSummary(session.memory, resolvedResponse.recommendations || resolvedRecs.recommendations),
          captured_fields: session.memory.lead_capture || {},
          source: "Concierge-Backend-v1 session memory"
        },
        llm: {
          provider: resolvedLlm.provider || "gemini",
          model: resolvedLlm.model || GEMINI_MODEL,
          model_used: resolvedLlm.model_used || (resolvedLlm.used ? resolvedLlm.model : null),
          attempted_models: resolvedLlm.attempted_models || [],
          used: Boolean(resolvedLlm.used),
          reason: resolvedLlm.reason,
          fallback_reason: resolvedFallbackReason
        },
        validation: validation("pending_context_resolved")
      };
      logChatOrchestration({ intent: resolvedRoute.intent, entities: resolvedRoute.entities, shouldUseRag: true, chunksCount: resolvedRag.chunks.length, model: resolvedLlm.model_used || resolvedLlm.model || GEMINI_MODEL, geminiError: resolvedLlm.used ? null : resolvedLlm.error || resolvedLlm.reason, fallback_reason: resolvedFallbackReason, vision: { used: false, features: [], error: null } });
      resolvedResult.persistence = await persistChatExchange({ input, result: resolvedResult });
      chatDebug("final.json", summarizeFinalJson(resolvedResult));
      return resolvedResult;
    }
    // Could not resolve — fall through to normal routing
  }
  // ── EARLY GATE: Greetings, name capture, and small talk bypass Gemini planner & RAG ──
  // nonPropertyResponse now calls Gemini with a lightweight conversational prompt,
  // so every greeting / name-capture / small-talk response is generated dynamically.
  if (!images.length) {
    const quickRoute = routeIntent(data, message);
    if (!quickRoute.property_intent) {
      const quickGate = await nonPropertyResponse(session, message, quickRoute);
      sessions.set(sessionId, session);
      // Persist ALL lead fields (name, phone, email) into session memory for downstream compatibility
      if (quickRoute.intent === "name_contact_capture" && quickRoute.entities) {
        const leadFields = {};
        if (quickRoute.entities.name && quickRoute.entities.name !== "unknown") leadFields.name = quickRoute.entities.name;
        if (quickRoute.entities.phone && quickRoute.entities.phone !== "unknown") leadFields.phone = quickRoute.entities.phone;
        if (quickRoute.entities.email && quickRoute.entities.email !== "unknown") leadFields.email = quickRoute.entities.email;
        session.memory.lead_capture = mergeKnown(session.memory.lead_capture || {}, leadFields);
      }
      const quickResult = {
        session_id: sessionId,
        llm_used: quickGate.llm_used || false,
        property_intent: false,
        fallback_reason: null,
        answer: quickGate.fallbackAnswer,
        reply: quickGate.fallbackAnswer,
        sources: [],
        sources_used: [],
        cards: [],
        response_cards: [],
        follow_up: quickGate.follow_up || "",
        response_type: quickRoute.intent,
        model_used: quickGate.model_used || null,
        ai_plan: { used: false, model_used: null, error: null, plan: null },
        visual_analysis: { used: false, description: "", features: [], error: null },
        intent: quickRoute.intent,
        entities: quickRoute.entities,
        memory: session.memory,
        lead_capture: session.memory.lead_capture || {},
        recommendations: [],
        sales_handoff: {
          status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
          summary: buildSalesSummary(session.memory, []),
          captured_fields: session.memory.lead_capture || {},
          source: "Concierge-Backend-v1 session memory"
        },
        llm: {
          provider: quickGate.llm_used ? "gemini" : "none",
          model: quickGate.model_used || null,
          model_used: quickGate.model_used || null,
          attempted_models: quickGate.model_used ? [quickGate.model_used] : [],
          used: quickGate.llm_used || false,
          reason: quickGate.llm_used ? "conversational_response" : "early_gate_gemini_unavailable",
          fallback_reason: null
        },
        validation: validation("non_property_no_retrieval")
      };
      logChatOrchestration({ intent: quickRoute.intent, entities: quickRoute.entities, shouldUseRag: false, chunksCount: 0, model: quickGate.model_used || null, geminiError: null, fallback_reason: null, vision: { used: false, features: [], error: null } });
      quickResult.persistence = await persistChatExchange({ input, result: quickResult });
      chatDebug("final.json", summarizeFinalJson(quickResult));
      return quickResult;
    }
  }
  const aiPlanner = visionAnalysis.used
    ? {
        used: true,
        model_used: visionAnalysis.model_used,
        error: null,
        plan: buildVisionAiPlan(message, visionAnalysis)
      }
    : await planChatWithGemini(data, message, session, images, visionAnalysis);
  const aiPlan = aiPlanner.plan;
  const route = routeFromAiPlan(data, message, aiPlan);
  if (isAmbiguousBudgetMessage(message)) {
    const budget = parseBudget(norm(message));
    if (budget) session.memory.budget = budget;
    // Store pending_context so the next short reply ("AED", "USD", etc.) resolves correctly
    const budgetSlots = parseSlots(message);
    session.memory.pending_context = {
      type: "currency_clarification",
      original_message: message,
      property_type: budgetSlots.property_type || session.memory.property_type || null,
      budget_amount: budget,
      missing_field: "currency"
    };
    session.turns.push({ message, intent: "budget_clarification", parsed: { budget }, lead: {} });
    sessions.set(sessionId, session);
    const budgetDisplay = budget ? Number(budget).toLocaleString("en-US") : "budget";
    const answer = "Thanks. Is that AED " + budgetDisplay + ", or did you mean another currency?";
    const result = {
      session_id: sessionId,
      llm_used: false,
      property_intent: false,
      fallback_reason: null,
      answer,
      reply: answer,
      sources: [],
      sources_used: [],
      cards: [],
      response_cards: [],
      follow_up: "Is that AED, USD, or another currency?",
      response_type: "budget_clarification",
      model_used: null,
      ai_plan: { used: aiPlanner.used, model_used: aiPlanner.model_used || null, error: aiPlanner.error || null, plan: aiPlan },
      visual_analysis: visionAnalysis,
      intent: "budget_clarification",
      entities: { budget },
      memory: session.memory,
      lead_capture: session.memory.lead_capture || {},
      recommendations: [],
      sales_handoff: {
        status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
        summary: buildSalesSummary(session.memory, []),
        captured_fields: session.memory.lead_capture || {},
        source: "Concierge-Backend-v1 session memory"
      },
      llm: { provider: "none", model: null, model_used: null, attempted_models: [], used: false, reason: "budget_currency_clarification", fallback_reason: null },
      validation: validation("non_property_no_retrieval")
    };
    result.persistence = await persistChatExchange({ input, result });
    return result;
  }
  const organicClarifier = organicClarifierFor(message, route, session);
  if (organicClarifier) {
    // Store pending_context so the user's short clarification answer resolves correctly
    const orgSlots = parseSlots(message);
    if (/buy|rent|invest|commercial/i.test(organicClarifier)) {
      session.memory.pending_context = { type: "purpose_clarification", original_message: message, property_type: orgSlots.property_type || null, missing_field: "purpose" };
    } else if (/community|location|area|ajman/i.test(organicClarifier)) {
      session.memory.pending_context = { type: "location_clarification", original_message: message, property_type: orgSlots.property_type || null, missing_field: "location" };
    } else if (/office|retail|clinic|commercial/i.test(organicClarifier)) {
      session.memory.pending_context = { type: "purpose_clarification", original_message: message, property_type: "commercial", missing_field: "commercial_type" };
    }
    session.turns.push({ message, intent: route.intent, parsed: route.entities, lead: route.entities });
    sessions.set(sessionId, session);
    const result = {
      session_id: sessionId,
      llm_used: false,
      property_intent: false,
      fallback_reason: null,
      answer: organicClarifier,
      reply: organicClarifier,
      sources: [],
      sources_used: [],
      cards: [],
      response_cards: [],
      follow_up: organicClarifier,
      response_type: "organic_clarification",
      model_used: null,
      ai_plan: { used: aiPlanner.used, model_used: aiPlanner.model_used || null, error: aiPlanner.error || null, plan: aiPlan },
      visual_analysis: visionAnalysis,
      intent: route.intent,
      entities: route.entities,
      memory: session.memory,
      lead_capture: session.memory.lead_capture || {},
      recommendations: [],
      sales_handoff: {
        status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
        summary: buildSalesSummary(session.memory, []),
        captured_fields: session.memory.lead_capture || {},
        source: "Concierge-Backend-v1 session memory"
      },
      llm: { provider: "none", model: null, model_used: null, attempted_models: [], used: false, reason: "organic_clarification", fallback_reason: null },
      validation: validation("non_property_no_retrieval")
    };
    result.persistence = await persistChatExchange({ input, result });
    return result;
  }
  const preGate = !route.property_intent ? await nonPropertyResponse(session, message, route) : null;
  if (preGate) {
    chatDebug("intent.detected", { intent: route.intent, entities: route.entities, property_intent: false, retrieval_skipped: true });
    if (route.intent === "name_contact_capture") {
      session.memory.lead_capture = mergeKnown(session.memory.lead_capture || {}, {
        name: route.entities.name,
        phone: route.entities.phone,
        email: route.entities.email
      });
    }
    if (route.intent === "nationality_capture" && isKnown(route.entities.nationality)) {
      session.memory.nationality = route.entities.nationality;
    }
    const answer = isKnown(aiPlan.response_hint) ? aiPlan.response_hint : preGate.fallbackAnswer;
    // Track previous AI replies to avoid repetition across turns
    if (!session.previousReplies) session.previousReplies = [];
    session.previousReplies.push(answer);
    if (session.previousReplies.length > 12) session.previousReplies = session.previousReplies.slice(-12);
    const fallbackReason = null;
    sessions.set(sessionId, session);
    const result = {
      session_id: sessionId,
      llm_used: false,
      property_intent: false,
      fallback_reason: fallbackReason,
      answer,
      reply: answer,
      sources: [],
      sources_used: [],
      cards: [],
      response_cards: [],
      follow_up: preGate.follow_up,
      response_type: preGate.response_type,
      model_used: null,
      ai_plan: {
        used: aiPlanner.used,
        model_used: aiPlanner.model_used || null,
        error: aiPlanner.error || null,
        plan: aiPlan
      },
      visual_analysis: visionAnalysis,
      intent: route.intent,
      intent_details: preGate.intent,
      entities: route.entities,
      memory: session.memory,
      lead_capture: session.memory.lead_capture || {},
      recommendations: [],
      sales_handoff: {
        status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
        summary: buildSalesSummary(session.memory, []),
        captured_fields: session.memory.lead_capture || {},
        source: "Concierge-Backend-v1 session memory"
      },
      llm: {
        provider: "none",
      model: null,
      model_used: null,
        attempted_models: [],
        used: false,
        reason: "non_property_no_llm",
      fallback_reason: fallbackReason
      },
      validation: validation("non_property_no_retrieval")
    };
    logChatOrchestration({
      intent: route.intent,
      entities: route.entities,
      shouldUseRag: false,
      chunksCount: 0,
      model: null,
      geminiError: aiPlanner.error || null,
      fallback_reason: fallbackReason,
      vision: { used: visionAnalysis.used, features: visionAnalysis.features || [], error: visionAnalysis.error || null }
    });
    result.persistence = await persistChatExchange({ input, result });
    chatDebug("fallback.reason", { fallback_reason: fallbackReason });
    chatDebug("final.json", summarizeFinalJson(result));
    return result;
  }
  const retrievalMessage = buildAiRetrievalMessage(message, aiPlan, session.memory);
  const incoming = mergeKnown(parseSlots(retrievalMessage), slotsFromAiEntities(aiPlan.entities));
  const requestedIntent = normalizeIntent(input.intent);
  if (requestedIntent && !session.memory.purpose) incoming.purpose = requestedIntent;
  const lead = captureLead(message);
  session.memory = mergeKnown(session.memory, incoming);
  session.memory.lead_capture = mergeKnown(session.memory.lead_capture || {}, lead);

  const detected = detectIntent(data, [retrievalMessage, session.memory.purpose].filter(Boolean).join(" "));
  const activePurpose = session.memory.purpose || intentToPurpose(detected.intent) || "buy";
  session.memory.purpose = activePurpose;
  chatDebug("intent.detected", {
    intent: route.intent,
    legacy_intent: PURPOSE_TO_INTENT[activePurpose] || detected.intent,
    response_hint: classifyQuestion(retrievalMessage),
    extracted_entities: route.entities,
    property_intent: true
  });

  const retrieved = search(data, buildMemoryQuery(retrievalMessage, session.memory), 10);
  const previous = session.lastProfiles
    .map((id) => allProfiles(data).find((profile) => profile.property_id === id))
    .filter(Boolean);
  const recs = recommend(data, { ...session.memory, message: retrievalMessage, intent: activePurpose, limit: 4, session: { lastProfiles: previous } });
  if (recs.recommendations.length) session.lastProfiles = recs.recommendations.map((item) => item.project.property_id);
  const qualification = qualify(data, { intent: PURPOSE_TO_INTENT[activePurpose] || detected.intent, message: retrievalMessage });

  session.turns.push({ message, intent: aiPlan.intent || activePurpose, parsed: incoming, lead, ai_plan: aiPlan });
  sessions.set(sessionId, session);

  const nextQuestion = nextQuestionFor(session.memory, activePurpose);
  const response = buildContextualResponse(data, retrievalMessage, session.memory, retrieved, recs, nextQuestion);
  if (response.recommendations?.length) session.lastProfiles = response.recommendations.map((item) => item.project.property_id);
  const rag = retrieveAqaarContext(data, retrievalMessage, route, response, recs, 8);
  chatDebug("kb.retrieval", {
    search_results: retrieved.results.length,
    response_cards: response.cards.map((card) => card.project),
    retrieved_chunks: rag.chunks.map((chunk) => ({ title: chunk.title, score: chunk.score, source_label: chunk.source_label }))
  });
  const promptRag = {
    ...rag,
    chunks: rag.chunks.slice(0, 4).map((chunk) => ({
      ...chunk,
      text: String(chunk.text || "").slice(0, 650)
    }))
  };
  const prompt = buildGroundedPrompt({
    message,
    memory: session.memory,
    extractedEntities: route.entities,
    route,
    detected,
    response,
    cards: response.cards,
    rag: promptRag,
    nextQuestion,
    visionAnalysis,
    session
  });
  // Track this as an ongoing conversation turn for future reply variation
  if (!session.previousReplies) session.previousReplies = [];
  chatDebug("prompt.sent_to_gemini", { prompt });
  const hasGroundedContext = response.cards.length > 0 || rag.chunks.length > 0;
  const unsupported = response.cards.length === 0 && /^(This is not published in the verified Aqaar KB\.|Not published in verified Aqaar KB\.)$/.test(response.answer);
  const llmResult = hasGroundedContext && !unsupported
    ? await generateWithGemini({ prompt })
    : {
        provider: "gemini",
        model: GEMINI_MODEL,
        used: false,
        reason: unsupported ? "unsupported_by_kb" : "no_retrieved_context",
        text: ""
      };
  chatDebug("gemini.raw_response", summarizeLlmResult(llmResult));
  chatDebug("parser.result", { valid_text: Boolean(llmResult.used && llmResult.text), text_length: String(llmResult.text || "").length });
  const fallbackAnswer = buildGroundedFallback(response, nextQuestion, visionAnalysis);
  const nonGeminiFallback = ["unsupported_by_kb", "no_retrieved_context"].includes(llmResult.reason);
  const fallbackReason = llmResult.used || nonGeminiFallback ? null : llmResult.reason || "gemini_unavailable";
  const gracefulFallback = fallbackReason
    ? `Here is the verified Aqaar KB answer.\n${fallbackAnswer}`
    : fallbackAnswer;
  const groundedAnswer = sanitizeAnswer(llmResult.used ? llmResult.text : gracefulFallback);
  const finalAnswer = groundedAnswer || response.answer || "Not published in verified Aqaar KB.";
  // Track final answer for reply variation (avoid repeating same phrasing)
  if (!session.previousReplies) session.previousReplies = [];
  session.previousReplies.push(finalAnswer);
  if (session.previousReplies.length > 12) session.previousReplies = session.previousReplies.slice(-12);
  const sourcePool = uniqueSources(rag.sources);
  const cleanSources = cleanSourceLabels(sourcePool);
  const result = {
    session_id: sessionId,
    llm_used: Boolean(llmResult.used),
    property_intent: true,
    fallback_reason: fallbackReason,
    answer: finalAnswer,
    reply: finalAnswer,
    follow_up: nextQuestion,
    response_type: response.type,
    model_used: llmResult.model_used || (llmResult.used ? llmResult.model : null),
    ai_plan: {
      used: aiPlanner.used,
      model_used: aiPlanner.model_used || null,
      error: aiPlanner.error || null,
      plan: aiPlan
    },
    visual_analysis: visionAnalysis,
    cards: response.cards,
    response_cards: response.cards,
    intent: route.intent,
    intent_details: { ...detected, intent: route.intent },
    entities: route.entities,
    memory: session.memory,
    recommendations: response.recommendations || recs.recommendations,
    qualification,
    lead_capture: session.memory.lead_capture,
    sales_handoff: {
      status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
      summary: buildSalesSummary(session.memory, response.recommendations || recs.recommendations),
      captured_fields: session.memory.lead_capture,
      source: "Concierge-Backend-v1 session memory plus KB-backed recommendations"
    },
    sources: cleanSources,
    sources_used: cleanSources,
    source_audit: sourcePool,
    rag: {
      model_context: rag.chunks,
      chunks_used: rag.chunks.length,
      query: rag.query,
      planner_query: retrievalMessage
    },
    llm: {
      provider: llmResult.provider,
      model: llmResult.model || GEMINI_MODEL,
      model_used: llmResult.model_used || (llmResult.used ? llmResult.model : null),
      attempted_models: llmResult.attempted_models || [],
      used: llmResult.used,
      reason: llmResult.reason,
      fallback_reason: fallbackReason
    },
    validation: validation("kb_checked_before_response")
  };
  logChatOrchestration({
    intent: route.intent,
    entities: route.entities,
    shouldUseRag: true,
    chunksCount: rag.chunks.length,
    model: llmResult.model_used || llmResult.model || GEMINI_MODEL,
    geminiError: llmResult.used ? null : llmResult.error || llmResult.reason,
    fallback_reason: fallbackReason,
    vision: { used: visionAnalysis.used, features: visionAnalysis.features || [], error: visionAnalysis.error || null }
  });
  result.persistence = await persistChatExchange({ input, result });
  chatDebug("fallback.reason", { fallback_reason: fallbackReason });
  chatDebug("final.json", summarizeFinalJson(result));
  return result;
}

function retrieveAqaarContext(data, message, route, response, recs, limit = 8) {
  const query = [message, Object.values(route.entities || {}).flat().filter((value) => typeof value === "string").join(" ")].join(" ");
  const parsed = parseSlots(query);
  const queryTokens = expandQueryTokens(tokens(query), parsed);
  const cardNames = (response.cards || []).map((card) => norm(card.project)).filter(Boolean);
  const recommendationNames = (recs.recommendations || []).map((item) => norm(item.project.project_name)).filter(Boolean);
  const entityProjectNames = (route.entities?.project_names || []).map(norm).filter(Boolean);
  const preferredNames = new Set(cardNames.length ? cardNames : (entityProjectNames.length ? entityProjectNames : recommendationNames));

  const hasPreferredCards = preferredNames.size > 0;
  const documents = buildKbDocuments(data);
  const scoredDocuments = documents.map((doc, index) => {
    const haystack = `${doc.title} ${doc.text}`;
    const exactProjectMatch = [...preferredNames].some((name) => name !== "unknown" && norm(doc.title) === name);
    const matchesPreferred = [...preferredNames].some((name) => name !== "unknown" && norm(haystack).includes(name));
    const intentMatch = intentMatchesDocument(route.intent, doc);
    const entityMatch = entityMatchesDocument(route.entities, haystack);
    const keywordScore = matchScore(queryTokens, haystack);
    return {
      score: (exactProjectMatch ? 100 : 0) + (intentMatch ? 35 : 0) + entityMatch + keywordScore,
      matchesPreferred,
      index,
      doc
    };
  });

  const chunks = scoredDocuments
    .filter((entry) => entry.score > 0)
    .filter((entry) => !hasPreferredCards || entry.matchesPreferred)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, index, score }) => ({
      chunk_id: knownOrUnknown(doc.id || `kb_doc_${index}`),
      title: knownOrUnknown(doc.title || `KB context ${index + 1}`),
      project: knownOrUnknown(doc.project || doc.title),
      section: knownOrUnknown(doc.type),
      text: knownOrUnknown(doc.text).slice(0, 900),
      source: doc.source,
      source_label: sourceLabel(doc.source?.source_url || doc.source_label || doc.type),
      score
    }));

  const cardSources = (response.recommendations || recs.recommendations || [])
    .map((item) => item.source || item.project?.source)
    .filter(Boolean);

  return {
    query,
    chunks,
    sources: uniqueSources([...chunks.map((chunk) => chunk.source), ...cardSources])
  };
}

function buildKbDocuments(data) {
  if (data.kbDocumentCache) return data.kbDocumentCache;
  const docs = [];
  data.ragChunks.forEach((chunk, index) => {
    docs.push({
      id: chunk.chunk_id || chunk.id || `rag_${index}`,
      type: "rag_chunk",
      title: knownOrUnknown(chunk.title || chunk.project || chunk.document),
      project: knownOrUnknown(chunk.project || chunk.project_name || chunk.title),
      text: knownOrUnknown(chunk.text || chunk.content || JSON.stringify(chunk)),
      source: sourceFromChunk(chunk, index)
    });
  });
  data.projects.forEach((row) => docs.push({
    id: row.property_id,
    type: "project_csv",
    title: row.property_name,
    project: row.property_name,
    text: csvRowText("project", row),
    source: sourceFromProject(row)
  }));
  data.units.forEach((row) => docs.push({
    id: row.unit_id,
    type: "inventory_csv",
    title: row.property_name,
    project: row.property_name,
    text: csvRowText("inventory", row),
    source: sourceFromUnit(row)
  }));
  data.amenities.forEach((row, index) => docs.push({
    id: row.amenity_id || `amenity_${index}`,
    type: "amenities_csv",
    title: row.property_name || row.project_name || row.amenity_name,
    project: row.property_name || row.project_name,
    text: csvRowText("amenity", row),
    source: sourceFromGeneric("amenity", row, index)
  }));
  data.locations.forEach((row, index) => docs.push({
    id: row.location_id || row.property_id || `location_${index}`,
    type: "locations_csv",
    title: row.property_name || row.project_name || row.community,
    project: row.property_name || row.project_name,
    text: csvRowText("location", row),
    source: sourceFromGeneric("location", row, index)
  }));
  data.assets.forEach((row, index) => docs.push({
    id: row.asset_id || `asset_${index}`,
    type: "assets_csv",
    title: row.property_name || row.project_name || row.asset_label,
    project: row.property_name || row.project_name,
    text: csvRowText("asset", row),
    source: sourceFromGeneric("asset", row, index)
  }));
  data.kbDocumentCache = docs;
  return docs;
}

function csvRowText(type, row) {
  return `${type}: ${Object.entries(row || {}).filter(([, value]) => isKnown(value)).map(([key, value]) => `${key}: ${value}`).join("; ")}`;
}

function sourceFromGeneric(type, row, index) {
  return {
    entity_type: type,
    entity_id: knownOrUnknown(row?.asset_id || row?.amenity_id || row?.location_id || row?.property_id || `${type}_${index}`),
    entity_name: knownOrUnknown(row?.property_name || row?.project_name || row?.asset_label || row?.amenity_name || row?.community),
    source_url: knownOrUnknown(row?.source_url || row?.asset_url || row?.evidence_url || row?.source),
    last_verified: knownOrUnknown(row?.last_verified || row?.extraction_date),
    confidence_score: knownOrUnknown(row?.confidence_score)
  };
}

function intentMatchesDocument(intent, doc) {
  const text = norm(`${doc.type} ${doc.text}`);
  if (intent === "price") return /\bprice|price_min|price_max|starting price|aed\b/.test(text);
  if (intent === "payment_plan") return /payment|installment|instalment|down payment/.test(text);
  if (intent === "amenities") return /amenity|gym|pool|beach|waterfront|parking|retail/.test(text);
  if (intent === "location_freehold") return /location|community|freehold|nearby|school|hospital|university|landmark/.test(text);
  if (intent === "comparison") return true;
  if (intent === "investment") return /investment|roi|yield|freehold|off-plan|price/.test(text);
  if (intent === "commercial") return /commercial|office|retail|clinic|warehouse|shop/.test(text);
  return /project|property|inventory|bedroom|apartment|villa|studio/.test(text);
}

function entityMatchesDocument(entities = {}, text = "") {
  const haystack = norm(text);
  let score = 0;
  for (const project of entities.project_names || []) if (isKnown(project) && haystack.includes(norm(project))) score += 60;
  if (isKnown(entities.location) && haystack.includes(norm(entities.location))) score += 18;
  if (isKnown(entities.property_type) && haystack.includes(norm(entities.property_type))) score += 18;
  if (entities.bedrooms !== "unknown" && haystack.includes(String(entities.bedrooms))) score += 12;
  for (const amenity of entities.amenities || []) if (haystack.includes(norm(amenity))) score += 12;
  for (const feature of entities.image_features || []) if (haystack.includes(norm(feature))) score += 10;
  return score;
}

function buildGroundedPrompt({ message, memory, extractedEntities, detected, response, cards, rag, nextQuestion, visionAnalysis = null, session = null }) {
  const clientName = (session && session.memory && session.memory.name) ? session.memory.name : (memory && memory.name ? memory.name : null);
  const previousReplies = (session && session.previousReplies ? session.previousReplies : []).slice(-4);
  const recentTurns = (session && session.turns ? session.turns : []).slice(-5).map(function(t) {
    return { user: t.message, intent: t.intent };
  });

  const context = {
    user_message: message,
    client_name: clientName || "unknown",
    detected_intent: detected && detected.intent ? detected.intent : "unknown",
    extracted_entities: extractedEntities || {},
    conversation_memory: memory,
    recent_conversation_history: recentTurns,
    uploaded_image_analysis: visionAnalysis && visionAnalysis.used ? {
      visual_description: visionAnalysis.description,
      features: visionAnalysis.features,
      details: visionAnalysis.raw
    } : null,
    response_type: response.type,
    allowed_project_cards: cards || [],
    retrieved_chunks: rag.chunks.map(function(chunk) {
      return { title: chunk.title, project: chunk.project, section: chunk.section, text: chunk.text, source_label: chunk.source_label };
    }),
    required_follow_up_slot: nextQuestion,
    previous_ai_replies_to_avoid_repeating: previousReplies
  };

  const nameRef = clientName ? clientName : null;

  return [
    "You are the Aqaar AI Concierge — a senior luxury real-estate consultant for Ajman, UAE.",
    "You sound like an experienced, warm sales advisor at a premium property brand.",
    "You are NOT a chatbot, NOT a FAQ engine, and NOT a form. You are a human-sounding consultant.",
    "",
    "CORE RULES:",
    "1. Answer ONLY from the verified Aqaar KB context provided in VERIFIED_CONTEXT_JSON below.",
    "2. Sound natural, conversational, and premium — like a trusted advisor, not a script.",
    "3. NEVER use survey-style labels: Purpose:, Type:, Location:, Budget:, Bedrooms: — unless explicitly comparing projects.",
    "4. Ask only ONE follow-up question, and make it feel like a natural next step in the conversation.",
    "5. For recommendations, give 2-3 options maximum with one warm sentence per option explaining why it fits.",
    "6. Do NOT dump all available data. Be selective and human.",
    "7. If the client's name is known, use it naturally once in your response.",
    "8. DO NOT repeat any sentence from previous_ai_replies_to_avoid_repeating.",
    "9. Vary your language — avoid always starting with the same phrase.",
    "10. Do NOT invent projects, prices, ROI, rankings, amenities, payment plans, locations, dates, or URLs.",
    "11. Do NOT print raw URLs. Refer to sources by clean label only.",
    "12. If the answer is absent from the context, say exactly: Not published in verified Aqaar KB.",
    "13. If allowed_project_cards is empty, do not recommend or name any property.",
    "14. When recommending, start with something like 'Based on what you've shared...' or 'Given your interest in...' — vary it.",
    "15. Treat this as a continuation of an ongoing conversation — acknowledge the flow naturally.",
    nameRef ? ("16. The client's name is " + nameRef + ". Use it warmly, but only once.") : "16. Client name not yet known.",
    "",
    "VERIFIED_CONTEXT_JSON:",
    JSON.stringify(context, null, 2)
  ].join("\n");
}
function sanitizeAnswer(text) {
  const cleaned = String(text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return cleaned;
}

function buildGroundedFallback(response, nextQuestion, visionAnalysis = null) {
  if (!response.cards?.length) return response.answer || "Not published in verified Aqaar KB.";
  const lines = [];
  if (visionAnalysis?.used) {
    lines.push(`Gemini Vision observed: ${visionAnalysis.description}`);
    lines.push("Here are the closest verified Aqaar matches I would start with:");
  }
  if (response.type === "payment_plans") {
    lines.push("Payment plans are published only for selected Aqaar records in the current KB.");
    for (const card of response.cards.slice(0, 3)) lines.push(`- ${card.project}: ${card.payment_plan}`);
  } else if (response.type === "price") {
    lines.push("Here are the closest published price matches I found:");
    for (const card of response.cards.slice(0, 3)) lines.push(`- ${card.project}: ${card.price} in ${card.location}.`);
  } else if (response.type === "compare") {
    return response.answer;
  } else if (response.type === "nearby_landmarks") {
    for (const card of response.cards.slice(0, 3)) lines.push(`${card.project} is published in the Aqaar KB as ${card.unit_types} in ${card.location}.`);
  } else {
    if (!visionAnalysis?.used) lines.push(response.cards.length === 1 ? "The closest published match is:" : "Based on that, I would shortlist these first:");
    for (const card of response.cards.slice(0, 3)) {
      const reason = visionAnalysis?.used
        ? ` It matches the uploaded image cues around ${visionAnalysis.features?.slice(0, 3).join(", ") || "property style"}.`
        : "";
      lines.push(`- ${card.project}: ${card.location}, ${card.unit_types}. Price: ${card.price}.${reason}`);
    }
  }
  if (nextQuestion) lines.push(nextQuestion);
  return lines.join("\n");
}

function sourceLabel(raw) {
  const value = String(raw || "").replace(/\\/g, "/");
  const lower = value.toLowerCase();
  if (lower.includes("mawjan")) return "Mawjan brochure";
  if (lower.includes("dusit")) return "Dusit Thani brochure";
  if (lower.includes("aqaar_projects_master")) return "Aqaar projects master";
  if (lower.includes("aqaar_properties_inventory")) return "Aqaar properties inventory";
  if (lower.includes("aqaar_locations")) return "Aqaar locations";
  if (lower.includes("aqaar_amenities")) return "Aqaar amenities";
  if (lower.includes("aqaar_rag_chunks")) return "Aqaar RAG chunks";
  if (lower.includes("aqaar") || lower.startsWith("http")) return "Aqaar official KB";
  return "Verified Aqaar KB";
}

function cleanSourceLabels(sources) {
  const seen = new Set();
  return sources
    .map((source) => ({
      entity_type: source.entity_type || "kb_record",
      entity_name: knownOrUnknown(source.entity_name),
      source_label: sourceLabel(source.source_url || source.source || source.entity_name),
      last_verified: knownOrUnknown(source.last_verified),
      confidence_score: knownOrUnknown(source.confidence_score)
    }))
    .filter((source) => {
      const key = `${source.entity_type}:${source.entity_name}:${source.source_label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function parseSlots(message) {
  const text = norm(message);
  const slots = {};
  if (/\b(buy|purchase|own)\b/.test(text)) slots.purpose = "buy";
  if (/\b(rent|lease)\b/.test(text)) slots.purpose = "rent";
  if (/\b(invest|investment|roi|yield)\b/.test(text)) slots.purpose = "invest";
  if (/\b(commercial|office|retail|clinic|warehouse|shop)\b/.test(text)) slots.purpose = "commercial";
  if (/\bvillas?\b/.test(text)) slots.property_type = "villa";
  if (/\b(apartments?|flats?|studio|studios)\b/.test(text)) slots.property_type = "apartment";
  if (/\btownhouses?\b/.test(text)) slots.property_type = "townhouse";
  if (/\b(office|retail|clinic|warehouse|shop)\b/.test(text)) slots.commercial_type = text.match(/\b(office|retail|clinic|warehouse|shop)\b/)?.[1];
  const bedrooms = parseBedrooms(text);
  if (bedrooms !== null) slots.bedrooms = bedrooms;
  const budget = parseBudget(text);
  if (budget) slots.budget = budget;
  const currency = parseCurrency(text);
  if (currency) slots.currency = currency;
  const location = parseLocation(text);
  if (location) slots.location = location;
  const amenities = parseAmenities(text);
  if (amenities.length) slots.amenities = amenities;
  if (/\b(cash|mortgage|payment plan|installment|instalment)\b/.test(text)) slots.payment_preference = text.match(/\b(cash|mortgage|payment plan|installment|instalment)\b/)?.[1];
  if (/\b(ready|handover|off plan|off-plan)\b/.test(text)) slots.readiness = text.match(/\b(ready|handover|off plan|off-plan)\b/)?.[1];
  if (/\b(family|bachelor)\b/.test(text)) slots.family_status = text.match(/\b(family|bachelor)\b/)?.[1];
  if (/\b(today|now|immediate|this month|next month|3 months|six months|year)\b/.test(text)) slots.timeline = text.match(/\b(today|now|immediate|this month|next month|3 months|six months|year)\b/)?.[1];
  if (/\b(roi|yield)\b/.test(text)) slots.roi_expectations = "requested";
  if (/\b(rental income|capital appreciation|rental)\b/.test(text)) slots.rental_preference = text.match(/\b(rental income|capital appreciation|rental)\b/)?.[1];
  return slots;
}

function parseBedrooms(text) {
  const direct = text.match(/\b(\d+)[\s-]*(?:bed|beds|bedroom|bedrooms|br)\b/)?.[1];
  if (direct) return Number(direct);
  const words = { studio: 0, one: 1, two: 2, three: 3, four: 4, five: 5 };
  for (const [word, value] of Object.entries(words)) {
    if (new RegExp(`\\b${word}[\\s-]*(?:bed|bedroom|br)?\\b`).test(text)) return value;
  }
  return null;
}

function parseBudget(text) {
  const match = text.match(/(?:budget|under|below|around|up to)?\s*(?:aed)?\s*([\d,.]+)\s*(m|million|k|thousand)?/i);
  if (!match) return null;
  let value = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const suffix = norm(match[2]);
  if (suffix === "m" || suffix === "million") value *= 1000000;
  if (suffix === "k" || suffix === "thousand") value *= 1000;
  if (/\b(usd|dollar|dollars)\b/i.test(String(text || ""))) value *= 3.67;
  if (value < 1000) return null;
  return Math.round(value);
}

function parseCurrency(text) {
  if (/\b(usd|dollar|dollars)\b/i.test(String(text || ""))) return "USD";
  if (/\b(aed|dirham|dirhams)\b/i.test(String(text || ""))) return "AED";
  if (/\b(inr|rupee|rupees)\b/i.test(String(text || ""))) return "INR";
  return null;
}

function parseLocation(text) {
  const knownLocations = ["ajman corniche", "corniche", "ajman", "al helio", "al zahra", "al nuaimiya", "rashidiya", "al nakheel", "mawjan", "dusit"];
  return knownLocations.find((location) => text.includes(location)) || null;
}

function parseAmenities(text) {
  return Object.entries(AMENITY_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => hasTerm(text, alias)))
    .map(([label]) => label);
}

function normalizeInput(input) {
  const out = {};
  if (input.intent) out.purpose = normalizeIntent(input.intent);
  if (input.purpose) out.purpose = normalizeIntent(input.purpose);
  if (input.location) out.location = input.location;
  if (input.property_type) out.property_type = input.property_type;
  if (input.bedrooms) out.bedrooms = Number(input.bedrooms);
  if (input.budget) out.budget = Number(input.budget);
  if (input.amenities) out.amenities = Array.isArray(input.amenities) ? input.amenities : [input.amenities];
  return out;
}

function normalizeIntent(intent) {
  const text = norm(intent);
  if (text.includes("buy")) return "buy";
  if (text.includes("rent")) return "rent";
  if (text.includes("invest")) return "invest";
  if (text.includes("commercial")) return "commercial";
  return null;
}

function intentToPurpose(intent) {
  return normalizeIntent(intent);
}

function mergeKnown(base, incoming) {
  const next = { ...(base || {}) };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value !== undefined && value !== null && value !== "" && value !== "unknown") next[key] = value;
  }
  return next;
}

function expandQueryTokens(queryTokens, parsed) {
  const extras = [];
  if (parsed.bedrooms !== undefined) extras.push(String(parsed.bedrooms), "bedroom", "bedrooms");
  if (parsed.property_type) extras.push(parsed.property_type);
  if (parsed.commercial_type) extras.push(parsed.commercial_type, "commercial");
  if (parsed.location) extras.push(...tokens(parsed.location));
  if (parsed.amenities) extras.push(...parsed.amenities);
  if (parsed.purpose) extras.push(parsed.purpose);
  return [...new Set([...queryTokens, ...extras])];
}

function scoreProfile(profile, criteria = {}) {
  const reasons = [];
  let score = matchScore(criteria.queryTokens || [], profile.corpus);
  if (criteria.location && norm(profile.corpus).includes(norm(criteria.location))) {
    score += 12;
    reasons.push(`matches ${criteria.location}`);
  }
  if (criteria.property_type && norm(profile.corpus).includes(norm(criteria.property_type))) {
    score += 10;
    reasons.push(`matches ${criteria.property_type}`);
  }
  if (criteria.commercial_type && norm(profile.corpus).includes(norm(criteria.commercial_type))) {
    score += 10;
    reasons.push(`matches ${criteria.commercial_type}`);
  }
  if (criteria.bedrooms !== undefined && projectHasBedrooms(profile, criteria.bedrooms)) {
    score += 14;
    reasons.push(`has ${criteria.bedrooms} bedroom inventory`);
  }
  if (criteria.budget && budgetMatches(profile, criteria.budget)) {
    score += 10;
    reasons.push(`has published pricing within AED ${Number(criteria.budget).toLocaleString("en-US")}`);
  } else if (criteria.budget && profile.price_min !== "unknown") {
    reasons.push(`published pricing starts from AED ${Number(profile.price_min).toLocaleString("en-US")}`);
  }
  for (const amenity of criteria.amenities || []) {
    if (hasTerm(profile.corpus, amenity) || (AMENITY_ALIASES[amenity] || []).some((alias) => hasTerm(profile.corpus, alias))) {
      score += 8;
      reasons.push(`matches ${amenity}`);
    }
  }
  if (criteria.intent === "Commercial" || criteria.purpose === "commercial") {
    if (norm(profile.property_type).includes("commercial") || norm(profile.corpus).includes("commercial")) score += 8;
  }
  if (criteria.purpose === "rent" && norm(profile.corpus).includes("rent")) score += 8;
  if (criteria.purpose === "buy" && norm(profile.corpus).match(/freehold|sale|buy|apartment|villa|residence/)) score += 5;
  if (criteria.purpose === "invest" && norm(profile.corpus).match(/investment|freehold|off-plan|off plan|price|waterfront/)) score += 5;
  if (!reasons.length && score > 0) reasons.push("matches Aqaar KB search terms");
  return { score, reasons };
}

function projectHasBedrooms(profile, bedrooms) {
  return profile.units.some((unit) => {
    const min = Number(unit.bedrooms_min);
    const max = Number(unit.bedrooms_max || unit.bedrooms_min);
    return Number.isFinite(min) && Number.isFinite(max) && bedrooms >= min && bedrooms <= max;
  });
}

function budgetMatches(profile, budget) {
  const ceiling = Number(budget);
  if (!Number.isFinite(ceiling) || ceiling <= 0) return false;
  return minPublishedPrice(profile) <= ceiling;
}

function minPublishedPrice(profile) {
  const unitPrices = profile.units
    .flatMap((unit) => [Number(unit.price_min), Number(unit.price_max)])
    .filter((value) => Number.isFinite(value) && value > 0);
  const profilePrice = Number(profile.price_min);
  if (Number.isFinite(profilePrice) && profilePrice > 0) unitPrices.push(profilePrice);
  return unitPrices.length ? Math.min(...unitPrices) : Number.POSITIVE_INFINITY;
}

function matchingUnits(profile, criteria) {
  const units = profile.units.filter((unit) => {
    const bedroomOk = criteria.bedrooms === undefined || criteria.bedrooms === null || (Number(unit.bedrooms_min) <= criteria.bedrooms && Number(unit.bedrooms_max || unit.bedrooms_min) >= criteria.bedrooms);
    const budgetOk = !criteria.budget || !Number.isFinite(Number(unit.price_min)) || Number(unit.price_min) <= criteria.budget;
    return bedroomOk && budgetOk;
  });
  return (units.length ? units : profile.units).slice(0, 5);
}

function searchResultFromProfile(profile, score, reasons) {
  return {
    type: "project",
    score,
    title: profile.project_name,
    entity_id: profile.property_id,
    project: profile,
    summary: {
      developer: profile.developer,
      city: profile.city,
      district: profile.district,
      community: profile.community,
      description: profile.description,
      property_type: profile.property_type,
      sub_type: profile.sub_type,
      status: profile.status,
      bedrooms: profile.bedrooms,
      bathrooms: profile.bathrooms,
      area: profile.area,
      price_min: profile.price_min,
      price_max: profile.price_max,
      payment_plan: profile.payment_plan,
      amenities: profile.amenities,
      completion: profile.completion,
      images: profile.images,
      brochure: profile.brochure,
      floorplans: profile.floorplans,
      why: reasons
    },
    source: profile.source
  };
}

function recommendationFromProfile(profile, score, reasons, criteria) {
  return {
    score,
    project: profile,
    units: matchingUnits(profile, criteria),
    why_recommended: reasons.length ? reasons : ["matches Aqaar KB criteria"],
    matched_amenities: (criteria.amenities || []).filter((amenity) => hasTerm(profile.corpus, amenity) || (AMENITY_ALIASES[amenity] || []).some((alias) => hasTerm(profile.corpus, alias))),
    source: profile.source,
    matched_rule: {
      rule_id: "kb_ranked_retrieval",
      buyer_profile: criteria.purpose || "unknown",
      kb_source: "AQAAR-KB-ACQ-FINAL-v3 + Intelligence-Layer-v2"
    }
  };
}

function comparePrices(a, b, budget) {
  if (!budget) return 0;
  const ap = Number(a.project.price_min);
  const bp = Number(b.project.price_min);
  const ad = Number.isFinite(ap) ? Math.abs(budget - ap) : Number.MAX_SAFE_INTEGER;
  const bd = Number.isFinite(bp) ? Math.abs(budget - bp) : Number.MAX_SAFE_INTEGER;
  return ad - bd;
}

function sessionBaseProfiles(data, session) {
  return Array.isArray(session?.lastProfiles) && session.lastProfiles.length ? session.lastProfiles : [];
}

function buildMemoryQuery(message, memory) {
  return [
    message,
    memory.purpose,
    memory.property_type,
    memory.commercial_type,
    memory.location,
    memory.bedrooms !== undefined ? `${memory.bedrooms} bedroom` : "",
    memory.budget,
    memory.currency,
    ...(memory.amenities || [])
  ].filter(Boolean).join(" ");
}

function nextQuestionFor(memory, purpose) {
  // Ask only the most contextually relevant next question based on what's missing.
  // The order is conversational — start with the most impactful missing slot.
  const order = FLOW_ORDER[purpose] || FLOW_ORDER.buy;
  const name = (memory && memory.name) ? memory.name : null;

  for (const slot of order) {
    if (slot === "contact") {
      if (!hasContact(memory && memory.lead_capture ? memory.lead_capture : {})) {
        return FLOW_QUESTIONS.contact;
      }
      continue;
    }
    if (!memory || !memory[slot]) {
      // Return a warm, context-aware version of the question
      const q = FLOW_QUESTIONS[slot];
      if (!q) continue;
      return q;
    }
  }
  return null; // All key slots filled — no forced follow-up
}
function classifyQuestion(message) {
  const text = norm(message);
  if (/\b(email|phone|call me|my name is|enquiry|enquire|contact me)\b/.test(text)) return "enquiry";
  if (/\bcompare\b/.test(text)) return "compare";
  if (/\bprice|prices|priced|range|cost|budget|under|below|cheapest|lowest price|least expensive|affordable\b/.test(text)) return "price";
  if (/\bpayment plan|installment|instalment|down payment|cheque|cheques\b/.test(text)) return "payment_plans";
  if (/\bamenit|facilit|gym|pool|kids|parking\b/.test(text)) return "amenities";
  if (/\bschools?\b/.test(text)) return "schools";
  if (/\bhospitals?|healthcare|clinic\b/.test(text) && !/\bcommercial\b/.test(text)) return "hospitals";
  if (/\bnearby|landmark|landmarks|university|universities\b/.test(text)) return "nearby_landmarks";
  if (/\bluxury|premium|branded\b/.test(text)) return "luxury";
  if (/\binvest|investment|roi|yield\b/.test(text)) return "investment";
  if (/\bcommercial|office|retail|warehouse|clinic\b/.test(text)) return "commercial";
  if (/\bbeachfront|waterfront|beach|sea view|corniche\b/.test(text)) return "waterfront";
  if (/\bfreehold|location|community|area\b/.test(text)) return "location_freehold";
  if (/\b\d+\s*(bed|bedroom|br)|studio|apartment|villa|townhouse\b/.test(text)) return "bedroom_unit_type";
  return "project_search";
}

function buildContextualResponse(data, message, memory, retrieved, recs, nextQuestion) {
  const type = classifyQuestion(message);
  const parsed = mergeKnown(parseSlots(message), memory || {});
  const profiles = allProfiles(data);
  const named = findNamedProjects(profiles, message);
  let items = [];
  let answer = "";

  if (type === "enquiry") {
    return {
      type,
      answer: "I can capture your enquiry details and keep the current Aqaar shortlist attached to the lead. Please share your name and phone number when ready.",
      cards: [],
      recommendations: []
    };
  }

  if (type === "compare") {
    items = named;
    if (items.length < 2) return noMatch("compare");
    return compareResponse(items.slice(0, 2));
  }

  if (type === "nearby_landmarks") {
    if (named.length) return landmarkResponse(named);
    items = profiles.filter((profile) => /\beducation|school|university|healthcare|hospital\b/i.test(`${profile.property_type} ${profile.sub_type} ${profile.project_name}`));
    return facilityResponse(items, "Nearby landmark records found in the verified Aqaar KB", "nearby_landmarks");
  }

  if (type === "amenities") {
    items = named;
    if (!items.length) items = filterProfiles(profiles, parsed).slice(0, 3);
    return amenitiesResponse(items);
  }

  if (type === "payment_plans") {
    items = (named.length ? named : filterProfiles(profiles, parsed))
      .filter((profile) => isKnown(profile.payment_plan) || profile.units.some((unit) => isKnown(unit.payment_plan)))
      .slice(0, 5);
    return paymentPlanResponse(items);
  }

  if (type === "price") {
    items = filterProfiles(profiles, parsed)
      .filter((profile) => Number.isFinite(minPublishedPrice(profile)))
      .sort((a, b) => minPublishedPrice(a) - minPublishedPrice(b))
      .slice(0, 6);
    return priceResponse(items, parsed);
  }

  if (named.length) {
    return projectLookupResponse(named.slice(0, 3), parsed);
  }

  if (type === "schools") {
    items = profiles.filter((profile) => norm(profile.property_type).includes("education") || norm(profile.sub_type).includes("education"));
    return facilityResponse(items, "Schools found in Aqaar KB", "school");
  }

  if (type === "hospitals") {
    items = profiles.filter((profile) => norm(profile.property_type).includes("healthcare") || norm(profile.project_name).includes("hospital"));
    return facilityResponse(items, "Healthcare records found in Aqaar KB", "hospital");
  }

  if (type === "luxury") {
    items = profiles
      .filter((profile) => /\bluxury|premium|branded|beachfront|waterfront\b/i.test(profile.corpus))
      .sort((a, b) => Number(b.price_min || 0) - Number(a.price_min || 0))
      .slice(0, 5);
    return listResponse("Luxury-positioned Aqaar projects", items, parsed);
  }

  if (type === "investment") {
    items = filterProfiles(profiles, { ...parsed, purpose: "invest" })
      .filter((profile) => /\bresidential|villa|freehold|branded|waterfront|beachfront\b/i.test(`${profile.property_type} ${profile.sub_type} ${profile.completion} ${profile.project_name}`))
      .filter((profile) => !/\bcommercial|education|school|healthcare|hospital|clinic\b/i.test(`${profile.property_type} ${profile.sub_type} ${profile.project_name}`))
      .slice(0, 5);
    answer = "For investment, I can only use published KB signals such as project status, location, pricing, unit mix, waterfront/branded positioning, and available payment plans. ROI is not published in the KB.";
    return cardResponse(type, answer, items, parsed, nextQuestion);
  }

  if (type === "commercial") {
    items = filterProfiles(profiles, { ...parsed, purpose: "commercial", property_type: "commercial" }).slice(0, 6);
    return listResponse("Commercial Aqaar projects matching the request", items, { ...parsed, property_type: "commercial" });
  }

  if (type === "waterfront") {
    items = filterProfiles(profiles, { ...parsed, amenities: [...new Set([...(parsed.amenities || []), "waterfront"])] }).slice(0, 5);
    return listResponse("Waterfront and Corniche matches", items, parsed);
  }

  if (type === "location_freehold") {
    items = profiles
      .filter((profile) => norm(profile.ownership_type).includes("freehold") || norm(profile.sub_type).includes("freehold") || hasTerm(profile.corpus, "freehold"))
      .filter((profile) => matchesStrict(profile, parsed))
      .slice(0, 6);
    return listResponse("Location and ownership matches from Aqaar KB", items, parsed, nextQuestion);
  }

  if (type === "bedroom_unit_type") {
    items = filterProfiles(profiles, parsed).slice(0, 6);
    return listResponse("Unit matches from Aqaar KB", items, parsed, nextQuestion);
  }

  items = filterProfiles(profiles, parsed).slice(0, 5);
  if (!items.length && !hasExplicitFilters(parsed) && recs.recommendations.length) items = recs.recommendations.map((item) => item.project).slice(0, 5);
  if (!items.length && retrieved.results.length === 0) {
    return {
      type: "out_of_scope",
      answer: "Not published in verified Aqaar KB.",
      cards: [],
      recommendations: []
    };
  }
  return listResponse("Published Aqaar KB matches", items, parsed, nextQuestion);
}

function noMatch(type = "search") {
  return {
    type,
    answer: "Not published in verified Aqaar KB.",
    cards: [],
    recommendations: []
  };
}

function hasExplicitFilters(criteria = {}) {
  return Boolean(criteria.property_type || criteria.commercial_type || criteria.location || criteria.bedrooms !== undefined || criteria.budget || criteria.amenities?.length);
}

function listResponse(title, profiles, criteria = {}, nextQuestion = null) {
  if (!profiles.length) return noMatch("project_search");
  const filtered = profiles.map((profile) => recommendationFromProfile(profile, 1, whyForProfile(profile, criteria), criteria));
  const detail = profiles.length === 1 ? "Here is the closest published match." : `I found ${profiles.length} published match${profiles.length === 1 ? "" : "es"}.`;
  const followUp = nextQuestion ? `\n\n${nextQuestion}` : "";
  return {
    type: "project_search",
    answer: `${title}. ${detail}${followUp}`,
    cards: profiles.map((profile) => cleanCard(profile, criteria)),
    recommendations: filtered
  };
}

function cardResponse(type, intro, profiles, criteria = {}, nextQuestion = null) {
  if (!profiles.length) return noMatch(type);
  return {
    type,
    answer: `${intro}${nextQuestion ? `\n\n${nextQuestion}` : ""}`,
    cards: profiles.map((profile) => cleanCard(profile, criteria)),
    recommendations: profiles.map((profile) => recommendationFromProfile(profile, 1, whyForProfile(profile, criteria), criteria))
  };
}

function paymentPlanResponse(profiles) {
  if (!profiles.length) return noMatch("payment_plans");
  return {
    type: "payment_plans",
    answer: "Published payment plans are available for these Aqaar records. Values not published in the KB are left out.",
    cards: profiles.map((profile) => cleanCard(profile, {}, { focus: "payment" })),
    recommendations: profiles.map((profile) => recommendationFromProfile(profile, 1, ["has a published payment plan"], {}))
  };
}

function priceResponse(profiles, criteria = {}) {
  if (!profiles.length) {
    return {
      type: "price",
      answer: "Not published in verified Aqaar KB.",
      cards: [],
      recommendations: []
    };
  }
  const label = criteria.property_type ? `${criteria.property_type} price range` : "Published price range";
  return {
    type: "price",
    answer: `${label}: showing only Aqaar records with published prices matching the request.`,
    cards: profiles.map((profile) => cleanCard(profile, criteria, { focus: "price" })),
    recommendations: profiles.map((profile) => recommendationFromProfile(profile, 1, [`published price starts from ${formatProjectPrice(profile)}`], criteria))
  };
}

function projectLookupResponse(profiles, criteria = {}) {
  if (!profiles.length) return noMatch("project_lookup");
  const names = profiles.map((profile) => profile.project_name).join(", ");
  return {
    type: "project_lookup",
    answer: `${names} ${profiles.length === 1 ? "is" : "are"} published in the verified Aqaar KB.`,
    cards: profiles.map((profile) => cleanCard(profile, criteria, { focus: "lookup" })),
    recommendations: profiles.map((profile) => recommendationFromProfile(profile, 1, ["direct project lookup"], criteria))
  };
}

function landmarkResponse(profiles) {
  if (!profiles.length) {
    return {
      type: "nearby_landmarks",
      answer: "Not published in verified Aqaar KB.",
      cards: [],
      recommendations: []
    };
  }
  return {
    type: "nearby_landmarks",
    answer: "These landmark records are published in the verified Aqaar KB. They are treated as location or landmark context only.",
    cards: profiles.map((profile) => cleanCard(profile, {}, { focus: "landmark" })),
    recommendations: profiles.map((profile) => recommendationFromProfile(profile, 1, ["landmark context from Aqaar KB"], {}))
  };
}

function amenitiesResponse(profiles) {
  if (!profiles.length) return noMatch("amenities");
  return {
    type: "amenities",
    answer: profiles.length === 1
      ? `Amenities published for ${profiles[0].project_name}.`
      : "Amenities published for the matching Aqaar projects.",
    cards: profiles.map((profile) => cleanCard(profile, {}, { focus: "amenities" })),
    recommendations: profiles.map((profile) => recommendationFromProfile(profile, 1, ["amenity data requested"], {}))
  };
}

function facilityResponse(profiles, title, type) {
  if (!profiles.length) return noMatch(type);
  return {
    type,
    answer: `${title}. Distances are shown only where the KB publishes them.`,
    cards: profiles.slice(0, 8).map((profile) => cleanCard(profile, {}, { focus: type })),
    recommendations: profiles.slice(0, 8).map((profile) => recommendationFromProfile(profile, 1, [`${type} record in KB`], {}))
  };
}

function compareResponse(profiles) {
  const rows = profiles.slice(0, 2).map((profile) => {
    const unitTypes = unitTypesFor(profile).join(", ") || "Property details available with consultant";
    const amenities = profile.amenities.length ? profile.amenities.join(", ") : "Community amenities and lifestyle facilities";
    return `- ${profile.project_name}: ${cleanLocation(profile)}. ${unitTypes}. Price: ${formatProjectPrice(profile)}. Payment: ${isKnown(profile.payment_plan) ? profile.payment_plan : "flexible options available"}. Amenities: ${amenities.split(",").slice(0, 3).join(", ")}.`;
  });
  return {
    type: "compare",
    answer: `Here is the quick Aqaar KB comparison:\n${rows.join("\n")}\n\nIf you want stronger waterfront positioning, I would start with the Corniche option. If you want value and unit fit, I can narrow it by budget next.`,
    cards: profiles.map((profile) => cleanCard(profile, {}, { focus: "compare" })),
    recommendations: profiles.map((profile) => recommendationFromProfile(profile, 1, ["directly requested for comparison"], {}))
  };
}

function filterProfiles(profiles, criteria = {}) {
  const budget = Number(criteria.budget);
  return profiles
    .filter((profile) => matchesStrict(profile, criteria))
    .filter((profile) => !Number.isFinite(budget) || budget <= 0 || minPublishedPrice(profile) <= budget)
    .map((profile) => ({ profile, score: scoreProfile(profile, { ...criteria, queryTokens: expandQueryTokens([], criteria) }).score }))
    .sort((a, b) => b.score - a.score || Number(a.profile.price_min || Infinity) - Number(b.profile.price_min || Infinity))
    .map((entry) => entry.profile);
}

function matchesStrict(profile, criteria = {}) {
  if (criteria.property_type) {
    const wanted = norm(criteria.property_type);
    const classification = `${profile.property_type} ${profile.sub_type} ${unitTypesFor(profile).join(" ")}`;
    if (wanted === "apartment") {
      if (/\bcommercial|office|retail|shop|clinic|warehouse|education|school|hospital|healthcare|villa|townhouse\b/i.test(classification)) return false;
      if (!/\bapartment|residence|residential|studio\b/i.test(profile.corpus)) return false;
    }
    else if (wanted === "villa" && !/\bvilla\b/i.test(profile.corpus)) return false;
    else if (wanted === "commercial" && !/\bcommercial|office|retail|shop|clinic|warehouse\b/i.test(profile.corpus)) return false;
    else if (!["apartment", "villa", "commercial"].includes(wanted) && !hasTerm(profile.corpus, wanted)) return false;
  }
  if (criteria.purpose === "commercial" && !/\bcommercial|office|retail|shop|clinic|warehouse\b/i.test(profile.corpus)) return false;
  if (criteria.location && !norm(profile.corpus).includes(norm(criteria.location))) return false;
  if (criteria.bedrooms !== undefined && !projectHasBedrooms(profile, criteria.bedrooms)) return false;
  if (criteria.budget && !budgetMatches(profile, criteria.budget)) return false;
  for (const amenity of criteria.amenities || []) {
    if (!hasTerm(profile.corpus, amenity) && !(AMENITY_ALIASES[amenity] || []).some((alias) => hasTerm(profile.corpus, alias))) return false;
  }
  return PROJECT_TYPES.some((type) => norm(profile.property_type).includes(type)) || profile.project_name !== "unknown";
}

function findNamedProjects(profiles, message) {
  const text = norm(message);
  return profiles.filter((profile) => {
    const name = norm(profile.project_name);
    if (name !== "unknown" && text.includes(name)) return true;
    if (name.includes("dusit") && text.includes("dusit")) return true;
    if (name.includes("mawjan") && text.includes("mawjan")) return true;
    return false;
  });
}

function cleanCard(profile, criteria = {}, options = {}) {
  const units = matchingUnits(profile, criteria);
  const why = options.focus === "payment"
    ? paymentWhy(profile)
    : options.focus === "amenities"
      ? amenityWhy(profile)
      : options.focus === "school" || options.focus === "hospital"
        ? facilityWhy(profile)
        : whyForProfile(profile, criteria).join("; ");
  return {
    project: knownOrDisplay(profile.project_name),
    location: cleanLocation(profile),
    price: knownOrDisplay(formatProjectPrice(profile, units)),
    unit_types: unitTypesFor(profile).join(", ") || "Property details available with consultant",
    bedrooms: knownOrDisplay(criteria.bedrooms !== undefined ? String(criteria.bedrooms) : profile.bedrooms),
    amenities: profile.amenities.length ? profile.amenities.join(", ") : "Community amenities and lifestyle facilities",
    payment_plan: isKnown(profile.payment_plan) ? profile.payment_plan : "Flexible payment options available",
    status: knownOrDisplay(profile.status),
    why_recommended: why
  };
}

function cleanLocation(profile) {
  return [profile.community, profile.district, profile.city]
    .filter(isKnown)
    .filter((value, index, arr) => arr.findIndex(item => norm(item) === norm(value)) === index)
    .join(", ") || "Ajman";
}

function formatProjectPrice(profile, units = profile.units) {
  const prices = units.flatMap((unit) => [Number(unit.price_min), Number(unit.price_max)]).filter((value) => Number.isFinite(value) && value > 0);
  if (!prices.length && isKnown(profile.price_min)) prices.push(Number(profile.price_min));
  if (!prices.length) return "Price available on enquiry";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `AED ${min.toLocaleString("en-US")}` : `AED ${min.toLocaleString("en-US")} - ${max.toLocaleString("en-US")}`;
}

function unitTypesFor(profile) {
  return [...new Set(profile.units.map((unit) => unit.unit_type).filter(isKnown))].slice(0, 5);
}

function whyForProfile(profile, criteria = {}) {
  const reasons = [];
  if (criteria.property_type) reasons.push(`matches ${criteria.property_type}`);
  if (criteria.bedrooms !== undefined) reasons.push(`has ${criteria.bedrooms} bedroom inventory`);
  if (criteria.budget) reasons.push(`within published budget where pricing is available`);
  if (criteria.location) reasons.push(`located in ${criteria.location}`);
  for (const amenity of criteria.amenities || []) reasons.push(`matches ${amenity}`);
  if (!reasons.length && profile.description !== "unknown") reasons.push("matches the published Aqaar profile");
  if (!reasons.length) reasons.push("published in Aqaar KB");
  return reasons;
}

function paymentWhy(profile) {
  const plans = [...new Set(profile.units.map((unit) => unit.payment_plan).filter(isKnown))];
  return plans.length ? `published plan: ${plans[0]}` : "payment plan not published in KB";
}

function amenityWhy(profile) {
  return profile.amenities.length ? `published amenities: ${profile.amenities.join(", ")}` : "amenities not published in KB";
}

function facilityWhy(profile) {
  return [profile.nearby_schools, profile.nearby_hospitals, profile.connectivity, profile.landmarks].filter(isKnown).join("; ") || "facility record published in KB";
}

function buildAdvisorAnswer(memory, retrieved, recs, nextQuestion) {
  const lines = [];
  lines.push("I searched the Aqaar KB first and filtered against the details we have in this conversation.");
  if (!recs.recommendations.length) {
    lines.push("I could not find a published Aqaar KB match for that exact combination. I can broaden the search by location, budget, or property type.");
    lines.push(nextQuestion);
    return lines.join("\n\n");
  }

  lines.push(`Best matches from the KB:`);
  for (const item of recs.recommendations.slice(0, 3)) {
    const p = item.project;
    const unit = item.units[0] || {};
    const price = isKnown(unit.price_min) ? `${unit.currency || p.currency || "AED"} ${Number(unit.price_min).toLocaleString("en-US")}` : (isKnown(p.price_min) ? `${p.currency || "AED"} ${Number(p.price_min).toLocaleString("en-US")}` : "Price available on enquiry");
    const payment = isKnown(unit.payment_plan) ? unit.payment_plan : (isKnown(p.payment_plan) ? p.payment_plan : "Flexible payment options available");
    const amenities = item.matched_amenities.length ? item.matched_amenities.join(", ") : (p.amenities.length ? p.amenities.slice(0, 4).join(", ") : "Community amenities and lifestyle facilities");
    const brochure = isKnown(p.brochure) ? p.brochure : "Brochure available through Aqaar consultant";
    lines.push(`- ${p.project_name}: ${item.why_recommended.join("; ")}. ${p.community !== "unknown" ? `Community: ${p.community}. ` : ""}${p.city !== "unknown" ? `City: ${p.city}. ` : ""}Price: ${price}. Payment plan: ${payment}. Matching amenities/features: ${amenities}. Brochure/source: ${brochure}.`);
  }

  if (retrieved.rag_context?.length) {
    lines.push(`RAG context used: ${retrieved.rag_context.map((chunk) => chunk.title).join(", ")}.`);
  }
  lines.push(nextQuestion);
  return lines.join("\n\n");
}

function captureLead(message) {
  const text = String(message || "");
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0];
  const rawName = text.match(/\bmy name is\s+([a-z][a-z\s.'-]{1,60}?)(?:\s+and\b|\s+phone\b|\s+email\b|,|$)/i)?.[1]?.trim()
    || text.match(/\bi am\s+([a-z][a-z\s.'-]{1,60}?)(?:\s+and\b|\s+phone\b|\s+email\b|,|$)/i)?.[1]?.trim()
    || text.match(/\bi['’`]?m\s+([a-z][a-z\s.'-]{1,60}?)(?:\s+and\b|\s+phone\b|\s+email\b|,|$)/i)?.[1]?.trim();
  const name = rawName?.replace(/\b(my|phone|email|number)\b.*$/i, "").trim();
  const cleanName = name && !/^(from|looking|interested|planning|searching|buying|renting|investing)\b/i.test(name) ? name : undefined;
  return {
    name: knownOrUnknown(cleanName),
    phone: knownOrUnknown(phone),
    email: knownOrUnknown(email)
  };
}

function hasContact(lead = {}) {
  return isKnown(lead.phone) || isKnown(lead.email);
}

function buildSalesSummary(memory, recommendations) {
  const names = recommendations.map((item) => item.project.project_name).join(", ") || "unknown";
  return `Purpose: ${knownOrUnknown(memory.purpose)}; type: ${knownOrUnknown(memory.property_type || memory.commercial_type)}; bedrooms: ${knownOrUnknown(memory.bedrooms)}; budget: ${knownOrUnknown(memory.budget)}; location: ${knownOrUnknown(memory.location || memory.business_location)}; shortlisted projects: ${names}.`;
}

function uniqueSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    const key = `${source.entity_type}:${source.entity_id}:${source.source_url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const value = knownOrUnknown(row[field]);
    if (value === "unknown") continue;
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function topCounts(counts, limit = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value, count: value }));
}

function deriveIntentCounts(seed) {
  const counts = { buy: 0, rent: 0, invest: 0, commercial: 0 };
  for (const row of seed) {
    const intent = deriveSeedIntent(row);
    counts[intent] = (counts[intent] || 0) + 1;
  }
  return counts;
}

function bucketSequence(total, buckets) {
  if (!total) return [];
  const base = Math.floor(total / buckets);
  const remainder = total % buckets;
  return Array.from({ length: buckets }, (_, index) => ({
    date: `KB seed ${index + 1}`,
    count: base + (index < remainder ? 1 : 0)
  }));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function formatBudget(min, max, currency = "AED") {
  const low = Number(min);
  const high = Number(max);
  if (Number.isFinite(low) && Number.isFinite(high) && low > 0 && high > 0) {
    return low === high ? `${currency} ${low.toLocaleString("en-US")}` : `${currency} ${low.toLocaleString("en-US")}-${high.toLocaleString("en-US")}`;
  }
  return "unknown";
}

function validation(basis) {
  return {
    kb_only: true,
    intelligence_only: true,
    basis,
    unsupported_values_returned_as_unknown: true
  };
}
