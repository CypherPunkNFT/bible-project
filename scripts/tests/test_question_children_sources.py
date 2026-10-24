"""The children's sources reach the bank only checked, in their new wording (scripts/question_children_sources.py)."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import question_children_sources
from question_children_sources import (
    children_records,
    fingerprint,
    reply_fault,
)

SOURCE = {"id": "children-batch4:manly:275", "source_id": "children-batch4", "bank_id": "manly",
          "collection": "Manly", "lesson": "Lesson 9", "question": "What did Jesus say to him?",
          "answer": "Rise, take up thy bed, and walk.", "licence": "Public domain", "licence_class": "public-domain",
          "publishable": True, "attribution": None, "source_url": "https://archive.org/details/x",
          "question_origin": "human-written", "people": [], "places": [], "subjects": []}
REPLY = {"question": "What did Jesus tell the sick man at the pool to do?", "answer": "Get up, pick up your mat, and walk",
         "wrong": ["Wash in the pool seven times", "Go home and rest", "Wait for the water to move"],
         "reference": "John 5:8"}


@pytest.mark.parametrize("change, fault", [
    ({}, None),
    ({"wrong": ["Go home and rest", "Go home and rest", "Wait"]}, "not three distinct wrong choices"),
    ({"wrong": ["Get up, pick up your mat, and walk", "Go home", "Wait"]}, "not three distinct wrong choices"),
    ({"wrong": ["All of the above", "Go home", "Wait"]}, "an all-of-the-above choice"),
    ({"question": "What did Jesus say unto him?"}, "King James wording"),
    ({"reference": "the Gospel of John"}, "a reference that cannot be read: 'the Gospel of John'"),
    ({"answer": " "}, "no question or answer"),
])
def test_a_reply_is_kept_only_when_it_passes_the_rules(change: dict, fault: str | None) -> None:
    assert reply_fault({**REPLY, **change}) == fault


def records_with(monkeypatch, record: dict) -> list[dict]:
    monkeypatch.setattr(question_children_sources, "load_sources", lambda: [SOURCE])
    monkeypatch.setattr(question_children_sources, "load_wording", lambda: {"questions": {SOURCE["id"]: record}})
    return children_records()


def test_a_checked_rewrite_reaches_the_bank_with_four_choices(monkeypatch) -> None:
    [record] = records_with(monkeypatch, {**REPLY, "of": fingerprint(SOURCE), "by": "m", "checked": "m"})
    assert record["bank_id"] == "children-manly"
    assert record["question"] == REPLY["question"] and record["reference"] == "John 5:8"
    assert sorted(record["options"]) == sorted([REPLY["answer"], *REPLY["wrong"]])
    assert record["question_origin"].endswith("reworded for the BSB and for children by m")


def test_an_unchecked_rewrite_stays_out(monkeypatch) -> None:
    assert records_with(monkeypatch, {**REPLY, "of": fingerprint(SOURCE), "by": "m"}) == []


def test_a_rewrite_of_older_source_wording_stays_out(monkeypatch) -> None:
    assert records_with(monkeypatch, {**REPLY, "of": "0" * 16, "by": "m", "checked": "m"}) == []


def test_a_dropped_question_keeps_its_source_wording_and_no_choices(monkeypatch) -> None:
    [record] = records_with(monkeypatch, {"dropped": "Asks about the child's own Sunday", "of": fingerprint(SOURCE),
                                          "by": "m"})
    assert (record["question"], record["options"]) == (SOURCE["question"], None)


@pytest.mark.parametrize("answer, wrong, longest", [
    ("Noah", ["Moses", "Abel", "Lot"], False),
    ("He built a very big boat", ["Moses", "Abel", "Lot"], True),  # two words longer than every wrong choice
    ("Jerusalem", ["Ur", "Dan", "Gaza"], True),  # 15% longer in letters
    ("In a manger", ["In a palace", "In a boat", "On a hill"], False),
])
def test_a_right_choice_plainly_the_longest_is_found(answer: str, wrong: list[str], longest: bool) -> None:
    assert question_children_sources.plainly_longest(answer, wrong) is longest
