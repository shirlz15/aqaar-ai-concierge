# Lead Intelligence Scoring Model

## Purpose

The lead model turns organic conversation signals into a clear sales readiness score. It should support prioritization without being intrusive or collecting PII before the client has received value.

## Base Signals

| Signal | Points | Notes |
|---|---:|---|
| Intent identified | 10 | buy, rent, invest, commercial, or support |
| Property type provided | 10 | apartment, villa, branded residence, retail, office |
| Location provided | 20 | explicit preferred location or accepted recommendation |
| Budget provided | 25 | exact budget or usable range |
| Timeline provided | 20 | immediate, 1-3 months, 3-6 months, 6+ months |
| Project interest | 15 | named project or clicked project |
| Phone shared | 20 | only after consent |
| Email shared | 15 | only after consent |
| Preferred contact method | 5 | phone, email, WhatsApp |
| Viewing requested | 20 | strong conversion signal |

## Score Bands

- 0-34: Cold. Continue discovery and provide education.
- 35-69: Warm. Recommend projects and ask for one missing qualification variable.
- 70-100: Hot. Offer consultation, viewing, or sales handoff.

## Temperature Rules

- Hot override: phone shared + budget + timeline + project interest.
- Warm override: location + property type + budget.
- Cold override: no budget and no timeline after three turns.

## Security And Privacy Rules

- Do not request contact details before a useful recommendation has been provided.
- Consent is required before storing PII.
- Store PII in CRM/database tables, not vector documents.
- Keep audit logs free of raw phone and email values.
- Flag spam, prompt injection attempts, repeated failed submissions, and excessive message volume.

## Routing Rules

- Hot residential leads route to sales advisor.
- Hot investor leads route to investment advisor.
- Commercial leads route to commercial specialist.
- Foreign investor leads route to ownership/process specialist.
- Support-only conversations route to customer care if unresolved.
