# AQAAR Knowledge Acquisition Repository

This repository is dedicated to Aqaar KB acquisition only.

Folders:

- csv: source-attributed Aqaar datasets
- json: Aqaar-only personas, intents, recommendation rules, and sales flows
- rag: markdown source documents and JSONL retrieval chunks
- reports: coverage and validation reports
- assets: official Aqaar asset manifest
- scripts: acquisition, finalization, and validation scripts
- docs: audit and structure documentation

Run from the repository root:

```bash
node KB-Acq/scripts/build_csv.mjs
node KB-Acq/scripts/build_final_package.mjs
node KB-Acq/scripts/validate_final_package.mjs
```

Final package:

- KB-Acq/AQAAR-KB-ACQ-FINAL.zip
