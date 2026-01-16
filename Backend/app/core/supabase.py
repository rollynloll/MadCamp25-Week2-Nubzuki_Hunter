import httpx

from app.core.config import get_settings


class SupabaseAuthError(RuntimeError):
    pass


async def supabase_signup(email: str, password: str) -> dict:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise SupabaseAuthError("SUPABASE_URL or SUPABASE_ANON_KEY is not configured")

    url = f"{settings.supabase_url}/auth/v1/signup"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
    }
    payload = {"email": email, "password": password}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json=payload, headers=headers)

    if resp.status_code >= 400:
        raise SupabaseAuthError(resp.text)

    return resp.json()


async def supabase_login(email: str, password: str) -> dict:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise SupabaseAuthError("SUPABASE_URL or SUPABASE_ANON_KEY is not configured")

    url = f"{settings.supabase_url}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
    }
    payload = {"email": email, "password": password}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, data=payload, headers=headers)

    if resp.status_code >= 400:
        raise SupabaseAuthError(resp.text)

    return resp.json()
