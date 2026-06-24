import { isKnown, knownOrUnknown } from "./csv.js";

const sessions = new Map();

function tokens(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1);
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

function matchScore(queryTokens, text) {
  const haystack = new Set(tokens(text));
  return queryTokens.reduce((score, token) => score + (haystack.has(token) ? 1 : 0), 0);
}

export function detectIntent(data, message = "") {
  const text = String(message).toLowerCase();
  const matches = (data.intents.intents || [])
    .map((intent) => {
      const triggerHits = (intent.trigger_phrases || []).filter((phrase) => text.includes(String(phrase).toLowerCase()));
      return { ...intent, score: triggerHits.length, trigger_hits: triggerHits };
    })
    .filter((intent) => intent.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    intent: matches[0]?.intent || "unknown",
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
  const queryTokens = tokens(query);
  if (!queryTokens.length) {
    return { query, results: [], sources: [], validation: validation("unknown query") };
  }

  const projectResults = data.projects.map((project) => {
    const score = matchScore(queryTokens, [
      project.property_name,
      project.developer,
      project.city,
      project.district,
      project.community,
      project.property_type,
      project.sub_type,
      project.status
    ].join(" "));
    return {
      type: "project",
      score,
      title: knownOrUnknown(project.property_name),
      entity_id: knownOrUnknown(project.property_id),
      summary: {
        developer: knownOrUnknown(project.developer),
        city: knownOrUnknown(project.city),
        district: knownOrUnknown(project.district),
        community: knownOrUnknown(project.community),
        property_type: knownOrUnknown(project.property_type),
        status: knownOrUnknown(project.status)
      },
      source: sourceFromProject(project)
    };
  });

  const ragResults = data.ragChunks.map((chunk, index) => {
    const text = JSON.stringify(chunk);
    const score = matchScore(queryTokens, text);
    return {
      type: "rag_chunk",
      score,
      title: knownOrUnknown(chunk.project || chunk.title || chunk.document || `chunk_${index}`),
      entity_id: knownOrUnknown(chunk.project_id || chunk.id || `chunk_${index}`),
      summary: { text: knownOrUnknown(chunk.text || chunk.content || text).slice(0, 500) },
      source: {
        entity_type: "rag_chunk",
        entity_id: knownOrUnknown(chunk.id || `chunk_${index}`),
        entity_name: knownOrUnknown(chunk.project || chunk.title || chunk.document),
        source_url: knownOrUnknown(chunk.source_url || chunk.source),
        last_verified: knownOrUnknown(chunk.last_verified),
        confidence_score: knownOrUnknown(chunk.confidence_score)
      }
    };
  });

  const results = [...projectResults, ...ragResults]
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(limit) || 5);

  return {
    query,
    results,
    sources: results.map((result) => result.source),
    validation: validation(results.length ? "kb_matches" : "unknown")
  };
}

export function recommend(data, input = {}) {
  const query = [input.message, input.intent, input.purpose, input.location, input.property_type, input.project].filter(Boolean).join(" ");
  const queryTokens = tokens(query);

  const rules = data.recommendationEngine.rules || [];
  const ruleMatches = rules.map((rule) => {
    const score = matchScore(queryTokens, JSON.stringify(rule));
    return { rule, score };
  });

  const matchedRules = ruleMatches
    .filter((entry) => entry.score > 0 || !queryTokens.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit || 5);

  const seen = new Set();
  const recommendations = [];
  for (const entry of matchedRules) {
    for (const project of entry.rule.recommended_aqaar_projects || []) {
      if (!isKnown(project.project_id) || seen.has(project.project_id)) continue;
      seen.add(project.project_id);
      const units = data.unitsByProject.get(project.project_id) || [];
      recommendations.push({
        project,
        units: units.slice(0, 5).map((unit) => ({
          unit_id: knownOrUnknown(unit.unit_id),
          unit_type: knownOrUnknown(unit.unit_type),
          bedrooms_min: knownOrUnknown(unit.bedrooms_min),
          area_min_sqft: knownOrUnknown(unit.area_min_sqft),
          price_min: knownOrUnknown(unit.price_min),
          price_max: knownOrUnknown(unit.price_max),
          currency: knownOrUnknown(unit.currency),
          payment_plan: knownOrUnknown(unit.payment_plan),
          source: sourceFromUnit(unit)
        })),
        matched_rule: {
          rule_id: entry.rule.rule_id,
          buyer_profile: entry.rule.buyer_profile,
          kb_source: entry.rule.kb_source
        },
        source: sourceFromProject(data.projectById.get(project.project_id))
      });
    }
  }

  return {
    recommendations,
    sources: recommendations.map((item) => item.source),
    validation: validation(recommendations.length ? "kb_recommendation_rules" : "unknown")
  };
}

