"""Prove build-data.py refuses wrong inputs. Each case changes one thing in memory and must raise BuildError with the
expected words. Nothing is written: data.js's bytes and time are compared before and after.
Run from Website/: python design/following-jesus-directions/build-data.py --selftest
"""
from scripture_text import BuildError

# (what is wrong, how to make it wrong, words the refusal must contain)
CONTENT_CASES = [
    ("a changed word in a block quotation", ("built his house on the rock.\n", "built his house upon the rock.\n"), "not word for word"),
    ("a block quotation under the wrong reference", ("Matthew 7:24 · BSB", "Matthew 7:25 · BSB"), "not word for word"),
    ("a changed word in a quoted phrase", ('"You cannot serve both God and money"', '"You cannot serve God and money"'), "quoted words"),
    ("a quote cited to the wrong verse", ('there your heart will be also" (Matthew 6:21)', 'there your heart will be also" (Matthew 6:22)'), "quoted words"),
    ("a reference that does not exist", ("**Main readings:** Matthew 5:1–16", "**Main readings:** Matthew 5:1–49"), "does not resolve"),
    ("a link that leaves the site", ("Read more in *The kingdom he announced*.", "Read more in [the kingdom](https://example.com/)."), "only links to this site"),
    ("a protocol-relative link", ("Read more in *The kingdom he announced*.", "Read more in [the kingdom](//example.com/)."), "only links to this site"),
    ("a line the page cannot place", ("## 01 Blessed", "### A stray heading\n\n## 01 Blessed"), "does not know how to place"),
    ("a relative verse outside its part", ("which reads verses 27–32 for its own questions", "which reads verses 27–52 for its own questions"), "outside its main readings"),
    ("a crisis number that is not a checked help line", ("call or text 988", "call or text 989"), "crisis number 988"),
    ("a care note turned into a plain paragraph", ("[care] Anxiety can be an illness", "Anxiety can be an illness"), "care notes"),
    ("an unpaired quotation mark", ('"Hate" here is', '"Hate here is'), "odd number of quotation marks"),
]


def list_cases(lists: dict) -> list:
    """Each returns a broken copy of the lists. The caller passes a fresh deep copy every time."""
    def phrase(l):
        l["LINES"][1]["phrase"] = "turn to him the other cheek"; return l
    def outside_whole(l):
        l["LINES"][7]["after_ref"] = "Luke 15:4"; l["LINES"][7]["after_phrase"] = "a hundred sheep"; return l
    def fact(l):
        l["FACTS"][0] = (l["FACTS"][0][0], l["FACTS"][0][1], l["FACTS"][0][2], 7); return l
    def stale_fix(l):
        l["MISQUOTE_FIXES"].append({"was": "words that are not in the study", "now": "Jesus wept", "ref": "John 11:35"}); return l
    def beatitude(l):
        l["BEATITUDES"][2] = ("Matthew 5:5", "the meek", "they will inherit the kingdom"); return l
    def pair(l):
        l["PAIRS"][3]["two_ref"] = "Matthew 7:24"; return l
    def study_link(l):
        l["STUDY_LINKS"]["The kingdom he announced"] = "https://example.com/"; return l
    def ranges(l):
        l["PART_RANGES"]["02"] = "Matthew 5:17–47"; return l
    return [("a famous line's phrase changed", phrase, "not in Matthew 5:39"),
            ("a famous line's verse outside its whole", outside_whole, "not inside Luke 14:25–35"),
            ("a wrong count in a stated fact", fact, "6 times, not 7"),
            ("a misquote fix that no longer applies", stale_fix, "no longer applies"),
            ("a beatitude promise changed", beatitude, "not in Matthew 5:5"),
            ("a pair's phrase under the wrong verse", pair, "not in Matthew 7:24"),
            ("a study link that leaves the site", study_link, "leaves the site"),
            ("the parts' ranges with a gap", ranges, "cover the sermon")]


def run_selftest(build, default_lists, read_content, load_bible, out) -> int:
    before = (out.read_bytes(), out.stat().st_mtime_ns) if out.exists() else None
    bible, text = load_bible(), read_content()
    build(text, default_lists(), bible)  # the real inputs must pass first, or every refusal below means nothing
    failures = []
    for what, (old, new), expected in CONTENT_CASES:
        if old not in text:
            failures.append(f"{what}: the test's anchor {old!r} is not in content.md; update the case")
            continue
        failures += attempt(what, expected, lambda: build(text.replace(old, new, 1), default_lists(), bible))
    for what, breaker, expected in list_cases(default_lists()):
        failures += attempt(what, expected, lambda b=breaker: build(text, b(default_lists()), bible))
    after = (out.read_bytes(), out.stat().st_mtime_ns) if out.exists() else None
    if before != after:
        failures.append("data.js changed during the self-test")
    total = len(CONTENT_CASES) + len(list_cases(default_lists()))
    for line in failures:
        print(f"selftest: FAILED: {line}")
    print(f"selftest: {total - len(failures)} of {total} wrong inputs refused for the expected reason; data.js untouched")
    return 1 if failures else 0


def attempt(what: str, expected: str, call) -> list:
    try:
        call()
    except BuildError as error:
        if expected in str(error):
            print(f"selftest: refused, as it should be: {what}: {str(error).splitlines()[0][:150]}")
            return []
        return [f"{what}: refused, but for another reason: {error}"]
    except (KeyError, TypeError, AttributeError, ValueError) as error:
        return [f"{what}: crashed with {type(error).__name__} instead of a refusal: {error}"]
    return [f"{what}: was NOT refused"]
