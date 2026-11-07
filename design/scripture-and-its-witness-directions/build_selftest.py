"""The self-test for the What the Bible says about itself build: wrong inputs fed in memory, each of which
build-data.py must refuse for the right reason, and the tricky citations it must read right. Run it as
build-data.py --selftest. Nothing is written."""

def respell(old: str, new: str):
    """Change a held quotation in the text and in HELD_QUOTES together, as an editor would, so the held-copy check
    itself is what must refuse it. KNOWN_DIFFERENCES is keyed by the exact wording, so it is not carried over: a
    changed wording must have its difference from the held copy compared and recorded again."""
    def spoil(text: str, lists) -> str:
        key = next(k for k in lists.HELD_QUOTES if old in k)
        lists.HELD_QUOTES[key.replace(old, new)] = lists.HELD_QUOTES.pop(key)
        return text.replace(old, new)
    return spoil


SELFTEST = [
    # (what is wrong, how to make it wrong, words the refusal must contain)
    ("a changed word in a block quotation", lambda t, l: t.replace("> Your word is a lamp to my feet", "> Your word is a light to my feet"), "word for word"),
    ("a block quotation under the wrong reference", lambda t, l: t.replace("Romans 15:4 · BSB", "Romans 15:5 · BSB"), "word for word"),
    ("a changed word in a quoted phrase", lambda t, l: t.replace('"about seven miles from Jerusalem"', '"about eight miles from Jerusalem"'), "not in"),
    ("a quote cited to the wrong verse", lambda t, l: t.replace('"more precious than gold" and "sweeter than honey" (Psalm 19:10)', '"more precious than gold" and "sweeter than honey" (Psalm 19:11)'), "not in"),
    ("a reference that does not exist", lambda t, l: t.replace("(Titus 1:2 says so)", "(Titus 4:2 says so)"), "does not resolve"),
    ("a link that leaves the site", lambda t, l: t.replace("(/apologetics/study/canon)", "(https://example.com/canon)"), "only site links"),
    ("a link that leaves the site by a double slash", lambda t, l: t.replace("(/apologetics/study/canon)", "(//example.com/canon)"), "only site links"),
    ("a sub-head the page cannot place", lambda t, l: t.replace("## 01 Breathed out", "### Stray\n\n## 01 Breathed out"), "outside any part"),
    ("a note in brackets the page cannot place", lambda t, l: t.replace("Each of those questions needs its own kind of evidence.", "Each of those questions needs its own kind of evidence. [note: unplaced]"), "square brackets"),
    ("an altered confession quotation", respell("totally true and trustworthy", "wholly true and trustworthy"), "held copy"),
    ("a new punctuation change in a confession quotation", respell("are so clearly propounded", "are so clearly propounded,"), "differs from"),
    ("a short quotation on no list", lambda t, l: t.replace("Jesus is starving.", 'Jesus is "hungry" (Matthew 4:2).'), "short quotation"),
    ("a study title on no list", lambda t, l: t.replace("*The hope to come*", "*The hope that is to come*"), "neither STUDY_LINKS"),
    ("a fifth 'It is written' claimed", lambda t, l: l.WRITTEN.append(dict(l.WRITTEN[0], ref="Matthew 4:11")), "every verse"),
    ("shared words the source does not hold", lambda t, l: l.WRITTEN[3]["shared"].append("worship the Lord your God"), "is not in"),
    ("a use the study does not say", lambda t, l: l.WRITTEN[1].update(use="The devil misquotes the psalm."), "the study does not say"),
    ("a reading of 2 Peter 1:19 chosen", lambda t, l: l.READINGS[0].update(chosen="a"), "without choosing"),
    ("a fourth 'opened' claimed", lambda t, l: l.OPENED.append(("Luke 24:16", "their eyes were kept", "Eyes")), "every verse of Luke 24"),
    ("a Cleopas fact not in its verse", lambda t, l: l.FACTS.append({"ref": "Luke 24:22", "words": "the stone was rolled away", "under": "rise"}), "is not in"),
    ("a concept moved to the wrong part", lambda t, l: l.CONCEPT_OF_PART.update({"01": "True", "02": "Breathed out"}), "CONCEPT_OF_PART"),
]
# How tricky citations in this study must be read. A wrong reading would quietly misplace a verse link.
PARSE_CASES = [
    ("Acts 27:15 and 27:17", ["Acts 27:15", "Acts 27:17"]),
    ("(Luke 24:33–34)", ["Luke 24:33–34"]),
    ("2 Timothy 3:14–17, 2 Peter 1:16–21, Matthew 4:1–11, and Luke 24:13–35 with 24:44–49",
     ["2 Timothy 3:14–17", "2 Peter 1:16–21", "Matthew 4:1–11", "Luke 24:13–35", "Luke 24:44–49"]),
    ("(Matthew 4:6–7)", ["Matthew 4:6–7"]),
]


def run(text: str, bible: dict, build, Builder, Lists, BuildError) -> int:
    failures = 0
    builder = Builder(bible, Lists())
    for cited, expected in PARSE_CASES:
        got = [label for _, _, label in builder.refs_in(cited)]
        ok = got == expected and cited.strip("()") in text
        print(f"  {'read right' if ok else 'MISREAD'}  {cited}: {got}")
        failures += 0 if ok else 1
    for what, spoil, expect in SELFTEST:
        lists = Lists()
        changed = spoil(text, lists)
        wrong = changed if isinstance(changed, str) else text
        if isinstance(changed, str) and changed == text:
            print(f"  NOT TESTED  {what}: the change did not apply to the text")
            failures += 1
            continue
        try:
            build(wrong, lists, bible)
        except BuildError as error:
            ok = expect in str(error)
            print(f"  {'refused' if ok else 'WRONG REASON'}  {what}: {str(error).splitlines()[0][:110]}")
            failures += 0 if ok else 1
            continue
        print(f"  ACCEPTED  {what}")
        failures += 1
    total = len(SELFTEST) + len(PARSE_CASES)
    print(f"build-data selftest: {total - failures} of {total} cases right ({len(SELFTEST)} wrong inputs, {len(PARSE_CASES)} citations)")
    return 1 if failures else 0
