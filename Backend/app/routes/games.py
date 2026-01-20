from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Capture, Eyeball, EyeballType, Game, Group, UserProfile

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/active")
async def get_active_game(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Game)
        .where(Game.status.in_(["lobby", "playing"]))
        .where(Game.expires_at > func.now())
        .order_by(Game.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    game = result.scalar_one_or_none()
    if not game:
        return {"game": None}

    return {
        "game": {
            "id": game.id,
            "title": game.title,
            "status": game.status,
            "owner_id": game.owner_id,
            "created_at": game.created_at,
            "starts_at": game.starts_at,
            "ends_at": game.ends_at,
            "expires_at": game.expires_at,
        }
    }


@router.get("/{game_id}/eyeballs")
async def get_game_eyeballs(
    game_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Eyeball.id,
            Eyeball.qr_code,
            Eyeball.type_id,
            Eyeball.point,
            Eyeball.is_active,
            EyeballType.name.label("type_name"),
        )
        .join(EyeballType, EyeballType.id == Eyeball.type_id)
        .where(Eyeball.game_id == game_id)
        .order_by(Eyeball.created_at.asc())
    )
    result = await db.execute(stmt)
    eyeballs = []
    for row in result.mappings().all():
        points = row["point"]
        eyeballs.append(
            {
                "id": row["id"],
                "qr_code": row["qr_code"],
                "is_active": row["is_active"],
                "type_name": row["type_name"],
                "type_id": row["type_id"],
                "points": points,
            }
        )

    return {"game_id": game_id, "eyeballs": eyeballs}


@router.get("/{game_id}/leaderboard")
async def game_leaderboard(
    game_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = text(
        """
        SELECT g.id AS group_id,
               g.name,
               g.code,
               COALESCE(SUM(gs.score), 0) AS total_score,
               COALESCE(SUM(gs.captures_count), 0) AS captures_count,
               MAX(gs.updated_at) AS updated_at
        FROM public.groups g
        LEFT JOIN public.group_scores gs ON gs.group_id = g.id
        WHERE g.game_id = :game_id
        GROUP BY g.id, g.name, g.code
        ORDER BY total_score DESC, MAX(gs.updated_at) ASC NULLS LAST
        """
    )
    result = await db.execute(stmt, {"game_id": game_id})
    leaderboard = [
        {
            "group_id": row["group_id"],
            "name": row["name"],
            "code": row["code"],
            "score": row["total_score"],
            "captures_count": row["captures_count"],
            "updated_at": row["updated_at"],
        }
        for row in result.mappings().all()
    ]

    return {"game_id": game_id, "leaderboard": leaderboard}


@router.get("/{game_id}/result")
async def game_result(
    game_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group_stmt = text(
        """
        SELECT g.id AS group_id,
               g.name,
               g.code,
               COALESCE(SUM(gs.score), 0) AS total_score,
               COALESCE(SUM(gs.captures_count), 0) AS captures_count,
               MAX(gs.updated_at) AS updated_at
        FROM public.groups g
        LEFT JOIN public.group_scores gs ON gs.group_id = g.id
        WHERE g.game_id = :game_id
        GROUP BY g.id, g.name, g.code
        ORDER BY total_score DESC, MAX(gs.updated_at) ASC NULLS LAST
        """
    )
    group_result = await db.execute(group_stmt, {"game_id": game_id})
    group_leaderboard = [
        {
            "group_id": row["group_id"],
            "name": row["name"],
            "code": row["code"],
            "score": row["total_score"],
            "captures_count": row["captures_count"],
            "updated_at": row["updated_at"],
        }
        for row in group_result.mappings().all()
    ]

    personal_stmt = text(
        """
        SELECT gm.user_id,
               COALESCE(ps.score, 0) AS score,
               COALESCE(ps.captures_count, 0) AS captures_count,
               ps.updated_at,
               u.nickname,
               u.avatar_url
        FROM public.group_members gm
        JOIN public.groups g ON g.id = gm.group_id
        JOIN public.users u ON u.id = gm.user_id
        LEFT JOIN public.personal_scores ps
               ON ps.game_id = :game_id AND ps.user_id = gm.user_id
        WHERE g.game_id = :game_id
        ORDER BY score DESC, ps.updated_at ASC NULLS LAST
        """
    )
    personal_result = await db.execute(personal_stmt, {"game_id": game_id})
    personal_leaderboard = [
        {
            "user_id": row["user_id"],
            "score": row["score"],
            "captures_count": row["captures_count"],
            "nickname": row["nickname"],
            "avatar_url": row["avatar_url"],
            "updated_at": row["updated_at"],
        }
        for row in personal_result.mappings().all()
    ]

    return {
        "game_id": game_id,
        "group_leaderboard": group_leaderboard,
        "personal_leaderboard": personal_leaderboard,
    }


@router.get("/{game_id}/captures")
async def game_captures(
    game_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Capture.id.label("capture_id"),
            Capture.captured_at,
            Capture.group_id,
            Capture.user_id,
            Capture.image_url,
            Eyeball.qr_code,
            EyeballType.name.label("type_name"),
            Eyeball.type_id,
            Eyeball.point,
            UserProfile.nickname,
        )
        .join(Eyeball, Eyeball.id == Capture.eyeball_id)
        .join(EyeballType, EyeballType.id == Eyeball.type_id)
        .join(UserProfile, UserProfile.id == Capture.user_id)
        .where(Capture.game_id == game_id)
        .order_by(Capture.captured_at.desc())
    )
    result = await db.execute(stmt)
    captures = []
    for row in result.mappings().all():
        points = row["point"]
        captures.append(
            {
                "id": row["capture_id"],
                "captured_at": row["captured_at"],
                "group_id": row["group_id"],
                "user_id": row["user_id"],
                "nickname": row["nickname"],
                "image_url": row["image_url"],
                "qr_code": row["qr_code"],
                "type_name": row["type_name"],
                "type_id": row["type_id"],
                "points": points,
            }
        )

    return {"game_id": game_id, "captures": captures}
