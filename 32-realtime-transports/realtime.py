import base64
import hashlib
import struct
import threading

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def ws_accept_key(sec_websocket_key: str) -> str:
    """base64(sha1(key + GUID))"""
    raise NotImplementedError


def ws_encode_frame(payload: bytes, opcode: int = 1, mask: bytes | None = None) -> bytes:
    """FIN=1. Lengths < 126 inline, < 65536 use the 16-bit extended length (126).
    If mask is given (4 bytes) set the mask bit and XOR the payload."""
    raise NotImplementedError


def ws_decode_frame(data: bytes) -> tuple[int, bytes]:
    """Return (opcode, unmasked payload)."""
    raise NotImplementedError


def format_sse(data: str, event: str | None = None, id: str | None = None) -> str:
    """'id: ..\n' 'event: ..\n' then one 'data: ' line per line of data, then a blank line."""
    raise NotImplementedError


class SSEParser:
    """Feed arbitrary chunks; returns completed events as {"event", "data", "id"}.
    event defaults to "message"; multiple data lines join with "\n"; lines starting with ':' are comments;
    a blank line dispatches the event, but only if some data was collected."""

    def __init__(self):
        self.buf = ""

    def feed(self, chunk: str) -> list[dict]:
        raise NotImplementedError


class LongPollBroker:
    def __init__(self):
        self.messages: list[str] = []
        self.cond = threading.Condition()

    def publish(self, msg: str) -> int:
        """Return the new cursor (number of messages so far)."""
        raise NotImplementedError

    def poll(self, cursor: int) -> tuple[list[str], int]:
        """Messages after cursor and the new cursor, without blocking."""
        raise NotImplementedError

    def wait(self, cursor: int, timeout: float) -> tuple[list[str], int]:
        """Block until there is something after cursor or timeout."""
        raise NotImplementedError
