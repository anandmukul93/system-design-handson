from datetime import date, datetime, timedelta


def severity(users_affected_pct: float, data_loss: bool = False, revenue_impact: bool = False) -> str:
    """SEV1: data loss or >= 25% users; SEV2: >= 5% users or revenue impact; else SEV3."""
    raise NotImplementedError


def incident_metrics(t: dict[str, datetime]) -> dict[str, float]:
    """t has started, detected, acknowledged, mitigated, resolved. Return minutes:
    {"mttd": detected-started, "mtta": acknowledged-detected, "mttm": mitigated-started, "mttr": resolved-started}"""
    raise NotImplementedError


def rotation(engineers: list[str], start: date, weeks: int, overrides: dict[date, str] | None = None) -> list[tuple[date, str, str]]:
    """Weekly shifts from `start`: (week_start, primary, secondary) with primary = engineers[i % n] and
    secondary = engineers[(i + 1) % n]. An override for a week_start replaces the primary; if the override
    person is also that week's secondary, the secondary becomes the scheduled primary."""
    raise NotImplementedError


SECTIONS = ["Summary", "Impact", "Timeline", "Root causes", "What went well", "What went wrong", "Action items"]


def postmortem_skeleton(title: str, sev: str, timeline: list[tuple[datetime, str]]) -> str:
    """Markdown: '# Postmortem: <title> (<sev>)' then '## <section>' for each of SECTIONS in order; the
    Timeline section lists '- HH:MM <event>' lines sorted by time."""
    raise NotImplementedError


BLAME_PATTERNS = ["human error", "should have known", "careless", "fault of", "blame"]


def blame_phrases(text: str) -> list[str]:
    """Blame patterns found in text (case-insensitive), in BLAME_PATTERNS order."""
    raise NotImplementedError
