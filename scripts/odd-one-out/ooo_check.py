"""Odd one out: the uniqueness check every candidate set must pass (design section 6).

A set is rejected when any property, other than the intended rule, singles out an item that is not the odd one.
Unknown facts count against the set, never for it (6.2): an unknown can never be what makes an item stand out, and
an unknown on another item is taken to be whatever would let the property single that item out.
"""
import re
from dataclasses import dataclass, field

from ooo_model import Item, Prop, Rule

LABEL_WORDS = ("mount", "sea", "river", "valley", "wilderness")
# Words too common to give a reason away (design 6.4, giveaway check).
STOP_WORDS = {
    "a", "after", "also", "an", "and", "are", "as", "by", "did", "during", "each", "from", "had", "has", "have", "her",
    "his", "in", "is", "just", "more", "never", "no", "not", "of", "one", "only", "or", "than", "that", "the", "their",
    "them", "to", "too", "was", "were", "who", "with",
}
SYNONYMS = {"mount": "mountain", "brook": "river", "lake": "sea"}
MAX_EXTRA_REASONS = {"easy": None, "medium": 1, "hard": 0}


@dataclass
class Verdict:
    ok: bool
    reason: str = ""
    # other properties singling out the odd item: (property, the odd item's value, all four values known)
    also: list[tuple[Prop, bool, bool]] = field(default_factory=list)


def words(text: str) -> set[str]:
    """Lower-case content words, with a plural 's' dropped so 'kings' meets 'king'."""
    out = set()
    for word in re.findall(r"[a-z]+", text.lower()):
        if word in STOP_WORDS:
            continue
        out.add(word[:-1] if len(word) > 3 and word.endswith("s") else word)
    return out


def first_letter(label: str) -> str:
    match = re.search(r"[A-Za-z]", label)
    return match.group(0).upper() if match else ""


def singles_out(values: dict[str, bool | None], target: str, prop: Prop) -> bool:
    """True when the property picks out `target` alone among the four (6.1 step 2, 6.2)."""
    mine = values[target]
    if mine is None or (prop.lacks_only and mine):
        return False
    return all(theirs is None or theirs != mine for other, theirs in values.items() if other != target)


def label_props(items: list[Item], shown: dict[str, str], book_words: set[str]) -> list[tuple[Prop, dict]]:
    """Surface properties of the labels actually shown (design 5.2 and 6.4)."""
    kind = items[0].kind
    out: list[tuple[Prop, dict]] = []
    for letter in sorted({first_letter(shown[item.id]) for item in items}):
        values = {item.id: first_letter(shown[item.id]) == letter for item in items}
        out.append((Prop(f"label:first:{letter}", kind, 1, lacks_only=True), values))
    out.append((Prop("label:qualified", kind, 1), {item.id: shown[item.id] != item.name for item in items}))
    if kind == "person":
        values = {item.id: re.split(r"[ ,]", shown[item.id])[0] in book_words for item in items}
        out.append((Prop("label:book-name", kind, 1), values))
    if kind == "place":
        for word in LABEL_WORDS:
            values = {item.id: word in re.findall(r"[a-z]+", shown[item.id].lower()) for item in items}
            out.append((Prop(f"label:word:{word}", kind, 1), values))
    if kind == "book":
        out.append((Prop("label:numbered", kind, 1), {item.id: shown[item.id][:1].isdigit() for item in items}))
    return out


def fact_props(items: list[Item], props: dict[str, Prop]) -> list[tuple[Prop, dict]]:
    """Every fact property that is true or unknown for at least one of the four; the rest are false for all."""
    ids = sorted({prop_id for item in items for prop_id in item.values})
    return [(props[prop_id], {item.id: item.value(prop_id) for item in items}) for prop_id in ids]


def bare(name: str) -> str:
    """A name without a leading 'Mount', so Carmel the town and Mount Carmel count as the same name."""
    return re.sub(r"^mount (of )?", "", name.lower())


def name_clash(items: list[Item], shown: dict[str, str]) -> str:
    """Two items a player could take for the same one (design 6.4: same names, alias collisions)."""
    for i, a in enumerate(items):
        for b in items[i + 1:]:
            if bare(a.name) == bare(b.name) or bare(shown[a.id]) == bare(shown[b.id]):
                return f"{a.id} and {b.id} share the name {a.name}"
            if a.name in b.aliases or b.name in a.aliases:
                return f"{a.id} and {b.id}: one is the other's other name"
    return ""


