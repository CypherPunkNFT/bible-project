"""The shapes of the Prayer across Scripture mock-up: each letter passage broken into lines, the six columns read upward, and
the prayer Jesus taught set out line by line. Every phrase is found once in its verse, so the wrong one cannot be labelled."""
import re

from study_lists import KIND_LABELS, LEAVES, ROLES, SPINE
from scripture_text import BuildError, fold, has_words, plain_text, typographic, verses_of


def verse_position(bible: dict, ref: str) -> tuple:
    _, verses = verses_of(bible, ref)
    if len(verses) != 1:
        raise BuildError(f"a phrase must name one verse: {ref}")
    return verses[0]


def find_once(phrase: str, text: str, ref: str) -> int:
    """Where a phrase stands in a verse. Refused if absent or if it occurs twice, because then the wrong one could be marked."""
    pattern = r"(?<!\w)" + re.escape(fold(phrase)) + r"(?!\w)"
    found = [m.start() for m in re.finditer(pattern, fold(text))]
    if len(found) != 1:
        raise BuildError(f"phrase occurs {len(found)} times, not once, in {ref}: {phrase!r}")
    return found[0]


TRAILING = re.compile(r"[,.;:!?”’\"')]*")


def leaf_lines(bible: dict, label: str, leaf: dict) -> list:
    """The passage broken into lines at its phrases. The lines join back to exactly the Berean text, or the build fails."""
    _, verses = verses_of(bible, label)
    inside = {(c, v) for c, v, _ in verses}
    placed = []
    for kind, ref, words in leaf["marks"]:
        if kind not in KIND_LABELS:
            raise BuildError(f"unknown kind {kind} on {label}")
        c, v, text = verse_position(bible, ref)
        if (c, v) not in inside:
            raise BuildError(f"{ref} is outside the passage {label}")
        start = find_once(words, text, ref)
        placed.append((c, v, start, start + len(words), kind))
    placed.sort()
    for first, second in zip(placed, placed[1:]):
        if first[:2] == second[:2] and first[3] > second[2]:
            raise BuildError(f"two phrases overlap in {label} at {first[0]}:{first[1]}")
    lines, plain = [], []
    level = 0
    so_steps = 0

    def flush() -> None:
        if plain:
            lines.append({"k": None, "l": level, "runs": list(plain)})
            plain.clear()
    for c, v, text in verses:
        plain.append({"v": v})
        at = 0
        for pc, pv, start, end, kind in placed:
            if (pc, pv) != (c, v):
                continue
            if start > at:
                plain.append(text[at:start])
            head = list(plain) if all(isinstance(run, dict) for run in plain) else []
            if not head:
                flush()
            else:
                plain.clear()
            if kind == "thanks":
                level, so_steps = 0, 0
            elif kind == "asks":
                level, so_steps = 1, 0
            elif kind == "so":
                so_steps = min(so_steps + 1, 3)
                level = 1 + so_steps
            end += len(TRAILING.match(text, end).group(0))  # a comma or full stop stays on the line it closes, never on a line of its own
            lines.append({"k": kind, "l": level, "runs": head + [text[start:end]]})
            at = end
        if at < len(text):
            plain.append(text[at:])
    flush()
    for line in lines:
        line["runs"] = [run.strip() if isinstance(run, str) else run for run in line["runs"]]
        line["runs"] = [run for run in line["runs"] if run != ""]
    shown = "".join(run for line in lines for run in line["runs"] if isinstance(run, str))
    if re.sub(r"\s", "", shown) != re.sub(r"\s", "", "".join(t for _, _, t in verses)):
        raise BuildError(f"the lines of {label} do not join back to its text")
    return lines


def build_leaf(builder, label: str) -> dict:
    leaf = LEAVES[label]
    key = builder.passage(label)
    note = lambda text: builder.runs(text, f"leaf {label}", [key])  # noqa: E731
    out = {"r": key, "label": label, "role": ROLES[leaf["role"]], "who": note(leaf["who"]), "sure": note(leaf["sure"]),
           "lines": leaf_lines(builder.bible, label, leaf)}
    if leaf.get("note"):
        out["note"] = note(leaf["note"])
    return out


def build_climb(builder, climb: dict) -> dict:
    leaf = LEAVES[climb["leaf"]]
    stations, last = [], (0, 0, -1)
    for kind, ref, words in climb["stations"]:
        c, v, text = verse_position(builder.bible, ref)
        here = (c, v, find_once(words, text, ref))
        if here < last:
            raise BuildError(f"{climb['name']}: stations out of verse order at {ref}")
        last = here
        if not any(mark[0] == kind and mark[1] == ref and has_words(fold(words), fold(mark[2])) for mark in leaf["marks"]):
            raise BuildError(f"{climb['name']}: {words!r} is not inside a {kind} phrase of that leaf at {ref}")
        stations.append({"k": kind, "r": builder.passage(ref), "label": ref, "t": typographic(words), "verse": typographic(text)})
    if stations[-1]["k"] != "ends":
        raise BuildError(f"{climb['name']} must finish on where it arrives")
    if "so that" not in fold(plain_text(builder.bible, climb["leaf"])):
        raise BuildError(f"the page says all six say so that; {climb['leaf']} does not")
    return {"id": climb["id"], "name": climb["name"], "part": climb["part"], "r": builder.passage(climb["leaf"]), "stations": stations}


def inside(builder, ref: str, cited: set) -> bool:
    """Whether every verse of a reference lies inside one passage the study cites."""
    code, verses = verses_of(builder.bible, ref)
    wanted = {(c, v) for c, v, _ in verses}
    return any(builder.passages[k]["code"] == code and wanted <= {(v["c"], v["v"]) for v in builder.passages[k]["verses"]} for k in cited)


def build_spine(builder, parts: list, cited: set) -> list:
    """The prayer line by line. Each line's words occur once in its verse; each points at a part that exists, every part is
    reached, and each letter set beside a line lies inside a passage the study cites."""
    numbers = {part["n"] for part in parts}
    out = []
    for line in SPINE:
        c, v, text = verse_position(builder.bible, line["ref"])
        find_once(line["words"], text, line["ref"])
        if line["part"] not in numbers:
            raise BuildError(f"spine line {line['id']} points at part {line['part']}, which the study does not have")
        for ref in line["letters"]:
            if not inside(builder, ref, cited):
                raise BuildError(f"spine line {line['id']}: {ref} is not inside any passage the study cites")
        out.append({"id": line["id"], "r": builder.passage(line["ref"]), "label": line["ref"], "words": typographic(line["words"]),
                    "part": line["part"], "band": line["band"], "letters": [{"r": builder.passage(ref), "label": ref} for ref in line["letters"]]})
    unreached = numbers - {line["part"] for line in SPINE}
    if unreached:
        raise BuildError(f"no line of the prayer leads to part(s) {sorted(unreached)}")
    return out
