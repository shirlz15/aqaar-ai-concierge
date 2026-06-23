from collections import deque

from .schemas import ChatMessage, ConciergeProfile, ConversationState
from .storage import get_conversation, upsert_conversation


_memory_store: dict[str, ConversationState] = {}


def load_state(session_id: str, fallback_profile: ConciergeProfile | None = None) -> ConversationState:
    stored = get_conversation(session_id)
    if stored:
        return stored
    if session_id not in _memory_store:
        _memory_store[session_id] = ConversationState(session_id=session_id, profile=fallback_profile or ConciergeProfile())
    return _memory_store[session_id]


def persist_turn(session_id: str, user_message: str, assistant_message: str, profile: ConciergeProfile) -> ConversationState:
    state = load_state(session_id, profile)
    messages = deque(state.messages, maxlen=40)
    messages.append(ChatMessage(role="user", content=user_message))
    messages.append(ChatMessage(role="assistant", content=assistant_message))
    updated = ConversationState(
        session_id=session_id,
        profile=profile,
        messages=list(messages),
        turn_count=state.turn_count + 1,
        last_intent=profile.intent,
    )
    _memory_store[session_id] = updated
    upsert_conversation(updated)
    return updated
