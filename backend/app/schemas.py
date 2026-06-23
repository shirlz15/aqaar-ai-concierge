import re
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ConciergeProfile(BaseModel):
    intent: str | None = None
    property_type: str | None = None
    project_name: str | None = None
    location: str | None = None
    budget: str | None = None
    timeline: str | None = None
    investment_interest: bool | None = None
    urgency: Literal["low", "medium", "high"] | None = None
    persona: str | None = None
    organic_buying_stage: Literal["awareness", "consideration", "qualification", "conversion"] | None = None


class IntentSignal(BaseModel):
    name: str
    confidence: float = Field(ge=0, le=1)
    evidence: list[str] = Field(default_factory=list, max_length=8)


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=128)
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    profile: ConciergeProfile = Field(default_factory=ConciergeProfile)


class Recommendation(BaseModel):
    project_name: str
    match_score: int
    why_recommended: str
    investment_potential: str
    estimated_roi: str
    reasoning: list[str] = Field(default_factory=list)
    project_type: str | None = None
    location: str | None = None
    sales_pitch: str | None = None


class LeadScoreBreakdown(BaseModel):
    score: int = Field(ge=0, le=100)
    category: Literal["Cold", "Warm", "Hot"]
    signals: dict[str, int]
    missing_fields: list[str]


class ChatResponse(BaseModel):
    reply: str
    profile: ConciergeProfile
    lead_score: int
    lead_category: Literal["Cold", "Warm", "Hot"]
    recommendations: list[Recommendation] = []
    intent_signals: list[IntentSignal] = []
    lead_score_breakdown: LeadScoreBreakdown | None = None
    next_best_action: str | None = None


class ConversationState(BaseModel):
    session_id: str = Field(min_length=8, max_length=128)
    profile: ConciergeProfile = Field(default_factory=ConciergeProfile)
    messages: list[ChatMessage] = Field(default_factory=list, max_length=40)
    turn_count: int = Field(default=0, ge=0)
    last_intent: str | None = None


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    preferred_contact_method: Literal["phone", "email", "whatsapp"]
    consent_given: bool
    session_id: str = Field(min_length=8, max_length=128)
    profile: ConciergeProfile = Field(default_factory=ConciergeProfile)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not re.fullmatch(r"[\d\s()+.-]{7,30}", value):
            raise ValueError("Phone number contains unsupported characters.")
        return value


class DashboardAnalytics(BaseModel):
    total_seed_leads: int
    hot_signal_count: int
    project_interest: dict[str, int]
    location_interest: dict[str, int]
    persona_distribution: dict[str, int]
    source_health: dict[str, int]


class KnowledgeHealth(BaseModel):
    sources: dict[str, int]
    graph_edge_count: int
    status: Literal["ok"]
