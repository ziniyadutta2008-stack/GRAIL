"""Generic state-transition guard used by every governance record lifecycle."""

from collections.abc import Mapping
from enum import StrEnum

from grail.errors import InvalidTransition


def assert_transition[S: StrEnum](
    allowed: Mapping[S, frozenset[S]], current: S, target: S, *, reason: str
) -> None:
    """Raise unless ``current -> target`` is an allowed transition with a stated reason.

    Every transition must record actor, timestamp, reason and request ID; the guard
    enforces the reason here so callers cannot omit it.
    """
    if not reason.strip():
        raise InvalidTransition("A transition reason is required.")
    if target not in allowed.get(current, frozenset()):
        raise InvalidTransition(f"Cannot move from {current} to {target}.")
