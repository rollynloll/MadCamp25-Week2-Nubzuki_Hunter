from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import CurrentUser, get_current_user
from app.models import (
    Capture,
    CaptureEvent,
    Eyeball,
    EyeballEvent,
    EyeballType,
    Group,
    GroupMember,
)
from app.schemas import CaptureCreateRequest

router = APIRouter(prefix="/captures", tags=["captures"])


@router.post("")
async def create_capture(
    payload: CaptureCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    eyeball_stmt = (
        select(
            Eyeball.id,
            Eyeball.game_id,
            Eyeball.type_id,
            Eyeball.is_active,
            Eyeball.points_override,
            EyeballType.base_points,
        )
        .join(EyeballType, EyeballType.id == Eyeball.type_id)
        .where(Eyeball.id == payload.eyeball_id)
    )
    eyeball_result = await db.execute(eyeball_stmt)
    eyeball = eyeball_result.mappings().one_or_none()
    if not eyeball:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Eyeball not found")

    if not eyeball["is_active"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Eyeball inactive")

    group_id = payload.group_id
    if not group_id:
        group_stmt = (
            select(GroupMember.group_id)
            .join(Group, Group.id == GroupMember.group_id)
            .where(GroupMember.user_id == current_user.user_id)
            .where(Group.game_id == eyeball["game_id"])
            .limit(1)
        )
        group_result = await db.execute(group_stmt)
        group_id = group_result.scalar_one_or_none()
        if not group_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="group_id is required when user has no group",
            )

    member_stmt = (
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .where(GroupMember.user_id == current_user.user_id)
    )
    member_result = await db.execute(member_stmt)
    if not member_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not in group")

    group_check = select(Group.id).where(Group.id == group_id).where(Group.game_id == eyeball["game_id"])
    group_check_result = await db.execute(group_check)
    if not group_check_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group mismatch for game")

    dup_stmt = (
        select(Capture)
        .where(Capture.game_id == eyeball["game_id"])
        .where(Capture.eyeball_id == payload.eyeball_id)
    )
    dup_result = await db.execute(dup_stmt)
    if dup_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already captured")

    capture = Capture(
        game_id=eyeball["game_id"],
        group_id=group_id,
        user_id=current_user.user_id,
        eyeball_id=payload.eyeball_id,
    )
    db.add(capture)
    await db.flush()

    points = (
        eyeball["points_override"]
        if eyeball["points_override"] is not None
        else eyeball["base_points"]
    )

    group_upsert = text(
        """
        INSERT INTO public.group_scores (group_id, user_id, score, captures_count)
        VALUES (:group_id, :user_id, :score, :captures)
        ON CONFLICT (group_id, user_id)
        DO UPDATE SET score = public.group_scores.score + EXCLUDED.score,
                      captures_count = public.group_scores.captures_count + EXCLUDED.captures_count,
                      updated_at = now()
        """
    )
    await db.execute(
        group_upsert,
        {
            "group_id": group_id,
            "user_id": current_user.user_id,
            "score": points,
            "captures": 1,
        },
    )

    personal_upsert = text(
        """
        INSERT INTO public.personal_scores (game_id, user_id, score, captures_count)
        VALUES (:game_id, :user_id, :score, :captures)
        ON CONFLICT (game_id, user_id)
        DO UPDATE SET score = public.personal_scores.score + EXCLUDED.score,
                      captures_count = public.personal_scores.captures_count + EXCLUDED.captures_count,
                      updated_at = now()
        """
    )
    await db.execute(
        personal_upsert,
        {
            "game_id": eyeball["game_id"],
            "user_id": current_user.user_id,
            "score": points,
            "captures": 1,
        },
    )

    events_stmt = select(EyeballEvent).where(EyeballEvent.type_id == eyeball["type_id"])
    events_result = await db.execute(events_stmt)
    events = []
    for event in events_result.scalars().all():
        capture_event = CaptureEvent(
            capture_id=capture.id,
            event_type=event.event_type,
            payload=event.payload,
        )
        db.add(capture_event)
        events.append({"event_type": event.event_type, "payload": event.payload})

    await db.commit()

    return {
        "id": capture.id,
        "game_id": capture.game_id,
        "group_id": capture.group_id,
        "user_id": capture.user_id,
        "eyeball_id": capture.eyeball_id,
        "captured_at": capture.captured_at,
        "points": points,
        "events": events,
    }
