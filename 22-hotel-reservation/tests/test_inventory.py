from concurrent.futures import ThreadPoolExecutor
from datetime import date

from inventory import Inventory

D = date(2026, 12, 24)


def test_basic_and_idempotent():
    inv = Inventory()
    inv.add("h", "king", D, 3, total=2)
    assert inv.reserve("r1", "h", "king", D, date(2026, 12, 26))
    assert inv.reserve("r1", "h", "king", D, date(2026, 12, 26))  # retry of same request
    assert inv.rows[("h", "king", D)].total_reserved == 1
    assert inv.rows[("h", "king", date(2026, 12, 26))].total_reserved == 0  # checkout night not booked


def test_sold_out():
    inv = Inventory()
    inv.add("h", "king", D, 1, total=1)
    assert inv.reserve("a", "h", "king", D, date(2026, 12, 25))
    assert not inv.reserve("b", "h", "king", D, date(2026, 12, 25))


def test_overbooking_ratio():
    inv = Inventory(overbook_ratio=1.1)
    inv.add("h", "q", D, 1, total=10)
    results = [inv.reserve(f"r{i}", "h", "q", D, date(2026, 12, 25)) for i in range(12)]
    assert sum(results) == 11


def test_no_double_booking_under_concurrency():
    inv = Inventory()
    inv.add("h", "king", D, 2, total=5)
    with ThreadPoolExecutor(32) as pool:
        results = list(pool.map(lambda i: inv.reserve(f"r{i}", "h", "king", D, date(2026, 12, 26)), range(200)))
    assert sum(results) == 5
    assert all(r.total_reserved == 5 for r in inv.rows.values())
