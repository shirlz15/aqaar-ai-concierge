# Concierge Backend Test Results

Command:

```powershell
npm test
```

Result: PASS

Tests:

- RAG search returns KB-backed results with source attribution.
- Chat detects intent and preserves multi-turn context memory.
- Recommendations come from intelligence rules only.
- Lead scoring returns `unknown` because v3 does not publish scoring logic.
- Dashboard metrics load from the intelligence package.
- Qualification uses KB qualification trees.

Summary:

- Suites: 1
- Tests: 6
- Passed: 6
- Failed: 0
