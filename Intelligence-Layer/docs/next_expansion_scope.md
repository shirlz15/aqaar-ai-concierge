# Next Expansion Scope

Generated: 2026-06-24
Version: 2.0

## Recommended Next Phase

- Wire the V2 concierge schemas into the live chat runtime.
- Add CRM/webhook integration for real Aqaar sales handoff.
- Replace lexical retrieval checks with embedding retrieval, reranking, and answer-grounding evaluation.
- Add consent tracking before storing real customer name, phone, or email.
- Add project-level amenity matching only if Aqaar publishes project-specific amenity relationships.
- Add live unit availability only if Aqaar publishes official unit inventory endpoints.
- Add dashboard frontend only after the V2 data contracts are approved.

## Guardrails

- Do not infer ROI, legal, financing, service-charge, handover, commute, or exact availability facts unless official Aqaar sources publish them.
- Keep unavailable values as `unknown`.
- Do not use PalmX or third-party data as facts.
