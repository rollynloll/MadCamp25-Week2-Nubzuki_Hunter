from datetime import datetime
from uuid import uuid4
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UserProfile(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nickname: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class AuthUser(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)


class Game(Base):
    __tablename__ = "games"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    title: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    owner_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Group(Base):
    __tablename__ = "groups"
    __table_args__ = (UniqueConstraint("code"), {"schema": "public"})

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    game_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.games.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id"))
    max_members: Mapped[int] = mapped_column(Integer, server_default="6", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (
        PrimaryKeyConstraint("group_id", "user_id"),
        {"schema": "public"},
    )

    group_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)
    role: Mapped[str] = mapped_column(Text, server_default=text("'member'"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class EyeballType(Base):
    __tablename__ = "eyeball_types"
    __table_args__ = (UniqueConstraint("event_key"), {"schema": "public"})

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    event_key: Mapped[str] = mapped_column(Text, nullable=False)
    base_points: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class Eyeball(Base):
    __tablename__ = "eyeballs"
    __table_args__ = (UniqueConstraint("qr_code"), {"schema": "public"})

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    game_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.games.id", ondelete="CASCADE"),
        nullable=False,
    )
    type_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("public.eyeball_types.id"), nullable=False
    )
    qr_code: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str | None] = mapped_column(Text)
    location_name: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[float | None] = mapped_column()
    lng: Mapped[float | None] = mapped_column()
    hint: Mapped[str | None] = mapped_column(Text)
    points_override: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class EyeballEvent(Base):
    __tablename__ = "eyeball_events"
    __table_args__ = {"schema": "public"}

    type_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.eyeball_types.id"),
        primary_key=True,
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb"), nullable=False
    )


class Capture(Base):
    __tablename__ = "captures"
    __table_args__ = (
        UniqueConstraint("game_id", "eyeball_id"),
        {"schema": "public"},
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    game_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.games.id", ondelete="CASCADE"),
        nullable=False,
    )
    group_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)
    eyeball_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.eyeballs.id"),
        nullable=False,
    )
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GroupScore(Base):
    __tablename__ = "group_scores"
    __table_args__ = (
        PrimaryKeyConstraint("group_id", "user_id"),
        {"schema": "public"},
    )

    group_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    captures_count: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PersonalScore(Base):
    __tablename__ = "personal_scores"
    __table_args__ = (
        PrimaryKeyConstraint("game_id", "user_id"),
        {"schema": "public"},
    )

    game_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.games.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    captures_count: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CaptureEvent(Base):
    __tablename__ = "capture_events"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    capture_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.captures.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
