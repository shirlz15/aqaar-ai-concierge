# PalmX Structure Mapping

PalmX was reviewed only as a structural reference. No PalmX projects, pricing,
assets, locations, FAQs, personas, recommendations, or implementation content
were copied into the Aqaar package.

## Reference Shape

PalmX KB-Acq contained:

- build_csv.py
- build_buyer_kb.py
- logs/followup_run.log
- outputs/palmx_projects_master.csv
- outputs/palmx_projects_buyer_kb.csv
- outputs/palmx_screens_index.csv
- outputs/palmx_sources_audit.csv

## Aqaar Final Shape

The Aqaar repository uses the stricter requested layout:

- csv/: Aqaar CSV datasets, equivalent to PalmX outputs.
- json/: Aqaar-only personas, intents, recommendation rules, and sales flows.
- rag/: Aqaar RAG chunks and per-record markdown documents.
- reports/: coverage and validation reports, equivalent to PalmX logs/reporting.
- assets/: official Aqaar asset manifest.
- scripts/: Aqaar build and validation scripts.
- docs/: package notes and structure mapping.

## Data Policy

- Official Aqaar sources only.
- Unknown public values stay `unknown`.
- Unpublished prices stay `on_request` or `sold_out`.
- No localhost URLs.
- No PalmX/Palm Hills records.
- No third-party real-estate portals.
- Every extracted fact must be traceable through `csv/aqaar_sources_audit.csv`.
