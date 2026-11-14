import hashlib
import json
import re


def parse(v: str) -> tuple[int, int, int, tuple]:
    """'1.2.3-rc.1' -> (1, 2, 3, ('rc', 1)); release -> (1, 2, 3, ()). Numeric pre-release parts are ints."""
    raise NotImplementedError


def compare(a: str, b: str) -> int:
    """-1, 0, 1. A pre-release sorts before its release; compare pre-release parts left to right."""
    raise NotImplementedError


def bump(v: str, part: str) -> str:
    """part in major/minor/patch; lower parts reset to 0; pre-release dropped."""
    raise NotImplementedError


def satisfies(v: str, rng: str) -> bool:
    """Support '*' (anything but pre-releases), '1.2.3' (exact), '^1.2.3', '~1.2.3', and space-separated comparators like '>=1.0.0 <2.0.0'.
    ^0.y.z means >=0.y.z <0.(y+1).0. Pre-releases only match exact versions."""
    raise NotImplementedError


class ResolutionError(Exception):
    pass


def resolve(root: dict[str, str], registry: dict[str, dict[str, dict[str, str]]]) -> dict[str, str]:
    """registry: package -> version -> {dependency: range}. Pick the highest version of each package that
    satisfies every range on it, backtracking when a choice leads to a conflict. Raise ResolutionError."""
    raise NotImplementedError


def cache_key(step: str, inputs: dict[str, str], env: dict[str, str] | None = None) -> str:
    """sha256 hex over the step name, inputs and env, independent of dict ordering."""
    raise NotImplementedError
