import re

from .data_acquisition import load_knowledge_sources
from .schemas import ConciergeProfile, IntentSignal


INTENT_KEYWORDS = {
    "buy": ("buy", "purchase", "own", "ownership", "book", "reserve", "home", "apartment", "villa"),
    "rent": ("rent", "lease", "monthly", "move in", "tenant"),
    "invest": ("invest", "investment", "roi", "yield", "return", "capital", "income"),
    "commercial": ("commercial", "office", "retail", "showroom", "business", "shop"),
    "support": ("handover", "documents", "payment", "service charge", "eligibility", "legal"),
}

BUYING_STAGE_SIGNALS = {
    "awareness": ("options", "projects", "available", "show me"),
    "consideration": ("compare", "best", "recommend", "suitable", "location"),
    "qualification": ("budget", "timeline", "cash", "finance", "loan"),
    "conversion": ("viewing", "call", "whatsapp", "reserve", "book", "today", "this week"),
}


def _contains_any(text: str, words: tuple[str, ...]) -> bool:
    return any(word in text for word in words)


def extract_intent(message: str, previous: ConciergeProfile) -> tuple[ConciergeProfile, list[IntentSignal]]:
    data = load_knowledge_sources()
    text = message.lower()
    profile = previous.model_copy(deep=True)
    signals: list[IntentSignal] = []

    for intent, words in INTENT_KEYWORDS.items():
        matches = [word for word in words if word in text]
        if matches:
            confidence = min(0.95, 0.58 + len(matches) * 0.09)
            profile.intent = intent
            signals.append(IntentSignal(name=f"intent:{intent}", confidence=confidence, evidence=matches[:5]))

    for project in data["projects"]:
        if project["project_name"].lower() in text:
            profile.project_name = project["project_name"]
            profile.location = profile.location or project["location"]
            signals.append(IntentSignal(name="project_interest", confidence=0.93, evidence=[project["project_name"]]))

    for location in data["locations"][:50]:
        name = location["location_name"]
        if name and name.lower() in text:
            profile.location = name
            signals.append(IntentSignal(name="location", confidence=0.88, evidence=[name]))

    for item in data["property_types"][:80]:
        property_type = item["property_type"]
        normalized = property_type.lower().replace(" variant", "")
        if property_type and any(piece in text for piece in normalized.split()):
            profile.property_type = property_type
            signals.append(IntentSignal(name="property_type", confidence=0.72, evidence=[property_type]))
            break

    if "ajman" in text:
        profile.location = "Ajman"
    if "waterfront" in text and not profile.location:
        profile.location = "Ajman Waterfront"

    budget = re.search(r"(?:aed|dirham|budget|around|under|below|up to)?\s*(\d{1,4}(?:,\d{3})?|\d+(?:\.\d+)?)\s*(k|thousand|m|million|aed|dirham)?", text)
    if budget and re.search(r"\b(aed|dirham|budget|cash|finance|loan|under|below|up to|k|thousand|million|m)\b", text):
        profile.budget = budget.group(0).strip()
        signals.append(IntentSignal(name="budget", confidence=0.77, evidence=[profile.budget]))

    if re.search(r"\b(now|today|this week|urgent|immediately|as soon)\b", text):
        profile.timeline = "immediate"
        profile.urgency = "high"
    elif re.search(r"\b(1-3|three months|next month|soon|quarter)\b", text):
        profile.timeline = "1-3 months"
        profile.urgency = "medium"
    elif re.search(r"\b(6 months|six months|next year|later)\b", text):
        profile.timeline = "6+ months"
        profile.urgency = "low"
    if profile.timeline:
        signals.append(IntentSignal(name="timeline", confidence=0.75, evidence=[profile.timeline]))

    profile.investment_interest = profile.investment_interest or profile.intent == "invest"
    profile.organic_buying_stage = identify_buying_stage(text)
    profile.persona = infer_persona(profile, text)
    return profile, signals


def identify_buying_stage(text: str) -> str:
    for stage, words in reversed(BUYING_STAGE_SIGNALS.items()):
        if _contains_any(text, words):
            return stage
    return "awareness"


def infer_persona(profile: ConciergeProfile, text: str) -> str:
    if profile.intent == "commercial":
        return "Commercial Buyer"
    if profile.intent == "rent":
        return "Rental Seeker"
    if "foreign" in text or "overseas" in text or "expat" in text:
        return "Foreign Investor"
    if profile.investment_interest or profile.intent == "invest":
        return "Investor"
    if "luxury" in text or "private" in text or profile.property_type == "Villa":
        return "Luxury Buyer"
    return "First Time Buyer"
