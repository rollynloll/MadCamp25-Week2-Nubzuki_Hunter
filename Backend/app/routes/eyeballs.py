from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Eyeball, EyeballType

router = APIRouter(prefix="/eyeballs", tags=["eyeballs"])


@router.get("/active/counts")
async def get_active_counts(
    game_id: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    join_condition = (Eyeball.type_id == EyeballType.id) & (Eyeball.is_active.is_(True))
    if game_id:
        join_condition = join_condition & (Eyeball.game_id == game_id)

    stmt = (
        select(EyeballType.name.label("type_name"), func.count(Eyeball.id).label("count"))
        .outerjoin(Eyeball, join_condition)
        .group_by(EyeballType.name)
    )

    result = await db.execute(stmt)
    return {row["type_name"]: row["count"] for row in result.mappings().all()}


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
            Eyeball.type_id,
            Eyeball.point,
            Eyeball.is_active,
            EyeballType.name.label("type_name"),
        )
        .join(EyeballType, EyeballType.id == Eyeball.type_id)
        .where(Eyeball.id == eyeball_id)
    )
    result = await db.execute(stmt)
    row = result.mappings().one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Eyeball not found")

    points = row["point"]

    return {
        "id": row["id"],
        "game_id": row["game_id"],
        "qr_code": row["qr_code"],
        "is_active": row["is_active"],
        "type_name": row["type_name"],
        "type_id": row["type_id"],
        "points": points,
    }


@router.post("/{eyeball_id}/qr")
async def ensure_qr_code(
    eyeball_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Eyeball).where(Eyeball.id == eyeball_id)
    result = await db.execute(stmt)
    eyeball = result.scalar_one_or_none()
    if not eyeball:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Eyeball not found")

    if not eyeball.qr_code:
        eyeball.qr_code = eyeball.id
        await db.commit()

    return {
        "eyeball_id": eyeball.id,
        "qr_value": eyeball.qr_code,
    }


@router.get("/qr/resolve")
async def resolve_qr(
    value: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Eyeball.id,
            Eyeball.game_id,
            Eyeball.qr_code,
            Eyeball.type_id,
            Eyeball.point,
            Eyeball.is_active,
            EyeballType.name.label("type_name"),
        )
        .join(EyeballType, EyeballType.id == Eyeball.type_id)
        .where(or_(Eyeball.id == value, Eyeball.qr_code == value))
        .limit(1)
    )
    result = await db.execute(stmt)
    row = result.mappings().one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Eyeball not found")

    points = row["point"]

    return {
        "id": row["id"],
        "game_id": row["game_id"],
        "qr_code": row["qr_code"],
        "is_active": row["is_active"],
        "type_name": row["type_name"],
        "type_id": row["type_id"],
        "points": points,
    }
