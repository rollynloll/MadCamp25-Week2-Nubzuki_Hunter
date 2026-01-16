from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Capture, Eyeball, EyeballType, Game, UserProfile
from app.schemas import ProfileUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UserProfile).where(UserProfile.id == current_user.user_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return {
        "id": str(profile.id),
        "nickname": profile.nickname,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@router.patch("/me")
async def update_me(
    payload: ProfileUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    values = {}
    if payload.nickname is not None:
        values["nickname"] = payload.nickname
    if payload.avatar_url is not None:
        values["avatar_url"] = payload.avatar_url
    if not values:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes")
    values["updated_at"] = func.now()

    stmt = (
        update(UserProfile)
        .where(UserProfile.id == current_user.user_id)
        .values(**values)
        .returning(UserProfile)
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    await db.commit()
    return {
        "id": str(profile.id),
        "nickname": profile.nickname,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@router.get("/me/captures")
async def get_my_captures(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Capture.id.label("capture_id"),
            Capture.captured_at,
            Capture.game_id,
            Capture.group_id,
            Capture.eyeball_id,
            Eyeball.title.label("eyeball_title"),
            Eyeball.location_name,
            Eyeball.qr_code,
            EyeballType.name.label("type_name"),
            EyeballType.event_key,
            EyeballType.base_points,
            Eyeball.points_override,
            Game.title.label("game_title"),
        )
        .join(Eyeball, Eyeball.id == Capture.eyeball_id)
        .join(EyeballType, EyeballType.id == Eyeball.type_id)
        .join(Game, Game.id == Capture.game_id)
        .where(Capture.user_id == current_user.user_id)
        .order_by(Capture.captured_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.mappings().all()
    captures = []
    for row in rows:
        points = row["points_override"] if row["points_override"] is not None else row["base_points"]
        captures.append(
            {
                "id": row["capture_id"],
                "captured_at": row["captured_at"],
                "game_id": row["game_id"],
                "game_title": row["game_title"],
                "group_id": row["group_id"],
                "eyeball_id": row["eyeball_id"],
                "eyeball_title": row["eyeball_title"],
                "location_name": row["location_name"],
                "qr_code": row["qr_code"],
                "type_name": row["type_name"],
                "event_key": row["event_key"],
                "points": points,
            }
        )

    return {"captures": captures}
