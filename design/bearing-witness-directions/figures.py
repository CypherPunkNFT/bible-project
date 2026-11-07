"""The figures of the Witness and the nations page, checked: the chain of Romans 10:14–15, the rings of Acts 1:8, and
the seven passages against the close's three questions. Also the check of the page's own files."""
import re
from pathlib import Path

from scripture_text import BuildError, fold, has_words, plain_text, typographic

NUMBER_WORDS = {"seven": 7, "four": 4, "five": 5, "six": 6, "three": 3}
SHARED = ["../authors-directions/shared/frame.css", "../authors-directions/shared/frame.js",
          "../authors-directions/teachers/teachers.css", "../manuscripts-directions/css/ms.css", "../letters-shared/favicon.svg"]
SCRIPTS = ["js/theme.js", "data.js", "../authors-directions/shared/frame.js", "js/art.js", "js/bw-core.js", "js/bw-hero.js",
           "js/bw-chain.js", "js/bw-parts.js", "js/bw-places.js", "js/bw-questions.js", "js/bw.js"]


def plain(text: str) -> str:
    return fold(text).replace('"', "")


def in_study(raw: str, sentence: str, what: str) -> None:
    if fold(sentence) not in fold(raw):
        raise BuildError(f"{what}: {sentence!r} is not in the study's own text")


def phrase_in(builder, label: str, words: str, what: str) -> str:
    key = builder.passage(label)
    if not has_words(plain(words), plain_text(builder.bible, label)):
        raise BuildError(f"{what}: {words!r} is not in {label}")
    return key


def within(builder, key: str, range_keys: list, what: str) -> None:
    """The verse is one of the verses of the part's readings."""
    verses = {cv for k in range_keys for cv, _ in builder.passages[k]["verses"]}
    if not all(cv in verses for cv, _ in builder.passages[key]["verses"]):
        raise BuildError(f"{what}: {builder.passages[key]['label']} is outside its passage")


def check_chain(builder, L, raw: str, parts: dict) -> list:
    text = plain_text(builder.bible, L.CHAIN_RANGE)
    verbs = tuple(re.findall(r"[Hh]ow (?:then )?can they (\w+)", text))
    ids = tuple(link["id"] for link in L.CHAIN)
    if verbs != L.CHAIN_VERBS or ids[:len(verbs)] != verbs or len(ids) != len(verbs) + 1 or not has_words("sent", text):
        raise BuildError(f"the chain must be the verses' own links {verbs} and then 'sent', in order; CHAIN has {ids}")
    range_key = builder.passage(L.CHAIN_RANGE)
    within(builder, range_key, parts["02"]["readings"], "the chain")
    chain, last = [], -1
    for link in L.CHAIN:
        key = phrase_in(builder, link["ref"], link["words"], f"chain link {link['id']}")
        at = text.find(plain(link["words"]))
        if at <= last:
            raise BuildError(f"chain link {link['id']} is out of the verses' order")
        last = at
        if link.get("study"):
            in_study(raw, link["study"], f"chain link {link['id']}")
        if link["whose"] not in (None, "god", "speaks", "hears") or (link["whose"] is None) == bool(link.get("study")):
            raise BuildError(f"chain link {link['id']}: a place needs the study's words for it, and no place needs a note")
        chain.append({**link, "r": key, "words": typographic(link["words"]), "study": typographic(link.get("study") or "") or None,
                      "note": typographic(link.get("note") or "") or None})
    phrase_in(builder, L.CHAIN_END["ref"], L.CHAIN_END["words"], "the chain's last line")
    return chain


def check_rings(builder, L, parts: dict) -> dict:
    key = builder.passage(L.RINGS_REF)
    if key not in parts["01"]["also"]:
        raise BuildError(f"the rings are {L.RINGS_REF}, which part 01 must quote")
    text, last = plain_text(builder.bible, L.RINGS_REF), -1
    for ring in L.RINGS:
        at = text.find(plain(ring["words"]))
        if at <= last or not has_words(plain(ring["words"]), text):
            raise BuildError(f"ring {ring['label']!r}: {ring['words']!r} is not in {L.RINGS_REF} in the verse's order")
        last = at
    return {"r": key, "rings": L.RINGS}


