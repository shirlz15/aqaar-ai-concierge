import { isKnown, knownOrUnknown } from "./csv.js";

const sessions = new Map();

const FLOW_ORDER = {
  buy: ["purpose", "property_type", "bedrooms", "budget", "location", "timeline", "payment_preference", "contact"],
  rent: ["purpose", "bedrooms", "budget", "location", "family_status", "move_in_timeline", "contact"],
  invest: ["purpose", "budget", "roi_expectations", "rental_preference", "readiness", "contact"],
  commercial: ["purpose", "commercial_type", "budget", "business_location", "timeline", "contact"]
};

const FLOW_QUESTIONS = {
  purpose: "Are you looking to buy, rent, invest, or lease a commercial space?",
  property_type: "Which property type should I focus on: apartment, villa, townhouse, or commercial?",
  commercial_type: "What type of commercial space do you need: office, retail, clinic, or warehouse?",
  bedrooms: "How many bedrooms should I filter for?",
  budget: "What budget range should I use?",
  location: "Which Aqaar location or community do you prefer?",
  business_location: "Which business location in Ajman should I focus on?",
  timeline: "What timeline are you working with?",
  move_in_timeline: "When would you like to move in?",
  payment_preference: "Do you prefer cash, mortgage, or a published payment plan?",
  roi_expectations: "What ROI expectation should I note for the investment brief?",
  rental_preference: "Do you prefer a rental-income property or capital appreciation focus?",
  readiness: "Do you prefer ready properties or off-plan opportunities?",
  family_status: "Is this for a family or bachelor requirement?",
  contact: "Would you like to share your name and phone so an Aqaar advisor can follow up with this shortlist?"
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
    status: knownOrUnknown(project.status),
    completion: knownOrUnknown(project.completion_status || project.handover_year),
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
      project.status,
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

export function dashboard(data) {
  const seed = data.leadsSeed || [];
  const projectCounts = countBy(seed, "project_name");
  const locationCounts = countBy(seed, "location");
  const unitTypeCounts = countBy(seed, "unit_type");
  const priced = seed.map((row) => Number(row.budget_min || row.budget_max)).filter((value) => Number.isFinite(value) && value > 0);
  const leads = seed.slice(0, 50).map((row) => ({
    id: row.lead_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    intent: row.purpose,
    budget: formatBudget(row.budget_min, row.budget_max, row.currency),
    property_name: row.project_name,
    unit_type: row.unit_type,
    location: row.location,
    score: row.lead_score,
    date: data.dashboardMetrics[0]?.generated_at || row.last_verified || "unknown",
    status: "KB seed",
    source_url: row.source_url
  }));

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
      total_leads: seed.length,
      unique_contacts: 0,
      projects_represented: Object.keys(projectCounts).length,
      units_with_published_budget: priced.length,
      median_budget: median(priced) || "unknown"
    },
    chart_data: {
      activity: bucketSequence(seed.length, 7),
      intents: deriveIntentCounts(seed),
      top_projects: topCounts(projectCounts, 8),
      location_distribution: topCounts(locationCounts, 8),
      unit_type_distribution: topCounts(unitTypeCounts, 8),
      timeline_distribution: topCounts(countBy(seed, "timeline"), 8)
    },
    leads,
    sources: [
      { entity_type: "intelligence_seed", entity_id: "aqaar_leads_seed.csv", source_url: "Intelligence-Layer-v2/csv/aqaar_leads_seed.csv" }
    ],
    validation: validation("intelligence_seed_dashboard")
  };
}

export function chat(data, input = {}) {
  const sessionId = input.session_id || "default";
  const message = input.message || "";
  const session = sessions.get(sessionId) || { session_id: sessionId, turns: [], memory: {}, lastProfiles: [] };
  const incoming = parseSlots(message);
  const requestedIntent = normalizeIntent(input.intent);
  if (requestedIntent && !session.memory.purpose) incoming.purpose = requestedIntent;
  const lead = captureLead(message);
  session.memory = mergeKnown(session.memory, incoming);
  session.memory.lead_capture = mergeKnown(session.memory.lead_capture || {}, lead);

  const detected = detectIntent(data, [message, session.memory.purpose].filter(Boolean).join(" "));
  const activePurpose = session.memory.purpose || intentToPurpose(detected.intent) || "buy";
  session.memory.purpose = activePurpose;

  const retrieved = search(data, buildMemoryQuery(message, session.memory), 10);
  const previous = session.lastProfiles
    .map((id) => allProfiles(data).find((profile) => profile.property_id === id))
    .filter(Boolean);
  const recs = recommend(data, { ...session.memory, message, intent: activePurpose, limit: 4, session: { lastProfiles: previous } });
  if (recs.recommendations.length) session.lastProfiles = recs.recommendations.map((item) => item.project.property_id);
  const qualification = qualify(data, { intent: PURPOSE_TO_INTENT[activePurpose] || detected.intent, message });

  session.turns.push({ message, intent: activePurpose, parsed: incoming, lead });
  sessions.set(sessionId, session);

  const nextQuestion = nextQuestionFor(session.memory, activePurpose);
  const answer = buildAdvisorAnswer(session.memory, retrieved, recs, nextQuestion);
  return {
    session_id: sessionId,
    answer,
    reply: answer,
    intent: { ...detected, intent: PURPOSE_TO_INTENT[activePurpose] || detected.intent },
    memory: session.memory,
    recommendations: recs.recommendations,
    qualification,
    lead_capture: session.memory.lead_capture,
    sales_handoff: {
      status: hasContact(session.memory.lead_capture) ? "ready_for_sales_follow_up" : "awaiting_contact",
      summary: buildSalesSummary(session.memory, recs.recommendations),
      captured_fields: session.memory.lead_capture,
      source: "Concierge-Backend-v1 session memory plus KB-backed recommendations"
    },
    sources: uniqueSources([...retrieved.sources, ...recs.sources]),
    validation: validation("kb_checked_before_response")
  };
}

