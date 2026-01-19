from datetime import datetime, timedelta
import base64
import hashlib
import logging
import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db
from app.core.supabase import (
    SupabaseAuthError,
    supabase_exchange_oauth_code,
    supabase_login,
    supabase_signup,
)
from app.models import UserProfile
from app.schemas import LoginRequest, SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

_OAUTH_STATE_TTL = timedelta(minutes=10)
_oauth_state_store: dict[str, tuple[str, datetime]] = {}


def _build_pkce_pair() -> tuple[str, str]:
    code_verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


def _store_state(state: str, code_verifier: str) -> None:
    _oauth_state_store[state] = (code_verifier, datetime.utcnow() + _OAUTH_STATE_TTL)


def _consume_state(state: str) -> str | None:
    entry = _oauth_state_store.pop(state, None)
    if not entry:
        return None
    code_verifier, expires_at = entry
    if datetime.utcnow() > expires_at:
        return None
    return code_verifier


async def ensure_profile(
    session: AsyncSession,
    user_id: str,
    nickname: str | None,
    avatar_url: str | None,
    email: str | None,
) -> UserProfile | None:
    auth_id = await _resolve_auth_user_id(session, user_id, email)
    if not auth_id:
        logger.error("Auth user not found in DB for user_id=%s email=%s", user_id, email)
        return None

    user_id = auth_id
    stmt = select(UserProfile).where(UserProfile.id == user_id)
    result = await session.execute(stmt)
    profile = result.scalar_one_or_none()
    if profile:
        return profile

    if not nickname and email:
        nickname = email.split("@", 1)[0]

    profile = UserProfile(
        id=user_id,
        nickname=nickname or "player",
        avatar_url=avatar_url,
    )
    session.add(profile)
    try:
        await session.commit()
        await session.refresh(profile)
        return profile
    except IntegrityError:
        await session.rollback()
        logger.error("Failed to insert user profile for user_id=%s", user_id)
        return None


async def _resolve_auth_user_id(
    session: AsyncSession,
    user_id: str,
    email: str | None,
) -> str | None:
    exists_stmt = text("SELECT id FROM auth.users WHERE id = :user_id")
    exists_result = await session.execute(exists_stmt, {"user_id": user_id})
    row = exists_result.first()
    if row:
        return str(row[0])

    if email:
        email_stmt = text("SELECT id FROM auth.users WHERE email = :email")
        email_result = await session.execute(email_stmt, {"email": email})
        email_row = email_result.first()
        if email_row:
            return str(email_row[0])

    return None


@router.post("/signup")
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    try:
        response = await supabase_signup(payload.email, payload.password)
    except SupabaseAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    user = response.get("user") or response
    user_id = user.get("id")
    if not user_id:
        logger.error("Supabase signup missing user id: %s", response)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase user id missing in response",
        )

    await ensure_profile(db, user_id, payload.nickname, payload.avatar_url, payload.email)

    return {
        "user": user,
        "session": response.get("session"),
    }


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        response = await supabase_login(payload.email, payload.password)
    except SupabaseAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    user = response.get("user") or {}
    user_id = user.get("id")
    if user_id:
        await ensure_profile(db, user_id, None, None, payload.email)

    return response


@router.get("/google/login")
async def google_login():
    settings = get_settings()
    if not settings.supabase_url or not settings.google_redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL or GOOGLE_REDIRECT_URI is not configured",
        )

    state = secrets.token_urlsafe(16)
    code_verifier, code_challenge = _build_pkce_pair()
    _store_state(state, code_verifier)

    query = urlencode(
        {
            "provider": "google",
            "redirect_to": settings.google_redirect_uri,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "flow_type": "pkce",
            "state": state,
        }
    )
    auth_url = f"{settings.supabase_url}/auth/v1/authorize?{query}"
    return {"auth_url": auth_url, "state": state}


@router.get("/google/callback")
async def google_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing code or state in callback",
        )

    code_verifier = _consume_state(state)
    if not code_verifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state",
        )

    try:
        response = await supabase_exchange_oauth_code(code, code_verifier)
    except SupabaseAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    user = response.get("user") or {}
    user_id = user.get("id")
    if user_id:
        await ensure_profile(
            db,
            user_id,
            user.get("user_metadata", {}).get("full_name"),
            user.get("user_metadata", {}).get("avatar_url"),
            user.get("email"),
        )

    return response
