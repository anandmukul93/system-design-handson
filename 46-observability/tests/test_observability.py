import json

import pytest
from observability import burn_rate, child_traceparent, error_budget, json_log, parse_traceparent, should_page

TP = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"


def test_traceparent():
    assert parse_traceparent(TP) == {"version": "00", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
                                     "span_id": "00f067aa0ba902b7", "sampled": True}
    assert parse_traceparent("00-xyz-00f067aa0ba902b7-01") is None
    assert parse_traceparent("00-" + "0" * 32 + "-00f067aa0ba902b7-01") is None
    child = child_traceparent(TP, "b7ad6b7169203331")
    assert child == "00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01"


def test_json_log():
    line = json_log("info", "login", clock=lambda: 1.5, user="u1", password="hunter2")
    assert json.loads(line) == {"ts": 1.5, "level": "info", "msg": "login", "user": "u1", "password": "***"}
    assert list(json.loads(line)) == sorted(json.loads(line))


def test_error_budget():
    assert error_budget(99.9, 1_000_000, 400) == {"allowed_bad": 1000, "remaining": 600, "consumed_pct": 40.0}


def test_burn_rate_alert():
    assert burn_rate(10, 1000, 99.9) == pytest.approx(10)
    assert burn_rate(0, 0, 99.9) == 0
    assert should_page((20, 1000), (150, 10_000), 99.9)        # 20x and 15x
    assert not should_page((20, 1000), (50, 10_000), 99.9)     # blip: long window only 5x
