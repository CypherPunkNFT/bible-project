"""The recheck of shown questions against the verses that hold their answers (scripts/question_recheck.py)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from question_recheck import answer_spans, prompt_verses, rechecked_record  # noqa: E402

PROMPT = """Kind: trivia (A collection)
Question: [Genesis 1] is not a header here
Answer: x

BSB text:
[Genesis 6-8]
6:22 So Noah did everything precisely as God had commanded him.
7:1 Then the LORD said to Noah,
[1 Kings 14:21]
14:21 Rehoboam son of Solomon reigned in Judah.
"""

BEFORE = {"question": "Q", "answer": "A", "right": "A", "options": ["A", "B", "C", "D"], "reference": ""}
PREVIOUS = {"collection": "c", "verdict": "fix", "problems": [{"kind": "reference", "detail": "none given"}],
            "why": "Added the reference.", "by": "claude-sonnet-5-5, quotation corrected by hand", "audited": "2026-10-22",
            "before": BEFORE, "after": {**BEFORE, "reference": "Gen 1:1"}}


def test_prompt_verses_reads_only_the_bible_text_across_chapters() -> None:
    assert prompt_verses(PROMPT) == {"GEN 6:22", "GEN 7:1", "1KI 14:21"}


def test_answer_spans_join_neighbouring_verses_of_one_chapter() -> None:
    spans = answer_spans(["GEN 37:28", "GEN 37:29", "GEN 37:36", "GEN 38:1"])
    assert [(s["start"], s["end"]) for s in spans] == [((37, 28), (37, 29)), ((37, 36), (37, 36)), ((38, 1), (38, 1))]


def test_keep_leaves_the_earlier_fix_in_place() -> None:
    record = rechecked_record(PREVIOUS, {"verdict": "keep", "problems": [], "after": None}, "No fault.", "m", "d")
    assert record["after"] == PREVIOUS["after"] and record["verdict"] == "fix" and record["by"] == PREVIOUS["by"]
    assert record["rechecked"] == {"by": "m", "date": "d", "verdict": "keep", "earlier_by": PREVIOUS["by"]}


def test_fix_keeps_the_source_wording_and_both_reasons() -> None:
    after = {**BEFORE, "options": ["A", "E", "C", "D"], "reference": "Gen 1:1"}
    new = {"verdict": "fix", "problems": [{"kind": "choice_also_right", "detail": "B is also right"}], "after": after}
    record = rechecked_record(PREVIOUS, new, "B is also right.", "m", "d")
    assert record["before"] == BEFORE and record["after"] == after
    assert [p["kind"] for p in record["problems"]] == ["reference", "choice_also_right"]
    assert record["why"] == "Added the reference. Rechecked against the verses that hold the answer: B is also right."


def test_fix_of_a_kept_question_drops_no_fault_found() -> None:
    kept = {**PREVIOUS, "verdict": "keep", "problems": [], "why": "No fault found.", "after": None}
    new = {"verdict": "fix", "problems": [{"kind": "misquote", "detail": "d"}], "after": BEFORE}
    assert rechecked_record(kept, new, "Reworded.", "m", "d")["why"] == (
        "Rechecked against the verses that hold the answer: Reworded.")
