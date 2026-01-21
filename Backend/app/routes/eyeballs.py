from fastapi import APIRouter, Depends, HTTPException, status
from uuid import uuid4
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Eyeball, EyeballType, Game
from app.schemas import EyeballBulkCreateRequest

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


@router.post("/bulk")
async def bulk_create_eyeballs(
    payload: EyeballBulkCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    game_id = payload.game_id
    if not game_id:
        game_stmt = (
            select(Game.id)
            .where(Game.status.in_(["lobby", "playing"]))
            .where(Game.expires_at > func.now())
            .order_by(Game.created_at.desc())
            .limit(1)
        )
        game_result = await db.execute(game_stmt)
        game_id = game_result.scalar_one_or_none()
        if not game_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active game not found",
            )

    types_stmt = select(EyeballType.id, EyeballType.name)
    types_result = await db.execute(types_stmt)
    types = types_result.mappings().all()
    if not types:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eyeball types not found",
        )

    created = []
    eyeballs = []
    for type_row in types:
        for _ in range(payload.per_type_count):
            eyeball_id = uuid4()
            qr_value = str(eyeball_id)
            eyeballs.append(
                Eyeball(
                    id=eyeball_id,
                    game_id=game_id,
                    type_id=type_row["id"],
                    qr_code=qr_value,
                    point=payload.point,
                    is_active=payload.is_active,
                )
            )
            created.append(
                {
                    "id": eyeball_id,
                    "qr_code": qr_value,
                    "type_id": type_row["id"],
                    "type_name": type_row["name"],
                }
            )

    db.add_all(eyeballs)
    await db.commit()

    return {"game_id": game_id, "created": created}


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
