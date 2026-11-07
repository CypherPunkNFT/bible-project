"""Wrong inputs for the Who do you say that I am build, tried in memory. The unchanged inputs must pass first; then each wrong input must be refused with the
reason given. Nothing is written. Run from Website/: python -B design/who-do-you-say-that-i-am-directions/build_selftest.py"""
import copy
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("build_data", HERE / "build-data.py")
B = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(B)
L = B.L


def with_row(rows: list, index: int, **changes) -> list:
    return rows[:index] + [{**rows[index], **changes}] + rows[index + 1:]


def ledger(forms: dict, **changes) -> dict:
    return {**forms, "word": {**forms["word"], **changes}}


# (what is tried, a change to content.md as (old, new) or None, a change to the lists as (name, function) or None, words the refusal must contain)
CASES = [
    ("a changed word in a block quotation", ("others say Elijah; and still others, Jeremiah", "others say Elias; and still others, Jeremiah"), None,
     "is not the whole Berean text"),
    ("a block quotation under the wrong reference", ("Matthew 16:14 · BSB", "Matthew 16:13 · BSB"), None, "is not the whole Berean text"),
    ("a quotation cited to the wrong verse", ('"one of the prophets" (Mark 8:28)', '"one of the prophets" (Mark 8:27)'), None, "quoted words are not in the reference"),
    ("a changed word in a quoted phrase", ('"a prophet of old has arisen" (Luke 9:19)', '"a prophet of old has risen" (Luke 9:19)'), None, "quoted words are not in the reference"),
    ("a changed word in a commentary quotation, its list entry moved with it", ("that his time had not fully come", "that his hour had not fully come"),
     ("SOURCE_PLACES", lambda v: {key.replace("his time", "his hour"): value for key, value in v.items()}), "quotation not found in one paragraph of barnes"),
    ("a link that leaves the site", ("](/study/names)", "](https://example.com)"), None, "not on the site link list"),
    ("a curly double quote in prose", ('"was praying in private and the disciples were with Him"', "“was praying in private and the disciples were with Him”"), None,
     "curly double quote in prose"),
    ("a number written as a word that nothing checks", ("six days later", "six days later, seven lamps"), None, "is not on COUNTS"),
    ("a check note that is not on the list", ("[check: date commonly given, about 735–734 BC]", "[check: date commonly given]"), None, "check notes differ from CHECK_NOTES"),
    ("a wall line credited to a speaker, taken from the narration", None,
     ("ANSWERS", lambda v: with_row(v, 0, ref="Matthew 16:13", words="the region of Caesarea Philippi", next=None)), "but not in the speech credited"),
    ("a word whose list leaves out a line the search finds", None,
     ("WORD_LENSES", lambda v: with_row(v, 0, expect=v[0]["expect"] - {"peter"})), "word son: search found"),
    ("the turn's name with the wrong count of verses", None,
     ("FORMS", lambda v: {**v, "turn": {**v["turn"], "name": "Five verses, down and back"}}), "the turn's name says"),
    ("the ledger lighting a word its row does not have", None,
     ("FORMS", lambda v: ledger(v, rows=with_row(v["word"]["rows"], 0, gold="made"))), "the ledger lights"),
    ("a church row in words no checked list holds", None,
     ("FORMS", lambda v: ledger(v, church=[("The Baptist Faith and Message", "fully God and fully man")] + v["word"]["church"][1:])), "a church row is not on a checked list"),
    ("a readout label that is not one of the Habit's questions", None,
     ("READOUT_LABELS", lambda v: {**v, "who": "Who is talking?"}), "is not one of the Habit's questions"),
    ("a commentary quotation placed on the wrong verse", None,
     ("SOURCE_PLACES", lambda v: {**v, "The reason of this seems to be that his time had not fully come": {**v["The reason of this seems to be that his time had not fully come"], "place": (16, 21)}}),
     "is in the note on"),
    ("the text's wrong chapter for a quotation, with its known issue taken away", None,
     ("SOURCE_PLACES", lambda v: {**v, "In that sense the Jews plainly understood Him": {key: value for key, value in v["In that sense the Jews plainly understood Him"].items() if key != "issue"}}),
     "and the held note is on chapter"),
    ("a known issue that the build does not find", None, ("KNOWN_ISSUES", lambda v: {**v, "made-up": "A fault that is not in the text."}), "KNOWN_ISSUES entries not confirmed"),
    ("a check note called verified when nothing in its line was checked", None,
     ("CHECK_NOTES", lambda v: {**v, "date commonly given, about 735–734 BC": "verified"}), "is verified, and no quotation in its line passed"),
    ("an absence claim that the Bible contradicts", None,
     ("ABSENT_BOOKS", lambda v: [{**v[0], "pattern": r"\bI am God\b|\bSon of God\b"}]), "and it is at"),
]


def run_case(name: str, original: str, text_change, list_change, expected: str, bible: dict, held: dict) -> bool:
    text = original
    if text_change:
        old, new = text_change
        if old not in text:
            print(f"selftest: SETUP FAILED for {name}: {old!r} is not in content.md")
            return False
        text = text.replace(old, new, 1)
    saved = None
    if list_change:
        saved = getattr(L, list_change[0])
        setattr(L, list_change[0], list_change[1](copy.deepcopy(saved)))
    try:
        B.build_payload(text.encode("utf-8"), bible, held)
        print(f"selftest: NOT REFUSED: {name}")
        return False
    except B.BuildError as error:
        if expected not in str(error):
            print(f"selftest: REFUSED FOR THE WRONG REASON: {name}: {error}")
            return False
        print(f"selftest: refused, as it should be: {name} ({str(error)[:110]})")
        return True
    finally:
        if list_change:
            setattr(L, list_change[0], saved)


def main() -> int:
    bible, held = B.load_bible(), B.load_held()
    original = B.CONTENT.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    try:
        B.build_payload(original.encode("utf-8"), bible, held)
    except B.BuildError as error:
        print(f"selftest: FAILED: the unchanged inputs do not build: {error}")
        return 1
    print("selftest: the unchanged inputs build")
    passed = sum(run_case(name, original, text_change, list_change, expected, bible, held) for name, text_change, list_change, expected in CASES)
    print(f"selftest: {passed} of {len(CASES)} wrong inputs refused for the right reason")
    return 0 if passed == len(CASES) else 1


if __name__ == "__main__":
    sys.exit(main())
