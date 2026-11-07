"""Wrong inputs for The wisdom books build, tried in memory. Each must be refused with the reason given; nothing is
written. Run: python -B design/the-wisdom-books-directions/build-data.py --selftest"""
import copy

from figures import build_figures
from held import load_held
from scripture_text import BuildError, load_bible

# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None,
#  words the refusal must contain)
CASES = [
    ("a changed word in a block quotation", ("> But where can wisdom be found,", "> But where can wisdom be discovered,"), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Job 38:4 · BSB", "Job 38:5 · BSB"), None, "not word for word"),
    ("a block quotation cut short at its end", ("Blessed be the name of the LORD.\n", "Blessed be the name.\n"), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"heard a rumor about it"', '"heard a whisper about it"'), None, "are not in"),
    ("a quotation cited to the wrong verse", ('"It cannot be bought with gold" (Job 28:15)', '"It cannot be bought with gold" (Job 28:16)'), None, "not in Job 28:16"),
    ("a reference that does not exist", ("(Job 42:15)", "(Job 42:18)"), None, "does not resolve"),
    ("a chapter range that does not exist", ("(Job 32–37)", "(Job 32–43)"), None, "chapter does not exist"),
    ("a link that leaves the site", ("Read more in *Grief and dying*.", "Read more in [this](https://example.com)."), None, "only links on this site"),
    ("a protocol-relative link", ("Read more in *Grief and dying*.", "Read more in [this](//example.com/x)."), None, "only links on this site"),
    ("a link with a tab that a browser would drop", ("Read more in *Grief and dying*.", "Read more in [this](/\t/example.com)."), None, "only links on this site"),
    ("a link with a backslash", ("Read more in *Grief and dying*.", "Read more in [this](/\\example.com)."), None, "only links on this site"),
    ("a line the page cannot place", ("Selection: This is a selection", "A stray line.\n\nSelection: This is a selection"), None, "outside any section"),
    ("a heading the page does not know", ("## Reading the wisdom books", "## Reading the wisdom books well"), None, "section heading"),
    ("an italic that is neither a study nor a known term", ("*Orations against the Arians*", "*Orations against Arius*"), None, "italic"),
    ("a changed word in a confession quotation", ('"cheerfully, regularly, systematically, proportionately, and liberally"', '"cheerfully, regularly, systematically, proportionately, and generously"'), None, "are not in"),
    ("a not-held quotation in a form the mark misses", ('"begotten, not made"', '"begotten, not made,"'), None, "without its mark"),
    ("a third note under the paired subheading", ("[open] The confession this site writes under does not say how to read the Song", "[read] The confession this site writes under does not say how to read the Song"), None, "exactly two"),
    ("a confession quotation searched in the wrong article", None,
     ("OUTSIDE_QUOTES", lambda v: {**v, "one man and one woman in covenant commitment for a lifetime": ("the Baptist Faith and Message 2000, article XV", "bfm", "XV")}), "not in the held copy"),
    ("a speaker line for a passage the page does not print", None, ("SPEAKERS", lambda v: {**v, "Job 28:1": {"who": "x", "kind": "y"}}), "speaker line"),
    ("a printed passage with no speaker line", None, ("SPEAKERS", lambda v: {k: s for k, s in v.items() if k != "Job 38:4"}), "speaker line"),
    ("Elihu given God's verdict on the friends", None,
     ("BOOKS", lambda v: [{**v[0], "voices": [{**x, "verdict": True} if x["name"] == "Elihu" else x for x in v[0]["voices"]]}] + v[1:]), "only Eliphaz"),
    ("the Song drawn as meeting the shared line", None,
     ("BOOKS", lambda v: v[:3] + [{**v[3], "floor": [{"words": "love is as strong as death", "ref": "Song of Songs 8:6"}]}]), "must hold the word 'fear'"),
    ("a floor point that misquotes its verse", None,
     ("BOOKS", lambda v: [{**v[0], "floor": [{"words": "the fear of the LORD", "ref": "Job 28:28"}]}] + v[1:]), "is not in Job 28:28"),
    ("a voice from a verse the study does not cite", None,
     ("BOOKS", lambda v: v[:3] + [{**v[3], "end": {"words": "Comfort, comfort My people", "ref": "Isaiah 40:1"}}]), "not inside any passage the study cites"),
    ("the shaft's layers out of the poem's order", None, ("SHAFT", lambda v: [v[1], v[0]] + v[2:]), "text's own order"),
    ("a question word not in its verse", None, ("QUESTIONS", lambda v: [("whale", "Job 38:4")] + v[1:]), "is not in Job 38:4"),
    ("God's questions out of order", None, ("QUESTIONS", lambda v: v[1:2] + v[:1] + v[2:]), "text's own order"),
    ("Folly's call taken from a verse that differs from Wisdom's", None,
     ("TABLES", lambda v: [v[0], {**v[1], "call": "Proverbs 9:15"}]), "word for word the same"),
    ("the pair's second saying given the first one's head", None, ("PAIR", lambda v: [v[0], {**v[1], "head": "Do not answer"}]), "does not begin"),
    ("a count of times the verses do not hold", None, ("TIMES_COUNT", lambda v: 15), "holds 14 pairs"),
    ("the refrain given a fourth verse", None,
     ("REFRAIN", lambda v: {**v, "refs": v["refs"] + ["Song of Songs 5:8"]}), "is not in Song of Songs 5:8"),
    ("a line of belonging with words its verse does not have", None,
     ("BELONGING", lambda v: v[:2] + [("I belong to my beloved,", "he belongs to me", "Song of Songs 7:10")]), "is not in Song of Songs 7:10"),
    ("a study phrase the study does not have", None, ("SHAFT_BOTTOM", lambda v: "Wisdom is not down here."), "not in the study's own text"),
    ("an own-term entry the text does not use", None, ("OWN_TERMS", lambda v: {**v, ("02", "nonsense"): "test"}), "OWN_TERMS has entries"),
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
            if old not in text:
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
            if expected not in str(error):
                print(f"selftest: REFUSED FOR THE WRONG REASON: {name}: {error}")
                failures += 1
            else:
                print(f"selftest: refused, as it should be: {name} ({str(error).splitlines()[0][:110]})")
        finally:
            if list_change:
                setattr(lists, list_change[0], saved)
    print(f"selftest: {len(CASES) - failures} of {len(CASES)} wrong inputs refused for the right reason")
    return 1 if failures else 0
