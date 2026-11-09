"""Biblical baby names: people -> names -> originals -> meanings (docs/features/baby-names/design.md 3.2-3.5).

A name page is one English spelling as the Berean prints it. Each person contributes one bearer entry per spelling they
bear (Abraham bears "Abraham" and "Abram"); each spelling holds one block per original word (Noah: the ark-builder's
H5146 and the daughter of Zelophehad's H5270). A Greek form whose Strong's entry points back to a Hebrew original
already on the page is folded into that block (the ark-builder's Greek "Noe" adds no second block).
"""

import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, field

from bn_meaning import Meaning, choose_meaning, follow_chain, parse_note, themes_for
from bn_sources import Berean, NameLine, StrongEntry, TipnrPerson

NT_PERIODS = {"life-of-christ", "early-church"}
RESERVED = {"boys", "girls", "meaning", "letter", "search"}


class BuildError(RuntimeError):
    pass


def slug_of(name: str) -> str:
    """The one slug rule (src/data/baby-names/index.ts has the same): lower case, letters only, hyphens kept,
    accents removed. 'Maher-shalal-hash-baz' -> 'maher-shalal-hash-baz'."""
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii").lower()
    plain = re.sub(r"[^a-z-]+", "-", plain)
    return re.sub(r"-{2,}", "-", plain).strip("-")


@dataclass
class Bearer:
    person: str
    spelling: str
    strongs: list[str] = field(default_factory=list)
    refs: set[int] = field(default_factory=set)
    forms: set[str] = field(default_factory=set)   # TIPNR's other English forms for these lines


@dataclass
class Original:
    strongs: str
    word: str
    translit: str
    greek: list[dict] = field(default_factory=list)     # folded Greek forms: {"strongs", "word"}
    persons: list[str] = field(default_factory=list)
    meaning: Meaning | None = None


@dataclass
class Name:
    spelling: str
    slug: str
    bearers: dict[str, Bearer] = field(default_factory=dict)
    originals: dict[str, Original] = field(default_factory=dict)
    places: list[dict] = field(default_factory=list)
    passages: list[int] = field(default_factory=list)
    extra_gender: str = ""
    about: str = ""          # extra names: what the name is in the Bible ("the angel sent to Daniel, Zechariah and Mary")


def berean_spelling(forms: list[str], refs: list[int], strongs: str, berean: Berean, plain: dict[int, str]) -> str:
    """The Berean's spelling of a name line: the TIPNR form found as a whole word in the most of its verses in the
    Berean text; failing that, the word the Berean tags with its Strong's number there; '' when neither is found."""
    best, best_count = "", 0
    for form in forms:
        pattern = re.compile(rf"(?<![\w-]){re.escape(form)}(?![\w-])")
        count = sum(1 for ref in refs if pattern.search(plain.get(ref, "")))
        if count > best_count:
            best, best_count = form, count
    if best:
        return best
    seen: Counter = Counter()
    for ref in refs:
        seen.update(berean.words.get((ref, strongs), Counter()))
    return seen.most_common(1)[0][0] if seen else ""


def decided_spelling(key: str, line: NameLine, decision: dict | None, plain: dict[int, str],
                     log: list[str]) -> tuple[str | None, list[int]]:
    """A reviewed decision on one TIPNR name line: (None, []) when excluded; otherwise the confirmed spelling ('' when
    the decision leaves it to the Berean) and the line's verses, minus any it moves away ("dropRefs": verses TIPNR
    gives this person that belong to someone else)."""
    if not decision:
        return "", line.refs
    if not decision.get("reason"):
        raise BuildError(f"baby-names: spelling decision {key} lacks a reason")
    if decision.get("exclude"):
        log.append(f"reviewed exclusion: {key}: {decision['reason']}")
        return None, []
    refs = line.refs
    drop = set(decision.get("dropRefs", []))
    if drop:
        if not drop <= set(line.refs) or drop >= set(line.refs):
            raise BuildError(f"baby-names: spelling decision {key} drops verses the line does not have, or all of them")
        refs = [ref for ref in line.refs if ref not in drop]
        log.append(f"reviewed verse move: {key}: {decision['reason']}")
    spelling = decision.get("spelling", "")
    if spelling:
        evidence = set(decision.get("refs", [])) & set(refs)
        if not any(re.search(rf"(?<![\w-]){re.escape(spelling)}(?![\w-])", plain.get(ref, "")) for ref in evidence):
            raise BuildError(f"baby-names: spelling decision {key} has no matching Berean evidence")
    elif not drop:
        raise BuildError(f"baby-names: spelling decision {key} neither excludes, spells nor moves verses")
    return spelling, refs


