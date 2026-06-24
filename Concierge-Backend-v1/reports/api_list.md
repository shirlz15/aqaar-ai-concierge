# API List

All APIs return JSON and validate responses against KB and intelligence package data.

## POST /chat

Multi-turn concierge endpoint. Performs intent detection, RAG search, recommendation lookup, qualification prompts, memory updates, and lead field capture from the user's message.

## POST /recommend

Returns project recommendations from `Intelligence-Layer-v2/json/recommendation_engine.json` and validates referenced projects against the KB.

## POST /qualify

Returns qualification questions and next steps from `Intelligence-Layer-v2/json/qualification_trees.json`.

## POST /lead-score

Returns `unknown` score and grade because `AQAAR-INTELLIGENCE-LAYER-v2` does not publish scoring weights.

## GET|POST /dashboard

Returns dashboard metrics from `Intelligence-Layer-v2/csv/dashboard_metrics.csv`.

## GET|POST /search

Performs lexical KB/RAG retrieval across project records and RAG chunks. Responses include source attribution.
