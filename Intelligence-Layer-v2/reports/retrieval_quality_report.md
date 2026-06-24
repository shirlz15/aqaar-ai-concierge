# Retrieval Quality Report

Source of truth: AQAAR-KB-ACQ-FINAL-v3.zip

Generated: 2026-06-25

## Test Set

- Retrieval tests: 24
- RAG chunks available from v3: 239
- Enriched projects covered: Dusit Thani Residences Ajman, Mawjan

## Quality Rules

- Answers must cite a v3 source URL or document marker.
- Answers must not use external web data.
- Unknown values must remain unknown.
- Recommendations must resolve to a v3 project_id.

## Sample Queries

- RT-001: What published unit prices are available for Dusit Thani Residences Ajman?
- RT-002: What amenities or lifestyle features are published for Dusit Thani Residences Ajman?
- RT-003: What published unit prices are available for Mawjan?
- RT-004: What amenities or lifestyle features are published for Mawjan?
- RT-005: Show verified Aqaar details for Ajman Corniche Residences
- RT-006: Show verified Aqaar details for Ajman One
- RT-007: Show verified Aqaar details for Ajman One - PH II
- RT-008: Show verified Aqaar details for Ajman Pearl
- RT-009: Show verified Aqaar details for Ajman Uptown
- RT-010: Show verified Aqaar details for Al Andalus 4
- RT-011: Show verified Aqaar details for Al Arabi Building
- RT-012: Show verified Aqaar details for Al Berouj 1

## Result

PASS: Generated retrieval tests are tied to v3 project identifiers and source policy.