def giveaway(items: list[Item], shown: dict[str, str], rule: Rule, odd: str) -> str:
    """A label that contains a word of the rule's own phrases gives the answer away (design 6.4)."""
    rule_words = words(" ".join([rule.members, rule.odd, rule.odd_only, rule.others]))
    for item in items:
        mine = words(shown[item.id])
        if item.id == odd:  # "Mount Carmel" may not be the only mountain, nor "Brook of Egypt" the only river
            mine |= {SYNONYMS[word] for word in mine if word in SYNONYMS}
        common = mine & rule_words
        if common:
            return f"label {shown[item.id]!r} gives away {rule.id} ({', '.join(sorted(common))})"
    return ""


def intended_split(items: list[Item], odd: str, rule: Rule, polarity: str) -> str:
    """The rule must be known for all four and split them three and one as intended (6.1 step 1)."""
    share = polarity == "members-share"
    for item in items:
        value = item.value(rule.id)
        expected = (not share) if item.id == odd else share
        if value is None:
            return f"{rule.id} is unknown for {item.id}"
        if value != expected:
            return f"{rule.id} is {value} for {item.id}, expected {expected}"
    return ""


def hidden_rival(values: dict[str, bool | None], odd: str) -> str:
    """An item whose fact is unknown while the other three agree could be the odd one out for that reason (Cornelius
    beside three known Jews, Barabbas beside three followers), so it is a possible second answer."""
    unknown = [item for item, value in values.items() if value is None]
    known = {value for value in values.values() if value is not None}
    return unknown[0] if len(unknown) == 1 and len(known) == 1 and unknown[0] != odd else ""


def check_set(items: list[Item], odd: str, rule: Rule, polarity: str, difficulty: str, props: dict[str, Prop],
              book_words: set[str], labels: dict[str, str] | None = None) -> Verdict:
    """Judge one candidate. `labels` overrides what the buttons say (seed sets, design 6.4)."""
    shown = {item.id: (labels or {}).get(item.id, item.label) for item in items}
    problem = intended_split(items, odd, rule, polarity) or name_clash(items, shown) or giveaway(items, shown, rule, odd)
    if problem:
        return Verdict(False, problem)
    ids = {item.id for item in items}
    if rule.anchor in ids:
        return Verdict(False, f"{rule.id} is about {rule.anchor}, who is one of the four")
    also: list[tuple[Prop, bool, bool]] = []
    for prop, values in fact_props(items, props) + label_props(items, shown, book_words):
        if prop.id == rule.id or (prop.anchor and prop.anchor in ids):
            continue
        hidden = hidden_rival(values, odd) if prop.use == "rule" or prop.id == "foreign" else ""
        if hidden:
            return Verdict(False, f"possible rival answer: {prop.id} is unknown for {hidden} alone")
        for item in items:
            if singles_out(values, item.id, prop):
                if item.id != odd:
                    return Verdict(False, f"rival answer: {prop.id} singles out {item.id}")
                also.append((prop, bool(values[item.id]), None not in values.values()))
    # Another reason for the same answer keeps the answer unique; Medium and Hard limit how many (design 6.3). Only
    # reasons resting on known facts count here: one that rests on an unknown is not a reason a player can give.
    limit = MAX_EXTRA_REASONS[difficulty]
    extra = [entry for entry in also if entry[0].tier <= 2 and entry[2]]
    if limit is not None and len(extra) > limit:
        return Verdict(False, f"{len(extra)} other reasons single out the odd one ({difficulty} allows {limit})")
    return Verdict(True, also=also)


MAX_ALSO = 3


def also_phrases(also: list[tuple[Prop, bool, bool]]) -> list[str]:
    """The 'also true' lines a player sees (design 5.5): facts known for all four, rules before rivals, never label
    surface properties, at most three."""
    shown = [(prop, has_it) for prop, has_it, certain in also
             if certain and prop.tier <= 2 and not prop.id.startswith("label:")]
    out: list[str] = []
    for prop, has_it in sorted(shown, key=lambda entry: entry[0].use != "rule"):
        phrase = prop.only if has_it else prop.lacks
        if phrase and phrase not in out:
            out.append(phrase)
    return out[:MAX_ALSO]
