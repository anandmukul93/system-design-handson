import re


def plan(desired: dict[str, dict], state: dict[str, dict], force_new: set[str] = frozenset()) -> list[tuple[str, str]]:
    """desired/state: address -> attributes. Return actions sorted by address:
    ('create', addr) not in state; ('delete', addr) not in desired;
    ('replace', addr) if any changed attribute is in force_new; ('update', addr) other changes.
    Unchanged resources produce no action."""
    raise NotImplementedError


class CycleError(Exception):
    pass


def apply_order(resources: dict[str, list[str]]) -> list[str]:
    """resources: address -> addresses it depends on. Dependencies first; ties alphabetical.
    Raise CycleError on cycles."""
    raise NotImplementedError


def destroy_order(resources: dict[str, list[str]]) -> list[str]:
    """Reverse of apply_order."""
    raise NotImplementedError


def render(template: str, values: dict) -> str:
    """Replace {{ .Values.a.b }} with values["a"]["b"] and {{ .Values.x | default "y" }} with the value or y.
    A missing value without a default raises KeyError."""
    raise NotImplementedError
