from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.supabase import SupabaseAuthError, supabase_login, supabase_signup
from app.models import UserProfile
from app.schemas import LoginRequest, SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])


async def ensure_profile(
    session: AsyncSession,
    user_id: str,
    nickname: str | None,
    avatar_url: str | None,
    email: str | None,
) -> UserProfile:
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
    await session.commit()
    await session.refresh(profile)
    return profile


@router.post("/signup")
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    try:
        response = await supabase_signup(payload.email, payload.password)
    except SupabaseAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    user = response.get("user") or {}
    user_id = user.get("id")
    if not user_id:
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
