import httpx
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

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
        logger.error("Supabase signup error %s: %s", resp.status_code, resp.text)
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

    logger.info("Supabase login request url=%s email=%s", url, email)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json=payload, headers=headers)

    if resp.status_code >= 400:
        logger.error("Supabase login error %s: %s", resp.status_code, resp.text)
        raise SupabaseAuthError(resp.text)
    logger.info("Supabase login success status=%s", resp.status_code)

    return resp.json()


async def supabase_exchange_oauth_code(auth_code: str, code_verifier: str) -> dict:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise SupabaseAuthError("SUPABASE_URL or SUPABASE_ANON_KEY is not configured")

    url = f"{settings.supabase_url}/auth/v1/token?grant_type=pkce"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
    }
    payload = {"auth_code": auth_code, "code_verifier": code_verifier}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json=payload, headers=headers)

    if resp.status_code >= 400:
        raise SupabaseAuthError(resp.text)

    return resp.json()
