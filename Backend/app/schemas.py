from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    nickname: str | None = None
    avatar_url: str | None = None


class GroupCreateRequest(BaseModel):
    game_id: str | None = None
    name: str | None = None
    code: str | None = None
    max_members: int | None = None


class GroupJoinRequest(BaseModel):
    code: str


class CaptureCreateRequest(BaseModel):
    eyeball_id: str
    group_id: str | None = None
