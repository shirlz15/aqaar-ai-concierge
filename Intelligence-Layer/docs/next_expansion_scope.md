# Next Expansion Scope

Generated: 2026-06-24

## Recommended Next Phase

- Connect the concierge schema to a live conversation runtime.
- Add CRM/webhook integration for real Aqaar sales handoff.
- Replace lexical retrieval testing with embedding retrieval, reranking, and answer-grounding checks.
- Add authenticated lead capture and consent tracking before storing personal contact details.
- Add dashboard frontend only after runtime data contracts are approved.
- Add project-level amenity matching only if Aqaar publishes project-specific amenity relationships.
- Add unit-level availability only if Aqaar publishes official unit inventory endpoints.

## Guardrails

- Do not infer ROI, legal, financing, service-charge, handover, or commute facts unless official Aqaar sources publish them.
- Keep unavailable values as `unknown`.
- Do not use PalmX or third-party data as facts.
