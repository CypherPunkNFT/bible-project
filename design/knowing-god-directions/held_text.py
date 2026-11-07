"""Reading the held outside sources for the Knowing God mock-up: one section of each, as plain folded text, so a
quotation can only pass on words from the part of the source it names."""
import hashlib
import html
import json
import re
from pathlib import Path

from scripture_text import BuildError, fold


def _flat(text: str) -> str:
    return re.sub(r"\s+", " ", fold(text)).strip()


def _between(text: str, opens: str, closes: str, path: Path) -> str:
    start = text.find(opens)
    if start < 0:
        raise BuildError(f"held source {path.name}: could not find the start of the part read, {opens!r}")
    end = text.find(closes, start + len(opens))
    if end < 0:
        raise BuildError(f"held source {path.name}: could not find the end of the part read, {closes!r}")
    return text[start:end]


def held_section(spec: dict, project: Path) -> str:
    """The text of the one section a held source is cited for. Fails if the file is missing or outside the project."""
    path = Path(spec["path"]).resolve()
    if project.resolve() not in path.parents:
        raise BuildError(f"held source {path} is outside the allowed folder {project}")
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    if path.suffix == ".txt":
        raw = re.sub(r"\n\s*\d+\s*\n", "\n", raw)          # page numbers on lines of their own
        raw = re.sub(r"(\w)-\n\s*(\w)", r"\1\2", raw)        # a word broken at a line end
        return _flat(_between(raw, spec["from"], spec["to"], path))
    if path.suffix == ".html":
        text = _flat(html.unescape(re.sub(r"<[^>]+>", " ", raw)))
        return _between(text, spec["from"], spec["to"], path)
    try:
        data = json.loads(raw)["Data"]
    except (ValueError, KeyError) as error:
        raise BuildError(f"held source {path.name} is not the expected creed JSON: {error}") from error
    if "number" in spec:
        found = [item for item in data if item.get("Number") == spec["number"]]
        if len(found) != 1:
            raise BuildError(f"held source {path.name}: question {spec['number']} not found once")
        return _flat(f"{found[0]['Question']} {found[0]['Answer']}")
    chapter = next((c for c in data if str(c.get("Chapter")) == spec["chapter"]), None)
    section = next((s for s in (chapter or {}).get("Sections", []) if str(s.get("Section")) == spec["section"]), None)
    if section is None:
        raise BuildError(f"held source {path.name}: chapter {spec['chapter']} paragraph {spec['section']} not found")
    return _flat(section["Content"])


def held_print(spec: dict) -> str:
    return hashlib.sha256(Path(spec["path"]).read_bytes()).hexdigest()[:16]


def answer_words(section: str) -> list:
    """The answer of a catechism question as lower-case words, for comparing two catechisms' answers."""
    answer = re.sub(r"^\s*the work of creation\s*,?\s*is\b", "", section.split("?", 1)[-1].lower())
    return re.findall(r"[a-z']+", answer)
