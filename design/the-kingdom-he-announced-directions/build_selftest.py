"""The self-test for build-data.py: wrong inputs fed in memory, each of which must be refused. Run it as
python design/the-kingdom-he-announced-directions/build-data.py --selftest  (it writes nothing)."""
import copy

import study_lists
from scripture_text import BuildError


def selftest(bible: dict, content: str, build, OUT) -> int:
    """Each wrong input must be refused. Nothing is written; data.js's bytes are compared before and after."""
    def lists_with(change):
        lists = copy.deepcopy({k: v for k, v in vars(study_lists).items() if k.isupper()})
        change(lists)
        return type("Lists", (), lists)
    same = lambda lists: None  # noqa: E731
    cases = [
        ("a changed word in a block quotation", content.replace("and the kingdom of God is near. Repent", "and the kingdom of God is here. Repent", 1), same),
        ("a block quotation under the wrong reference", content.replace("Luke 11:20 · BSB", "Luke 11:21 · BSB", 1), same),
        ("a changed word in a quoted phrase", content.replace('"This is the finger of God"', '"This is the hand of God"', 1), same),
        ("a quotation cited to the wrong verse", content.replace('"After a long time the master of those servants returned" (Matthew 25:19)', '"After a long time the master of those servants returned" (Matthew 25:18)', 1), same),
        ("a reference that does not exist", content.replace("(Luke 11:14)", "(Luke 25:14)", 1), same),
        ("a link that leaves the site", content.replace("Read more in *Encounters with Jesus*.", "Read more [here](https://example.com/).", 1), same),
        ("a link that only looks local", content.replace("Read more in *Encounters with Jesus*.", "Read more [here](/\\example.com).", 1), same),
        ("a line the page cannot place", content.replace("Concepts:", "Stray: a line\n\nConcepts:", 1), same),
        ("a quotation cut with … in the wrong order", content.replace('"I knew that you are a hard man … So I was afraid"', '"So I was afraid … I knew that you are a hard man"', 1), same),
        ("a confession phrase under the wrong article", content.replace("as article IV (salvation) of the confession", "as article VI (salvation) of the confession", 1), same),
        ("a changed word in a confession phrase", content.replace("trustful, childlike commitment", "trustful, childish commitment", 1), same),
        ("a tense verb not in its verse", content, lambda l: l["TENSES"][1]["verbs"][0].update(clause="the kingdom of God is here", verb="is here")),
        ("a parable opening not in its verse", content, lambda l: l["PARABLES"][2].update(opening="The kingdom of heaven is like a fig tree")),
        ("a parable kind the part's question does not name", content, lambda l: l["KINDS"].append(("joy", "Joy"))),
        ("the selection's count changed", content.replace("seven passages", "six passages", 1), same),
        ("an outside quotation that is really a verse", content, lambda l: l["OUTSIDE_QUOTES"].update({"This is the finger of God": "not Scripture"})),
        ("a study link to a page that does not exist", content, lambda l: l["STUDY_LINKS"].update({"Grief and dying": "/mockups/no-such-page-directions/"})),
    ]
    before = OUT.read_bytes() if OUT.exists() else b""
    failures = 0
    for name, text, change in cases:
        if text == content and change is same:
            print(f"  NOT TRIED (the change did not apply): {name}"); failures += 1; continue
        try:
            build(bible, text, lists_with(change))
            print(f"  NOT REFUSED: {name}"); failures += 1
        except BuildError as error:
            print(f"  refused: {name}: {str(error).splitlines()[0][:110]}")
    if (OUT.read_bytes() if OUT.exists() else b"") != before:
        print("  data.js changed during the self-test"); failures += 1
    print(f"build-data: selftest: {len(cases) - failures} of {len(cases)} wrong inputs refused")
    return 1 if failures else 0
