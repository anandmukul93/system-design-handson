"""Geohash + distance helpers. Base32 alphabet below (no a, i, l, o)."""
import math

BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
EARTH_RADIUS_M = 6_371_000


def haversine_m(lat1, lon1, lat2, lon2) -> float:
    raise NotImplementedError


def encode(lat: float, lon: float, precision: int = 6) -> str:
    """Interleave bits starting with LONGITUDE, 5 bits per base32 char."""
    raise NotImplementedError


def decode(gh: str) -> tuple[float, float]:
    """Return the centre (lat, lon) of the cell."""
    raise NotImplementedError


def neighbors(gh: str) -> list[str]:
    """The 8 surrounding cells at the same precision (hint: decode centre, step by cell size, encode)."""
    raise NotImplementedError


def precision_for_radius(radius_m: float) -> int:
    """Use the chapter table: radius <= 0.5km -> 6, <= 2km -> 5, <= 20km -> 4, otherwise 3."""
    raise NotImplementedError
