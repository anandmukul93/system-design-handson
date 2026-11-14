import math


class TargetTrackingScaler:
    def __init__(self, target: float, min_replicas: int, max_replicas: int, scale_in_cooldown: float):
        self.target, self.min, self.max, self.cooldown = target, min_replicas, max_replicas, scale_in_cooldown
        self.last_change = -math.inf

    def desired(self, current: int, metric: float, now: float) -> int:
        """ceil(current * metric / target) clamped to [min, max].
        Scale out immediately. Scale in only if now - last_change >= cooldown; otherwise keep current.
        Update last_change whenever the replica count changes."""
        raise NotImplementedError


class FunctionPool:
    """Each instance handles one request at a time for `duration` seconds and is reclaimed after
    `idle_timeout` seconds without work."""

    def __init__(self, duration: float, idle_timeout: float):
        self.duration, self.idle_timeout = duration, idle_timeout
        self.instances: list[dict] = []   # {"busy_until", "last_used"}
        self.cold = 0
        self.warm = 0

    def invoke(self, now: float) -> str:
        """Drop instances idle longer than idle_timeout, reuse a free one ('warm') or start one ('cold')."""
        raise NotImplementedError


def monthly_cost(requests: int, gb_seconds_per_request: float, price_per_gb_s: float,
                 price_per_million_requests: float, vm_monthly: float, vms_needed: int) -> dict:
    """{"serverless": ..., "vm": ..., "cheaper": "serverless" | "vm"} (round costs to 2 dp)."""
    raise NotImplementedError
