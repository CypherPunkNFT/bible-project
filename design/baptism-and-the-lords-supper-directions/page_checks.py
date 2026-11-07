"""Checks for the lists in study_lists.py, the crisis numbers and the page's own files. Used by build-data.py.
(Adapted from the Life together mock-up's page_checks.py; its roots and steps checks are left out.)
Every list phrase is compared with the Berean exactly as the site holds it (curly quotes and all), in the one verse named."""
import re
from pathlib import Path

from scripture_text import BuildError, typographic, verses_of

NEGATIONS = {"not", "no", "never", "nor", "neither", "without", "cease", "stop", "lest", "nothing", "none"}
FOLDER_NAME = re.compile(r"^[a-z0-9-]+-directions$")


def verse_text(builder, label: str) -> tuple:
    """(book code, "c:v", raw text) of a single verse; refuses a range."""
    code, verses = verses_of(builder.bible, label)
    if len(verses) != 1:
        raise BuildError(f"a list entry must name one verse, found {label}")
    c, v, text = verses[0]
    return code, f"{c}:{v}", text


def negated(text: str, start: int, phrase: str) -> bool:
    """True if one of the three words before the phrase, in the same clause, turns it round ("not", "never", "lest")."""
    if phrase.split()[0].lower() in NEGATIONS:
        return False
    clause = re.split(r"[.;:!?,]", text[:start])[-1]
    before = [w.lower() for w in re.findall(r"\w+", clause)[-3:]]
    return any(w in NEGATIONS for w in before)


def phrase_in(builder, label: str, phrase: str, what: str) -> dict:
    """The phrase is in the one verse named, exactly once, as whole words, and not straight after a negation."""
    code, cv, text = verse_text(builder, label)
    found = list(re.finditer(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text))
    if len(found) != 1:
        raise BuildError(f"{what}: {phrase!r} should be in {label} exactly once, found {len(found)} times")
    if negated(text, found[0].start(), phrase):
        raise BuildError(f"{what}: {phrase!r} in {label} follows a negation, so it would reverse the verse")
    return {"r": builder.passage(label), "label": label, "phrase": phrase}


def check_crisis(text: str, crisis: list, life: dict) -> dict:
    """Each number is in content.md as a whole number; a number the site's list holds must match it there."""
    entries = {e["id"]: e for group in life["groups"] for e in group.get("entries", [])}
    held, unverified = [], []
    for number, entry_id in crisis:
        if not re.search(r"(?<![\d-])(?<!\d )" + re.escape(number) + r"(?![\d-])(?! \d)", text):
            raise BuildError(f"crisis line: {number} is not in content.md as a whole number")
        if entry_id is None:
            unverified.append(number)
            continue
        entry = entries.get(entry_id)
        if not entry or number not in {c.get("value") for c in entry.get("contact", [])}:
            raise BuildError(f"crisis line: {number} is not in life.json under {entry_id!r}")
        held.append({"number": number, "entry": entry_id, "checked": entry.get("checked") or life.get("checked")})
    return {"held": held, "unverified": unverified}


def study_links(design: Path, links: dict) -> dict:
    """Each named study's link, written here from a folder name that is plain and exists inside design/."""
    out = {}
    for name, folder in sorted(links.items()):
        if folder is None:
            out[name] = None
            continue
        if not FOLDER_NAME.match(folder) or (design / folder).resolve().parent != design.resolve() or not (design / folder / "index.html").exists():
            raise BuildError(f"study link for {name!r}: {folder!r} is not a mock-up folder with an index.html in design/")
        out[name] = f"/mockups/{folder}/"
    return out


def check_page_files(folder: Path) -> list:
    """Every file index.html loads exists and is a relative path; the shared frame still defines what the page calls."""
    html = (folder / "index.html").read_text(encoding="utf-8")
    problems = []
    for ref in re.findall(r'(?:src|href)="([^"#?]+)"', html):
        if ":" in ref or ref.startswith(("/", "\\")):
            problems.append(f"{ref} (not a relative path)")
        elif not (folder / ref).resolve().exists():
            problems.append(ref)
    frame = folder.parent / "authors-directions/shared/frame.js"
    if not frame.exists() or not all(word in frame.read_text(encoding="utf-8") for word in ("Frame", "icon")):
        problems.append("frame.js no longer defines Frame and icon")
    return problems
