# Audit Method

Each source-backed fact is recorded in `csv/aqaar_sources_audit.csv`.

Audit columns:

- audit_id
- entity_id
- field_name
- field_value
- source_url
- evidence_snippet
- extraction_date
- confidence_score

Official public data was captured from Aqaar web properties and the public data
responses used by the Aqaar website. Assets are cataloged only when referenced
by those official responses or pages.

Validation checks:

- required CSV, JSON, RAG, and report files exist
- JSON files parse successfully
- RAG JSONL parses successfully
- localhost URLs are absent
- PalmX/Palm Hills and third-party portal contamination is absent
- final package contains only Aqaar-specific data and structure