export function qualify(data, input = {}) {
  const intent = input.intent || detectIntent(data, input.message).intent;
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
  return {
    metrics: data.dashboardMetrics.map((metric) => ({
      metric_id: knownOrUnknown(metric.metric_id),
      metric_group: knownOrUnknown(metric.metric_group),
      metric_name: knownOrUnknown(metric.metric_name),
      metric_value: knownOrUnknown(metric.metric_value),
      metric_label: knownOrUnknown(metric.metric_label),
      source_file: knownOrUnknown(metric.source_file),
      generated_at: knownOrUnknown(metric.generated_at)
    })),
    validation: validation("kb_dashboard_metrics")
  };
}

export function chat(data, input = {}) {
  const sessionId = input.session_id || "default";
  const message = input.message || "";
  const session = sessions.get(sessionId) || { session_id: sessionId, turns: [], memory: {} };
  const detected = detectIntent(data, message);
  const retrieved = search(data, message, 5);
  const recs = recommend(data, { message, intent: detected.intent, limit: 3 });
  const qualification = qualify(data, { intent: detected.intent, message });

  const lead = captureLead(message);
  session.turns.push({ message, intent: detected.intent, lead });
  session.memory = {
    last_intent: detected.intent,
    mentioned_projects: retrieved.results.filter((result) => result.type === "project").map((result) => result.title),
    lead_capture: { ...session.memory.lead_capture, ...lead }
  };
  sessions.set(sessionId, session);

  const answer = buildAnswer(detected, retrieved, recs, qualification);
  return {
    session_id: sessionId,
    answer,
    intent: detected,
    memory: session.memory,
    recommendations: recs.recommendations,
    qualification,
    lead_capture: session.memory.lead_capture,
    sales_handoff: {
      status: "unknown",
      reason: data.salesPlaybook.reason || "v3 KB does not publish handoff templates.",
      captured_fields: session.memory.lead_capture
    },
    sources: [...retrieved.sources, ...recs.sources],
    validation: validation("kb_checked")
  };
}

function captureLead(message) {
  const text = String(message || "");
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0];
  const name = text.match(/\bmy name is\s+([a-z][a-z\s.'-]{1,60})/i)?.[1]?.trim();
  return {
    name: knownOrUnknown(name),
    phone: knownOrUnknown(phone),
    email: knownOrUnknown(email)
  };
}

function buildAnswer(detected, retrieved, recs, qualification) {
  const parts = [];
  parts.push(`Intent: ${detected.intent}.`);
  if (retrieved.results.length) parts.push(`KB matches found: ${retrieved.results.map((result) => result.title).join("; ")}.`);
  else parts.push("KB matches found: unknown.");
  if (recs.recommendations.length) {
    parts.push(`KB recommendation projects: ${recs.recommendations.map((item) => item.project.project_name).join("; ")}.`);
  } else {
    parts.push("KB recommendation projects: unknown.");
  }
  if (qualification.qualification_questions.length) {
    parts.push(`Qualification questions: ${qualification.qualification_questions.join(" | ")}.`);
  }
  parts.push("Unpublished values remain unknown.");
  return parts.join(" ");
}

function validation(basis) {
  return {
    kb_only: true,
    intelligence_only: true,
    basis,
    unsupported_values_returned_as_unknown: true
  };
}
