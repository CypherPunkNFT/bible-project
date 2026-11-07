"""Wrong inputs for the Prayer across Scripture build, each fed in memory and each required to be refused for the right
reason. Run through `build-data.py --selftest`. Nothing here writes data.js: build_payload only returns text.

1. The real content.md must build (a check that refuses everything proves nothing).
2. Named cases: each changes one thing and names the words its refusal must contain.
3. Every block quotation and every quoted phrase in the text has one word changed, one at a time, and each must be refused."""
import copy
import functools
import re

import prose
import study_lists as L
from scripture_text import BuildError

# (name, text to find once, its replacement, words the refusal must contain)
TEXT_CASES = [
    ("block quotation altered by one word", "Ask, and it will be given to you; seek", "Ask, and it shall be given to you; seek", "not word for word"),
    ("quotation cited to the wrong verse, though another verse in scope has it", "test and prove what is best\" (Philippians 1:10)", "test and prove what is best\" (Philippians 1:9)", "not in Philippians 1:9"),
    ("verse that does not exist", "(Luke 11:8)", "(Luke 11:88)", "does not resolve"),
    ("range that runs backwards", "**Main readings:** Luke 11:1–13; Matthew 6:5–8", "**Main readings:** Luke 11:1–13; Matthew 6:8–5", "runs backwards"),
    ("quotation straddling the gap in a split reference", "\"And forgive us our debts, as we also have forgiven our debtors\" (Matthew 6:12)",
     "\"our debtors. For if you forgive men\" (Matthew 6:12, 14)", "are not in"),
    ("link leaving the site", "known as the Lord's Prayer.", "known as the Lord's Prayer, https://example.com.", "'://' is not allowed"),
    ("markdown link", "known as the Lord's Prayer.", "known as the [Lord's Prayer](/elsewhere).", "'](' is not allowed"),
    ("javascript: in the text", "known as the Lord's Prayer.", "known as the Lord's Prayer javascript:void.", "'javascript:' is not allowed"),
    ("ellipsis inside a quotation", "\"Lord, teach us to pray\", and", "\"Lord, teach us...\", and", "is not allowed"),
    ("curly quotation marks in prose, which would skip the checks", "\"Lord, teach us to pray\", and", "“Lord, teach us to pray”, and", "is not allowed"),
    ("quotation hidden in a note still to check", "[check: the BSB footnote on Matthew 6:13]", "[check: the BSB footnote, \"for ever\"]", "inside a note still to check"),
    ("italic that is no listed study or term", "*The Holy Spirit*. Telling", "*The Holy Ghost*. Telling", "is not a listed study"),
    ("line with an unknown key", "Frame: Most of the prayers", "Framing: Most of the prayers", "line belongs to nothing"),
    ("unknown paragraph tag", "[read] Matthew 6 warns", "[think] Matthew 6 warns", "unknown paragraph tag"),
    ("known text issue corrected without updating the list", "and four where he tells them", "and three where he tells them", "KNOWN_TEXT_ISSUES"),
    ("own term no longer used", "the \"standing prayer\", which", "the standing prayer, which", "no longer uses"),
    ("confession phrase changed", "\"render loyal obedience\"", "\"render faithful obedience\"", "'render faithful obedience'"),
    ("source quotation changed", "\"Not a part only, much less the smallest part.\"", "\"Not a part only, much less the least part.\"", "quote not found in one paragraph of wesley"),
    ("parts out of order", "## 03 Give us this day", "## 07 Give us this day", "numbered 01 to 06"),
    ("question opening with plain prose", "Text: Matthew 6:14–15\n\n[read]", "Text: Matthew 6:14–15\n\nPlain words first.\n\n[read]", "must name its text and open"),
]


def spine_part(lists) -> None:
    lists.SPINE[1]["part"] = "07"


def spine_twice(lists) -> None:
    lists.SPINE[3]["words"] = "Your"


def spine_letter(lists) -> None:
    lists.SPINE[2]["letters"] = ["Romans 8:26"]


def station_outside(lists) -> None:
    climb = lists.CLIMBS[0]
    climb["stations"][0] = ("asks",) + climb["stations"][0][1:]  # a thanks phrase claimed as a request


def leaf_twice(lists) -> None:
    lists.LEAVES["Philippians 1:3–11"]["marks"][0] = ("thanks", "Philippians 1:3", "I")


def missing_study(lists) -> None:
    lists.STUDY_LINKS["Grief and dying"] = "no-such-study"


