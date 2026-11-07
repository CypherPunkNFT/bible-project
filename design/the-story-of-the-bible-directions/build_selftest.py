"""The self-test for build-data.py: wrong inputs fed in memory, each of which must be refused for its own reason (the
error must contain the words given). Run it as
python design/the-story-of-the-bible-directions/build-data.py --selftest  (it writes nothing)."""
import copy

import study_lists
from scripture_text import BuildError


def selftest(bible: dict, content: str, build, OUT) -> int:
    """Each wrong input must be refused with its expected message. data.js's bytes are compared before and after."""
    def lists_with(change):
        lists = copy.deepcopy({k: v for k, v in vars(study_lists).items() if k.isupper()})
        change(lists)
        return type("Lists", (), lists)

    def mark(thread, index, **values):
        return lambda l: next(t for t in l["THREADS"] if t["id"] == thread)["marks"][index].update(values)
    same = lambda lists: None  # noqa: E731
    cases = [
        ("a changed word in a block quotation", content.replace("He will crush your head, and you will strike his heel.", "He will crush your head, and you will bruise his heel.", 1), same, "not word for word the Berean"),
        ("a block quotation under the wrong reference", content.replace("Judges 21:25 · BSB", "Judges 21:24 · BSB", 1), same, "not word for word the Berean"),
        ("a changed word in a quoted phrase", content.replace('"for the healing of the nations"', '"for the healing of the peoples"', 1), same, "are not in"),
        ("a quotation cited to the wrong verse", content.replace('a light for revelation to the Gentiles (Luke 2:32)', 'a light for revelation to the Gentiles (Luke 2:31)', 1).replace('"The Word" is John', '"a light for revelation" (Luke 2:31) is not John', 1), same, "are not in"),
        ("a reference that does not exist", content.replace("(Genesis 50:26)", "(Genesis 51:26)", 1), same, "does not resolve"),
        ("a link that leaves the site", content.replace("Read more in *The Holy Spirit*.", "Read more [here](https://example.com/).", 1), same, "only plain links on this site"),
        ("a link that only looks local", content.replace("Read more in *The Holy Spirit*.", "Read more [here](/\\example.com).", 1), same, "only plain links on this site"),
        ("a line the page cannot place", content.replace("Concepts:", "Stray: a line\n\nConcepts:", 1), same, "does not know how to place"),
        ("an unknown note marker", content.replace("[care] If you are grieving", "[aside] If you are grieving", 1), same, "unknown note marker"),
        ("a note to check left unclosed", content.replace("[check: edition and year]", "[check: edition and year", 1), same, "not closed"),
        ("a Jewish-tradition label on a note that is not", content.replace("[other] Jewish readers have often", "[other] Readers have often", 1), same, "does not say 'Jewish'"),
        ("a confession phrase under the wrong article", content.replace("in its article III (man)", "in its article VI (man)", 1), same, "belongs to article III"),
        ("a changed word in a confession phrase", content.replace("endeavor to make disciples of all nations", "endeavor to make disciples of all peoples", 1), same, "are not in"),
        ("a study named that the page does not know", content.replace("Read more in *The Holy Spirit*.", "Read more in *The Holy Ghost*.", 1), same, "not in STUDY_LINKS"),
        ("a part removed, so the map's eight stations no longer match", content.replace("## 07 The church sent", "### 07 The church sent", 1), same, "the eight movements"),
        ("a thread phrase not in its verse", content, mark("nations", 4, phrase="a light for the peoples"), "is not in Isaiah 49:6"),
        ("a 'kept' mark with no warrant in the study", content, mark("land", 2, state="full", study="the land was kept in full"), "are not in content.md"),
        ("a mark on a chapter the study never points to", content, mark("king", 1, ref="Matthew 2:2", phrase="King of the Jews"), "never points to Matthew 2"),
        ("marks out of story order", content, mark("dwelling", 2, at="02"), "run forward"),
        ("a movement coloured by a section none of its readings is in", content, lambda l: l["MOVEMENT_SECTION"].update({"05": "gospels"}), "coloured as gospels"),
        ("a station name that is not the concepts line", content, lambda l: l["STATION_NAMES"].__setitem__(4, "Babylon"), "is not the station names"),
        ("a three-questions ask the frame no longer has", content, lambda l: l["QUESTIONS"]["frame"].__setitem__(0, "Who am I in the story?"), "no longer asks"),
        ("a study link to a page that does not exist", content, lambda l: l["STUDY_LINKS"].update({"The Holy Spirit": "/mockups/no-such-page-directions/"}), "has no page on this PC"),
    ]
    before = OUT.read_bytes() if OUT.exists() else b""
    failures = 0
    for name, text, change, expect in cases:
        if text == content and change is same:
            print(f"  NOT TRIED (the change did not apply): {name}"); failures += 1; continue
        try:
            build(bible, text, lists_with(change))
            print(f"  NOT REFUSED: {name}"); failures += 1
        except BuildError as error:
            message = str(error).splitlines()[0]
            if expect not in message:
                print(f"  REFUSED FOR ANOTHER REASON: {name}: {message[:120]}"); failures += 1
            else:
                print(f"  refused: {name}: {message[:110]}")
    if (OUT.read_bytes() if OUT.exists() else b"") != before:
        print("  data.js changed during the self-test"); failures += 1
    if OUT.with_suffix(".js.tmp").exists():
        print("  a temporary data.js.tmp was left behind"); failures += 1
    print(f"build-data: selftest: {len(cases) - failures} of {len(cases)} wrong inputs refused for their own reason")
    return 1 if failures else 0
