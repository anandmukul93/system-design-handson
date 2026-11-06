"""In-memory model of room_type_inventory with optimistic locking.

Each (hotel, room_type, date) row has total_inventory, total_reserved and version.
reserve() must be safe when called from many threads: read the rows, check
availability, then compare-and-swap each row on version (retry on conflict).
Use the provided _cas helper; it is the only place that takes the lock, like a DB
`UPDATE ... WHERE version = ?`."""
import threading
from dataclasses import dataclass
from datetime import date, timedelta


@dataclass
class Row:
    total_inventory: int
    total_reserved: int = 0
    version: int = 0


class Inventory:
    def __init__(self, overbook_ratio: float = 1.0):
        self.rows: dict[tuple, Row] = {}
        self.reservations: dict[str, dict] = {}
        self.overbook_ratio = overbook_ratio
        self._lock = threading.Lock()
        self.conflicts = 0

    def add(self, hotel: str, room_type: str, start: date, days: int, total: int) -> None:
        for i in range(days):
            self.rows[(hotel, room_type, start + timedelta(days=i))] = Row(total)

    def _cas(self, key, expected_version: int, new_reserved: int) -> bool:
        with self._lock:
            row = self.rows[key]
            if row.version != expected_version:
                return False
            row.total_reserved, row.version = new_reserved, row.version + 1
            return True

    def reserve(self, reservation_id: str, hotel: str, room_type: str,
                check_in: date, check_out: date, rooms: int = 1) -> bool:
        """Idempotent on reservation_id (same id -> same result, no double count).
        Nights are check_in .. check_out - 1. Respect overbook_ratio.
        Return True if booked, False if sold out."""
        raise NotImplementedError
