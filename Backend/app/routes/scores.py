from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Game, PersonalScore

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
