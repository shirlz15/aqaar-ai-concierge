import logging

from fastapi import Request

from .security import hash_ip
from .storage import store_audit_event

logger = logging.getLogger("aqaar.security")


def log_security_event(request: Request, event_type: str, severity: str, metadata: dict | None = None) -> None:
    event = {
        "event_type": event_type,
        "severity": severity,
        "ip_hash": hash_ip(request.client.host if request.client else None),
        "user_agent": request.headers.get("user-agent", ""),
        "metadata": metadata or {},
    }
    logger.info(
        "security_event",
        extra=event,
    )
    store_audit_event(event)
