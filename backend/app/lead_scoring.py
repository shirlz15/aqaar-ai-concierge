from .schemas import ConciergeProfile, LeadScoreBreakdown


def calculate_lead_score(
    profile: ConciergeProfile,
    *,
    phone_given: bool = False,
    email_given: bool = False,
    consent_given: bool = False,
) -> LeadScoreBreakdown:
    signals: dict[str, int] = {}
    if profile.intent:
        signals["intent_identified"] = 10
    if profile.property_type:
        signals["property_type_provided"] = 10
    if profile.location:
        signals["location_provided"] = 20
    if profile.budget:
        signals["budget_provided"] = 25
    if profile.timeline:
        signals["timeline_provided"] = 20
    if profile.project_name:
        signals["project_interest"] = 15
    if phone_given:
        signals["phone_shared"] = 20
    if email_given:
        signals["email_shared"] = 15
    if consent_given:
        signals["consent_given"] = 5
    if profile.organic_buying_stage == "conversion":
        signals["conversion_stage_language"] = 15
    elif profile.organic_buying_stage == "qualification":
        signals["qualification_stage_language"] = 8

    score = min(sum(signals.values()), 100)
    if score >= 75:
        category = "Hot"
    elif score >= 40:
        category = "Warm"
    else:
        category = "Cold"
    missing = [
        label
        for label, value in {
            "intent": profile.intent,
            "property_type": profile.property_type,
            "location": profile.location,
            "budget": profile.budget,
            "timeline": profile.timeline,
        }.items()
        if not value
    ]
    return LeadScoreBreakdown(score=score, category=category, signals=signals, missing_fields=missing)
