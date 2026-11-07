"""Wrong inputs for the A new creation build, tried in memory. Each must be refused with the reason given; nothing is
written. Run: python -B design/a-new-creation-directions/build-data.py --selftest"""
from typing import Any, Callable

from held import load_held
from scripture_text import BuildError, load_bible


def changed(entries: list, index: int, **change: Any) -> list:
    """A copy of a list of dicts with one entry changed."""
    return [{**entry, **change} if i == index else entry for i, entry in enumerate(entries)]


# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None,
#  words the refusal must contain)
CASES: list[tuple[str, tuple | None, tuple[str, Callable] | None, str]] = [
    ("a changed word in a block quotation", ("> For it is by grace you have been saved through faith", "> For it is by grace you have been saved by faith"), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Romans 6:4 · BSB", "Romans 6:5 · BSB"), None, "not word for word"),
    ("a block quotation that stops mid-verse where none is allowed", ("which God prepared in advance as our way of life.", "which God prepared in advance."), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"For Christ’s love compels us', '"For Christ’s love moves us'), None, "are not in"),
    ("a made-up quotation", ('Then: "Therefore do not let sin reign', 'Then: "Sin is already beaten" and "Therefore do not let sin reign'), None, "are not in"),
    ("a quotation cited to the wrong verse", ("(Romans 6:1)", "(Romans 6:3)"), None, "not in Romans 6:3"),
    ("a reference that does not exist", ("(Philippians 3:7)", "(Philippians 3:77)"), None, "does not resolve"),
    ("a link that leaves the site", ("Read more in *Fear, anxiety and despair*.", "Read more in [this](https://example.com)."), None, "only links on this site"),
    ("a protocol-relative link", ("Read more in *Fear, anxiety and despair*.", "Read more in [this](//example.com/x)."), None, "only links on this site"),
    ("an italic that is neither a study nor a known term", ("*Learning to discern*", "*Learning to decide*"), None, "italic"),
    ("a line the page cannot place", ("Selection: This is a selection", "Hook: A stray hook.\n\nSelection: This is a selection"), None, "does not allow"),
    ("an unknown paragraph tag", ("[open] How the law of Moses", "[maybe] How the law of Moses"), None, "unknown paragraph tag"),
    ("an unknown source marker", ("[source:luther]", "[source:aquinas]"), None, "unknown source marker"),
    ("a changed Baptist Faith and Message phrase", ('"All true believers endure to the end"', '"All true believers persevere to the end"'), None, "are not in"),
    ("a confession phrase credited to an article its paragraph does not name", ("(article VII, baptism and the Lord's Supper)", "(article VI, the church)"), None, "credited to article VII"),
    ("a seventh question", ("## Close: Return to the beginning", "## Question extra: One more?\n\nText: Romans 6:1\n\n[read] No.\n\n## Close: Return to the beginning"), None, "6 questions"),
    ("a close pair without its joining 'so'", ("you were forgiven, so forgive", "you were forgiven, forgive"), None, "pairs"),
    ("a place FoldReads names that the list leaves out", None, ("TEXT_FOLDS", lambda v: v[:5]), "FoldReads names"),
    ("a confession phrase searched in the wrong part", None,
     ("OUTSIDE_QUOTES", lambda v: {**v, "yet imperfect in this life": ("Second London Baptist Confession, chapter 29", "lbc", "29.1")}), "not in the held copy"),
    ("an own-term entry the text does not use", None, ("OWN_TERMS", lambda v: {**v, ("01", "nonsense"): "test"}), "OWN_TERMS has entries"),
    ("a fold phrase not in its verse", None, ("PART_FOLDS", lambda v: changed(v, 1, now=("Romans 6:11", "count yourselves alive to sin"))), "phrase not found"),
    ("a joining word that is only part of a word", None, ("TEXT_FOLDS", lambda v: changed(v, 4, join=("Colossians 3:12", "a"))), "phrase not found"),
    ("a part's fold outside that part's reading", None, ("PART_FOLDS", lambda v: changed(v, 0, done=("2 Corinthians 5:18", "who reconciled us to Himself"), span="2 Corinthians 5:15–18")), "not inside its part"),
    ("one of Ephesians' lines with words from another verse", None, ("FOUR_LINES", lambda v: changed(v, 0, because="doing good with his own hands")), "phrase not found"),
    ("a study link to a folder with no page", None, ("STUDY_LINKS", lambda v: {**v, "The Holy Spirit": "no-such-study-directions"}), "has no index.html"),
    ("a javascript: source link", None, ("SOURCES", lambda v: changed(v, 0, href="javascript:alert(1)")), "https or a site page"),
]


def run_selftest(build_module: Any) -> int:
    """Each case alone, from the real inputs; the lists are put back after each one."""
    lists = build_module.L
    bible, held = load_bible(), load_held(lists.HELD)
    original = build_module.CONTENT.read_text(encoding="utf-8-sig")
    build_module.build(original, bible, held)  # the real inputs must pass first, or a refusal proves nothing
    failures = 0
    for what, text_change, list_change, expected in CASES:
        text = original
        if text_change:
            old, new = text_change
            if text.count(old) != 1:
                print(f"selftest: SETUP: {what}: {old!r} is in content.md {text.count(old)} times, expected once")
                failures += 1
                continue
            text = text.replace(old, new)
        saved = None
        if list_change:
            name, change = list_change
            saved = getattr(lists, name)
            setattr(lists, name, change(saved))
        try:
            build_module.build(text, bible, held)
            print(f"selftest: NOT REFUSED: {what}")
            failures += 1
        except BuildError as error:
            if expected in str(error):
                print(f"selftest: refused, as it should be: {what}")
            else:
                print(f"selftest: refused for another reason: {what}: {error}")
                failures += 1
        finally:
            if list_change:
                setattr(lists, list_change[0], saved)
    print(f"selftest: {len(CASES) - failures} of {len(CASES)} wrong inputs refused for the right reason")
    return 1 if failures else 0
