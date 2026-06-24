# Retrieval Quality Report

Generated: 2026-06-24

## Scope

Retrieval tests use only the Aqaar KB RAG chunks generated from AQAAR-KB-ACQ-FINAL. No PalmX content, external sources, or fake projects are included.

## Results

- Test queries: 21
- Passed lexical entity checks: 21/21
- Review required: 0

## Method

Each query is matched against Aqaar RAG chunk titles and text using a simple lexical coverage check. The test validates that expected Aqaar project, location, price, or FAQ terms appear in the top retrieved chunks. Production retrieval should replace this lexical check with embeddings and reranking while preserving the same test set.

## Query Results

- RQ-001: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=7
- RQ-002: PASS | top_chunk=2a565476_ed0f_ee11_a2be_00155d119f33_48 | score=7
- RQ-003: PASS | top_chunk=f6b7dd4b_0ad1_e811_a2b8_00155d119707_211 | score=6
- RQ-004: PASS | top_chunk=96b8dd4b_0ad1_e811_a2b8_00155d119707_140 | score=7
- RQ-005: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=6
- RQ-006: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=6
- RQ-007: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=6
- RQ-008: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=6
- RQ-009: PASS | top_chunk=60b8dd4b_0ad1_e811_a2b8_00155d119707_98 | score=6
- RQ-010: PASS | top_chunk=836256dc_a305_f111_8407_70a8a5232028_121 | score=6
- RQ-011: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=5
- RQ-012: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=5
- RQ-013: PASS | top_chunk=7f307ab5_a6a9_ea11_a2c3_00155d119619_117 | score=5
- RQ-014: PASS | top_chunk=faq_001_220 | score=9
- RQ-015: PASS | top_chunk=faq_002_221 | score=5
- RQ-016: PASS | top_chunk=faq_003_222 | score=6
- RQ-017: PASS | top_chunk=faq_004_223 | score=5
- RQ-018: PASS | top_chunk=faq_005_224 | score=8
- RQ-019: PASS | top_chunk=faq_006_225 | score=9
- RQ-020: PASS | top_chunk=faq_003_222 | score=7
- RQ-021: PASS | top_chunk=00b8dd4b_0ad1_e811_a2b8_00155d119707_1 | score=5

## Unknown Policy

If the KB does not publish a field, the runtime answer should say `unknown` and offer Aqaar handoff rather than inferring facts.
