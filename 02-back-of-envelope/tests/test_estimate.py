import pytest
from estimate import (GB, downtime_per_year_seconds, human_bytes, peak_qps, qps,
                      servers_needed, storage_bytes)


def test_twitter_qps():
    # 150M DAU, 2 tweets/day -> ~3500 QPS
    assert qps(150_000_000, 2) == pytest.approx(3472.2, rel=1e-3)
    assert peak_qps(3472.2) == pytest.approx(6944.4, rel=1e-3)


def test_storage():
    # 1M items/day * 1KB * 1 year = 365 GB
    assert storage_bytes(1_000_000, 1000, 1) == 365 * GB


def test_servers_round_up():
    assert servers_needed(10_001, 1000) == 11


def test_downtime():
    assert downtime_per_year_seconds(99.9) == pytest.approx(31_536, rel=1e-3)


def test_human_bytes():
    assert human_bytes(1_500_000_000) == "1.5 GB"
    assert human_bytes(2_000) == "2.0 KB"
