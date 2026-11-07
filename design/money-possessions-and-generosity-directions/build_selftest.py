"""Wrong inputs for the Money, possessions and generosity build, tried in memory. Each must be refused with the reason
given; nothing is written. Run: python -B design/money-possessions-and-generosity-directions/build-data.py --selftest"""
import copy

from figures import build_figures
from held import load_held
from scripture_text import BuildError, load_bible

# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None,
#  words the refusal must contain)
CASES = [
    ("a changed word in a block quotation", ("> No servant can serve two masters.", "> No servant can serve three masters."), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Luke 16:13 · BSB", "Luke 16:14 · BSB"), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"I am too weak to dig', '"I am too tired to dig'), None, "are not in"),
    ("a quotation cited to the wrong verse", ("(Malachi 3:7)", "(Malachi 3:8)"), None, "not in Malachi 3:8"),
    ("a reference that does not exist", ("(Nehemiah 13:10)", "(Nehemiah 13:99)"), None, "does not resolve"),
    ("a chapter that does not exist", ("unjust judge in Luke 18", "unjust judge in Luke 25"), None, "chapter does not exist"),
    ("a link that leaves the site", ("[Help for life](/resources/life), lists more", "[Help for life](https://example.com), lists more"), None, "only links on this site"),
    ("a protocol-relative link", ("[Help for life](/resources/life), lists more", "[Help for life](//example.com/life), lists more"), None, "only links on this site"),
    ("a line the page cannot place", ("Selection: This is a selection", "A stray line.\n\nSelection: This is a selection"), None, "outside any section"),
    ("an italic that is neither a study, a question nor a known term", ("*denarius*", "*drachma*"), None, "italic"),
    ("a confession quotation with a changed word, in the text and the list", ('"a binding stewardship in their possessions"', '"a binding stewardship of their possessions"'),
     ("OUTSIDE_QUOTES", lambda v: {**{k: x for k, x in v.items() if k != "a binding stewardship in their possessions"},
                                   "a binding stewardship of their possessions": v["a binding stewardship in their possessions"]}), "not in the held copy"),
    ("a confession quotation searched in the wrong article", None,
     ("OUTSIDE_QUOTES", lambda v: {**v, "every form of greed": ("Baptist Faith and Message 2000, article XIII", "bfm", "XIII")}), "not in the held copy"),
    ("a misquotation entry that would hide a real match", None,
     ("MISQUOTES", lambda v: {**v, ("01", "your silver and gold increase and all that you have is multiplied"): ("Deuteronomy 8:13", "your silver and gold increase")}), "word for word in Deuteronomy 8:13"),
    ("a misquotation removed, so the study's wording must stand alone", None,
     ("MISQUOTES", lambda v: {k: x for k, x in v.items() if k[0] != "07"}), "not in Mark 12:40"),
    ("an own-term entry the text does not use", None, ("OWN_TERMS", lambda v: {**v, ("01", "nonsense"): "test"}), "OWN_TERMS has entries"),
    ("an address line that is not the study's own words", None,
     ("PART_ADDRESS", lambda v: {**v, "04": {**v["04"], "not": ("It is a rate of return", "04")}}), "not the study's own words"),
    ("an address line not in its verse", None,
     ("HEARD", lambda v: [{**v[0], "under": ("His covenant that He swore to Moses", "Deuteronomy 8:18")}] + v[1:]), "not in Deuteronomy 8:18"),
    ("a line said to be heard wrongly in words the study does not use", None,
     ("HEARD", lambda v: v[:2] + [{**v[2], "heard": ("A proverb is a promise", "opening")}] + v[3:]), "not the study's own words"),
    ("the order of Deuteronomy 8 changed", None,
     ("ORDER", lambda v: {**v, "steps": [v["steps"][1], v["steps"][0]] + v["steps"][2:]}), "after the step before it"),
    ("the proud heart put before a gift", None,
     ("ORDER", lambda v: {**v, "steps": v["steps"][:3] + [{**v["steps"][3], "kind": "heart"}] + v["steps"][4:]}), "the heart's steps are exactly"),
    ("David's prayer said to speak of the givers more than of God", None, ("YOURS", lambda v: {**v, "more_you": False}), "words for God"),
    ("a bill's number not in its verse", None, ("BILLS", lambda v: [{**v[0], "now_words": "write forty"}] + v[1:]), "not in Luke 16:6"),
    ("a bill that grows instead of shrinking", None, ("BILLS", lambda v: [{**v[0], "now": 150}] + v[1:]), "must be cut"),
    ("a guest not named in Deuteronomy 14:29", None,
     ("TITHE", lambda v: {**v, "guests": v["guests"][:3] + [{"word": "the orphan", "why": "test"}]}), "not in Deuteronomy 14:29"),
    ("the poor's years moved", None, ("TITHE", lambda v: {**v, "poor": [2, 6]}), "third and sixth"),
    ("the habit's steps out of order", None, ("WAY_STEPS", lambda v: [v[1], v[0]] + v[2:]), "after the step before it"),
    ("a part left without an address", None, ("PART_ADDRESS", lambda v: {k: x for k, x in v.items() if k != "06"}), "PART_ADDRESS covers"),
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
            builder = build_module.Builder(bible, held, build_module.question_titles(text))
            study = build_module.parse(builder, text)
            build_figures(builder, lists, study, text)
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
