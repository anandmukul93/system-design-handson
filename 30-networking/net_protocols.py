"""Networking building blocks."""
import math
import struct


def encode_varint(n: int) -> bytes:
    """Protobuf base-128 varint: 7 bits per byte, least significant group first, MSB = continuation."""
    raise NotImplementedError


def decode_varint(data: bytes, pos: int = 0) -> tuple[int, int]:
    """Return (value, position after the varint)."""
    raise NotImplementedError


def grpc_frame(message: bytes, compressed: bool = False) -> bytes:
    """1 byte compressed flag + 4 byte big-endian length + message."""
    raise NotImplementedError


def parse_grpc_frames(buf: bytes) -> list[bytes]:
    raise NotImplementedError


class ResolutionError(Exception):
    pass


def resolve(name: str, records: dict[str, list[tuple[str, str]]], max_depth: int = 8) -> list[str]:
    """records: name -> [("A", ip) | ("CNAME", other_name)]. Follow CNAMEs, return the A records.
    Raise ResolutionError for unknown names or chains deeper than max_depth (loops)."""
    raise NotImplementedError


class DnsCache:
    def __init__(self, clock):
        self.clock = clock
        self.entries: dict[str, tuple[list[str], float]] = {}

    def put(self, name: str, ips: list[str], ttl: float) -> None:
        raise NotImplementedError

    def get(self, name: str) -> list[str] | None:
        raise NotImplementedError


def tcp_window_throughput_bps(window_bytes: int, rtt_s: float) -> float:
    """Max throughput of one flow limited by the receive window."""
    raise NotImplementedError


def mathis_throughput_bps(mss_bytes: int, rtt_s: float, loss_rate: float) -> float:
    """Mathis et al.: (MSS / RTT) * (1.22 / sqrt(p)), in bits per second."""
    raise NotImplementedError
