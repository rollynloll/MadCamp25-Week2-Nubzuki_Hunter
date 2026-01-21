from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Game, Group, GroupMember, GroupScore, PersonalScore

router = APIRouter(prefix="/score", tags=["scores"])


@router.get("/me")
async def get_my_score(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
        return {"game_id": None, "score": 0, "captures_count": 0}

    score_stmt = (
        select(PersonalScore)
        .where(PersonalScore.game_id == game_id)
        .where(PersonalScore.user_id == current_user.user_id)
    )
    score_result = await db.execute(score_stmt)
    score = score_result.scalar_one_or_none()
    if not score:
        return {"game_id": game_id, "score": 0, "captures_count": 0}

    return {
        "game_id": score.game_id,
        "score": score.score,
        "captures_count": score.captures_count,
        "updated_at": score.updated_at,
    }


@router.get("/summary")
async def get_score_summary(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
        return {
            "game_id": None,
            "group_id": None,
            "personal_score": 0,
            "personal_captures": 0,
            "team_score": 0,
            "team_captures": 0,
        }

    score_stmt = (
        select(PersonalScore)
        .where(PersonalScore.game_id == game_id)
        .where(PersonalScore.user_id == current_user.user_id)
    )
    score_result = await db.execute(score_stmt)
    score = score_result.scalar_one_or_none()
    personal_score = score.score if score else 0
    personal_captures = score.captures_count if score else 0

    group_stmt = (
        select(GroupMember.group_id)
        .join(Group, Group.id == GroupMember.group_id)
        .where(GroupMember.user_id == current_user.user_id)
        .where(Group.game_id == game_id)
        .order_by(Group.created_at.desc())
        .limit(1)
    )
    group_result = await db.execute(group_stmt)
    group_id = group_result.scalar_one_or_none()

    if not group_id:
        return {
            "game_id": game_id,
            "group_id": None,
            "personal_score": personal_score,
            "personal_captures": personal_captures,
            "team_score": 0,
            "team_captures": 0,
        }

    team_stmt = (
        select(
            func.coalesce(func.sum(GroupScore.score), 0).label("team_score"),
            func.coalesce(func.sum(GroupScore.captures_count), 0).label("team_captures"),
        )
        .where(GroupScore.group_id == group_id)
    )
    team_result = await db.execute(team_stmt)
    team_row = team_result.mappings().one()

    return {
        "game_id": game_id,
        "group_id": group_id,
        "personal_score": personal_score,
        "personal_captures": personal_captures,
        "team_score": team_row["team_score"],
        "team_captures": team_row["team_captures"],
    }