def group_names(tipnr: dict[str, TipnrPerson], people: dict[str, dict], berean: Berean, plain: dict[int, str],
                spelling_overrides: dict[str, str], log: list[str], resolutions: dict | None = None) -> dict[str, Name]:
    """Every person in the people index with a confirmed Berean spelling, grouped by that spelling."""
    names: dict[str, Name] = {}
    resolutions = resolutions or {}
    used: set[str] = set()
    for pid, row in people.items():
        if row.get("g"):
            continue  # a people group, not a person (design 3.2)
        person = tipnr.get(pid)
        if person is None:
            decision = resolutions.get(pid)
            if not decision or not decision.get("reason") or not decision.get("exclude"):
                raise BuildError(f"baby-names: no reviewed TIPNR identity for {pid}; add it to \"identities\" or "
                                 "exclude it under \"reviewed\" in spelling-overrides.json")
            used.add(pid)
            log.append(f"reviewed exclusion: {pid}: {decision['reason']}")
            continue
        for line in person.lines:
            key = f"{pid}|{line.strongs}|{line.forms[0]}"
            decision = resolutions.get(key)
            if decision:
                used.add(key)
            spelling, refs = decided_spelling(key, line, decision, plain, log)
            if spelling is None:
                continue  # excluded by a reviewed decision
            if not spelling:
                spelling = spelling_overrides.get(pid, "") or berean_spelling(line.forms, refs, line.strongs, berean, plain)
            if spelling.endswith("ites"):
                continue  # a clan name the person is also listed under ("Gadites"), not a given name
            if not spelling:
                raise BuildError(f"baby-names: unconfirmed spelling: {key}; add an evidenced decision or exclusion")
            name = names.setdefault(spelling, Name(spelling, slug_of(spelling)))
            bearer = name.bearers.setdefault(pid, Bearer(pid, spelling))
            if line.strongs not in bearer.strongs:
                bearer.strongs.append(line.strongs)
            bearer.refs.update(refs)
            bearer.forms.update(f for f in line.forms if f != spelling)
    unused = sorted(set(resolutions) - used)
    if unused:
        raise BuildError(f"baby-names: reviewed spelling decisions match nothing (TIPNR or the people data changed); "
                         f"review and remove: {', '.join(unused)}")
    return names


def add_reviewed_identities(tipnr: dict[str, TipnrPerson], identities: dict[str, dict], people: dict[str, dict],
                            lexicon: dict[str, StrongEntry], plain: dict[int, str]) -> None:
    """Site-added people with no TIPNR record whose name was reviewed by hand ("identities" in spelling-overrides.json):
    each becomes a one-line TIPNR-style record, so the person bears a page like everyone else. Every claim is checked:
    the person exists, TIPNR still lacks them, the Strong's number exists, and the Berean prints the spelling in every
    verse given."""
    for pid, item in identities.items():
        if not str(item.get("reason", "")).strip():
            raise BuildError(f"baby-names: identity {pid} lacks a reason")
        if pid not in people:
            raise BuildError(f"baby-names: identity {pid} is not in data/study/people.json; remove it")
        if pid in tipnr:
            raise BuildError(f"baby-names: TIPNR now has its own record for {pid}; remove its entry from \"identities\"")
        strongs, spelling, refs = item.get("strongs", ""), item.get("spelling", ""), item.get("refs", [])
        entry = lexicon.get(strongs)
        if entry is None:
            raise BuildError(f"baby-names: identity {pid} gives Strong's {strongs!r}, which is not in the dictionaries")
        if not spelling or not refs:
            raise BuildError(f"baby-names: identity {pid} needs a spelling and at least one verse")
        pattern = re.compile(rf"(?<![\w-]){re.escape(spelling)}(?![\w-])")
        missing = [ref for ref in refs if not pattern.search(plain.get(ref, ""))]
        if missing:
            raise BuildError(f"baby-names: identity {pid}: the Berean does not print {spelling!r} at {missing}")
        tipnr[pid] = TipnrPerson(pid, f"{spelling}@reviewed", [NameLine("reviewed", [spelling], strongs, entry.word, list(refs))])


