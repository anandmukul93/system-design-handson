"""Storage-agnostic core so it can be unit tested. Wire it into FastAPI in app.py."""
from typing import Callable

import base62


class Shortener:
    def __init__(self, id_gen: Callable[[], int]):
        self.id_gen = id_gen
        self.by_code: dict[str, str] = {}
        self.by_url: dict[str, str] = {}

    def shorten(self, long_url: str) -> str:
        """Return existing code if long_url was shortened before, else allocate a new one."""
        raise NotImplementedError

    def resolve(self, code: str) -> str | None:
        raise NotImplementedError
