"""Prove the Genesis 1–11 build refuses wrong input. Every case runs in memory on a fresh copy of the study and its
lists; data.js is never written, and the test fails if data.js changes while it runs."""
import hashlib

from scripture_text import BuildError


def text_case(old: str, new: str):
    def apply(text, lists):
        if old not in text:
            raise AssertionError(f"self-test case is out of date: {old!r} is no longer in content.md")
        return text.replace(old, new, 1), lists
    return apply


def list_case(change):
    def apply(text, lists):
        change(lists)
        return text, lists
    return apply


def both(text_change, list_change):
    def apply(text, lists):
        text, lists = text_change(text, lists)
        list_change(lists)
        return text, lists
    return apply


def set_note(lists):
    lists.NOTE_QUOTES["Hebrew Adam"] = "Genesis 5:3"


def set_age(lists):
    lists.AGES[7]["parts"][0] = ("Genesis 5:27", "lived a total of 969 years", 960)


def set_language(lists):
    lists.LANGUAGES[1]["ref"] = "Genesis 10:21"


def set_outside(lists):
    source, part, held = lists.OUTSIDE_QUOTES.pop("they forsook righteousness")
    lists.OUTSIDE_QUOTES["they forsook all righteousness"] = (source, part, held)


def set_flood(lists):
    lists.FLOOD[2]["month"] = 8


CASES = [
    ("a changed word in a block quotation", text_case("For in six days the LORD made", "For in seven days the LORD made"), "not word for word"),
    ("a block quotation under the wrong reference", text_case("Genesis 12:1 · BSB", "Genesis 12:2 · BSB"), "not word for word"),
    ("a changed word in a quoted phrase", text_case('"it was very good"', '"it was very bad"'), "not in the verse cited"),
    ("a quotation under the wrong bare reference", text_case("(6:8 · BSB)", "(6:9 · BSB)"), "not in the verse cited"),
    ("a reference that does not exist", text_case("(4:9 · BSB)", "(4:99 · BSB)"), "does not resolve"),
    ("a link that leaves the site", text_case("Carry three questions into every part:", "Carry three questions into every part: [x](//example.com)"), "only links within this site"),
    ("a line the page cannot place", text_case("## 02 Were Adam", "#### A stray heading\n\n## 02 Were Adam"), "does not know how to place"),
    ("a section heading the page does not know", text_case("### Where the reading stops", "### Where the text stops"), "does not know"),
    ("a footnote quoted at the wrong verse", list_case(set_note), "not in the Berean's footnotes"),
    ("an outside quotation not in its held text", both(text_case('"they forsook righteousness"', '"they forsook all righteousness"'), set_outside), "not word for word in the held text"),
    ("an age the verse does not state", list_case(set_age), "does not state 960"),
    ("languages claimed for the wrong verse", list_case(set_language), "names languages in"),
    ("a flood date the verse does not give", list_case(set_flood), "is not day 17 of month 8"),
    ("a reading added to a question", text_case("- **A gap before the days.**", "- **An extra view.** Held by nobody.\n- **A gap before the days.**"), "expected 8 questions and 23"),
]


def fingerprint(path) -> tuple:
    return (hashlib.sha256(path.read_bytes()).hexdigest(), path.stat().st_mtime_ns) if path.exists() else None


def selftest(build_from, lists_copy, bible: dict, text: str, out) -> int:
    before = fingerprint(out)
    first = build_from(text, lists_copy(), bible)
    if build_from(text, lists_copy(), bible) != first:
        print("selftest: FAILED: two builds of the same input differ")
        return 1
    print("selftest: control build passes, and building twice gives the same output")
    failures = 0
    for name, apply, expected in CASES:
        changed_text, changed_lists = apply(text, lists_copy())
        try:
            build_from(changed_text, changed_lists, bible)
        except BuildError as error:
            if expected in str(error):
                print(f"  refused: {name}\n      -> {str(error).splitlines()[0][:150]}")
                continue
            print(f"  WRONG REASON: {name}: {error}")
        else:
            print(f"  NOT REFUSED: {name}")
        failures += 1
    if fingerprint(out) != before:
        print("selftest: FAILED: data.js changed during the self-test")
        return 1
    print(f"selftest: {len(CASES) - failures} of {len(CASES)} wrong inputs refused; data.js untouched")
    return 1 if failures else 0
