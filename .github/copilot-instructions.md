# Copilot instructions for Nupzuki Hunter

This file contains concise, actionable guidance for AI coding agents working in this repository.

1. Project overview
- Backend: FastAPI service in `Backend/app` serving JSON APIs. Entrypoint: `Backend/app/main.py`.
- Frontend: React app (Create React App) in `Frontend/` with `package.json` scripts (`npm start`, `npm run build`).
- DB: PostgreSQL; local compose in `Backend/docker-compose.yml` (db mapped to host port 5433).

2. Where to make changes
- API routes live in `Backend/app/routes/*.py` and are registered in `main.py` (examples: `auth.py`, `users.py`, `games.py`).
- Settings are loaded from environment using `Backend/app/core/config.py` -> `get_settings()` (reads `.env`).
- DB models/schemas are in `Backend/app/models.py` and `Backend/app/schemas.py`. Follow existing SQLModel/SQLAlchemy async patterns.
- Frontend components live under `Frontend/src/pages` and `Frontend/src/ui` — follow existing component naming and CSS files in `Frontend/src/styles`.

3. How to run locally (discoverable commands)
- Backend (recommended): `docker-compose -f Backend/docker-compose.yml up --build` — exposes API on port `8000`.
- Backend (dev without Docker): install `Backend/requirements.txt` then run (typical pattern used in this project):
  - `uvicorn app.main:app --reload --port 8000`
- Frontend: from `Frontend/` run `npm install` then `npm start` to run the dev server.

4. Important project conventions & patterns
- Router registration: new API modules must expose a FastAPI `APIRouter` named `router` and be added to `app.include_router(...)` in `main.py`.
- Env-driven config: `get_settings()` uses `pydantic-settings` and `.env`. Prefer adding required secrets to `.env` (do not commit secrets).
- Templates: Jinja2 templates used in `Backend/app/summary/templates` for HTML summary endpoints — modify carefully (not a SPA).
- DB access: code uses async DB drivers (e.g., `asyncpg`) and SQLAlchemy/SQLModel; follow async session patterns already present.

5. Integration & external dependencies
- Supabase/Postgres: DB URL is provided via `database_url` in settings; supabase helper code lives under `Backend/app/core`.
- OAuth: Google client IDs are defined in `Backend/app/core/config.py` fields — OAuth flows are implemented in `auth.py`.
- Map & QR: frontend uses Naver Map API (`naver_map_client_id`) and `html5-qrcode` for scanning; check frontend imports in `Frontend/src/pages/ingame`.

6. PR / coding notes for AI agents
- When adding endpoints, include tests or a simple manual-check snippet (curl/HTTPie) in the PR description.
- Keep changes minimal and follow the existing folder structure: `routes/` for endpoints, `core/` for infra/config, `summary/` for HTML views.
- Avoid changing global CORS or middleware beyond small, well-justified fixes; CORS is currently permissive in `main.py` (allow_origins=["*"]).

7. Files to inspect for context
- `Backend/app/main.py`, `Backend/app/core/config.py`, `Backend/docker-compose.yml`, `Backend/requirements.txt`
- `Backend/app/routes/` (all route modules)
- `Frontend/package.json`, `Frontend/src/pages`, `Frontend/src/ui`

8. Examples (quick patterns)
- Add a route: create `Backend/app/routes/myfeature.py` with `router = APIRouter(prefix="/myfeature")`, implement handlers, then `app.include_router(myfeature.router)` in `main.py`.
- Read an env setting: `from app.core.config import get_settings; settings = get_settings(); settings.database_url`

If anything here is unclear or you want me to include more examples (tests, curl checks, or template editing guidance), tell me which area to expand.
