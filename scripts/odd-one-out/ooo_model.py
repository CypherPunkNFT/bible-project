"""Odd one out: the shapes the build passes around (design sections 4, 5.2 and 6)."""
from dataclasses import dataclass, field

KINDS = ("person", "place", "book")
DIFFICULTIES = ("easy", "medium", "hard")


@dataclass(frozen=True)
class Prop:
    """One yes/no property of an item. Many-valued facts (era, tribe) become one Prop per value."""

    id: str
    kind: str
    tier: int
    use: str = "rival"  # "rule": may be the headline reason (and is checked); "rival": only checked
    anchor: str | None = None  # "related to X": not checked when X is one of the four (design 6.1 step 5)
    lacks_only: bool = False  # only "three have it, one lacks it" counts (first letters, design 6.4)
    only: str = ""  # the "also true" phrase when the odd item alone has it
    lacks: str = ""  # the "also true" phrase when the odd item alone lacks it


@dataclass
class Item:
    """A person, place or book that may appear in a set, with its fact sheet."""

    id: str
    kind: str
    name: str  # the bare name a player knows ("James")
    label: str  # what the button says ("James, son of Zebedee")
    brief: str
    href: str
    ref: int  # a verse id (BBCCCVVV) for the reveal's line
    fame: dict[str, bool] = field(default_factory=dict)  # difficulty -> in that difficulty's pool
    aliases: frozenset[str] = frozenset()
    values: dict[str, bool | None] = field(default_factory=dict)  # absent = False; None = unknown
    proof: dict[str, int] = field(default_factory=dict)  # rule id -> the verse that shows it for this item

    def value(self, prop_id: str) -> bool | None:
        return self.values.get(prop_id, False)


@dataclass
class Rule:
    """A headline reason from rules.json."""

    id: str
    kind: str
    tier: int
    easy: bool
    members: str
    odd: str
    odd_only: str = ""
    others: str = ""
    key_ref: tuple[int, int] | None = None
    anchor: str | None = None

    def polarities(self) -> list[str]:
        return ["members-share", "odd-only"] if self.odd_only and self.others else ["members-share"]

    def allowed(self, difficulty: str) -> bool:
        if difficulty == "easy":
            return self.tier == 1 or self.easy
        if difficulty == "hard":
            return self.tier == 2
        return True


@dataclass
class Candidate:
    """Four items, one odd, one rule: what the checker judges and the build ships."""

    kind: str
    difficulty: str
    items: list[str]
    odd: str
    rule: str
    polarity: str
    labels: dict[str, str] = field(default_factory=dict)  # per-set button labels (seed sets only)
    also: list[str] = field(default_factory=list)
    seed: bool = False
