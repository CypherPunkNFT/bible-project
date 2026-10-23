"""The question explorer's type-of-wrong groups and row shape (scripts/question_explorer.py)."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from question_audit import load_audit  # noqa: E402
from question_explorer import COLUMNS, explorer_row, wrong_groups  # noqa: E402

BEFORE = {"question": "Who built the ark?", "answer": "Noah", "right": "Noah", "options": ["Noah", "Moses", "Abel", "Lot"],
          "reference": ""}


def record(problems: list[str], **after: str) -> dict:
    return {"verdict": "fix", "problems": [{"kind": k, "detail": "d"} for k in problems], "before": BEFORE,
            "after": {**BEFORE, **after}, "why": "w", "by": "m"}


@pytest.mark.parametrize(("problems", "after", "groups"), [
    (["misquote"], {"question": "Who built the ark, by God's word?"}, ["question"]),
    (["misquote"], {}, ["other"]),  # a misquote fault that left the question as it was
    (["wrong_answer"], {"answer": "Noah's sons", "right": "Noah's sons"}, ["answer"]),
    (["choice_also_right"], {}, ["choice"]),
    (["other_translation"], {"answer": "Noah, a righteous man"}, ["reworded"]),
    (["reference"], {"reference": "Gen 6:14"}, ["reference"]),
    (["other_translation", "reference"], {"question": "Who made the ark?", "reference": "Gen 6:14"},
     ["question", "reference"]),
    ([], {}, []),
])
def test_wrong_groups(problems: list[str], after: dict, groups: list[str]) -> None:
    assert wrong_groups(record(problems, **after)) == groups


def test_a_hidden_record_without_after_does_not_fail() -> None:
    hidden = {"verdict": "hide", "problems": [{"kind": "other", "detail": "d"}], "before": BEFORE, "why": "w"}
    assert wrong_groups(hidden) == ["other"]


def test_every_saved_record_with_a_fault_lands_in_a_group() -> None:
    records = load_audit()["questions"].values()
    assert records
    assert [r for r in records if r["problems"] and not wrong_groups(r)] == []


def test_row_follows_the_columns_and_skips_records_not_applied() -> None:
    q = {"id": "x", "collection": "c", "kind": "trivia", "question": "Q", "answer": "A", "options": None,
         "reference": "Gen 6:14; Exodus 3:2", "hidden": None, "repeat_of": "y", "audit": None, "grounding": None}
    row = dict(zip(COLUMNS, explorer_row(q, None, None, {})))
    assert len(row) == len(COLUMNS)
    assert row["status"] == "repeat"
    assert row["refBooks"] == ["GEN", "EXO"]
    assert row["before"] is None and row["problems"] == [] and row["wrong"] == [] and row["verseKeys"] == []
