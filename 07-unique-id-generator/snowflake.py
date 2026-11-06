import threading
import time

EPOCH_MS = 1_288_834_974_657  # Twitter's epoch; pick your own if you like
DC_BITS, MACHINE_BITS, SEQ_BITS = 5, 5, 12
MAX_SEQ = (1 << SEQ_BITS) - 1


class ClockMovedBackwards(Exception):
    pass


class Snowflake:
    def __init__(self, datacenter_id: int, machine_id: int, clock=lambda: int(time.time() * 1000)):
        assert 0 <= datacenter_id < 32 and 0 <= machine_id < 32
        self.dc, self.machine, self.clock = datacenter_id, machine_id, clock
        self.last_ms = -1
        self.seq = 0
        self.lock = threading.Lock()

    def next_id(self) -> int:
        """Thread-safe. If seq overflows within one ms, spin until the next ms.
        If the clock goes backwards, raise ClockMovedBackwards."""
        raise NotImplementedError


def parse(snowflake_id: int) -> dict:
    """Return {"timestamp_ms": ..., "datacenter": ..., "machine": ..., "sequence": ...}.
    timestamp_ms is the absolute unix ms (add EPOCH_MS back)."""
    raise NotImplementedError
