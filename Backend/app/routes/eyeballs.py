from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Eyeball, EyeballType

router = APIRouter(prefix="/eyeballs", tags=["eyeballs"])


@router.get("/{eyeball_id}")
async def get_eyeball(
    eyeball_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Eyeball.id,
            Eyeball.game_id,
            Eyeball.qr_code,
            Eyeball.title,
            Eyeball.location_name,
            Eyeball.lat,
            Eyeball.lng,
            Eyeball.hint,
            Eyeball.points_override,
            Eyeball.is_active,
            EyeballType.name.label("type_name"),
            EyeballType.event_key,
            EyeballType.base_points,
        )
        .join(EyeballType, EyeballType.id == Eyeball.type_id)
        .where(Eyeball.id == eyeball_id)
    )
    result = await db.execute(stmt)
    row = result.mappings().one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Eyeball not found")

    points = row["points_override"] if row["points_override"] is not None else row["base_points"]

    return {
        "id": row["id"],
        "game_id": row["game_id"],
        "qr_code": row["qr_code"],
        "title": row["title"],
        "location_name": row["location_name"],
        "lat": row["lat"],
        "lng": row["lng"],
        "hint": row["hint"],
        "is_active": row["is_active"],
        "type_name": row["type_name"],
        "event_key": row["event_key"],
        "points": points,
    }
