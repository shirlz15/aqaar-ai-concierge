from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .admin_auth import require_admin
from .analytics import build_dashboard_analytics
from .audit import log_security_event
from .concierge import generate_concierge_response
from .config import Settings, get_settings
from .conversation_state import load_state
from .data_acquisition import source_health
from .knowledge_graph import build_graph_edges, profile_graph_context
from .lead_scoring import calculate_lead_score
from .schemas import ChatRequest, ConciergeProfile, KnowledgeHealth, LeadCreate
from .security import RequestSizeLimitMiddleware, hash_ip, rate_limiter
from .storage import store_lead

app = FastAPI(title="Aqaar AI Concierge API", version="0.1.0")
settings = get_settings()

app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(Exception)
async def safe_error_handler(request: Request, exc: Exception) -> JSONResponse:
    log_security_event(request, "unhandled_exception", "critical", {"path": request.url.path})
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/knowledge/health", response_model=KnowledgeHealth)
async def knowledge_health() -> KnowledgeHealth:
    return KnowledgeHealth(sources=source_health(), graph_edge_count=len(build_graph_edges()), status="ok")


@app.post("/api/knowledge/graph-context")
async def graph_context(profile: ConciergeProfile):
    return profile_graph_context(profile)


@app.post("/api/chat")
async def chat(request: Request, payload: ChatRequest, config: Settings = Depends(get_settings)):
    key = hash_ip(request.client.host if request.client else "unknown") or "anonymous"
    rate_limiter.check(f"chat:{key}", config.chat_rate_limit_per_minute)
    try:
        return generate_concierge_response(payload)
    except HTTPException:
        raise
    except Exception:
        log_security_event(request, "chat_generation_failed", "warning", {"session_id": payload.session_id})
        return JSONResponse(status_code=502, content={"detail": "The concierge is temporarily unavailable."})


@app.post("/api/leads")
async def create_lead(request: Request, payload: LeadCreate):
    if not payload.consent_given:
        log_security_event(request, "lead_without_consent", "warning", {"session_id": payload.session_id})
        raise HTTPException(status_code=400, detail="Consent is required before lead submission.")
    lead_breakdown = calculate_lead_score(
        payload.profile,
        phone_given=True,
        email_given=True,
        consent_given=payload.consent_given,
    )
    log_security_event(
        request,
        "lead_created",
        "info",
        {"session_id": payload.session_id, "lead_category": lead_breakdown.category},
    )
    record = store_lead(payload, lead_breakdown.score, lead_breakdown.category)
    return {
        "id": record["id"],
        "lead_score": lead_breakdown.score,
        "lead_category": lead_breakdown.category,
        "lead_score_breakdown": lead_breakdown,
        "status": "new",
    }


@app.get("/api/conversations/{session_id}")
async def conversation_state(session_id: str, _: None = Depends(require_admin)):
    return load_state(session_id)


@app.get("/api/dashboard/analytics")
async def dashboard_analytics(_: None = Depends(require_admin)):
    return build_dashboard_analytics()
