from dataclasses import dataclass
import logging
import time

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.core.config import get_settings

security = HTTPBearer()
logger = logging.getLogger(__name__)

_JWKS_CACHE: dict[str, object] = {"keys": None, "expires_at": 0.0}
_JWKS_TTL_SECONDS = 3600


@dataclass
class CurrentUser:
    user_id: str
    email: str | None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    settings = get_settings()

    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg and alg.startswith("HS"):
            if not settings.supabase_jwt_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_JWT_SECRET is not configured",
                )
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        elif alg == "ES256":
            jwks = await _get_jwks(settings)
            key = _select_jwk(jwks, header.get("kid"))
            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256"],
                options={"verify_aud": False},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unsupported JWT algorithm",
            )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    return CurrentUser(user_id=user_id, email=payload.get("email"))


async def _get_jwks(settings) -> dict:
    now = time.time()
    cached_keys = _JWKS_CACHE.get("keys")
    expires_at = _JWKS_CACHE.get("expires_at", 0.0)
    if cached_keys and now < float(expires_at):
        return {"keys": cached_keys}

    jwks_url = settings.supabase_jwks_url
    if not jwks_url:
        if not settings.supabase_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SUPABASE_URL or SUPABASE_JWKS_URL is not configured",
            )
        jwks_url = f"{settings.supabase_url}/auth/v1/jwks"

    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.get(jwks_url)
    if resp.status_code >= 400:
        logger.error("Failed to fetch JWKS: %s %s", resp.status_code, resp.text)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch JWKS",
        )

    data = resp.json()
    keys = data.get("keys")
    if not keys:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWKS payload missing keys",
        )

    _JWKS_CACHE["keys"] = keys
    _JWKS_CACHE["expires_at"] = now + _JWKS_TTL_SECONDS
    return data


def _select_jwk(jwks: dict, kid: str | None):
    keys = jwks.get("keys") or []
    if kid:
        for key in keys:
            if key.get("kid") == kid:
                return jwk.construct(key)
    if len(keys) == 1:
        return jwk.construct(keys[0])
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to select JWT signing key",
    )
