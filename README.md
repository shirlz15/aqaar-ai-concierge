# Aqaar AI Concierge

Enterprise-grade AI concierge for Aqaar's luxury real estate experience.

## Security Baseline

- Secrets are loaded from environment variables only.
- Frontend API routes validate payloads with Zod before proxying.
- FastAPI validates inbound requests with Pydantic and enforces request size limits.
- Chat endpoints include rate limiting and sanitized error responses.
- OpenAI keys remain server-side.
- Admin routes are protected by a server-issued secure cookie.
- Database access uses Supabase client methods and schema constraints.
- Audit events are structured for security monitoring.

## Local Setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill required secrets locally or in deployment secrets.
3. Install frontend dependencies: `npm install`.
4. Install backend dependencies: `pip install -r backend/requirements.txt`.
5. Start backend: `npm run backend:dev`.
6. Start frontend: `npm run dev`.

## Structure

- `frontend/` Next.js 15 App Router application.
- `backend/` FastAPI API layer for AI, leads, audit logging, and Supabase access.
- `database/` Postgres schema for Supabase.
- `csv/`, `data/`, and `rag/` Aqaar intelligence foundation.
- `.github/workflows/ci.yml` build, lint, test, and deploy-ready workflow.
