"""A one-chapter book cited by verse alone ("Philemon 13") is read as chapter 1 (question_audit, question_tags)."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from question_audit import parse_spans
from question_tags import link_of


@pytest.mark.parametrize("reference, spans", [
    ("Philemon 13", [((1, 13), (1, 13))]),
    ("Philemon 1:13", [((1, 13), (1, 13))]),
    ("Philemon 1, 9", [((1, 1), (1, 1)), ((1, 9), (1, 9))]),
    ("Jude 3-4", [((1, 3), (1, 4))]),
    ("Colossians 4:9; Philemon 10", [((4, 9), (4, 9)), ((1, 10), (1, 10))]),
    ("Genesis 3", [((3, None), (3, None))]),
])
def test_a_one_chapter_book_is_cited_by_verse(reference: str, spans: list) -> None:
    assert [(s["start"], s["end"]) for s in parse_spans(reference)] == spans


@pytest.mark.parametrize("reference, link", [
    ("Philemon 13", {"book": "PHM", "chapter": 1, "verse": 13}),
    ("3 John 4", {"book": "3JN", "chapter": 1, "verse": 4}),
    ("Obadiah 1:4", {"book": "OBA", "chapter": 1, "verse": 4}),
    ("Genesis 3", {"book": "GEN", "chapter": 3, "verse": None}),
])
def test_a_one_chapter_book_links_to_its_verse(reference: str, link: dict) -> None:
    assert link_of(reference) == link
