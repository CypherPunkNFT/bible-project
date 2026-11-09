"""The holy days calendar's English is registered for translation (sequence 41 step 3, job 844, 2026-11-09).

Every text the page shows is collected by `extract.py --pages` through the ordinary page rules, so it needs no line in
page-register.json. This test proves it and keeps it so: a reworded sentence the rules would pass by (a `\\"` escape, a
semicolon inside a string, a template led by a value or by a "Word:" label) fails here instead of staying English.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import extract
from page_rules import string_literals, without_comments

SITE = Path(__file__).resolve().parents[2]
FOLDER = SITE / "src" / "pages" / "holy-days"

# Shown by the page and the day rows: headings, buttons, labels and the sentences built around a value.
PAGE_TEXTS = [
    "Holy days calendar", "Coming up", "It begins at sunset the evening before.", "Choose a year", "Previous year",
    "Next year", "This year", "Year", "Choose a year from 1583 to 9999.", "Show holy days of", "At least one stays shown",
    "Holy days in {n}", "Showing {n} of {n}", "Keeping these days", "Today is {n}", "Under way now: {n}, day {n} of {n}",
    "Next comes {n}, on {n}, {n}", "Lasts {n}, until {n}", "in {n} days", "Loading the passages…",
    "The passages could not be loaded.", "Retry", "How the date is set:", "Key passages",
    "Like every day on the Hebrew calendar, it begins at sunset the evening before.",
    "Western churches", "Orthodox churches", "Biblical feasts",
    "Holy Days Calendar: Easter, Lent, Advent, Pentecost and the Biblical Feasts",
    "Easter, Western and Orthodox, Lent, Advent, Pentecost and the biblical feasts for any year, with key passages.",
    "A wall calendar with one day ringed, beside a small lit oil lamp",
]


@lru_cache(maxsize=1)
def collected() -> frozenset[str]:
    return frozenset(extract.page_strings())


def day_texts() -> list[str]:
    """Each day's name, explanation, how its date is set and its passages' notes: the strings of days.ts that hold a
    space, leaving out passage references ("MAT 2:1-2") and the type's own words."""
    source = without_comments((FOLDER / "days.ts").read_text("utf-8"))
    bodies = [body for _start, _end, _quote, body in string_literals(source)]
    return [body for body in bodies if " " in body and not body[:3].isupper() and not body.startswith("@/")]


def test_the_page_s_own_words_are_collected() -> None:
    missing = [text for text in PAGE_TEXTS if text not in collected()]
    assert missing == []


def test_every_holy_day_s_words_are_collected() -> None:
    texts = day_texts()
    assert len(texts) > 100  # 22 days: a name, an explanation, a reckoning and two or three notes each
    missing = [text for text in texts if text not in collected()]
    assert missing == []


def test_the_closing_note_and_introduction_are_collected() -> None:
    starts = ["The dates of Easter in the Western and Orthodox churches", "Scripture does not command Christians",
              "Dates for the biblical feasts follow the Hebrew calendar"]
    for start in starts:
        assert any(text.startswith(start) for text in collected()), start
