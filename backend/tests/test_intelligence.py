from backend.app.analytics import build_dashboard_analytics
from backend.app.concierge import generate_concierge_response
from backend.app.intent_engine import extract_intent
from backend.app.lead_scoring import calculate_lead_score
from backend.app.recommendation_engine import generate_recommendations
from backend.app.schemas import ChatRequest, ConciergeProfile


def test_intent_extraction_identifies_organic_buying_signals():
    profile, signals = extract_intent(
        "I want to buy a villa in Muscat Bay and can arrange a viewing this week",
        ConciergeProfile(),
    )
    assert profile.intent == "buy"
    assert profile.location == "Muscat Bay"
    assert profile.organic_buying_stage == "conversion"
    assert any(signal.name == "intent:buy" for signal in signals)


def test_lead_score_breakdown_explains_hot_lead():
    profile = ConciergeProfile(
        intent="buy",
        property_type="Villa",
        location="Muscat Bay",
        budget="OMR 500k",
        timeline="immediate",
        project_name="Dusit Thani",
        organic_buying_stage="conversion",
    )
    score = calculate_lead_score(profile, phone_given=True, email_given=True, consent_given=True)
    assert score.category == "Hot"
    assert score.score == 100
    assert "budget_provided" in score.signals


def test_recommendations_include_reasoning():
    recommendations = generate_recommendations(
        ConciergeProfile(intent="invest", location="Muscat Bay", property_type="Branded Residences", investment_interest=True)
    )
    assert recommendations
    assert recommendations[0].reasoning
    assert recommendations[0].match_score > 50


def test_conversation_response_persists_memory_in_process():
    response = generate_concierge_response(
        ChatRequest(session_id="session-memory-1", message="I want to invest in Dusit Thani", history=[], profile=ConciergeProfile())
    )
    assert response.profile.project_name == "Dusit Thani"
    assert response.intent_signals
    assert response.lead_score_breakdown is not None


def test_dashboard_analytics_uses_seed_sources():
    analytics = build_dashboard_analytics()
    assert analytics.source_health["projects"] >= 1
    assert analytics.project_interest
