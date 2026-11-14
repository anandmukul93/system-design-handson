import hashlib
import hmac


class SmoothWeightedRR:
    """nginx smooth weighted round robin: each pick, add weight to every current_weight,
    pick the max (ties: first in insertion order), subtract the total from the winner."""

    def __init__(self, weights: dict[str, int]):
        self.weights = dict(weights)
        self.current = {k: 0 for k in weights}

    def next(self) -> str:
        raise NotImplementedError


class Gateway:
    """routes: {(version, prefix): upstream}. Version comes from a /vN/ path prefix (which is
    stripped), else the "API-Version" header, else default_version. Longest prefix wins."""

    def __init__(self, routes: dict[tuple[str, str], str], default_version: str = "v1"):
        self.routes, self.default_version = routes, default_version

    def route(self, path: str, headers: dict | None = None) -> tuple[str, str, str] | None:
        """Return (upstream, version, path_without_version) or None."""
        raise NotImplementedError


def sign_webhook(secret: bytes, timestamp: int, body: bytes) -> str:
    """hex HMAC-SHA256 of b"<timestamp>." + body"""
    raise NotImplementedError


def verify_webhook(secret: bytes, signature: str, timestamp: int, body: bytes, now: int, tolerance: int = 300) -> bool:
    """Constant-time compare; reject if |now - timestamp| > tolerance."""
    raise NotImplementedError
