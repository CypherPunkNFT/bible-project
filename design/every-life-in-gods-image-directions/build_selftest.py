"""Wrong inputs for the Every life in God's image build, tried in memory. Each must be refused with the reason given;
nothing is written. Run: python -B design/every-life-in-gods-image-directions/build-data.py --selftest"""
import copy

from figures import build_figures
from held import load_held
from scripture_text import BuildError, load_bible


def room_mark(rooms, part, mark_id, **change):
    """ROOMS with one mark changed."""
    return [{**r, "marks": [{**m, **change} if r["part"] == part and m["id"] == mark_id else m for m in r["marks"]]} for r in rooms]


# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None,
#  words the refusal must contain)
CASES = [
    ("a changed word in a block quotation", ("> Whoever sheds the blood of man", "> Whoever spills the blood of man"), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Genesis 9:6 · BSB", "Genesis 9:7 · BSB"), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"blinds those who see"', '"blinds those who look"'), None, "are not in"),
    ("a quotation cited to the wrong verse", ('(2 Samuel 9:8)', '(2 Samuel 9:9)'), None, "not in 2 Samuel 9:9"),
    ("a reference that does not exist", ("(2 Samuel 4:4)", "(2 Samuel 4:44)"), None, "does not resolve"),
    ("a chapter that does not exist", ("Hannah wept and prayed in the house of the LORD for a son (1 Samuel 1)", "Hannah wept and prayed in the house of the LORD for a son (1 Samuel 41)"), None, "chapter does not exist"),
    ("a link that leaves the site", ("Read more in *The church and its calling*.", "Read more in [this](https://example.com)."), None, "only links on this site"),
    ("a protocol-relative link", ("Read more in *The church and its calling*.", "Read more in [this](//example.com/x)."), None, "only links on this site"),
    ("a line the page cannot place", ("Selection: This is a selection", "A stray line.\n\nSelection: This is a selection"), None, "outside any section"),
    ("an italic that is neither a study nor a known term", ("*Grief and dying*", "*Grieving and dying*"), None, "italic"),
    ("a first-sentence quotation that stops mid-sentence", ("standing before the throne and before the Lamb.\n", "standing before the throne.\n"), None, "not word for word"),
    ("a changed Baptist Faith and Message phrase", ('"should oppose racism"', '"should resist racism"'), None, "are not in"),
    ("a confession phrase searched in the wrong article", None,
     ("OUTSIDE_QUOTES", lambda v: {**v, "should oppose racism": ("Baptist Faith and Message 2000, article III", "bfm", "III")}), "not in the held copy"),
    ("a Talmud entry that hides a real match", None,
     ("OUTSIDE_DIFFERS", lambda v: {"and some say forty-six": (*v["and some say forty-six"][:3], "and some say in forty-seven places")}), "held copy does not have it"),
    ("an own-term entry the text does not use", None, ("OWN_TERMS", lambda v: {**v, ("01", "nonsense"): "test"}), "OWN_TERMS has entries"),
    ("a misquote entry that hides a real match", None,
     ("MISQUOTES", lambda v: {**v, ("05", "blinds those who see"): ("Exodus 23:8", "blinds those who see")}), "word for word in Exodus 23:8"),
    ("a room mark whose words are not in its verse", None,
     ("ROOMS", lambda v: room_mark(v, "04", "poor", words="a poor man in plain clothes also comes in")), "is not in James 2:2"),
    ("a room mark claiming the study's words when it has none", None,
     ("ROOMS", lambda v: room_mark(v, "06", "family", study="the family must decide")), "neither a verse's"),
    ("a room with two people who cannot speak", None,
     ("ROOMS", lambda v: room_mark(v, "05", "poor", silent=True, why="who does not belong to any family in town")), "exactly one"),
    ("a reason for silence not in the study's words", None,
     ("ROOMS", lambda v: room_mark(v, "02", "child", why="He cannot yet speak.")), "study's own words"),
    ("a room's silent one not named in the close", None,
     ("ROOMS", lambda v: [{**r, "silent_name": "the man in the corner"} if r["part"] == "03" else r for r in v]), "Way paragraph"),
    ("the table counted at the wrong verses", None, ("TABLE", lambda v: {**v, "study_cites": [7, 10, 13]}), "the verses with 'table'"),
    ("the reason said twice, under a verse that does not hold it", None,
     ("TWICE", lambda v: {**v, "rows": v["rows"][:1] + [{**v["rows"][1], "ref": "Genesis 9:7"}]}), "is not in Genesis 9:7"),
    ("a word said to be unnamed that the verse names", None,
     ("TWICE", lambda v: {**v, "not_named": {**v["not_named"], "words": v["not_named"]["words"] + ["female"]}}), "does not name 'female'"),
    ("Open your mouth counted wrong", None, ("MOUTH", lambda v: {**v, "expect": 3}), "not 3"),
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
            study = build_module.parse(builder, text)
            build_figures(builder, lists, text, study)
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
