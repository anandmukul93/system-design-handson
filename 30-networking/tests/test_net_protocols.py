import pytest
from net_protocols import (DnsCache, ResolutionError, decode_varint, encode_varint, grpc_frame,
                           mathis_throughput_bps, parse_grpc_frames, resolve, tcp_window_throughput_bps)


def test_varint():
    assert encode_varint(0) == b"\x00"
    assert encode_varint(1) == b"\x01"
    assert encode_varint(300) == b"\xac\x02"
    for n in [0, 127, 128, 16383, 16384, 2**40]:
        assert decode_varint(encode_varint(n)) == (n, len(encode_varint(n)))


def test_grpc_frames():
    buf = grpc_frame(b"hello") + grpc_frame(b"")
    assert buf[:5] == b"\x00\x00\x00\x00\x05"
    assert parse_grpc_frames(buf) == [b"hello", b""]


def test_resolve_cname_chain_and_loop():
    recs = {"www.shop.com": [("CNAME", "shop.cdn.net")], "shop.cdn.net": [("A", "1.2.3.4"), ("A", "1.2.3.5")],
            "a.com": [("CNAME", "b.com")], "b.com": [("CNAME", "a.com")]}
    assert resolve("www.shop.com", recs) == ["1.2.3.4", "1.2.3.5"]
    with pytest.raises(ResolutionError):
        resolve("a.com", recs)
    with pytest.raises(ResolutionError):
        resolve("nope.com", recs)


def test_dns_cache_ttl():
    t = [0.0]
    c = DnsCache(lambda: t[0])
    c.put("x.com", ["9.9.9.9"], ttl=30)
    assert c.get("x.com") == ["9.9.9.9"]
    t[0] = 31
    assert c.get("x.com") is None


def test_throughput():
    assert tcp_window_throughput_bps(65535, 0.1) == pytest.approx(5_242_800)
    assert mathis_throughput_bps(1460, 0.1, 0.01) == pytest.approx(1460 * 8 / 0.1 * 12.2, rel=1e-6)
