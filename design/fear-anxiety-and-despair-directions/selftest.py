"""Wrong inputs for build-data.py --selftest: each is fed in memory and must be refused for the expected reason.
Nothing is written. Run from Website/: python design/fear-anxiety-and-despair-directions/build-data.py --selftest"""
import copy
import sys

# Wrong text: (what it is, the words replaced, the wrong words, a phrase the refusal must contain).
TEXT_CASES = [
    ("a changed word in a block quotation", "> I cannot carry all these people by myself", "> I cannot lift all these people by myself", "not word for word"),
    ("a block quotation under the wrong reference", "Psalm 56:3 · BSB", "Psalm 56:4 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", '"family after family"', '"family upon family"', "not in"),
    ("a quotation cited to the wrong verse", '"Get up and eat" (1 Kings 19:5)', '"Get up and eat" (1 Kings 19:9)', "not in"),
    ("a reference that does not exist", "(Job 2:13)", "(Job 2:31)", "does not resolve"),
    ("a chapter that does not exist", "**Main readings:** Psalm 56; Psalm 46", "**Main readings:** Psalm 156; Psalm 46", "chapter does not exist"),
    ("a link that leaves the site", "Read the passage again before you answer.", "Read the [passage](https://example.com) again before you answer.", "only site links"),
    ("a link that looks local but leaves the site", "Read the passage again before you answer.", "Read the [passage](//example.com) again before you answer.", "only site links"),
    ("a bare chapter and verse with no book", "(Job 42:16–17)", "(42:16–17)", "has no book"),
    ("a heading the page cannot place", "## 01 ", "#### stray\n\n## 01 ", "does not know how to place"),
    ("a note marker the page does not know", "[read] The anger in this chapter", "[aside] The anger in this chapter", "does not know how to place"),
    ("an unbalanced quotation mark", '"family after family" at', '"family after family at', "odd number"),
    ("an outside quotation edited away from its source", "contend for the sanctity of all human life", "contend for the dignity of all human life", "not in"),
    ("a two-word quotation with no verse", "He says it to God, out loud.", 'He says it to "God himself", out loud.', "short quote"),
    ("a flagged wording corrected in the text but still listed", 'was "deeply grieved" in the garden', "was consumed with sorrow in the garden", "WORDING has entries"),
]

# Wrong entries in study_lists.py, patched in memory: (what it is, attribute path, wrong value, refusal phrase).
LIST_CASES = [
    ("a drawn phrase that is not in its verse", ("ROWS", 0, "next"), "Bring Me seventy of the priests", "is not in"),
    ("the refrain counted wrongly", ("REFRAIN", "times"), 2, "comes 3 times"),
    ("Elijah's care out of the verses' order", ("CARE",), "swap", "in the order"),
    ("a command not to fear left out of part 06", ("REASONS", "items"), "drop", "commands not to fear"),
    ("an outside quotation looked for in the wrong held copy", ("SOURCES_HELD", "foundation", "path"), "content", "is not in the site's doctrinal"),
]


def _patch(L, path: tuple, value, content):
    """Patch one entry of study_lists in memory; returns a function that puts it back."""
    holder = L if len(path) == 1 else getattr(L, path[0])
    for step in path[1:-1]:
        holder = holder[step]
    last = path[-1]
    current = getattr(L, last) if holder is L else holder[last]
    saved = copy.deepcopy(current)
    if value == "swap":
        value = [current[1], current[0], *current[2:]]
    elif value == "drop":
        value = current[:-1]
    elif value == "content":
        value = content.with_name("passage-notes.md")
    if holder is L:
        setattr(L, last, value)
        return lambda: setattr(L, last, saved)
    holder[last] = value
    return lambda: holder.__setitem__(last, saved)


def selftest(build_module, text: str, bible: dict) -> int:
    build, Held, BuildError, L = build_module.build, build_module.Held, build_module.BuildError, build_module.L
    build(text, bible, Held())  # the real text must build, or every refusal below proves nothing
    failures = 0

    def attempt(name: str, expected: str, new_text: str) -> None:
        nonlocal failures
        try:
            build(new_text, bible, Held())
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
    for name, path, value, expected in LIST_CASES:
        restore = _patch(L, path, value, build_module.CONTENT)
        try:
            attempt(name, expected, text)
        finally:
            restore()
    build(text, bible, Held())  # every patch was put back
    total = len(TEXT_CASES) + len(LIST_CASES)
    print(f"selftest: {total - failures} of {total} wrong inputs refused for the expected reason; nothing written")
    return 1 if failures else 0
