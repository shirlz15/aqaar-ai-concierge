# Aqaar KB-Acq Package

Knowledge acquisition package generated from official Aqaar sources only.

## Scope

This package is limited to KB acquisition deliverables:

- CSV outputs
- JSON source/manifest files
- audit trail
- site/API source map
- RAG documents and JSONL chunks
- crawl, validation, and coverage logs

It intentionally does not include frontend, dashboard, AI chat, persona engine,
intent engine, or recommendation engine generation.

## Official Sources

- https://www.aqaar.com
- https://prodadmin-aqaar.realcube.estate/api
- Official Aqaar Cloudinary assets referenced by Aqaar public responses

## Run

```bash
node KB-Acq/scripts/build_csv.mjs
node KB-Acq/scripts/validate_dataset.mjs
```

Python compatibility wrappers are provided for environments that expect the
PalmX-style script filenames:

```bash
python KB-Acq/scripts/build_csv.py
python KB-Acq/scripts/build_buyer_kb.py
python KB-Acq/scripts/validate_dataset.py
```

## Deliverables

- outputs/aqaar_projects_master.csv
- outputs/aqaar_projects_buyer_kb.csv
- outputs/aqaar_properties_inventory.csv
- outputs/aqaar_faqs.csv
- outputs/aqaar_assets.csv
- outputs/aqaar_sources_audit.csv
- outputs/aqaar_site_map.csv
- outputs/aqaar_developers.csv
- outputs/aqaar_locations.csv
- outputs/aqaar_amenities.csv
- knowledge/aqaar_acquisition_manifest.json
- knowledge/aqaar_source_catalog.json
- knowledge/aqaar_data_dictionary.json
- rag/aqaar_rag_chunks.jsonl
- rag/rag_documents/*.md
- logs/crawl_log.txt
- logs/validation_log.txt
- logs/coverage_report.md
