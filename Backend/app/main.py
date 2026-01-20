import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routes import auth, captures, eyeballs, games, groups, scores, system, users
from app.summary import router as summary_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(title="Nupzuki Hunter API", version=settings.project_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.time() - start) * 1000
        client_host = request.client.host if request.client else "-"
        logger.exception(
            "HTTP %s %s status=500 duration_ms=%.1f client=%s",
            request.method,
            request.url.path,
            duration_ms,
            client_host,
        )
        raise

    duration_ms = (time.time() - start) * 1000
    client_host = request.client.host if request.client else "-"
    logger.info(
        "HTTP %s %s status=%s duration_ms=%.1f client=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        client_host,
    )
    return response

app.include_router(system.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(games.router)
app.include_router(groups.router)
app.include_router(eyeballs.router)
app.include_router(captures.router)
app.include_router(scores.router)
app.include_router(summary_router)


@app.get("/")
async def root():
    return {"status": "ok", "version": settings.project_version}
