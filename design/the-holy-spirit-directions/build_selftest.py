"""The self-test for The Holy Spirit build: wrong inputs fed in memory, each of which build-data.py must refuse
for the right reason, and the tricky citations it must read right. Run it as build-data.py --selftest."""

SELFTEST = [
    # (what is wrong, how to make it wrong, words the refusal must contain)
    ("a changed word in a block quotation", lambda t, l: t.replace("remind you of everything I have told you.\n", "remind you of all I have told you.\n"), "word for word"),
    ("a block quotation under the wrong reference", lambda t, l: t.replace("John 14:26 · BSB", "John 14:25 · BSB"), "word for word"),
    ("a changed word in a quoted phrase", lambda t, l: t.replace('"It is for your benefit that I am going away"', '"It is for your good that I am going away"'), "not in"),
    ("a quote cited to the wrong verse", lambda t, l: t.replace("come to you\" (John 14:18)", "come to you\" (John 14:19)"), "not in"),
    ("a reference that does not exist", lambda t, l: t.replace("(Mark 14:36)", "(Mark 14:99)"), "does not resolve"),
    ("a link that leaves the site", lambda t, l: t.replace("(/study/theology-articles/the-trinity) teaches", "(https://example.com) teaches"), "only site links"),
    ("a link that leaves the site by a backslash", lambda t, l: t.replace("(/study/theology-articles/the-trinity) teaches", "(/\\evil.com) teaches"), "only site links"),
    ("a sub-head the page cannot place", lambda t, l: t.replace("## 01 Another Advocate", "### Stray\n\n## 01 Another Advocate"), "outside any part"),
    ("a note in brackets the page cannot place", lambda t, l: t.replace("Much is left out.", "Much is left out. [note: unplaced]"), "square brackets"),
    ("an altered confession quotation", lambda t, l: t.replace('"the Spirit of God, fully divine"', '"the Spirit of God, truly divine"'), "not in"),
    ("a short quotation on no list", lambda t, l: t.replace("Jesus is leaving.", 'Jesus says "I go" (John 16:7).'), "short quotation"),
    ("a study title on no list", lambda t, l: t.replace("*The hope to come*", "*The hope that is to come*"), "neither STUDY_LINKS"),
    ("a misquotation corrected without clearing its mark", lambda t, l: t.replace('"bite and devour"', '"biting and devouring"'), "no longer quotes"),
    ("a beam phrase not in its verse", lambda t, l: l.BEAMS[0].update(words="He will honour Me"), "is not in"),
    ("a beam the close does not name", lambda t, l: l.BEAMS[1].update(close="At Pentecost He points to Himself."), "the close does not say"),
    ("a fruit word not in the verse", lambda t, l: l.FRUIT["words"].append("hope"), "is not in"),
    ("a gift on the wrong list", lambda t, l: l.GIFTS[1]["words"].append("working of miracles"), "is not in"),
    ("a wrong count of readings", lambda t, l: setattr(l, "READINGS_CLAIMED", 9), "eight passages"),
]
# How three tricky citations in this study must be read. A wrong reading would quietly misplace a verse link.
PARSE_CASES = [
    ("(John 14:23, 26; 1 Corinthians 12:4–6)", ["John 14:23", "John 14:26", "1 Corinthians 12:4–6"]),
    ("(Acts 2:6, 9–11)", ["Acts 2:6", "Acts 2:9–11"]),
    ("(Mark 3:22, 30)", ["Mark 3:22", "Mark 3:30"]),
    ("Acts 4:31 and Ephesians 5:18", ["Acts 4:31", "Ephesians 5:18"]),
    ("(Leviticus 23:15–21; Deuteronomy 16:9–12)", ["Leviticus 23:15–21", "Deuteronomy 16:9–12"]),
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
