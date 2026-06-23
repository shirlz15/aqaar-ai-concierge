# Aqaar Domain Analysis

## Research Basis

- Primary website reference requested: https://aqaar.com. Automated fetch returned a 502 during this run, so Aqaar-specific project names are anchored to the client brief and expanded as intelligence-ready seed data.
- Client-provided known project anchors: Dusit Thani, Mawjan.
- Market context used for Oman real estate workflows: Oman Vision 2040 diversification and tourism emphasis, foreign ownership patterns in ITCs and usufruct-style access, and premium waterfront / hospitality-led real estate logic.

This document is designed as a production intelligence foundation for an Aqaar AI Concierge. It separates verified client-provided anchors from market-informed assumptions so the future data ingestion layer can replace generated seed values with authoritative CRM, website, and inventory data.

## 1. Company Information

Aqaar should be modeled as a real estate advisory and property discovery brand serving residential, investment, commercial, and rental users. The concierge should behave as a real estate advisor, not as a casual chatbot. Its purpose is to understand client motivation, qualify demand, recommend suitable opportunities, capture consent-based lead data, and route sales-ready conversations to Aqaar teams.

Core company intelligence entities:

- Brand: Aqaar
- Market: Oman real estate, with emphasis on Muscat and premium coastal / mixed-use communities
- Known project anchors: Dusit Thani and Mawjan
- Primary value proposition: curated property advisory, project discovery, investment guidance, lead qualification, and post-inquiry sales coordination
- Concierge promise: refined, discreet, helpful, commercially aware, and privacy-conscious

## 2. Business Units

The AI Concierge should support these business units:

- Residential sales: apartments, villas, townhouses, branded residences, serviced residences
- Luxury project sales: premium coastal and hospitality-led projects
- Investment advisory: ROI discovery, rental demand, capital appreciation, yield comparison
- Commercial real estate: offices, retail units, showrooms, mixed-use commercial inventory
- Rentals: residential rental discovery, availability triage, viewing requests
- Customer care: FAQs, documentation, viewing coordination, handover support
- Lead management: qualification, scoring, routing, sales pipeline enrichment
- Analytics: demand trends by project, location, budget, timeline, nationality, and intent

## 3. Property Categories

Primary property categories:

- Apartment: studio through three bedroom layouts
- Villa: detached and semi-detached family homes
- Townhouse: compact family ownership
- Branded residence: hospitality-associated residential product
- Serviced apartment: managed residence for lifestyle or rental strategy
- Penthouse: premium vertical living product
- Retail unit: customer-facing commercial property
- Office suite: business-use workspace
- Showroom: high-visibility commercial inventory
- Mixed-use asset: property connected to residential, retail, hospitality, and leisure uses

## 4. Property Lifecycle

The property lifecycle should be represented as:

1. Land and location strategy
2. Concept and master planning
3. Project launch
4. Inventory release
5. Lead generation
6. Discovery and qualification
7. Recommendation and shortlist
8. Viewing or private consultation
9. Reservation
10. Documentation and compliance
11. Contracting and payment schedule
12. Construction updates or fit-out coordination
13. Handover
14. Leasing or resale advisory
15. Relationship nurturing and referrals

## 5. Buyer Journey

The buyer journey begins with curiosity, not commitment. The concierge must identify whether the user is browsing, comparing, financially ready, or actively seeking to transact.

Stages:

- Awareness: sees Aqaar, a project, an ad, or a recommendation
- Exploration: asks about location, price, type, amenities
- Preference shaping: clarifies lifestyle needs, family size, commute, view, services
- Financial framing: budget, financing, payment plan, fees
- Shortlist: compares 2-3 suitable options
- Confidence building: asks about developer quality, handover, legal process
- Conversion: viewing, callback, reservation, sales handoff

## 6. Investor Journey

Investor users require evidence and comparison. They care about yield, capital appreciation, liquidity, tenant demand, service charges, ownership eligibility, and exit strategy.

Stages:

- Intent declaration: "investment", "ROI", "rental income", "capital growth"
- Market fit: location and property type alignment
- Ticket size: budget and financing assumptions
- Yield logic: rent potential, occupancy, service costs
- Risk review: delivery stage, vacancy, resale depth, regulatory constraints
- Recommendation: rank projects by investment signal
- Handoff: schedule investment consultation or request financial model

## 7. Lead Qualification Journey

The lead qualification journey should be progressive and unobtrusive. The concierge should never ask multiple questions at once.

Core qualification signals:

- Intent identified
- Buy/rent/commercial/investment path identified
- Property type known
- Preferred location known
- Budget known
- Timeline known
- Project interest detected
- Contact details shared with consent
- Preferred contact method known
- Urgency detected

## 8. Customer Support Journey

Support flows:

- General FAQ
- Project availability inquiry
- Viewing request
- Documentation guidance
- Payment plan clarification
- Ownership eligibility clarification
- Rental process
- Handover or after-sales routing
- Complaint or escalation capture

The support engine should answer only from approved knowledge. If uncertainty exists, it should acknowledge and route to Aqaar.

## 9. Sales Journey

Sales flow:

- Greeting
- Intent discovery
- Need qualification
- Project recommendation
- Value articulation
- Objection handling
- Lead capture
- Consent confirmation
- Sales handoff
- Follow-up scheduling

The sales journey must maintain a luxury advisory tone: precise, respectful, and consultative.

## 10. Property Discovery Journey

Discovery should move from broad to precise:

1. Purpose: buy, rent, invest, commercial
2. Lifestyle or business need
3. Location preference
4. Property type
5. Budget
6. Timeline
7. Must-have amenities
8. Shortlist
9. Recommendation explanation
10. Viewing or consultation

## Intelligence Risks And Controls

- Risk: hallucinated availability. Control: mark seed inventory as sample until connected to CRM.
- Risk: collecting PII too early. Control: capture only after value is delivered and consent is explicit.
- Risk: legal overstatement for foreign ownership. Control: provide general guidance and route legal confirmation to Aqaar.
- Risk: inaccurate pricing. Control: store price_source, price_valid_from, and price_valid_until.
- Risk: poor lead quality. Control: score multiple signals and separate curiosity from sales readiness.
