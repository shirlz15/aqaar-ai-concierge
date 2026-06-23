# Backend Architecture Audit

## 1. Open Data Acquisition Layer

Current implementation: CSV and JSON loaders read generated Aqaar intelligence assets from `/csv` and `/data`.

Weaknesses: The first version loaded only `data/projects.json` inside the concierge module.

Missing functionality addressed: Centralized data acquisition now loads projects, inventory, locations, property types, amenities, investment signals, personas, FAQs, language, and conversation flows.

Production-grade improvements: Replace seed loaders with scheduled website/CRM/Supabase ingestion, source versioning, freshness checks, and approval workflow before sales claims are used.

## 2. Knowledge Graph

Current implementation: Graph edges are generated from project, property type, location, persona, and investment signal data.

Weaknesses: The first version had a markdown graph only, not executable graph context.

Missing functionality addressed: Backend now exposes graph context for a profile and counts graph edges in health checks.

Production-grade improvements: Store graph nodes/edges in Postgres or a graph database, add confidence and source provenance on every edge, and support graph-based retrieval filters.

## 3. Intent Identification Engine

Current implementation: Rule-based extraction identifies intent, project interest, property type, location, budget, timeline, urgency, persona, and organic buying stage.

Weaknesses: The first version only searched for a few literal words.

Missing functionality addressed: Intent signals now include confidence and evidence so downstream systems can audit why the system inferred an intent.

Production-grade improvements: Add an LLM/classifier ensemble, multilingual Arabic/English detection, calibrated confidence, and a prompt-injection filter.

## 4. Recommendation Engine

Current implementation: Projects are ranked by profile fit, graph adjacency, project interest, location, property type, commercial fit, and investment alignment.

Weaknesses: The first version only boosted location and property type against a tiny JSON file.

Missing functionality addressed: Recommendations now return reasoning, project type, location, sales pitch, investment potential, and ROI band.

Production-grade improvements: Connect live inventory, availability, price validity windows, user constraints, and agent overrides.

## 5. Lead Scoring Engine

Current implementation: Scoring uses explicit signals for intent, property type, location, budget, timeline, project interest, contact data, consent, and buying stage.

Weaknesses: The first version scored only location, budget, timeline, and phone.

Missing functionality addressed: Score breakdowns now explain every point and list missing qualification fields.

Production-grade improvements: Train scoring weights against actual conversion data and add decay/recency scoring.

## 6. Conversation State Management

Current implementation: Conversation state is loaded by session, merged with incoming profile, persisted in memory locally, and upserted to Supabase when configured.

Weaknesses: The first version relied on frontend-provided history and had no server-side memory.

Missing functionality addressed: Backend memory now tracks profile, messages, turn count, and last intent.

Production-grade improvements: Add TTL, retention policy, PII redaction, and CRM handoff snapshots.

## 7. Lead Capture API

Current implementation: Lead API validates contact details, requires consent, scores the lead, stores profile context, and returns score breakdown.

Weaknesses: The first version stored basic contact fields only.

Missing functionality addressed: Phone validation, profile storage, score breakdown, and consent enforcement are now explicit.

Production-grade improvements: Add duplicate detection, lead source attribution, CRM assignment rules, and encrypted PII columns.

## 8. Dashboard Analytics API

Current implementation: Admin-protected analytics endpoint summarizes project interest, location interest, persona distribution, source health, and hot investment signals.

Weaknesses: The first version had no backend dashboard analytics endpoint.

Missing functionality addressed: `/api/dashboard/analytics` now provides backend analytics from knowledge sources.

Production-grade improvements: Materialize daily analytics tables from real conversation, lead, intent, and recommendation events.

## 9. Security Architecture

Current implementation: Environment variables, request size middleware, CORS allowlist, rate limiting, sanitized errors, admin bearer-token protection, and server-side OpenAI key usage.

Weaknesses: In-memory rate limiting is not enough for distributed production.

Missing functionality addressed: Admin backend endpoints can require `ADMIN_DASHBOARD_TOKEN`.

Production-grade improvements: Use Redis-backed rate limiting, structured WAF rules, CSRF strategy for browser admin actions, and secrets rotation.

## 10. Audit Logging

Current implementation: Security events are logged locally and stored to Supabase when configured.

Weaknesses: The first version did not persist audit events.

Missing functionality addressed: Audit records now include event type, severity, IP hash, user agent, and metadata without raw PII.

Production-grade improvements: Add SIEM export, alert thresholds, and immutable log retention.

## 11. Validation

Current implementation: Pydantic validates chat, profiles, lead capture, email, phone, session IDs, score bounds, and response models.

Weaknesses: Initial validation lacked richer profile and phone constraints.

Missing functionality addressed: Profile schema now includes project interest, persona, and organic buying stage.

Production-grade improvements: Add Arabic text normalization, allowlist-based enum catalogs, and adversarial input tests.

## 12. Database Schema

Current implementation: Schema covers leads, conversations, intent events, recommendation events, security events, knowledge documents, and vector chunks.

Weaknesses: The first schema only covered leads, conversations, and security events.

Missing functionality addressed: Database now supports memory, RAG, intent auditability, recommendations, and analytics materialization.

Production-grade improvements: Add strict RLS policies, encryption for PII fields, migration tooling, backup policy, and Supabase branch environments.
