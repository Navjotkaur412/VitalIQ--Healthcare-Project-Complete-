from fastapi import Header, HTTPException, status
from .config import settings


async def verify_internal_key(x_internal_api_key: str = Header(default="")):
    """
    This service is never exposed to the browser. The Node backend is the
    only caller, and it attaches this header on every request after it has
    already done JWT auth + role checks for the end user. If this check
    fails, either the key is misconfigured or something is calling this
    service that shouldn't be.
    """
    if not x_internal_api_key or x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing internal API key")
