"""Wrong inputs for the Children and the home build, tried in memory. Each must be refused with the reason given;
nothing is written. Run: python -B design/children-and-the-home-directions/build-data.py --selftest"""
import copy

import figures as F
from held import load_held
from scripture_text import BuildError, load_bible

# (what is tried, a change to content.md as (old, new) or None, a change to a list as (module, name, function) or None,
#  words the refusal must contain). module "L" is study_lists, "F" is figures.
CASES = [
    ("a changed word in a block quotation", ("> Train up a child in the way he should go", "> Raise up a child in the way he should go"), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Proverbs 22:6 · BSB", "Proverbs 22:7 · BSB"), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"a taste for wild game"', '"a taste for wild meat"'), None, "are not in"),
    ("a quotation cited to the wrong verse", ('"a little robe" (2:19)', '"a little robe" (2:20)'), None, "not in 1 Samuel 2:20"),
    ("a reference that does not exist", ("(Genesis 37:28)", "(Genesis 37:88)"), None, "does not resolve"),
    ("a chapter that does not exist", ("(Genesis 27)", "(Genesis 57)"), None, "chapter does not exist"),
    ("a link that leaves the site", ("[Help for life](/resources/life)", "[Help for life](https://example.com/help)"), None, "only links on this site"),
    ("a protocol-relative link", ("[Help for life](/resources/life)", "[Help for life](//example.com/help)"), None, "only links on this site"),
    ("a line the page cannot place", ("Frame: Scripture speaks", "A stray line before the frame.\n\nFrame: Scripture speaks"), None, "outside any section"),
    ("an italic that is neither a study nor a known term", ("*mezuzah*", "*mezuza*"), None, "italic"),
    ("a confession phrase changed", ('"through consistent lifestyle example and loving discipline"', '"through a consistent lifestyle example and loving discipline"'), None, "are not in"),
    ("a confession phrase searched in the wrong article", None,
     ("L", "OUTSIDE_QUOTES", lambda v: {**v, "to teach their children spiritual and moral values": ("BFM, article XVII", "bfm", "XVII")}), "not in the held copy"),
    ("a part with its 'Its limits' note removed", ("**Its limits.** These are songs,", "These are songs,"), None, "exactly one 'Its limits'"),
    ("a block quotation with no kind of sentence", None, ("L", "QUOTE_KINDS", lambda v: {k: x for k, x in v.items() if k != "Luke 15:20"}), "no kind of sentence"),
    ("a kind's sample the verse does not hold", None, ("L", "KINDS", lambda v: {**v, "song": {**v["song"], "ref": "Psalm 127:4"}}), "sample is not in"),
    ("an own-term entry the text does not use", None, ("L", "OWN_TERMS", lambda v: {**v, ("01", "nonsense"): "test"}), "OWN_TERMS has entries"),
    ("a spelling entry that hides a real difference", None,
     ("L", "SPELLING", lambda v: {("q1", "honour your father and mother"): ("Ephesians 6:2", "Honor your mother and father")}), "only in British spelling"),
    ("the rings of Deuteronomy 6 put out of order", None,
     ("F", "RINGS", lambda v: {**v, "rings": [v["rings"][3]] + v["rings"][:3] + v["rings"][4:]}), "step backwards"),
    ("the five generations in the wrong order", None,
     ("F", "CHAIN", lambda v: {**v, "links": [v["links"][1], v["links"][0]] + v["links"][2:]}), "after the piece before it"),
    ("the count of 'in vain' changed", None, ("F", "VAIN", lambda v: {**v, "count": 4}), "not 4"),
    ("a reason Genesis does not give", None,
     ("F", "LOVES", lambda v: v[:1] + [{**v[1], "why": "because Jacob stayed at home"}] + v[2:]), "are not in Genesis 25:28"),
    ("a reason hidden where Genesis gives one", None,
     ("F", "LOVES", lambda v: [{**v[0], "why": None}] + v[1:]), "gives no reason"),
    ("a Samuel thread that does not name him", None,
     ("F", "THREADS", lambda v: [("samuel", "1 Samuel 2:12–17")] + v[1:]), "does not name Samuel"),
    ("the father's acts on the road out of order", None,
     ("F", "ROAD", lambda v: {**v, "acts": ["He ran to his son", "saw him"] + v["acts"][2:]}), "after the piece before it"),
]


def run_selftest(build_module) -> int:
    lists = build_module.L
    bible, held = load_bible(), load_held(lists.HELD)
    original = build_module.CONTENT.read_text(encoding="utf-8")
    modules = {"L": lists, "F": F}
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
            module, attribute, change = list_change
            saved = getattr(modules[module], attribute)
            setattr(modules[module], attribute, change(copy.deepcopy(saved)))
        try:
            build_module.build_study(text, lists, bible, held)
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
                setattr(modules[list_change[0]], list_change[1], saved)
    print(f"selftest: {len(CASES) - failures} of {len(CASES)} wrong inputs refused for the right reason")
    return 1 if failures else 0
