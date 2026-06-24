# Aqaar KB-Acq Validation Report

Generated: 2026-06-24

## Checks Run

- Schema preservation for existing CSV files
- Official source attribution present on every row family
- Placeholder replacement for amenities, prices, locations, FAQ, sitemap, and project metadata where official data exists
- Mock/test project exclusion
- Unknown value policy applied to unavailable facts
- RAG documents regenerated from the cleaned official dataset

## Results

- PASS: No blocking validation findings.

## Residual Unknowns

3487 of 7755 audited master/inventory/location cells remain `unknown` because the official extracted Aqaar sources did not publish those facts.
