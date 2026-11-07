"""Wrong inputs for the Witness and the nations build, tried in memory. Each must be refused with the reason given;
nothing is written. Run: python -B design/bearing-witness-directions/build-data.py --selftest"""
import copy

from figures import build_figures
from held import load_held
from scripture_text import BuildError, load_bible

# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None,
#  words the refusal must contain)
CASES = [
    ("a changed word in a block quotation", ("> I planted the seed and Apollos watered it", "> I planted the seed and Apollos tended it"), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Romans 15:20 · BSB", "Romans 15:19 · BSB"), None, "not word for word"),
    ("a block quotation cut off mid-sentence", ("from every nation and tribe and people and tongue, standing before the throne and before the Lamb.",
                                                 "from every nation and tribe and people and tongue."), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"my circumstances have actually served to advance the gospel"', '"my circumstances have truly served to advance the gospel"'), None, "are not in"),
    ("a quotation cited to the wrong verse", ('"with Christ" (Philippians 1:23)', '"with Christ" (Philippians 1:22)'), None, "not in Philippians 1:22"),
    ("a quotation inside nested quotes, changed", ("'Lord, who has believed our message?'", "'Lord, who has trusted our message?'"), None, "are not in"),
    ("a reference that does not exist", ("(Romans 11:1–2)", "(Romans 11:1–92)"), None, "does not resolve"),
    ("a chapter range that does not exist", ("Paul wrote Romans 9–11 with grief", "Paul wrote Romans 9–17 with grief"), None, "chapter does not exist"),
    ("a link that leaves the site", ("Read more in *The church and its calling*.", "Read more in [this](https://example.com)."), None, "only links on this site"),
    ("a protocol-relative link", ("Read more in *The church and its calling*.", "Read more in [this](//example.com/x)."), None, "only links on this site"),
    ("a link with a backslash", ("Read more in *The church and its calling*.", "Read more in [this](/\\example.com)."), None, "only links on this site"),
    ("a line the page cannot place", ("## 01 The Great Commission", "Stray: a line.\n\n## Something else\n\n## 01 The Great Commission"), None, "section heading"),
    ("a heading the page does not know", ("## Questions readers ask", "## Questions people ask"), None, "section heading"),
    ("an italic that is neither a study nor a known term", ("A *commission* is", "A *charge* is"), None, "italic"),
    ("a list item in an unknown form", ("- **Listen first.** Learn", "- Listen first. Learn"), None, "list item"),
    ("a second 'Its limits' in one part", ("**Its limits.** Gracious does not mean vague.", "**Its limits.** One.\n\n**Its limits.** Gracious does not mean vague."), None, "second one"),
    ("Main readings in a form the page does not read", ("**Main readings:** Romans 15:18–21; with Revelation 7:9 quoted", "**Main readings:** Romans 15:18–21; and Revelation 7:9"), None, "Main readings must read"),
    ("a close with a fifth paragraph", ("Read the passage again before you answer.", "One more line.\n\nRead the passage again before you answer."), None, "the close must have"),
    ("a changed word in a confession quotation", ('"God alone is Lord of the conscience"', '"God alone is the Lord of the conscience"'), None, "are not in"),
    ("a confession quotation under the wrong article in the text", ("Article XVII (religious liberty)", "Article XV (religious liberty)"), None, "names article XV"),
    ("a not-held quotation in a form the mark misses", ("\"God's eternal choice", "\"God’s eternal choice"), None, "without its mark"),
    ("a confession quotation searched in the wrong article", ('Lord" (article IV, salvation)', 'Lord"'),
     ("BFM_QUOTES", lambda v: {**v, "There is no salvation apart from personal faith in Jesus Christ as Lord": "V"}), "not in article V"),
    ("a misquote entry for words that are in the verse", None,
     ("SCRIPTURE_MISQUOTES", lambda v: {**v, "with Christ": ("Philippians 1:23", "with Christ")}), "word for word in Philippians 1:23"),
    ("an own-term entry the text does not use", None, ("OWN_TERMS", lambda v: {**v, ("01", "nonsense"): "test"}), "OWN_TERMS has entries"),
    ("a study link the text does not use", None, ("STUDY_LINKS", lambda v: {**v, "The hope to come": "the-hope-to-come-directions"}), "STUDY_LINKS has entries"),
    ("the chain with a link left out", None, ("CHAIN", lambda v: v[:2] + v[3:]), "the chain must be"),
    ("the chain out of the verses' order", None, ("CHAIN", lambda v: [v[1], v[0]] + v[2:]), "the chain must be"),
    ("a chain link with words not in its verse", None, ("CHAIN", lambda v: v[:3] + [{**v[3], "words": "without someone to send"}] + v[4:]), "is not in Romans 10:14"),
    ("a chain link given a place without the study's words", None, ("CHAIN", lambda v: v[:2] + [{**v[2], "whose": "hears"}] + v[3:]), "needs the study's words"),
    ("a study line the study does not have", None, ("PLACES", lambda v: [{**v[0], "study": "The going is optional."}] + v[1:]), "not in the study's own text"),
    ("a phrase from outside its passage", None,
     ("PLACES", lambda v: [{**v[0], "god": v[0]["god"] + [("Acts 1:8", "you will receive power")]}] + v[1:]), "outside its passage"),
    ("a phrase in two places", None,
     ("PLACES", lambda v: v[:4] + [{**v[4], "hears": [("1 Corinthians 3:6", "God made it grow")]}] + v[5:]), "is in two places"),
    ("the rings out of the verse's order", None, ("RINGS", lambda v: [v[1], v[0], v[2]]), "in the verse's order"),
    ("a part missing from the places table", None, ("PLACES", lambda v: v[:-1]), "one row per part"),
]


def run_selftest(build_module) -> int:
    lists = build_module.L
    bible, held = load_bible(), load_held(lists.BFM_PATH)
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
