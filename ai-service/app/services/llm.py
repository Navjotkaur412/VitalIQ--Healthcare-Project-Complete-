import httpx
from ..config import settings

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
GEMINI_URL_TMPL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def active_provider() -> str | None:
    """
    Returns 'gemini', 'anthropic', or None. Respects an explicit LLM_PROVIDER
    override; otherwise prefers Gemini (it has a genuinely free tier, so a
    deployment with no budget can still use real LLM features) and falls
    back to Anthropic if only that key is set.
    """
    choice = settings.llm_provider.lower()
    if choice == "gemini":
        return "gemini" if settings.gemini_api_key else None
    if choice == "anthropic":
        return "anthropic" if settings.anthropic_api_key else None

    # auto
    if settings.gemini_api_key:
        return "gemini"
    if settings.anthropic_api_key:
        return "anthropic"
    return None


def is_llm_configured() -> bool:
    return active_provider() is not None


async def _call_gemini(system: str, user_message: str, max_tokens: int) -> str | None:
    url = GEMINI_URL_TMPL.format(model=settings.gemini_model)
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                url,
                params={"key": settings.gemini_api_key},
                headers={"content-type": "application/json"},
                json={
                    "systemInstruction": {"parts": [{"text": system}]},
                    "contents": [{"role": "user", "parts": [{"text": user_message}]}],
                    "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.4},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None
            parts = candidates[0].get("content", {}).get("parts", [])
            text = "".join(p.get("text", "") for p in parts).strip()
            return text or None
    except Exception as exc:
        print(f"[llm] Gemini call failed, falling back to template output: {exc}")
        return None


async def _call_anthropic(system: str, user_message: str, max_tokens: int) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                ANTHROPIC_URL,
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.anthropic_model,
                    "max_tokens": max_tokens,
                    "system": system,
                    "messages": [{"role": "user", "content": user_message}],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text_blocks = [b["text"] for b in data.get("content", []) if b.get("type") == "text"]
            return "\n".join(text_blocks).strip() or None
    except Exception as exc:
        print(f"[llm] Anthropic call failed, falling back to template output: {exc}")
        return None


async def call_llm(system: str, user_message: str, max_tokens: int = 600) -> str | None:
    """
    Returns the model's text response, or None if no provider is configured
    or the call fails — every caller must have a deterministic fallback ready.
    """
    provider = active_provider()
    if provider == "gemini":
        return await _call_gemini(system, user_message, max_tokens)
    if provider == "anthropic":
        return await _call_anthropic(system, user_message, max_tokens)
    return None
