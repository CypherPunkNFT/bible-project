"""Wrong inputs for The Christian and the state build, tried in memory. Each must be refused with the reason given;
nothing is written. Run: python -B design/the-christian-and-the-state-directions/build-data.py --selftest"""
import copy

from figures import build_figures
from held import load_held
from scripture_text import BuildError, load_bible

# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None,
#  words the refusal must contain)
CASES = [
    ("a changed word in a block quotation", ("> Then Jesus told them,", "> Then Jesus said to them,"), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Mark 12:17 · BSB", "Mark 12:16 · BSB"), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"from among your brothers"', '"from among your kinsmen"'), None, "are not in"),
    ("a quotation cited to the wrong verse", ("brothers\" (Deuteronomy 17:15)", "brothers\" (Deuteronomy 17:16)"), None, "not in Deuteronomy 17:16"),
    ("a reference that does not exist", ("(Acts 23:8 says so)", "(Acts 23:88 says so)"), None, "does not resolve"),
    ("a chapter range that does not exist", ("(1 Kings 10–11 tells the story)", "(1 Kings 10–23 tells the story)"), None, "chapter does not exist"),
    ("a link that leaves the site", ("Read more in *Encounters with Jesus*.", "Read more in [this](https://example.com)."), None, "only links on this site"),
    ("a protocol-relative link", ("Read more in *Encounters with Jesus*.", "Read more in [this](//example.com/x)."), None, "only links on this site"),
    ("a link with a tab that a browser would drop", ("Read more in *Encounters with Jesus*.", "Read more in [this](/\t/example.com)."), None, "only links on this site"),
    ("a link with a backslash", ("Read more in *Encounters with Jesus*.", "Read more in [this](/\\example.com)."), None, "only links on this site"),
    ("a line the page cannot place", ("Selection: This is a selection", "A stray line.\n\nSelection: This is a selection"), None, "outside any section"),
    ("a heading the page does not know", ("## Two columns", "## Three columns"), None, "section heading"),
    ("an italic that is neither a study nor a known term", ("*torah*, God's", "*tora*, God's"), None, "italic"),
    ("a changed word in a confession quotation", ('"God alone is Lord of the conscience"', '"God alone is the Lord of the conscience"'), None, "are not in"),
    ("a not-held quotation in a form the mark misses", ('"engage in just wars"', '"engage in just wars,"'), None, "without its mark"),
    ("a confession quotation searched in the wrong article", None,
     ("OUTSIDE_QUOTES", lambda v: {**v, "on principles of righteousness": ("Baptist Faith and Message 2000, article XV", "bfm", "XV")}), "not in the held copy"),
    ("a wrong correction of the 1677 confession", None,
     ("OUTSIDE_MISQUOTES", lambda v: {k: e[:3] + ("wage war upon just and needful occasions",) for k, e in v.items()}), "does not have it"),
    ("an own-term entry the text does not use", None, ("OWN_TERMS", lambda v: {**v, ("01", "nonsense"): "test"}), "OWN_TERMS has entries"),
    ("a part with no state line", None, ("STATES", lambda v: {k: s for k, s in v.items() if k != "04"}), "no entry in STATES"),
    ("one 'He will take' row left out", None, ("TAKES", lambda v: v[:-1]), "says 'take' 6 times"),
    ("a take row whose words are not in its verse", None, ("TAKES", lambda v: [{**v[0], "words": "He will take your sons and daughters"}] + v[1:]), "is not in 1 Samuel 8:11"),
    ("Solomon's horses shown wrong", None,
     ("LIMITS", lambda v: [{**v[0], "shown": [("12,500", "12,000 horses")]}] + v[1:]), "shows 12,500"),
    ("Solomon's wives shown wrong", None,
     ("LIMITS", lambda v: v[:1] + [{**v[1], "shown": [("1,000", "seven hundred wives")]}] + v[2:]), "shows 1,000"),
    ("Isaiah's steps out of order", None, ("ISAIAH", lambda v: [v[1], v[0]] + v[2:]), "own order"),
    ("a date the study does not give", None, ("DATES", lambda v: [{**v[0], "year": "1611"}] + v[1:]), "not in the study's own text"),
    ("a check note the study does not have", None, ("DATES", lambda v: [{**v[0], "check": "nothing like this"}] + v[1:]), "does not begin any"),
    ("Jeremiah put inside the ruler's coin", None,
     ("ITEMS", lambda v: v + [{"id": "city", "col": "ruler", "label": "x", "words": "Seek the prosperity of the city", "ref": "Jeremiah 29:7", "part": "03"}]), "belongs in part 03 only"),
    ("a view's words not in the study", None,
     ("VIEWS", lambda v: {**v, "both": v["both"] + ["War is sometimes good"]}), "not in the study's own text"),
    ("a verb that is not in its own verse", None, ("OWED", lambda v: [{**v[0], "verb": "Render"}] + v[1:]), "not a word of its own phrase"),
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
