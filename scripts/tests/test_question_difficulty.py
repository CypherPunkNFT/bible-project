"""Difficulty ratings follow the wording shown (scripts/question_difficulty.py)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import question_difficulty  # noqa: E402
from question_difficulty import add_difficulty, fingerprint  # noqa: E402

QUESTION = {"id": "q1", "question": "Who built the ark?", "answer": "Noah", "options": ["Noah", "Moses", "Abel", "Lot"]}


def test_a_rating_applies_to_the_wording_it_was_given_for(monkeypatch) -> None:
    rated = {"q1": {"level": "easy", "children": True, "of": fingerprint(QUESTION), "by": "m"}}
    monkeypatch.setattr(question_difficulty, "load_ratings", lambda: {"questions": rated})
    same, reworded = dict(QUESTION), {**QUESTION, "question": "Who built the ark at God's command?"}
    assert add_difficulty([same, reworded]) == 1
    assert (same["level"], same["children"]) == ("easy", True)
    assert (reworded["level"], reworded["children"]) == (None, None)  # asked again on the next run


def test_new_choices_change_the_fingerprint() -> None:
    assert fingerprint(QUESTION) != fingerprint({**QUESTION, "options": ["Noah", "Moses", "Abel", "Shem"]})
    assert fingerprint(QUESTION) != fingerprint({**QUESTION, "options": None})
