from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    nickname: str | None = None
    avatar_url: str | None = None

    @field_validator("avatar_url")
    @classmethod
    def empty_signup_avatar_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.strip():
            return None
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    nickname: str | None = None
    avatar_url: str | None = None

    @field_validator("avatar_url")
    @classmethod
    def empty_avatar_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.strip():
            return None
        return value


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
