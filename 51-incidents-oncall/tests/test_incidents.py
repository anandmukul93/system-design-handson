from datetime import date, datetime

from incidents import SECTIONS, blame_phrases, incident_metrics, postmortem_skeleton, rotation, severity


def test_severity():
    assert severity(30) == "SEV1"
    assert severity(1, data_loss=True) == "SEV1"
    assert severity(6) == "SEV2"
    assert severity(1, revenue_impact=True) == "SEV2"
    assert severity(1) == "SEV3"


def test_metrics():
    d = lambda h, m: datetime(2026, 11, 14, h, m)
    t = {"started": d(10, 0), "detected": d(10, 7), "acknowledged": d(10, 10), "mitigated": d(10, 30), "resolved": d(12, 0)}
    assert incident_metrics(t) == {"mttd": 7, "mtta": 3, "mttm": 30, "mttr": 120}


def test_rotation():
    r = rotation(["ana", "bo", "cy"], date(2026, 11, 16), 4, {date(2026, 11, 23): "cy"})
    assert r == [(date(2026, 11, 16), "ana", "bo"),
                 (date(2026, 11, 23), "cy", "bo"),
                 (date(2026, 11, 30), "cy", "ana"),
                 (date(2026, 12, 7), "ana", "bo")]
    r2 = rotation(["ana", "bo"], date(2026, 11, 16), 1, {date(2026, 11, 16): "bo"})
    assert r2 == [(date(2026, 11, 16), "bo", "ana")]


def test_postmortem():
    md = postmortem_skeleton("Checkout down", "SEV1", [(datetime(2026, 1, 1, 10, 5), "rollback"),
                                                       (datetime(2026, 1, 1, 9, 58), "alert fired")])
    assert md.startswith("# Postmortem: Checkout down (SEV1)")
    positions = [md.index(f"## {s}") for s in SECTIONS]
    assert positions == sorted(positions)
    assert md.index("- 09:58 alert fired") < md.index("- 10:05 rollback")


def test_blame():
    assert blame_phrases("Root cause: human error. Bob was careless.") == ["human error", "careless"]
    assert blame_phrases("The deploy tool allowed an unreviewed change.") == []
