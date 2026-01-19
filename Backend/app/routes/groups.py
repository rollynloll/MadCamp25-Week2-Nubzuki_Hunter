from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import Game, Group, GroupMember, GroupScore, UserProfile
from app.schemas import GroupCreateRequest, GroupJoinRequest
from app.utils import generate_group_code

router = APIRouter(prefix="/groups", tags=["groups"])


async def get_group_member_count(db: AsyncSession, group_id: str) -> int:
    stmt = select(func.count()).select_from(GroupMember).where(GroupMember.group_id == group_id)
    result = await db.execute(stmt)
    return result.scalar_one()


@router.post("")
async def create_group(
    payload: GroupCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.game_id:
        active_stmt = (
            select(Game.id)
            .where(Game.status.in_(["lobby", "playing"]))
            .where(Game.expires_at > func.now())
            .order_by(Game.created_at.desc())
            .limit(1)
        )
        result = await db.execute(active_stmt)
        game_id = result.scalar_one_or_none()
        if not game_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active game found. Provide game_id explicitly.",
            )
    else:
        game_id = payload.game_id

    code = payload.code or generate_group_code()
    for _ in range(5):
        existing_stmt = select(Group).where(Group.code == code)
        existing = await db.execute(existing_stmt)
        if not existing.scalar_one_or_none():
            break
        code = generate_group_code()
    else:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unable to allocate group code")

    group = Group(
        game_id=game_id,
        code=code,
        name=payload.name,
        owner_id=current_user.user_id,
        max_members=payload.max_members or 6,
    )
    db.add(group)
    await db.flush()

    db.add(
        GroupMember(
            group_id=group.id,
            user_id=current_user.user_id,
            role="owner",
        )
    )
    db.add(GroupScore(group_id=group.id, user_id=current_user.user_id))

    await db.commit()

    return {
        "id": group.id,
        "game_id": group.game_id,
        "code": group.code,
        "name": group.name,
        "owner_id": group.owner_id,
        "max_members": group.max_members,
        "created_at": group.created_at,
    }


@router.get("/active")
async def list_active_groups(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    active_stmt = (
        select(Game.id)
        .where(Game.status.in_(["lobby", "playing"]))
        .where(Game.expires_at > func.now())
        .order_by(Game.created_at.desc())
        .limit(1)
    )
    result = await db.execute(active_stmt)
    game_id = result.scalar_one_or_none()
    if not game_id:
        return {"game_id": None, "groups": []}

    stmt = text(
        """
        SELECT g.id,
               g.game_id,
               g.code,
               g.name,
               g.max_members,
               COALESCE(SUM(gs.score), 0) AS total_score,
               COALESCE(SUM(gs.captures_count), 0) AS captures_count,
               COALESCE(COUNT(DISTINCT gm.user_id), 0) AS member_count
        FROM public.groups g
        LEFT JOIN public.group_scores gs ON gs.group_id = g.id
        LEFT JOIN public.group_members gm ON gm.group_id = g.id
        WHERE g.game_id = :game_id
        GROUP BY g.id
        ORDER BY g.created_at ASC
        """
    )
    groups_result = await db.execute(stmt, {"game_id": game_id})
    groups = [
        {
            "id": row["id"],
            "game_id": row["game_id"],
            "code": row["code"],
            "name": row["name"],
            "max_members": row["max_members"],
            "total_score": row["total_score"],
            "captures_count": row["captures_count"],
            "member_count": row["member_count"],
        }
        for row in groups_result.mappings().all()
    ]

    return {"game_id": game_id, "groups": groups}


@router.post("/join")
async def join_group(
    payload: GroupJoinRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Group).where(Group.code == payload.code)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    member_count = await get_group_member_count(db, group.id)
    if member_count >= group.max_members:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group is full")

    exists_stmt = select(GroupMember).where(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.user_id,
    )
    exists = await db.execute(exists_stmt)
    if exists.scalar_one_or_none():
        return {"id": group.id, "message": "Already joined"}

    db.add(GroupMember(group_id=group.id, user_id=current_user.user_id))
    db.add(GroupScore(group_id=group.id, user_id=current_user.user_id))
    await db.commit()

    return {
        "id": group.id,
        "game_id": group.game_id,
        "code": group.code,
        "name": group.name,
        "owner_id": group.owner_id,
        "max_members": group.max_members,
        "created_at": group.created_at,
    }


@router.get("/me")
async def get_my_group(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Group)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == current_user.user_id)
        .order_by(Group.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    return {
        "id": group.id,
        "game_id": group.game_id,
        "code": group.code,
        "name": group.name,
        "owner_id": group.owner_id,
        "max_members": group.max_members,
        "created_at": group.created_at,
    }


@router.get("/{group_id}/snapshot")
async def group_snapshot(
    group_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member_stmt = (
        select(
            GroupMember.user_id,
            GroupMember.role,
            GroupMember.joined_at,
            UserProfile.nickname,
            UserProfile.avatar_url,
        )
        .join(UserProfile, UserProfile.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.joined_at.asc())
    )
    members_result = await db.execute(member_stmt)
    members = [
        {
            "user_id": row["user_id"],
            "role": row["role"],
            "joined_at": row["joined_at"],
            "nickname": row["nickname"],
            "avatar_url": row["avatar_url"],
        }
        for row in members_result.mappings().all()
    ]

    score_stmt = text(
        """
        SELECT COALESCE(SUM(score), 0) AS total_score,
               COALESCE(SUM(captures_count), 0) AS captures_count
        FROM public.group_scores
        WHERE group_id = :group_id
        """
    )
    score_result = await db.execute(score_stmt, {"group_id": group_id})
    score_row = score_result.mappings().one()

    group_stmt = select(Group).where(Group.id == group_id)
    group_result = await db.execute(group_stmt)
    group = group_result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    return {
        "group": {
            "id": group.id,
            "game_id": group.game_id,
            "code": group.code,
            "name": group.name,
            "owner_id": group.owner_id,
            "max_members": group.max_members,
            "created_at": group.created_at,
        },
        "members": members,
        "total_score": score_row["total_score"],
        "captures_count": score_row["captures_count"],
    }


@router.get("/{group_id}/leaderboard")
async def group_leaderboard(
    group_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            GroupScore.user_id,
            GroupScore.score,
            GroupScore.captures_count,
            UserProfile.nickname,
            UserProfile.avatar_url,
        )
        .join(UserProfile, UserProfile.id == GroupScore.user_id)
        .where(GroupScore.group_id == group_id)
        .order_by(GroupScore.score.desc())
    )
    result = await db.execute(stmt)
    leaderboard = [
        {
            "user_id": row["user_id"],
            "score": row["score"],
            "captures_count": row["captures_count"],
            "nickname": row["nickname"],
            "avatar_url": row["avatar_url"],
        }
        for row in result.mappings().all()
    ]

    return {"group_id": group_id, "leaderboard": leaderboard}
