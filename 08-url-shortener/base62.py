ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def encode(n: int) -> str:
    """0 -> '0', 61 -> 'Z', 62 -> '10'. Matches the chapter: 11157 -> '2TX'."""
    raise NotImplementedError


def decode(s: str) -> int:
    raise NotImplementedError
