import base64
import fnmatch
import hashlib
import hmac
import json
import re


def b64url(data: bytes) -> str:
    """URL-safe base64 without '=' padding."""
    raise NotImplementedError


def b64url_decode(s: str) -> bytes:
    raise NotImplementedError


class InvalidToken(Exception):
    pass


def jwt_sign(payload: dict, keys: dict[str, bytes], kid: str) -> str:
    """HS256 JWT with header {"alg": "HS256", "typ": "JWT", "kid": kid}. JSON with separators=(",", ":")."""
    raise NotImplementedError


def jwt_verify(token: str, keys: dict[str, bytes], now: float) -> dict:
    """Return the payload. Raise InvalidToken if: malformed, alg != HS256, unknown kid, bad signature,
    or payload has "exp" <= now."""
    raise NotImplementedError


def pkce_challenge(verifier: str) -> str:
    """S256: b64url(sha256(verifier))"""
    raise NotImplementedError


def iam_allowed(policies: list[dict], action: str, resource: str) -> bool:
    """policies: [{"effect": "Allow"|"Deny", "actions": [...], "resources": [...]}] with * wildcards.
    Default deny; any matching Deny wins; else any matching Allow."""
    raise NotImplementedError


def redact(text: str) -> str:
    """Mask AWS access key ids (AKIA + 16 upper/digits) as 'AKIA****************' and the value of
    password=..., token=..., secret=... (up to whitespace or &) as '***'."""
    raise NotImplementedError