def build_originals(name: Name, lexicon: dict[str, StrongEntry], tipnr: dict[str, TipnrPerson]) -> None:
    """One block per original word; a Greek form pointing to a Hebrew original on the page joins that block."""
    words = {line.strongs: line.original for b in name.bearers.values() for line in tipnr[b.person].lines}
    hebrew_on_page = {s for b in name.bearers.values() for s in b.strongs if s.startswith("H")}
    for bearer in sorted(name.bearers.values(), key=lambda b: -len(b.refs)):
        for strongs in bearer.strongs:
            target = strongs
            if strongs.startswith("G"):
                chain, _entry = follow_chain(strongs, lexicon)
                target = next((s for s in chain if s in hebrew_on_page), strongs)
            entry = lexicon.get(target)
            block = name.originals.setdefault(target, Original(target, words.get(target, entry.word if entry else ""),
                                                               entry.translit if entry else ""))
            if target != strongs and not any(g["strongs"] == strongs for g in block.greek):
                block.greek.append({"strongs": strongs, "word": words.get(strongs, "")})
            if bearer.person not in block.persons:
                block.persons.append(bearer.person)


def notes_for_names(berean: Berean) -> dict[str, list[dict]]:
    """Spelling -> the Berean's explanations of that name, each with its verse (design 3.3 rule 2)."""
    found: dict[str, list[dict]] = defaultdict(list)
    for note in berean.notes:
        for parsed in parse_note(note):
            found[parsed["name"]].append({**parsed, "verse": note.verse})
    for items in found.values():
        items.sort(key=lambda item: item["verse"])
    return found


def assign_meanings(names: dict[str, Name], lexicon: dict[str, StrongEntry], notes: dict[str, list[dict]],
                    overrides: dict[str, dict], used_overrides: set[str]) -> None:
    """A note joins the block whose people bear the name in the note's verse, so the Genesis 5:29 note on Noah
    reaches the ark-builder's block and never the other Noah's."""
    for name in names.values():
        for block in name.originals.values():
            key = f"{name.spelling}|{block.strongs}"
            override = overrides.get(key) or overrides.get(name.spelling)
            if override:
                used_overrides.add(key if key in overrides else name.spelling)
            verses = {v for p in block.persons if p in name.bearers for v in name.bearers[p].refs}
            mine = [n for n in notes.get(name.spelling, []) if n["verse"] in verses or not name.bearers]
            block.meaning = choose_meaning(block.strongs, lexicon, mine, override)


def gender_of(name: Name, details: dict[str, dict]) -> str:
    if name.extra_gender and not name.bearers:
        return name.extra_gender
    sexes = {details[p].get("s", "") for p in name.bearers}
    boy, girl = "M" in sexes, "F" in sexes
    if name.extra_gender:
        boy, girl = boy or name.extra_gender in ("boy", "both"), girl or name.extra_gender in ("girl", "both")
    return "both" if boy and girl else "boy" if boy else "girl" if girl else "unknown"


def bearer_testament(pid: str, people: dict[str, dict], refs: set[int], log: list[str]) -> str:
    period = people[pid].get("p", "")
    if period:
        return "nt" if period in NT_PERIODS else "ot"
    log.append(f"no period for {pid}; testament from its first reference")
    return "nt" if min(refs) >= 40_000_000 else "ot"


def testament_of(name: Name, people: dict[str, dict], log: list[str]) -> str:
    found = {bearer_testament(p, people, b.refs, log) for p, b in name.bearers.items()}
    refs = set(name.passages) | {v for place in name.places for v in place["verseIds"]}
    if refs and not name.bearers:
        found |= {"nt" if r >= 40_000_000 else "ot" for r in refs}
    return "both" if len(found) > 1 else (found.pop() if found else "ot")


def all_verses(name: Name) -> list[int]:
    verses = set(name.passages)
    for bearer in name.bearers.values():
        verses |= bearer.refs
    for place in name.places:
        verses |= set(place["verseIds"])
    return sorted(verses)


def check_slugs(names: dict[str, Name]) -> None:
    seen: dict[str, str] = {}
    for name in names.values():
        if not name.slug or name.slug in RESERVED:
            raise BuildError(f"baby-names: '{name.spelling}' makes the slug '{name.slug}', which is empty or reserved")
        if name.slug in seen:
            raise BuildError(f"baby-names: '{name.spelling}' and '{seen[name.slug]}' both make the slug '{name.slug}'")
        seen[name.slug] = name.spelling


def apply_themes(names: dict[str, Name], themes: dict[str, dict]) -> dict[str, list[str]]:
    return {n.slug: themes_for(main_original(n).meaning.headline, themes) if n.originals else [] for n in names.values()}


def main_original(name: Name) -> Original:
    """The block of the bearer with the most references (its headline is the one the browse list shows)."""
    def weight(block: Original) -> int:
        return max((len(name.bearers[p].refs) for p in block.persons if p in name.bearers), default=0)
    return max(name.originals.values(), key=lambda block: (weight(block), -list(name.originals).index(block.strongs)))
