import itertools


class Reconciler:
    """pods: pod_id -> phase ('Running' | 'Pending' | 'Terminating' | 'Failed')."""

    def __init__(self, desired: int):
        self.desired = desired
        self.pods: dict[str, str] = {}
        self._ids = itertools.count(1)

    def reconcile(self) -> list[tuple[str, str]]:
        """Return the actions taken as ('create', id) / ('delete', id) and apply them:
        - remove Failed pods (action 'delete')
        - count Running + Pending as active (Terminating doesn't count)
        - create pods named 'pod-N' (phase Pending) until active == desired
        - if too many, mark the newest active pods Terminating (action 'delete')"""
        raise NotImplementedError


def endpoints(pods: dict[str, dict]) -> list[str]:
    """pods: name -> {"live": bool, "ready": bool}. Only live AND ready pods get traffic. Sorted."""
    raise NotImplementedError


def crashloop_delay(restarts: int) -> int:
    """10s, 20s, 40s ... capped at 300s. restarts=0 -> 0 (first start)."""
    raise NotImplementedError


class ServiceRegistry:
    def __init__(self, ttl: float):
        self.ttl = ttl
        self.instances: dict[str, dict[str, float]] = {}   # service -> {addr: last_heartbeat}

    def register(self, service: str, addr: str, now: float) -> None:
        raise NotImplementedError

    def heartbeat(self, service: str, addr: str, now: float) -> None:
        raise NotImplementedError

    def lookup(self, service: str, now: float) -> list[str]:
        """Healthy addrs (heartbeat within ttl), sorted; expired ones are removed."""
        raise NotImplementedError
