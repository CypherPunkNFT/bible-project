"""The site's own life stories for people (content/people/stories/*.json; the format is described in that folder's
README.md). Each story replaces STEP's AI-adapted "Their story" on the person page; STEP's `short` and `article` stay
in the person's file untouched, so nothing is lost and the page can still credit both.

This module loads the files and checks their shape; scripts/check-people-stories.py checks the content (verses exist,
quotations match the KJV, no confidence words).
"""

import json
from pathlib import Path

FILE_KEYS = {"about", "stories"}
STORY_KEYS = {"short", "paragraphs"}
PARAGRAPH_KEYS = {"text", "refs"}


class StoryError(ValueError):
    pass


def _check_span(span, where: str) -> None:
    if not (isinstance(span, list) and len(span) == 2 and all(isinstance(v, int) and not isinstance(v, bool) for v in span)):
        raise StoryError(f"{where}: expected [first, last] verse ids, got {span!r}")
    if span[0] > span[1]:
        raise StoryError(f"{where}: first verse {span[0]} is after last verse {span[1]}")


def check_story_shape(story, where: str) -> None:
    """One story: {"short": str, "paragraphs": [{"text": str, "refs": [[first, last], ...]}, ...]}."""
    if not isinstance(story, dict):
        raise StoryError(f"{where}: expected an object with 'short' and 'paragraphs', got {type(story).__name__}")
    unknown, missing = set(story) - STORY_KEYS, STORY_KEYS - set(story)
    if unknown or missing:
        raise StoryError(f"{where}: keys must be exactly {sorted(STORY_KEYS)} (unknown {sorted(unknown)}, missing {sorted(missing)})")
    if not isinstance(story["short"], str) or not story["short"].strip():
        raise StoryError(f"{where}: 'short' must be a non-empty string")
    paragraphs = story["paragraphs"]
    if not isinstance(paragraphs, list) or not paragraphs:
        raise StoryError(f"{where}: 'paragraphs' must be a non-empty list")
    for index, paragraph in enumerate(paragraphs):
        at = f"{where} paragraph {index + 1}"
        if not isinstance(paragraph, dict) or set(paragraph) != PARAGRAPH_KEYS:
            raise StoryError(f"{at}: expected exactly {sorted(PARAGRAPH_KEYS)}, got {paragraph!r:.80}")
        if not isinstance(paragraph["text"], str) or not paragraph["text"].strip():
            raise StoryError(f"{at}: 'text' must be a non-empty string")
        if not isinstance(paragraph["refs"], list) or not paragraph["refs"]:
            raise StoryError(f"{at}: every paragraph needs at least one verse span in 'refs'")
        for i, span in enumerate(paragraph["refs"]):
            _check_span(span, f"{at} refs[{i}]")


def load_stories(folder: Path) -> tuple[dict[str, dict], dict[str, str]]:
    """Every story in folder/*.json, by person id, plus the file each came from. A person in two files stops the build."""
    stories: dict[str, dict] = {}
    source: dict[str, str] = {}
    for file in sorted(folder.glob("*.json")):
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise StoryError(f"{file.name}: not valid JSON ({error})") from error
        if not isinstance(data, dict) or set(data) != FILE_KEYS:
            raise StoryError(f"{file.name}: top-level keys must be exactly {sorted(FILE_KEYS)}")
        if not isinstance(data["stories"], dict):
            raise StoryError(f"{file.name}: 'stories' must be an object keyed by person id")
        for person_id, story in data["stories"].items():
            check_story_shape(story, f"{file.name}: {person_id}")
            if person_id in stories:
                raise StoryError(f"{file.name}: {person_id} already has a story in {source[person_id]}; one story per person")
            stories[person_id] = story
            source[person_id] = file.name
    return stories, source


def apply_people_stories(detail: dict[str, dict], stories: dict[str, dict], source: dict[str, str] | None = None) -> int:
    """Give each person's page data its story ("story", "storyBy": "site"). STEP's short/article are left as they are.
    A story for an id that is not a person, or for a record that duplicates another ("same"), stops the build."""
    source = source or {}
    for person_id, story in stories.items():
        where = f"{source.get(person_id, 'stories')}: {person_id}"
        record = detail.get(person_id)
        if record is None:
            raise StoryError(f"{where}: not a person id (expected a file in data/study/people)")
        if record.get("same"):
            raise StoryError(f"{where}: this record duplicates {record['same']}, whose page is shown; put the story there")
        record["story"] = {"short": story["short"], "paragraphs": [{"text": p["text"], "refs": p["refs"]} for p in story["paragraphs"]]}
        record["storyBy"] = "site"
    return len(stories)
