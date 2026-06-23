import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from supabase import Client, create_client

from .config import get_settings
from .schemas import ChatMessage, ConciergeProfile, ConversationState, IntentSignal, LeadCreate, Recommendation


def get_supabase() -> Client | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def store_lead(payload: LeadCreate, lead_score: int, lead_category: str) -> dict:
    client = get_supabase()
    selected_project = payload.selected_project or payload.profile.selected_project or payload.profile.project_name
    record = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "country": payload.country,
        "budget_range": payload.budget_range,
        "preferred_contact_method": payload.preferred_contact_method,
        "preference": payload.preference,
        "selected_project": selected_project,
        "lead_score": lead_score,
        "lead_category": lead_category,
        "consent_given": payload.consent_given,
        "profile": payload.profile.model_dump(),
    }
    if client is None:
        return _store_local_lead(payload, lead_score, lead_category, selected_project)
    result = client.table("leads").insert(record).execute()
    return result.data[0]


def _hash_contact(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()


def _store_local_lead(payload: LeadCreate, lead_score: int, lead_category: str, selected_project: str | None) -> dict:
    lead_id = f"local-{uuid4()}"
    storage_dir = Path.cwd() / ".local-data"
    storage_dir.mkdir(exist_ok=True)
    record = {
        "id": lead_id,
        "created_at": datetime.now(UTC).isoformat(),
        "name": payload.name,
        "email_hash": _hash_contact(payload.email),
        "phone_hash": _hash_contact(payload.phone),
        "preferred_contact_method": payload.preferred_contact_method,
        "country": payload.country,
        "budget_range": payload.budget_range,
        "preference": payload.preference,
        "selected_project": selected_project,
        "lead_score": lead_score,
        "lead_category": lead_category,
        "consent_given": payload.consent_given,
        "session_id": payload.session_id,
        "profile": payload.profile.model_dump(),
        "source": "backend-local-fallback",
    }
    with (storage_dir / "backend-leads.jsonl").open("a", encoding="utf-8") as lead_file:
        lead_file.write(json.dumps(record) + "\n")
    return {"id": lead_id, **record}


def get_conversation(session_id: str) -> ConversationState | None:
    client = get_supabase()
    if client is None:
        return None
    result = client.table("conversations").select("*").eq("session_id", session_id).limit(1).execute()
    if not result.data:
        return None
    row = result.data[0]
    return ConversationState(
        session_id=row["session_id"],
        profile=ConciergeProfile(**row.get("profile", {})),
        messages=[ChatMessage(**message) for message in row.get("messages", [])],
        turn_count=row.get("turn_count", 0),
        last_intent=row.get("last_intent"),
    )


def upsert_conversation(state: ConversationState) -> None:
    client = get_supabase()
    if client is None:
        return
    record = {
        "session_id": state.session_id,
        "profile": state.profile.model_dump(),
        "messages": [message.model_dump() for message in state.messages],
        "turn_count": state.turn_count,
        "last_intent": state.last_intent,
    }
    client.table("conversations").upsert(record, on_conflict="session_id").execute()


def store_audit_event(event: dict) -> None:
    client = get_supabase()
    if client is None:
        return
    client.table("security_events").insert(event).execute()


def store_intent_events(session_id: str, profile: ConciergeProfile, signals: list[IntentSignal]) -> None:
    client = get_supabase()
    if client is None or not signals:
        return
    rows = [
        {
            "session_id": session_id,
            "intent": signal.name,
            "confidence": signal.confidence,
            "evidence": signal.evidence,
            "profile_snapshot": profile.model_dump(),
        }
        for signal in signals
    ]
    client.table("intent_events").insert(rows).execute()


def store_recommendation_events(session_id: str, profile: ConciergeProfile, recommendations: list[Recommendation]) -> None:
    client = get_supabase()
    if client is None or not recommendations:
        return
    rows = [
        {
            "session_id": session_id,
            "project_name": item.project_name,
            "match_score": item.match_score,
            "reasoning": item.reasoning,
            "profile_snapshot": profile.model_dump(),
        }
        for item in recommendations
    ]
    client.table("recommendation_events").insert(rows).execute()
