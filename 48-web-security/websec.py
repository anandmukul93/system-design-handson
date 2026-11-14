import hashlib
import hmac
import ipaddress
import re
import sqlite3
from urllib.parse import urlsplit


def cors_preflight(origin: str, method: str, headers: list[str], policy: dict) -> dict | None:
    """policy: {"origins": [...], "methods": [...], "headers": [...], "credentials": bool}.
    Return response headers if allowed, else None:
    {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST" (policy order),
     "Access-Control-Allow-Headers": "content-type, x-api-key" (requested, lowercased),
     plus "Access-Control-Allow-Credentials": "true" when credentials}. Header names compare case-insensitively."""
    raise NotImplementedError


def csrf_token(session_id: str, secret: bytes) -> str:
    """hex HMAC-SHA256 of the session id."""
    raise NotImplementedError


def csrf_ok(method: str, session_id: str, token: str | None, secret: bytes) -> bool:
    """GET/HEAD/OPTIONS always ok; otherwise the token must match (constant-time)."""
    raise NotImplementedError


def escape_html(s: str) -> str:
    """Escape & < > " ' (as &amp; &lt; &gt; &quot; &#x27;)."""
    raise NotImplementedError


def find_user_unsafe(conn: sqlite3.Connection, name: str) -> list[tuple]:
    """DELIBERATELY VULNERABLE: do not copy this."""
    return conn.execute(f"SELECT id, name FROM users WHERE name = '{name}'").fetchall()


def find_user_safe(conn: sqlite3.Connection, name: str) -> list[tuple]:
    """Same query with a bound parameter."""
    raise NotImplementedError


def is_safe_url(url: str, resolve) -> bool:
    """Allow only http/https URLs with a host whose every resolved IP (resolve(host) -> list[str]) is
    global: reject private, loopback, link-local, reserved, multicast and unspecified addresses."""
    raise NotImplementedError


WAF_RULES = [
    ("sqli", r"(?i)(\bunion\b.+\bselect\b|'\s*or\s*'1'\s*=\s*'1)"),
    ("xss", r"(?i)<\s*script|javascript:|onerror\s*="),
    ("traversal", r"\.\./"),
]


def waf_check(path: str, query: str, body: str = "") -> str | None:
    """Return the name of the first matching rule (checking path, query and body), or None."""
    raise NotImplementedError
