import threading

import pytest
from realtime import LongPollBroker, SSEParser, format_sse, ws_accept_key, ws_decode_frame, ws_encode_frame


def test_accept_key_rfc6455():
    assert ws_accept_key("dGhlIHNhbXBsZSBub25jZQ==") == "s3pPLMBiTxaQ9kYGzzhZRbK+xOo="


def test_ws_frames():
    assert ws_encode_frame(b"Hi") == b"\x81\x02Hi"
    masked = ws_encode_frame(b"Hello", mask=b"\x37\xfa\x21\x3d")
    assert masked == bytes([0x81, 0x85, 0x37, 0xfa, 0x21, 0x3d, 0x7f, 0x9f, 0x4d, 0x51, 0x58])
    assert ws_decode_frame(masked) == (1, b"Hello")
    big = b"x" * 300
    assert ws_decode_frame(ws_encode_frame(big, opcode=2)) == (2, big)


def test_sse_roundtrip_in_chunks():
    stream = format_sse("hello", id="1") + ": keepalive\n\n" + format_sse("a\nb", event="update", id="2")
    p = SSEParser()
    events = []
    for i in range(0, len(stream), 7):
        events += p.feed(stream[i:i + 7])
    assert events == [{"event": "message", "data": "hello", "id": "1"},
                      {"event": "update", "data": "a\nb", "id": "2"}]


def test_long_poll_cursor():
    b = LongPollBroker()
    b.publish("a"); c = b.publish("b")
    assert c == 2
    assert b.poll(0) == (["a", "b"], 2)
    assert b.poll(2) == ([], 2)


@pytest.mark.needs_threads
def test_long_poll_wait_wakes_up():
    b = LongPollBroker()
    threading.Timer(0.05, lambda: b.publish("late")).start()
    assert b.wait(0, timeout=2) == (["late"], 1)
    assert b.wait(1, timeout=0.05) == ([], 1)
