"""Writing the site's own questions one BSB section at a time (scripts/question_writing.py, _gate.py, _review.py)."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from question_audit import as_sent  # noqa: E402
from question_writing import Locator, answered_sections, headings_of, link_related, next_number, read_sections, \
    target  # noqa: E402
from question_writing_gate import answer_held, cited_keys, gate  # noqa: E402
from question_writing_review import options_of, quiz_verdict, reference_of, second_round  # noqa: E402

GEN_12 = {"id": "GEN-12-1", "book": "GEN", "start": (12, 1), "end": (12, 9), "title": "The Call of Abram",
          "target": 4}
GOOD = {"question": "When Abram left Haran, how old was he?", "answer": "seventy-five years old",
        "wrong": ["sixty-five years old", "eighty-five years old", "ninety-nine years old"], "verses": ["12:4"],
        "people": ["Abram"], "places": ["Haran"], "subjects": ["call of Abram"]}


@pytest.fixture(scope="module")
def sections() -> list[dict]:
    found = read_sections()
    link_related(found, Locator(found))
    return found


def test_headings_merge_on_one_verse_and_a_bracketed_heading_is_a_related_line() -> None:
    verse = {"h": [["ms", "Book I"], ["r", "(Psalms 1—41)"], ["s", "The Faith of Many"], ["s", "(Joshua–Malachi)"],
                   ["r", "(Mark 1:1–8)"]]}
    assert headings_of(verse) == ("The Faith of Many", ["Joshua–Malachi", "Mark 1:1–8"])


def test_sections_cover_the_bible_from_heading_to_heading(sections: list[dict]) -> None:
    by_id = {s["id"]: s for s in sections}
    assert len(sections) == 3016 and all(s["words"] for s in sections)
    assert by_id["GEN-1-1"]["title"] == "The Creation" and by_id["GEN-1-1"]["end"] == (1, 31)
    assert by_id["GEN-2-1"]["start"] == (2, 1)


def test_parallel_gospels_are_written_one_after_another(sections: list[dict]) -> None:
    by_id = {s["id"]: s for s in sections}
    assert "MAT-3-1" in by_id["MRK-1-1"]["related"] and "MRK-1-1" in by_id["MAT-3-1"]["related"]
    assert by_id["MAT-3-1"]["wave"] < by_id["MRK-1-1"]["wave"] < by_id["LUK-3-1"]["wave"]


@pytest.mark.parametrize(("words", "asked", "expected"), [(30, 0, 2), (199, 0, 3), (2000, 0, 8), (199, 5, 0)])
def test_target_counts(words: int, asked: int, expected: int) -> None:
    assert target(words, asked, 60) == expected


def test_ids_are_never_reused() -> None:
    assert next_number("GEN-12-1", ["written:GEN-12-1:1", "written:GEN-12-1:3", "written:GEN-12-10:9"]) == 4


def test_a_section_answered_with_no_questions_counts_as_written() -> None:
    data = {"questions": {"written:GEN-12-1:1": {"section": "GEN-12-1"}},
            "notes": {"GEN-12-1": "", "GEN-10-1": "A list of names; nothing worth asking."}}
    assert answered_sections(data) == {"GEN-12-1", "GEN-10-1"}


@pytest.mark.parametrize(("answer", "text", "held"), [
    ("Lot", "Abram went, and Lot went with him.", True),
    ("seventy-five years old", "Abram was seventy-five years old when he left Haran.", True),
    ("75 years old", "Abram was seventy-five years old when he left Haran.", False),
    ("sixty-five years old", "Abram was seventy-five years old when he left Haran.", False),
    ("Nahor", "Abram went, and Lot went with him.", False),
    ("He built an altar to the LORD", "So Abram built an altar there to the LORD.", True),
    ("The", "Abram went.", False),
])
def test_answer_words_must_be_in_the_cited_verses(answer: str, text: str, held: bool) -> None:
    assert answer_held(answer, text) is held


def test_cited_verses_must_lie_inside_the_section() -> None:
    assert cited_keys(["12:4", "12:7-8"], GEN_12) == [(12, 4), (12, 7), (12, 8)]
    assert cited_keys(["12:10"], GEN_12) is None and cited_keys(["twelve"], GEN_12) is None


def test_a_good_question_passes_the_gate() -> None:
    assert gate(GOOD, GEN_12, []) is None


@pytest.mark.parametrize(("change", "why"), [
    ({"answer": "seventy-five years old, as the text records when he set out from Haran with Lot"},
     "answer longer than 12 words"),
    ({"wrong": ["sixty-five years old", "sixty-five years old", "ninety-nine years old"]}, "not three distinct wrong choices besides the answer"),
    ({"wrong": ["sixty-five years old", "All of the above", "ninety-nine years old"]}, "filler choice"),
    ({"verses": ["13:1"]}, "cited verses missing or outside the section"),
    ({"verses": ["12:1"]}, "the answer's words are not in the cited verses"),
    ({"question": 'Who was told "go to the land I will give you"?', "answer": "Abram",
      "wrong": ["Lot", "Nahor", "Terah"], "verses": ["12:1"]}, "a quotation not word for word in the BSB text"),
    ({"question": "When Abram left Haran, how old was he, as thou readest?"}, "King James wording"),
    ({"question": "In this passage, how old was Abram?"}, "does not stand alone"),
    ({"question": "He left Haran at what age?"}, "does not stand alone"),
    ({"question": "Was Abram seventy-five years old when he left Haran?"}, "the question contains its answer"),
    ({"answer": "seventy-five years old at the time", "wrong": ["65", "85", "99"]}, "the right choice is plainly the longest"),
])
def test_the_gate_rejects(change: dict, why: str) -> None:
    assert gate({**GOOD, **change}, GEN_12, []) == why


def test_a_made_up_saying_as_a_wrong_choice_is_not_a_misquote() -> None:
    text = {**GOOD, "question": "When the LORD called Abram, what did He tell him to leave?",
            "answer": "Your country, your kindred, and your father's household",
            "wrong": ['"Stay in Haran with your father Terah and his house"', "Your tents, your flocks, and your herds",
                      "Ur of the Chaldeans and the house of Nahor"], "verses": ["12:1"]}
    assert gate(text, GEN_12, []) is None


def test_the_gate_rejects_a_question_already_asked() -> None:
    assert gate(GOOD, GEN_12, ["When Abram left Haran, how old was he?"]) == "already asked"


@pytest.mark.parametrize(("stage", "answer", "passes"), [
    ("open", {"pick": "B", "also_right": [], "answerable": True, "note": ""}, True),
    ("open", {"pick": "A", "also_right": [], "answerable": True, "note": "x"}, False),
    ("open", {"pick": "B", "also_right": ["C"], "answerable": True, "note": "x"}, False),
    ("open", {"pick": "B", "also_right": ["B"], "answerable": True, "note": ""}, True),
    ("open", {"pick": "B", "also_right": [], "answerable": False, "note": "x"}, False),
    ("closed", {"clear": True, "pick": "", "also_right": [], "note": ""}, True),
    ("closed", {"clear": True, "pick": "B", "also_right": [], "note": ""}, True),
    ("closed", {"clear": False, "pick": "B", "also_right": [], "note": "x"}, False),
    ("closed", {"clear": True, "pick": "D", "also_right": [], "note": "x"}, False),
    ("closed", {"clear": True, "pick": "", "also_right": ["A"], "note": "x"}, False),
])
def test_blind_answers(stage: str, answer: dict, passes: bool) -> None:
    assert (quiz_verdict(stage, answer, "B") is None) is passes


def candidate(text: dict) -> dict:
    return {"section": GEN_12["id"], "section_info": {**GEN_12, "start": [12, 1], "end": [12, 9]}, "round": 1,
            "status": "check", "text": text, "by": "m", "history": []}


def test_a_fix_goes_back_for_a_second_round() -> None:
    c = candidate(GOOD)
    after = {"question": "How old was Abram when he left Haran?", "answer": "seventy-five years old",
             "right": "seventy-five years old", "reference": "Gen 12:4",
             "options": ["seventy-five years old", "sixty-five years old", "eighty-five years old", "seventy years old"]}
    assert second_round(c, after) and c["round"] == 2 and c["status"] == "review"
    assert c["text"]["verses"] == ["12:4"] and "seventy years old" in c["text"]["wrong"]


def test_a_fix_citing_another_passage_is_rejected() -> None:
    c = candidate(GOOD)
    after = {"question": GOOD["question"], "answer": GOOD["answer"], "right": GOOD["answer"],
             "options": [GOOD["answer"], *GOOD["wrong"]], "reference": "Acts 7:4"}
    assert not second_round(c, after) and c["status"] == "rejected"


def test_the_published_audit_record_matches_what_the_build_makes() -> None:
    qid = "written:GEN-12-1:1"
    c = candidate({**GOOD, "verses": ["12:4", "12:5"]})
    reference, options = reference_of(c), options_of(qid, GOOD)
    assert reference == "Genesis 12:4-5" and sorted(options) == sorted([GOOD["answer"], *GOOD["wrong"]])
    built = {"question": GOOD["question"], "answer": GOOD["answer"], "answer_choice": GOOD["answer"],
             "options": options, "reference": reference}  # as add_choices leaves a record that has its own options
    assert as_sent(built) == {"question": GOOD["question"], "answer": GOOD["answer"], "right": GOOD["answer"],
                              "options": options, "reference": reference}
