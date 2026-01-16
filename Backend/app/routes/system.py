from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/version")
async def version():
    settings = get_settings()
    return {"version": settings.project_version}
