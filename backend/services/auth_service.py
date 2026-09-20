# pyrefly: ignore [missing-import]
from flask import request
from extensions import r
from config import TTL_SECONDS

def get_or_create_id(client_token):
    """Derive a stable short ID from a client token.
    Persisted in Redis so identity survives server restarts."""
    if not client_token:
        return request.sid[:6]
    sanitized_token = str(client_token)[:64]
    cached = r.get(f"token:{sanitized_token}:id")
    if cached:
        return cached
    short_id = sanitized_token[:6]
    r.set(f"token:{sanitized_token}:id", short_id, ex=TTL_SECONDS)
    return short_id

def get_current_user_id():
    """Extract persistent short ID for current request socket."""
    client_token = request.args.get('client_token', None)
    return get_or_create_id(client_token)
