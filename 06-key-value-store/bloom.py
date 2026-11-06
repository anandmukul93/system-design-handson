import hashlib
import math


class BloomFilter:
    def __init__(self, expected_items: int, fp_rate: float = 0.01):
        # m = -n ln p / (ln 2)^2 ; k = m/n ln 2
        self.m = max(8, int(-expected_items * math.log(fp_rate) / (math.log(2) ** 2)))
        self.k = max(1, int(self.m / expected_items * math.log(2)))
        self.bits = bytearray((self.m + 7) // 8)

    def _positions(self, key: str):
        raise NotImplementedError  # hint: double hashing h1 + i*h2

    def add(self, key: str) -> None:
        raise NotImplementedError

    def might_contain(self, key: str) -> bool:
        raise NotImplementedError
