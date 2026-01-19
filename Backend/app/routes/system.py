import logging
import time

import httpx

from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings

router = APIRouter(prefix="/system", tags=["system"])
logger = logging.getLogger(__name__)


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/version")
async def version():
    settings = get_settings()
    return {"version": settings.project_version}


@router.get("/naver-map")
async def naver_map_config():
    settings = get_settings()
    if not settings.naver_map_client_id:
        logger.warning("naver_map: NAVER_MAP_CLIENT_ID missing")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="NAVER_MAP_CLIENT_ID is not configured",
        )
    masked = f"{settings.naver_map_client_id[:4]}***"
    logger.info("naver_map: client_id=%s", masked)
    return {"client_id": settings.naver_map_client_id}


@router.get("/naver-map/validate")
async def naver_map_validate(url: str):
    settings = get_settings()
    if not settings.naver_map_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="NAVER_MAP_CLIENT_ID is not configured",
        )
    params = {
        "clientId": settings.naver_map_client_id,
        "uri": url,
        "time": int(time.time() * 1000),
    }
    validate_url = "https://oapi.map.naver.com/v1/validatev3"
    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.get(validate_url, params=params)
    if resp.status_code >= 400:
        logger.error("naver_map validate error %s: %s", resp.status_code, resp.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NAVER_MAP_VALIDATE_FAILED",
        )
    data = resp.json()
    logger.info("naver_map validate response: %s", data)
    return data


@router.get("/kakao-map")
async def kakao_map_ping():
    logger.info("kakao_map: ping")
    return {"status": "ok"}