function parseSlots(message) {
  const text = norm(message);
  const slots = {};
  if (/\b(buy|purchase|own)\b/.test(text)) slots.purpose = "buy";
  if (/\b(rent|lease)\b/.test(text)) slots.purpose = "rent";
  if (/\b(invest|investment|roi|yield)\b/.test(text)) slots.purpose = "invest";
  if (/\b(commercial|office|retail|clinic|warehouse|shop)\b/.test(text)) slots.purpose = "commercial";
  if (/\bvilla\b/.test(text)) slots.property_type = "villa";
  if (/\b(apartment|flat|studio)\b/.test(text)) slots.property_type = "apartment";
  if (/\btownhouse\b/.test(text)) slots.property_type = "townhouse";
  if (/\b(office|retail|clinic|warehouse|shop)\b/.test(text)) slots.commercial_type = text.match(/\b(office|retail|clinic|warehouse|shop)\b/)?.[1];
  const bedrooms = parseBedrooms(text);
  if (bedrooms !== null) slots.bedrooms = bedrooms;
  const budget = parseBudget(text);
  if (budget) slots.budget = budget;
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
  const direct = text.match(/\b(\d+)\s*(?:bed|beds|bedroom|bedrooms|br)\b/)?.[1];
  if (direct) return Number(direct);
  const words = { studio: 0, one: 1, two: 2, three: 3, four: 4, five: 5 };
  for (const [word, value] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\s*(?:bed|bedroom|br)?\\b`).test(text)) return value;
  }
  return null;
}

function parseBudget(text) {
  const match = text.match(/(?:aed|budget|under|below|around|up to)?\s*([\d,.]+)\s*(m|million|k|thousand)?/i);
  if (!match) return null;
  let value = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const suffix = norm(match[2]);
  if (suffix === "m" || suffix === "million") value *= 1000000;
  if (suffix === "k" || suffix === "thousand") value *= 1000;
  if (value < 1000) return null;
  return Math.round(value);
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
    reasons.push(`has published pricing within AED ${Number(criteria.budget).toLocaleString()}`);
  } else if (criteria.budget && profile.price_min !== "unknown") {
    reasons.push(`published pricing starts from AED ${Number(profile.price_min).toLocaleString()}`);
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
  return profile.units.some((unit) => {
    const min = Number(unit.price_min || unit.price_max);
    return Number.isFinite(min) && min > 0 && min <= budget;
  });
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
    ...(memory.amenities || [])
  ].filter(Boolean).join(" ");
}

function nextQuestionFor(memory, purpose) {
  const order = FLOW_ORDER[purpose] || FLOW_ORDER.buy;
  for (const slot of order) {
    if (slot === "contact") {
      if (!hasContact(memory.lead_capture)) return FLOW_QUESTIONS.contact;
      continue;
    }
    if (!memory[slot]) return FLOW_QUESTIONS[slot];
  }
  return "Would you like me to prepare a sales handoff summary for this shortlist?";
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
    const price = isKnown(unit.price_min) ? `${unit.currency || p.currency || "AED"} ${Number(unit.price_min).toLocaleString()}` : (isKnown(p.price_min) ? `${p.currency || "AED"} ${Number(p.price_min).toLocaleString()}` : "Contact Aqaar for details");
    const payment = isKnown(unit.payment_plan) ? unit.payment_plan : (isKnown(p.payment_plan) ? p.payment_plan : "Contact Aqaar for details");
    const amenities = item.matched_amenities.length ? item.matched_amenities.join(", ") : (p.amenities.length ? p.amenities.slice(0, 4).join(", ") : "Contact Aqaar for details");
    const brochure = isKnown(p.brochure) ? p.brochure : "Contact Aqaar for details";
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
  const rawName = text.match(/\bmy name is\s+([a-z][a-z\s.'-]{1,60}?)(?:\s+and\b|\s+phone\b|\s+email\b|$)/i)?.[1]?.trim()
    || text.match(/\bi am\s+([a-z][a-z\s.'-]{1,60}?)(?:\s+and\b|\s+phone\b|\s+email\b|$)/i)?.[1]?.trim();
  const name = rawName?.replace(/\b(my|phone|email|number)\b.*$/i, "").trim();
  return {
    name: knownOrUnknown(name),
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
    const type = norm(row.unit_type);
    if (type.includes("commercial") || type.includes("office") || type.includes("retail")) counts.commercial += 1;
    else if (type.includes("rent") || norm(row.source_url).includes("rent")) counts.rent += 1;
    else if (Number(row.budget_min) > 0) counts.buy += 1;
    else counts.invest += 1;
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
    return low === high ? `${currency} ${low.toLocaleString()}` : `${currency} ${low.toLocaleString()}-${high.toLocaleString()}`;
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