def check_places(builder, L, raw: str, parts: dict) -> list:
    if [row["part"] for row in L.PLACES] != list(parts):
        raise BuildError(f"PLACES must have one row per part, in order: {list(parts)}")
    for _, question in L.COLUMNS:
        in_study(raw, question, "a column of the places table")
    rows = []
    for row in L.PLACES:
        readings, seen, out = parts[row["part"]]["readings"], [], {"part": row["part"]}
        for column, _ in L.COLUMNS:
            out[column] = []
            for label, words in row[column]:
                key = phrase_in(builder, label, words, f"places {row['part']} {column}")
                within(builder, key, readings, f"places {row['part']} {column}")
                if any(plain(words) in plain(other) or plain(other) in plain(words) for other in seen):
                    raise BuildError(f"places {row['part']}: {words!r} is in two places")
                seen.append(words)
                out[column].append({"r": key, "words": typographic(words)})
        if row.get("other"):
            other = row["other"]
            key = phrase_in(builder, other["ref"], other["words"], f"places {row['part']} other")
            within(builder, key, readings, f"places {row['part']} other")
            in_study(raw, other["study"], f"places {row['part']} other")
            out["other"] = {**other, "r": key, "words": typographic(other["words"])}
        if row["study"]:
            in_study(raw, row["study"], f"places {row['part']}")
        out["study"] = typographic(row["study"]) if row["study"] else None
        rows.append(out)
    return rows


def build_figures(builder, L, raw: str, study: dict) -> dict:
    parts = {p["n"]: p for p in study["parts"]}
    stated = re.search(r"It walks (\w+) passages", raw)
    if not stated or NUMBER_WORDS.get(stated.group(1)) != len(parts):
        raise BuildError(f"the study says it walks {stated.group(1) if stated else '?'} passages; it has {len(parts)} parts")
    return {"chain": check_chain(builder, L, raw, parts), "rings": check_rings(builder, L, parts),
            "places": check_places(builder, L, raw, parts), "columns": L.COLUMNS, "placesRead": typographic(L.PLACES_READ),
            "chainEnd": {**L.CHAIN_END, "r": builder.passage(L.CHAIN_END["ref"])}, "chainRange": builder.passage(L.CHAIN_RANGE)}


def check_page_files(here: Path) -> None:
    """The page loads exactly the expected scripts, no inline script or handler, one innerHTML (fixed drawings), and the
    shared frame files it borrows read-only are there."""
    html = (here / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script src="([^"]+)"></script>', html)
    if scripts != SCRIPTS:
        raise BuildError(f"index.html loads {scripts}, expected {SCRIPTS}")
    if re.search(r"<script>|<script [^s]|\son[a-z]+=", html):
        raise BuildError("index.html has an inline script or an inline event handler")
    own = sorted(p.name for p in (here / "js").glob("*.js"))
    if own != sorted(Path(s).name for s in SCRIPTS if s.startswith("js/")):
        raise BuildError(f"js/ holds {own}; it should hold only the scripts index.html loads")
    for name in own:
        code = (here / "js" / name).read_text(encoding="utf-8")
        if re.search(r"\beval\(|new Function\(|outerHTML|insertAdjacentHTML|document\.write", code):
            raise BuildError(f"js/{name} builds markup from strings in a way this page does not allow")
        allowed = 1 if name == "bw-core.js" else 0
        if code.count(".innerHTML") != allowed:
            raise BuildError(f"js/{name} uses innerHTML {code.count('.innerHTML')} times, expected {allowed}")
    missing = [s for s in SHARED if not (here / s).resolve().is_file()]
    if missing:
        raise BuildError(f"shared frame files this page borrows are missing: {missing}")
