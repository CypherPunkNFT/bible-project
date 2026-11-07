"""Wrong inputs fed to build-data.py in memory, each of which must be refused for the right reason. Nothing is written."""
import sys

from scripture_text import BuildError
import study_lists as L

# Wrong text: (what it is, the words replaced, the wrong words, a phrase the refusal must contain).
TEXT_CASES = [
    ("a changed word in a block quotation", "> Your word is a lamp to my feet", "> Your word is a light to my feet", "not word for word"),
    ("a block quotation under the wrong reference", "Acts 17:11 · BSB", "Acts 17:12 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", '"feared the LORD greatly"', '"feared the LORD deeply"', "not in"),
    ("a quote cited to the wrong verse", "(Jonah 2:6 · BSB)", "(Jonah 2:7 · BSB)", "not in"),
    ("a verse reference that does not exist", "(Jonah 4:3)", "(Jonah 5:3)", "does not resolve"),
    ("a chapter reference that does not exist", "(2 Kings 17)", "(2 Kings 27)", "no chapter"),
    ("a link that leaves the site", "Read the passage again before you answer.", "Read the [passage](https://example.com) again before you answer.", "only site links"),
    ("a line the page cannot place", "## 01 Where to start", "#### stray\n\n## 01 Where to start", "does not know how to place"),
    ("an unclosed bold mark", "Read more in *Learning to discern*.", "Read more in **Learning to discern.", "leftover markup"),
    ("numbered steps out of order", "3. **Three questions.**", "4. **Three questions.**", "must run in order"),
    ("a short reference with no book", "the fish in 1:17", "the fish in 1:18", "has no book"),
    ("an outside quotation edited away from its named wording", "without any mixture of error", "without any mixture of doubt", "are not in"),
    ("an unbalanced quotation mark", '"Have you any right to be angry?"', '"Have you any right to be angry?', "odd number"),
    ("a short quote with no verse", "Start again with tomorrow's chapter.", 'Start "again" with tomorrow\'s chapter.', "short quote"),
]

# Wrong entries in study_lists.py, patched in memory: (what it is, list name, index or None, wrong value, refusal phrase).
LIST_CASES = [
    ("a step of Jonah's descent given to the wrong verse", "DESCENT", 0, ("Jonah 1:4", "went down to Joppa", -1), "is not in"),
    ("a thing God appointed moved to a verse without it", "APPOINTED", 1, ("Jonah 4:5", "vine", "vine"), "is not in"),
    ("a shared phrase Jonah 4:2 does not hold", "SHARED_WORDS", 4, "abounding in faithfulness", "must be in"),
    ("Hananiah's two years made three", "YEARS", 0, ("Jeremiah 28:3", "Within two years", 3, "Hananiah"), "says 2"),
    ("a letter note sent to the wrong verse", "LETTER_NOTES", 4, ("Jeremiah 29:9", "Seventy years first", "seventy years"), "is not in"),
    ("an editors' heading looked for where there is none", "READER_LABELS", 0, ("heading", "Jonah 1:17", "A heading", "added by editors to help you find your way", "x"), "no editors' heading"),
    ("an outside quotation looked for in the wrong held copy", "SOURCES_HELD", None,
     {"foundation": {"name": "the site's doctrinal foundation", "path": L.PROJECT / "Website/content/studies/explore-the-bible/books-in-their-settings/working.md"}}, "not in the site's doctrinal"),
    ("a held source outside the allowed folders", "SOURCES_HELD", None,
     {"foundation": {"name": "elsewhere", "path": L.PROJECT.parent / "elsewhere.md"}}, "outside the allowed"),
    ("the six-week example with a mark that is not a day", "WEEKS_EXAMPLE", None, "11111x" + "1" * 36, "42 marks"),
]


def selftest(text: str, bible: dict, build, held) -> int:
    build(text, bible, held())  # the real text must build, or every refusal below proves nothing
    failures = 0

    def attempt(name: str, expected: str, new_text: str) -> None:
        nonlocal failures
        try:
            build(new_text, bible, held())
            print(f"selftest: NOT REFUSED: {name}", file=sys.stderr)
            failures += 1
        except BuildError as error:
            ok = expected in str(error)
            failures += not ok
            print(f"selftest: {'refused' if ok else 'REFUSED FOR THE WRONG REASON'}: {name}: {str(error).splitlines()[0]}")

    for name, old, new, expected in TEXT_CASES:
        if old not in text:
            print(f"selftest: cannot apply {name!r}: {old!r} is not in content.md", file=sys.stderr)
            failures += 1
            continue
        attempt(name, expected, text.replace(old, new, 1))
    for name, attr, index, value, expected in LIST_CASES:
        saved = getattr(L, attr)
        patched = value if index is None else [value if i == index else item for i, item in enumerate(saved)]
        setattr(L, attr, patched)
        try:
            attempt(name, expected, text)
        finally:
            setattr(L, attr, saved)
    build(text, bible, held())  # every patch was put back
    total = len(TEXT_CASES) + len(LIST_CASES)
    print(f"selftest: {total - failures} of {total} wrong inputs refused as expected; nothing written")
    return 1 if failures else 0