def outside_source(lists) -> None:
    lists.SOURCES[2]["href"] = "https://example.com/"


def column_part(lists) -> None:
    lists.CLIMBS[2]["part"] = "02"


LIST_CASES = [
    ("line of the prayer pointing at a part that does not exist", spine_part, "which the study does not have"),
    ("line of the prayer whose words occur twice in the verse", spine_twice, "not once"),
    ("letter set beside a line that the study never cites", spine_letter, "not inside any passage"),
    ("column station outside a phrase of its kind", station_outside, "is not inside"),
    ("leaf phrase that occurs more than once in its verse", leaf_twice, "not once"),
    ("study link to a mock-up that does not exist", missing_study, "does not exist"),
    ("source link leaving the site", outside_source, "must be a page on this site"),
    ("column sent to a part that does not read it", column_part, "does not read its passage"),
]


def refused(build, text: str, expected: str) -> tuple:
    try:
        build(text)
    except BuildError as error:
        return expected in str(error), str(error)
    return False, "built without complaint"


def changed_word(phrase: str) -> str | None:
    """The phrase with its first word of three letters or more replaced, or None if it has none."""
    match = re.search(r"[A-Za-z]{3,}", phrase)
    return phrase[:match.start()] + "Zqx" + phrase[match.end():] if match else None


def mutations(text: str) -> list:
    """(where, altered text) for each block quotation and each quoted phrase, one word changed in each."""
    out, lines = [], text.split("\n")
    for index, line in enumerate(lines):
        if line.startswith("> ") and (new := changed_word(line[2:])):
            out.append((f"block quotation on line {index + 1}", "\n".join(lines[:index] + ["> " + new] + lines[index + 1:])))
            continue
        for match in re.finditer(r'"([^"]+)"', line):
            new = changed_word(match.group(1))
            if new:
                altered = line[:match.start(1)] + new + line[match.end(1):]
                out.append((f"quotation {match.group(1)[:40]!r} on line {index + 1}", "\n".join(lines[:index] + [altered] + lines[index + 1:])))
    return out


def speed_up(module) -> None:
    """Read the Berean and the held sources once for the whole test, not once per case."""
    bible = module.load_bible()
    module.load_bible = lambda: bible
    prose.held_paragraphs = functools.lru_cache(maxsize=None)(prose.held_paragraphs)
    prose.bfm_articles = functools.lru_cache(maxsize=None)(prose.bfm_articles)


def run_selftest(module, text: str) -> int:
    speed_up(module)
    build = module.build_payload
    try:
        build(text)
    except BuildError as error:
        print(f"selftest: FAILED: the real content.md does not build: {error}")
        return 1
    failures, passed = [], 0
    for name, find, replace, expected in TEXT_CASES:
        if text.count(find) != 1:
            failures.append(f"{name}: the text to change is not in content.md exactly once: {find[:50]!r}")
            continue
        ok, message = refused(build, text.replace(find, replace), expected)
        passed += ok
        print(f"  {'refused' if ok else 'NOT REFUSED AS EXPECTED'}: {name}" + ("" if ok else f" ({message[:120]})"))
        if not ok:
            failures.append(name)
    saved = {name: copy.deepcopy(getattr(L, name)) for name in ("SPINE", "CLIMBS", "LEAVES", "STUDY_LINKS", "SOURCES")}
    for name, change, expected in LIST_CASES:
        change(L)
        ok, message = refused(build, text, expected)
        for key, value in saved.items():  # in place: shapes.py holds these same objects by name
            current = getattr(L, key)
            if isinstance(current, list):
                current[:] = copy.deepcopy(value)
            else:
                current.clear()
                current.update(copy.deepcopy(value))
        passed += ok
        print(f"  {'refused' if ok else 'NOT REFUSED AS EXPECTED'}: {name}" + ("" if ok else f" ({message[:120]})"))
        if not ok:
            failures.append(name)
    altered = mutations(text)
    slipped = [where for where, changed in altered if not isinstance(_try(build, changed), BuildError)]
    print(f"  every quotation altered by one word: {len(altered) - len(slipped)} of {len(altered)} refused")
    failures += [f"altered and not refused: {where}" for where in slipped]
    if failures:
        print(f"selftest: FAILED: {len(failures)} problem(s): {failures}")
        return 1
    print(f"selftest: ok. {passed} named wrong inputs and {len(altered)} altered quotations, each refused; the real text builds.")
    return 0


def _try(build, text: str):
    try:
        build(text)
    except BuildError as error:
        return error
    return None
