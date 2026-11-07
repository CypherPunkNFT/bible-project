"""Wrong inputs for build-data.py --selftest: each is fed in memory and must be refused for the reason named. Writes nothing."""
import copy

from scripture_text import BuildError

# (what is wrong, change to content.md as (old, new), or None, expected words in the refusal)
TEXT_CASES = [
    ("a changed word in a block quotation", ("your people will be my people", "your nation will be my people"), "not word for word the Berean at Ruth 1:16"),
    ("a block quotation under the wrong reference", ("Ruth 1:16 · BSB", "Ruth 1:17 · BSB"), "not word for word the Berean at Ruth 1:17"),
    ("a changed word in a quoted phrase", ('"laughed to herself"', '"laughed at herself"'), "laughed at herself"),
    ("a quote cited to the wrong verse", ("(Genesis 21:1 · BSB)", "(Genesis 21:2 · BSB)"), "Genesis 21:2"),
    ("a reference that does not exist", ("(Genesis 16:2)", "(Genesis 16:20)"), "does not resolve"),
    ("a reference that does not exist, in a part's readings", ("Ruth 1:1–22;", "Ruth 5:1–22;"), "does not resolve"),
    ("a link that leaves the site", ("(/topics/c/people-women)", "(https://example.com/women)"), "only site links"),
    ("a line the page cannot place", ("## 05 Esther", "#### 05 Esther"), "does not know how to place"),
    ("a changed word in an outside quotation", ("an unusual leader, with great", "a rare leader, with great"), "quoted words 'a rare leader"),
    ("a changed word in the closing paragraph", ("heard Hannah", "answered Hannah"), "heard 'Hannah'"),
]


def list_cases(lists):
    """(what is wrong, a function that breaks a copy of the lists, expected words in the refusal)."""
    def memory_wrong_verse(l):
        l.WOMEN[0]["memory"][0] = ("Hebrews 11:31", "named", "Sarah", "By faith Sarah")
    def memory_not_cited(l):
        l.WOMEN[1]["memory"][0] = ("Galatians 5:1", "aside", "Hagar", "This is Hagar")
    def line_not_in_verse(l):
        l.WOMEN[6]["line"] = ("your God will be my God", "Ruth 1:17")
    def motto_changed(l):
        l.MOTTO = {"lines": ["What she has done", "will be remembered."], "ref": "Mark 14:9"}
    def outside_in_wrong_source(l):
        l.OUTSIDE_QUOTES["she becomes an apostle to the apostles"] = "henry-acts"
    def a_story_dropped(l):
        l.WOMEN.pop()
    def link_to_missing_mockup(l):
        l.STUDY_LINKS["The church and its calling"] = "../no-such-study-directions/"
    return [
        ("a remembering verse that does not name her", memory_wrong_verse, "does not hold 'Sarah'"),
        ("a remembering verse the study does not cite", memory_not_cited, "is not cited in content.md"),
        ("her line given to the wrong verse", line_not_in_verse, "is not in Ruth 1:17"),
        ("a motto not in its verse", motto_changed, "is not in Mark 14:9"),
        ("an outside quotation looked for in the wrong held source", outside_in_wrong_source, "not found in its held source (henry-acts)"),
        ("a story dropped from the list", a_story_dropped, "the study reads 16 stories"),
        ("a study link to a mock-up that does not exist", link_to_missing_mockup, "has no index.html"),
    ]


def run_selftest(build, text, lists) -> int:
    names = ("WOMEN", "MOTTO", "OUTSIDE_QUOTES", "STUDY_LINKS")
    saved = {n: copy.deepcopy(getattr(lists, n)) for n in names}
    failures, results = 0, []
    cases = [(what, (lambda t=t, old=old, new=new: (t.replace(old, new, 1), None)) if old in text else None, expect)
             for what, (old, new), expect in TEXT_CASES for t in [text]]
    cases += [(what, (lambda breaker=breaker: (text, breaker)), expect) for what, breaker, expect in list_cases(lists)]
    for what, make, expect in cases:
        if make is None:
            results.append(f"FAIL  {what}: the text it changes is no longer in content.md"); failures += 1
            continue
        wrong_text, breaker = make()
        for n in names:
            setattr(lists, n, copy.deepcopy(saved[n]))
        if breaker:
            breaker(lists)
        try:
            build(wrong_text)
            results.append(f"FAIL  {what}: accepted"); failures += 1
        except BuildError as error:
            ok = expect in str(error)
            failures += not ok
            results.append(f"{'ok   ' if ok else 'FAIL '} {what}: refused: {str(error).splitlines()[0][:150]}")
        finally:
            for n in names:
                setattr(lists, n, copy.deepcopy(saved[n]))
    print("\n".join(results))
    print(f"selftest: {len(cases) - failures} of {len(cases)} wrong inputs refused for the expected reason; nothing written")
    return 1 if failures else 0
