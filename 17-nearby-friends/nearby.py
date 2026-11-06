"""Receiving-side logic: keep friends' last positions, emit only nearby ones."""
import math

MILE_M = 1609.344


def haversine_m(lat1, lon1, lat2, lon2) -> float:
    raise NotImplementedError


class LocationCache:
    """user -> (lat, lon, ts). Entries older than ttl are treated as missing."""

    def __init__(self, ttl: float = 600):
        self.ttl = ttl
        self.data: dict[str, tuple[float, float, float]] = {}

    def put(self, user: str, lat: float, lon: float, ts: float) -> None:
        raise NotImplementedError

    def get(self, user: str, now: float):
        raise NotImplementedError


class NearbyFilter:
    def __init__(self, me: str, radius_miles: float = 5.0):
        self.me, self.radius_m = me, radius_miles * MILE_M
        self.my_pos: tuple[float, float] | None = None

    def update_me(self, lat: float, lon: float) -> None:
        self.my_pos = (lat, lon)

    def on_friend_update(self, friend: str, lat: float, lon: float) -> dict | None:
        """Return {"friend", "distance_m"} if within radius, else None."""
        raise NotImplementedError
