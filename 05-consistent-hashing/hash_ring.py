"""Consistent hash ring with virtual nodes.

Hash function: use md5/sha1 from hashlib, take an int from the digest.
Store sorted vnode hashes in a list and use bisect for clockwise lookup."""
import bisect
import hashlib


def h(s: str) -> int:
    return int.from_bytes(hashlib.md5(s.encode()).digest()[:8], "big")


class HashRing:
    def __init__(self, nodes: list[str] | None = None, vnodes: int = 100):
        self.vnodes = vnodes
        self._ring: list[int] = []        # sorted vnode hashes
        self._owner: dict[int, str] = {}  # vnode hash -> physical node
        for n in nodes or []:
            self.add_node(n)

    def add_node(self, node: str) -> None:
        raise NotImplementedError

    def remove_node(self, node: str) -> None:
        raise NotImplementedError

    def get_node(self, key: str) -> str:
        """First vnode clockwise from h(key), wrapping around."""
        raise NotImplementedError

    def get_nodes(self, key: str, n: int) -> list[str]:
        """First n DISTINCT physical nodes clockwise from h(key)."""
        raise NotImplementedError
