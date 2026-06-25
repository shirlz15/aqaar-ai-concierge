# Manual Flow Test

Manual browser checks were run against:

- Frontend: `http://localhost:6199`
- Backend proxy: `/api/*`
- Backend source: `Concierge-Backend-v1`

## Results

- Landing and module order rendered: PASS
- Dashboard metrics populated from API: PASS
- Recommendation cards populated from API: PASS
- Partial search helper for `aj`: PASS
- Charts rendered: PASS
- Enquire modal opens from the header: PASS
- Lead capture creates summary and lead table row: PASS
- Runtime activity updates after lead capture: PASS
- Export CSV button triggers export flow: PASS
- Download guide button triggers guide flow: PASS
- Chat direct-send handler added and automated frontend tests pass: PASS

## Notes

The UI uses Aqaar dark charcoal, muted grey panels, white text, and lime yellow-green accents. The app avoids unsupported Palm styling and does not copy Palm data.
