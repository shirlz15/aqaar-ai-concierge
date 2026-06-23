from fastapi import Header, HTTPException

from .config import get_settings


def require_admin(authorization: str | None = Header(default=None)) -> None:
    token = get_settings().admin_dashboard_token
    if not token:
        return
    if authorization != f"Bearer {token}":
        raise HTTPException(status_code=401, detail="Admin authorization is required.")
