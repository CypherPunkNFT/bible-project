"""Checks for the lists in study_lists.py, the crisis numbers and the page's own files. Used by build-data.py.
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


def verse_index(builder, label: str) -> tuple:
    """(book code, running numbers of every verse in the reference), counted in the book's own order."""
    code, verses = verses_of(builder.bible, label)
    order = sorted(tuple(map(int, key.split(":"))) for key in builder.bible[code])
    place = {cv: i for i, cv in enumerate(order)}
    return code, [place[(c, v)] for c, v, _ in verses]


def distance(builder, command: str, gift: str) -> int:
    """How many verses apart the gift and its command stand, in either direction; refused across books."""
    book_a, a = verse_index(builder, command)
    book_b, b = verse_index(builder, gift)
    if book_a != book_b:
        raise BuildError(f"the gift for {command} is in another book ({gift}); the study's habit looks in the same paragraph")
    return min(abs(x - y) for x in a for y in b)


def check_roots(builder, lists: dict, content: str) -> list:
    roots = []
    for i, row in enumerate(lists["ROOTS"]):
        command = phrase_in(builder, *row["command"], f"root {i + 1}, the command")
        if row["part"] not in {p["n"] for p in builder.parts}:
            raise BuildError(f"root {i + 1}: no part {row['part']} in content.md")
        item = {"id": f"root{i + 1}", "part": row["part"], "command": command, "gift": None, "depth": None, "says": None}
        if row["gift"] is None:
            if row["depth"] is not None or row["study_says"] is not None:
                raise BuildError(f"root {i + 1}: a command with no gift cannot have a depth or a sentence from the study")
            roots.append(item)
            continue
        gift = phrase_in(builder, *row["gift"], f"root {i + 1}, the gift")
        measured = distance(builder, row["command"][0], row["gift"][0])
        if measured != row["depth"] or measured not in lists["DEPTHS"]:
            raise BuildError(f"root {i + 1}: the gift stands {measured} verses from the command, but the list says {row['depth']}")
        if not row["study_says"] or row["study_says"] not in content:
            raise BuildError(f"root {i + 1}: the study's sentence naming this pair is not in content.md: {row['study_says']!r}")
        item.update(gift=gift, depth=measured, says=typographic(row["study_says"]))
        if gift["r"] != command["r"]:
            span = sorted([row["command"][0], row["gift"][0]], key=lambda label: verse_index(builder, label)[1][0])
            start, end = span[0], span[1].split(":")[-1]
            same_chapter = span[0].split(":")[0] == span[1].split(":")[0]
            item["both"] = builder.passage(f"{start}–{end}" if same_chapter else f"{start}–{span[1].split(' ')[-1]}")
        roots.append(item)
    return roots


def check_steps(builder, lists: dict) -> dict:
    s = lists["STEPS"]
    steps = [{"name": st["name"], "people": st["people"], "said": phrase_in(builder, *st["said"], f"step {st['name']}"),
              "if": phrase_in(builder, *st["if"], f"step {st['name']}, its condition")} for st in s["steps"]]
    if len(steps) != 4:
        raise BuildError(f"Matthew 18 gives four steps, the list has {len(steps)}")
    return {"aim": phrase_in(builder, *s["aim"], "the aim"), "steps": steps, "still": phrase_in(builder, *s["still"], "still a brother")}


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
