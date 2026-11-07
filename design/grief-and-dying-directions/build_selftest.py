"""Wrong inputs for the Grief and dying build, tried in memory. Each must be refused with the reason given; nothing is
written. Run: python -B design/grief-and-dying-directions/build-data.py --selftest"""
import copy

from figures import build_figures
from held import load_held
from scripture_text import BuildError, load_bible

# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None,
#  words the refusal must contain)
CASES = [
    ("a changed word in a block quotation", ("> Jesus wept.", "> Jesus cried."), None, "not word for word"),
    ("a block quotation under the wrong reference", ("John 11:35 · BSB", "John 11:36 · BSB"), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"a foreigner and an outsider among you"', '"a stranger and an outsider among you"'), None, "are not in"),
    ("a quotation cited to the wrong verse", ("for nothing (Genesis 23:6)", "for nothing (Genesis 23:7)"), None, "not in Genesis 23:7"),
    ("a reference that does not exist", ("(Genesis 12:7)", "(Genesis 12:77)"), None, "does not resolve"),
    ("a chapter that does not exist", ("(Genesis 23).", "(Genesis 51)."), None, "chapter does not exist"),
    ("a link that leaves the site", ("Read more in *Covenants and promises*.", "Read more in [this](https://example.com)."), None, "only links on this site"),
    ("a protocol-relative link", ("Read more in *Covenants and promises*.", "Read more in [this](//example.com/x)."), None, "only links on this site"),
    ("a line the page cannot place", ("Selection: This is a selection", "A stray line.\n\nSelection: This is a selection"), None, "outside any section"),
    ("an italic that is neither a study nor a known term", ("*shiva*", "*shivah*"), None, "italic"),
    ("a question's opening line not in its passage", ("I will go to him, but he will not return to me.\n", "I will go to him, and he will not return to me.\n"), None, "opening line"),
    ("an outside quotation searched in the wrong chapter", None,
     ("OUTSIDE_QUOTES", lambda v: {**v, "neither die nor sleep": ("Second London Baptist Confession, chapter 10", "lbc", "X")}), "not in the held copy"),
    ("a quote cited to five verses with the named exception removed", None, ("QUOTE_EXCEPTIONS", lambda v: {}), "not in Lamentations 1:16"),
    ("an own-term entry the text does not use", None, ("OWN_TERMS", lambda v: {**v, ("01", "nonsense"): "test"}), "OWN_TERMS has entries"),
    ("a misquote entry that hides a real match", None,
     ("MISQUOTES", lambda v: {**v, ("01", "a foreigner and an outsider among you"): ("Genesis 23:4", "I am a foreigner")}), "word for word in Genesis 23:4"),
    ("a voice whose words are not in its verse", None,
     ("VOICES", lambda v: [{**v[0], "words": "to mourn and to cry for her"}] + v[1:]), "voice of Abraham"),
    ("a voice that breaks the reading sentence", None,
     ("VOICES", lambda v: v[:1] + [{**v[1], "to": "lord"}] + v[2:]), "no Genesis voice goes to the Lord"),
    ("the refrain cited at the wrong verses", None, ("SONG", lambda v: {**v, "cited": [19, 25]}), "the refrain is in verses"),
    ("a count of days under the wrong verse", None, ("DAYS", lambda v: [{**v[0], "ref": "Genesis 50:10"}] + v[1:]), "is not in Genesis 50:10"),
    ("the comma reading changed in the lists only", None, ("COMMA", lambda v: {**v, "moved": "Truly I say to you today, you will be with Me in Paradise"}), "not in any verse"),
    ("the comma reading with a changed word", ('"Truly I tell you today, you', '"Truly I say to you today, you'),
     ("COMMA", lambda v: {**v, "moved": "Truly I say to you today, you will be with Me in Paradise"}), "differ only in punctuation"),
    ("the hope said to stand at the middle when it does not", None,
     ("LAMENT", lambda v: {**v, "marks": [m if m["id"] != "hope" else {**m, "ref": "Lamentations 3:21–24"} for m in v["marks"]]}), "outside Lamentations 3:21–24"),
]


def run_selftest(build_module) -> int:
    lists = build_module.L
    bible, held = load_bible(), load_held(lists.HELD)
    original = build_module.CONTENT.read_text(encoding="utf-8")
    failures = 0
    for name, text_change, list_change, expected in CASES:
        text = original
        if text_change:
            old, new = text_change
            if text.count(old) < 1:
                print(f"selftest: SETUP FAILED for {name}: {old!r} is not in content.md")
                failures += 1
                continue
            text = text.replace(old, new, 1)
        saved = None
        if list_change:
            attribute, change = list_change
            saved = getattr(lists, attribute)
            setattr(lists, attribute, change(copy.deepcopy(saved)))
        try:
            builder = build_module.Builder(bible, held)
            build_module.parse(builder, text)
            build_figures(builder, lists)
            print(f"selftest: NOT REFUSED: {name}")
            failures += 1
        except BuildError as error:
            if expected and expected not in str(error):
                print(f"selftest: REFUSED FOR THE WRONG REASON: {name}: {error}")
                failures += 1
            else:
                print(f"selftest: refused, as it should be: {name} ({str(error).splitlines()[0][:110]})")
        finally:
            if list_change:
                setattr(lists, list_change[0], saved)
    print(f"selftest: {len(CASES) - failures} of {len(CASES)} wrong inputs refused for the right reason")
    return 1 if failures else 0
