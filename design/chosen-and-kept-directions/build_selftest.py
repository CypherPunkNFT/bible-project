"""The self-test for the Chosen and kept build: wrong inputs fed in memory, each of which build-data.py must refuse
for the right reason, and the tricky citations it must read right. Run it as build-data.py --selftest."""

SELFTEST = [
    # (what is wrong, how to make it wrong, words the refusal must contain)
    ("a changed word in a block quotation", lambda t, l: t.replace("No one can snatch them out of My hand. My Father", "No one can take them out of My hand. My Father"), "word for word"),
    ("a block quotation under the wrong reference", lambda t, l: t.replace("John 6:37 · BSB", "John 6:38 · BSB"), "word for word"),
    ("a changed word in a quoted phrase", lambda t, l: t.replace('"If God is for us, who can be against us?"', '"If God is with us, who can be against us?"'), "not in"),
    ("a quote cited to the wrong verse", lambda t, l: t.replace('"I and the Father are one" belongs', '"I and the Father are one" (John 10:31) belongs'), "not in"),
    ("a reference that does not exist", lambda t, l: t.replace("(Exodus 8:15)", "(Exodus 8:99)"), "does not resolve"),
    ("a link that leaves the site", lambda t, l: t.replace("*The good news* sets out how.", "[The good news](https://example.com) sets out how."), "only site links"),
    ("a link that leaves the site by a backslash", lambda t, l: t.replace("*The good news* sets out how.", "[The good news](/\\evil.com) sets out how."), "only site links"),
    ("a sub-head before any part", lambda t, l: t.replace("## 01 Chosen in Christ", "### Stray\n\n## 01 Chosen in Christ"), "outside any part"),
    ("a note in brackets the page cannot place", lambda t, l: t.replace("Read each one as what it is.", "Read each one as what it is. [note: unplaced]"), "square brackets"),
    ("an altered confession quotation", lambda t, l: t.replace('"excludes boasting and promotes humility"', '"excludes boasting and encourages humility"'), "not in"),
    ("a short quotation on no list", lambda t, l: t.replace("Look at what the sentence says.", 'Look at what "He chose" says (Ephesians 1:4).'), "short quotation"),
    ("a study title on no list", lambda t, l: t.replace("*The hope to come*", "*The hope that is to come*"), "neither STUDY_LINKS"),
    ("a misquotation corrected without clearing its mark", lambda t, l: t.replace('"great sorrow and unceasing anguish"', '"deep sorrow and unceasing anguish"'), "no longer quotes"),
    ("the crisis note moved after the hook", lambda t, l: t.replace("**Main readings:** Mark 3:28–30\n\n[care]", "**Main readings:** Mark 3:28–30\n\n*Hook:* Moved.\n\n[care]").replace("\n*Hook:* Jesus' first word", "\nJesus' first word"), "crisis note"),
    ("a purpose sentence the close does not say", lambda t, l: l.PURPOSE_OF_PART.update({"05": (["warn"], "Hebrews 6 frightens drifters.")}), "the close does not say"),
    ("a chain link not in its verse", lambda t, l: l.CHAIN.__setitem__(2, ("called", "Romans 8:30", "He also chose")), "is not in"),
    ("the chain out of the study's order", lambda t, l: l.CHAIN.reverse(), "in its order"),
    ("a danger Paul does not name", lambda t, l: l.DANGERS[0][1].append("doubt"), "is not in"),
    ("a fear the study does not voice", lambda t, l: l.FEARS[0].update(says="If you think you are too far gone"), "the study does not say"),
    ("a promise its part never cites", lambda t, l: l.FEARS[3].update(promise=("John 6:37", "the one who comes to Me I will never drive away")), "never cites"),
    ("a wrong count of readings", lambda t, l: setattr(l, "READINGS_CLAIMED", 9), "eight passages"),
]
# How the tricky citations in this study must be read. A wrong reading would quietly misplace a verse link.
PARSE_CASES = [
    ("(Ephesians 1:6, 12, 14)", ["Ephesians 1:6", "Ephesians 1:12", "Ephesians 1:14"]),
    ("Ephesians 1:3–14, Romans 8:28–39, Romans 9:6–24", ["Ephesians 1:3–14", "Romans 8:28–39", "Romans 9:6–24"]),
    ("John 6:35–44; John 10:27–30", ["John 6:35–44", "John 10:27–30"]),
    ("(Romans 9:7–9)", ["Romans 9:7–9"]),
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
