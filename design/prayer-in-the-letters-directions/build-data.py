#!/usr/bin/env python3
"""Build data.js for the Prayer across Scripture mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/prayer-in-the-letters-directions/build-data.py   (exit 1 and no data.js change if any check fails)
  --check     run the same checks and fail if data.js is not what its inputs build now. Writes nothing.
  --selftest  feed the checks wrong inputs in memory and confirm each is refused. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their
reference; every reference resolves with no gap; each quoted phrase is in the reference given for it (see prose.py), or its
held source, confession article or listed term; each passage's lines join back to exactly its Berean text; each labelled
phrase occurs once in its verse; stations lie inside a phrase of the same kind, in verse order; every line of the prayer
leads to a part and every part is reached; no link leaves the site. It does not prove that a label or a reading is right.
"""
import hashlib
import json
import os
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/prayer-in-the-letters/content.md"
SCHEMA = 2
EXPECTED_JS = {"theme.js", "art.js", "pc-core.js", "pc-hero.js", "pc-parts.js", "pc-spine.js", "pc-climb.js", "pc-questions.js", "pc.js"}
EXPECTED = {"parts": 6, "questions": 6, "letter passages": 9, "reported": 6, "columns": 6}
GOSPELS = {"Matthew", "Mark", "Luke", "John"}
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
import study_lists as L  # noqa: E402
from prose import HELD, PROJECT, Builder  # noqa: E402
from scripture_text import BSB, CANON, BuildError, load_bible  # noqa: E402
from shapes import build_climb, build_leaf, build_spine  # noqa: E402

TOP = {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Frame": "frame", "Selection": "selection", "SpineLead": "spineLead",
       "SpineReads": "spineReads", "SpineCare": "spineCare", "ClimbLead": "climbLead", "ClimbReads": "climbReads", "QuestionsLead": "questionsLead"}
CLOSE = {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again"}
TAG = re.compile(r"\[(read|care|open|source:[a-z0-9-]+)\] (.+)")


def heading(study: dict, line: str) -> tuple:
    """Open the section a level-two heading names. Returns (zone, the dict that receives it)."""
    numbered = re.fullmatch(r"## (\d\d) (.+)", line)
    question = re.fullmatch(r"## Question ([a-z]+): (.+)", line)
    closing = re.fullmatch(r"## Close: (.+)", line)
    if numbered:
        holder = {"n": numbered.group(1), "title": numbered.group(2), "sub": [], "raw": {}}
        study["parts"].append(holder)
        return "part", holder
    if question:
        holder = {"id": question.group(1), "title": question.group(2), "blocks": [], "raw": {}}
        study["questions"].append(holder)
        return "question", holder
    if closing:
        study["closing"] = closing.group(1)
        return "close", study
    raise BuildError(f"heading not recognised: {line}")


def keyed(zone: str, holder: dict, sub: dict | None, line: str) -> None:
    """A keyed line, or a plain paragraph inside a part's sub-section or a question."""
    key, sep, value = line.partition(": ")
    bold = re.fullmatch(r"\*\*(Main readings|Consider|Reflect):\*\* (.+)", line)
    if zone == "part" and bold:
        holder["raw"][bold.group(1)] = bold.group(2)
    elif zone == "part" and sub is None and key == "Hook" and sep:
        holder["raw"]["Hook"] = value
    elif zone == "question" and key == "Text" and sep and not holder["blocks"]:
        holder["raw"]["Text"] = value
    elif zone == "top" and key in TOP and sep:
        holder["raw"][key] = value
    elif zone == "close" and (key in CLOSE or key == "Passage") and sep:
        holder["raw"][key] = value
    elif zone == "part" and sub is not None:
        sub["blocks"].append({"k": "p", "raw": line})
    elif zone == "question":
        holder["blocks"].append({"k": "p", "raw": line})
    else:
        raise BuildError(f"line belongs to nothing, or uses a key this section does not allow: {line[:70]}")


def parse(builder: Builder, lines: list) -> dict:
    """content.md into raw sections. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"parts": [], "questions": [], "raw": {}}
    zone, holder, sub, index = "top", study, None, 0
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        if not line:
            continue
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("## "):
            zone, holder = heading(study, line)
            sub = None
        elif line.startswith("### "):
            if zone != "part":
                raise BuildError(f"sub-heading outside a part: {line}")
            sub = {"title": line[4:], "blocks": []}
            holder["sub"].append(sub)
        elif line.startswith("> "):
            ref_at = next((j for j in range(index, len(lines)) if lines[j].strip()), None)
            if ref_at is None:
                raise BuildError(f"block quote at the end of the file has no reference: {line[:50]}")
            block = builder.block_quote(line[2:], lines[ref_at])
            index = ref_at + 1
            target = study if zone == "top" else (sub if zone == "part" else holder if zone == "question" else None)
            if target is None:
                raise BuildError(f"block quote outside a part or question: {line[:60]}")
            if zone == "top":
                study["opening"] = block
            else:
                target["blocks"].append(block)
        elif TAG.match(line):
            tag, text = TAG.match(line).groups()
            target = holder["blocks"] if zone == "question" else (sub["blocks"] if sub is not None else None)
            if target is None:
                raise BuildError(f"tagged paragraph outside a part's sub-section or a question: {line[:60]}")
            target.append({"k": "source", "src": tag[7:], "raw": text} if tag.startswith("source:") else {"k": tag, "raw": text})
        elif line.startswith("["):
            raise BuildError(f"unknown paragraph tag: {line[:50]}")
        else:
            keyed(zone, holder, sub, line)
    return study


def ref_list(builder: Builder, text: str) -> list:
    return [{"r": builder.passage(label), "label": label} for _, _, label in builder.refs_in(text)]


def render_blocks(builder: Builder, blocks: list, section: str, scope: list) -> list:
    """Each block's prose to runs. A quotation printed above is in scope for the sentences after it."""
    out = []
    for block in blocks:
        if block["k"] == "quote":
            scope = scope + [block["r"]]
            out.append({k: v for k, v in block.items() if k != "t"} | {"t": block["t"]})
            continue
        if block["k"] == "source" and block["src"] not in {s["id"] for s in L.SOURCES}:
            raise BuildError(f"{section}: unknown source {block['src']}")
        text = f"[source:{block['src']}] {block['raw']}" if block["k"] == "source" else block["raw"]
        runs = builder.runs(text, section, scope)
        out.append({"k": block["k"], "runs": runs[1:] if block["k"] == "source" else runs, **({"src": block["src"]} if block["k"] == "source" else {})})
    return out


def need(raw: dict, keys, where: str) -> None:
    missing = [key for key in keys if key not in raw]
    if missing:
        raise BuildError(f"{where} lacks {missing}")


def render(builder: Builder, study: dict) -> dict:
    """Raw sections to the page's study, checking every quotation against the scope its section allows."""
    need(study, ("title", "opening", "closing"), "content.md")
    need(study["raw"], [*TOP, *CLOSE, "Passage"], "content.md")
    spine_refs = {line["part"]: [] for line in L.SPINE}
    for line in L.SPINE:
        spine_refs[line["part"]].append(builder.passage(line["ref"]))
    leaf_keys = [builder.passage(label) for label in L.LEAVES]
    close_passage = builder.passage(study["raw"]["Passage"])
    top_scope = [study["opening"]["r"], close_passage, *leaf_keys]
    out = {"title": study["title"], "opening": study["opening"], "closing": study["closing"], "passage": close_passage, "parts": [], "questions": []}
    for key, name in TOP.items():
        out[name] = builder.runs(study["raw"][key], "top", top_scope)
    for key, name in CLOSE.items():
        out[name] = builder.runs(study["raw"][key], "close", [close_passage])
    for part in study["parts"]:
        need(part["raw"], ("Main readings", "Hook", "Consider", "Reflect"), f"part {part['n']}")
        readings = ref_list(builder, part["raw"]["Main readings"])
        scope = [r["r"] for r in readings] + spine_refs.get(part["n"], []) + [close_passage]  # the prayer itself is every part's spine
        out["parts"].append({"n": part["n"], "title": builder.runs(part["title"], part["n"], scope), "readings": readings,
                             "leaves": [r["label"] for r in readings if r["label"] in L.LEAVES],
                             "hook": builder.runs(part["raw"]["Hook"], part["n"], scope),
                             "sub": [{"title": s["title"], "blocks": render_blocks(builder, s["blocks"], part["n"], scope)} for s in part["sub"]],
                             "consider": builder.runs(part["raw"]["Consider"], part["n"], scope), "reflect": builder.runs(part["raw"]["Reflect"], part["n"], scope)})
    for question in study["questions"]:
        need(question["raw"], ("Text",), f"question {question['id']}")
        texts = ref_list(builder, question["raw"]["Text"])
        if not texts or not question["blocks"] or question["blocks"][0]["k"] not in ("read", "care"):
            raise BuildError(f"question {question['id']} must name its text and open with this study's reading or a care note")
        scope = [t["r"] for t in texts] + [close_passage]
        out["questions"].append({"id": question["id"], "title": builder.runs(question["title"], f"q-{question['id']}", scope), "texts": texts,
                                 "blocks": render_blocks(builder, question["blocks"], f"q-{question['id']}", scope)})
    return out


def check_letters(study: dict) -> None:
    """Every letter passage a part reads has a leaf, and every leaf is read; part numbers run 01 to 06 in order."""
    read = [label for part in study["parts"] for label in (r["label"] for r in part["readings"]) if label.rsplit(" ", 1)[0] not in GOSPELS]
    if sorted(read) != sorted(L.LEAVES):
        raise BuildError(f"the parts' letter passages and the leaves differ: read {sorted(set(read) - set(L.LEAVES))}, unread {sorted(set(L.LEAVES) - set(read))}")
    if [p["n"] for p in study["parts"]] != [f"{i:02d}" for i in range(1, EXPECTED["parts"] + 1)]:
        raise BuildError(f"the parts must be numbered 01 to {EXPECTED['parts']:02d} in order")
    if len(study["questions"]) != EXPECTED["questions"]:
        raise BuildError(f"the page says {EXPECTED['questions']} questions; found {len(study['questions'])}")


def check_known_issues(raw_text: str) -> None:
    for sentence in L.KNOWN_TEXT_ISSUES:
        if sentence not in raw_text:
            raise BuildError(f"KNOWN_TEXT_ISSUES lists words no longer in content.md; update the list and the README: {sentence[:60]}")


def check_code() -> None:
    """The only markup strings allowed are the fixed drawings. Missing page files, inline scripts or handlers fail the build."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    if found != EXPECTED_JS:
        raise BuildError(f"page files differ from the expected list: missing {sorted(EXPECTED_JS - found)}, extra {sorted(found - EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        for word in ("insertAdjacentHTML", "outerHTML", "document.write", "eval(", "new Function", "javascript:"):
            if word in text:
                raise BuildError(f"{path.name} uses {word}")
        allowed = 1 if path.name == "pc-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in pc-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")
    scripts = set(re.findall(r'<script src="js/([^"]+)"', page))
    if scripts != EXPECTED_JS:
        raise BuildError(f"index.html loads {sorted(scripts)}, expected {sorted(EXPECTED_JS)}")


SAFE_HREF = re.compile(r"/(?:mockups/[a-z0-9-]+-directions/|study/creeds/[a-z0-9-]+)")


def check_links() -> None:
    for source in L.SOURCES:
        if source["href"] is not None and not SAFE_HREF.fullmatch(source["href"]):
            raise BuildError(f"source link must be a page on this site: {source['id']}: {source['href']}")
    for title, slug in L.STUDY_LINKS.items():
        if not (WEBSITE / "design" / f"{slug}-directions").is_dir():
            raise BuildError(f"STUDY_LINKS sends {title!r} to {slug}-directions, which does not exist")


def scan_payload(data: dict) -> None:
    """Every link the page will draw from data: a passage key, a study mock-up or a site creed page. Nothing else."""
    def walk(value) -> None:
        if isinstance(value, dict):
            if "s" in value and not SAFE_HREF.fullmatch(value["s"]):
                raise BuildError(f"a study link leaves the allowed pages: {value['s']}")
            if "r" in value and value["r"] not in data["passages"]:
                raise BuildError(f"a reference link has no passage: {value['r']}")
            for item in value.values():
                walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)
    walk(data["study"])
    walk(data["spine"])
    walk(data["climbs"])
    walk(data["leaves"])


def figures(builder: Builder, study: dict, leaves: dict, climbs: list, spine: list) -> dict:
    labels = list(L.LEAVES)
    reported = sum(1 for label in labels if L.LEAVES[label]["role"] == "reported")
    if len(labels) != EXPECTED["letter passages"] or reported != EXPECTED["reported"] or len(climbs) != EXPECTED["columns"]:
        raise BuildError(f"the page says {EXPECTED}; the lists now give {len(labels)} passages, {reported} reported, {len(climbs)} columns")
    walked = {(leaves[label]["r"], v["c"], v["v"]) for label in labels for v in builder.passages[leaves[label]["r"]]["verses"]}
    requests = [line for line in spine if line["band"] in ("god", "us")]
    return {"passages": len(labels), "reported": reported, "instructions": len(labels) - reported, "verses": len(walked),
            "named": sum(1 for label in labels for line in leaves[label]["lines"] if line["k"]), "requests": len(requests),
            "aboutGod": sum(1 for line in requests if line["band"] == "god"), "parts": len(study["parts"]), "questions": len(study["questions"])}


def fingerprints() -> dict:
    """Only this study's own inputs. A shared frame file edited by another job must not make this page read as stale."""
    own = ("build-data.py", "study_lists.py", "scripture_text.py", "prose.py", "shapes.py")
    paths = {CONTENT, PROJECT / L.BFM_HELD, *(HERE / name for name in own), *HELD.values(), *(BSB / f"{code}.json" for code in CANON)}
    return {path.relative_to(PROJECT).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}


def build_payload(content_text: str | None = None) -> tuple:
    """The page's data and the build's notes. `content_text` lets the self-test feed altered text in memory."""
    builder = Builder(load_bible())
    raw_text = content_text if content_text is not None else CONTENT.read_text(encoding="utf-8-sig")
    raw_text = raw_text.replace("\r\n", "\n")
    check_known_issues(raw_text)
    study = render(builder, parse(builder, raw_text.split("\n")))
    check_letters(study)
    check_code()
    check_links()
    leaves = {label: build_leaf(builder, label) for label in L.LEAVES}
    climbs = [build_climb(builder, climb) for climb in L.CLIMBS]
    for climb in climbs:
        if climb["part"] not in {p["n"] for p in study["parts"]} or climb["r"] not in {r["r"] for p in study["parts"] if p["n"] == climb["part"] for r in p["readings"]}:
            raise BuildError(f"column {climb['name']} sends readers to part {climb['part']}, which does not read its passage")
    spine = build_spine(builder, study["parts"], set(builder.passages))
    stale = builder.unused()
    if stale:
        raise BuildError(f"study_lists.py has entries the study no longer uses: {stale}")
    numbers = figures(builder, study, leaves, climbs, spine)
    data = {"schema": SCHEMA, "study": study, "spine": spine, "bands": L.BANDS, "leaves": leaves, "climbs": climbs, "kinds": L.KIND_LABELS,
            "passages": builder.passages, "sources": L.SOURCES, "numbers": numbers, "checks": len(builder.checks),
            "textIssues": list(L.KNOWN_TEXT_ISSUES.values()), "builtFrom": fingerprints()}
    scan_payload(data)
    payload = "window.PC = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, builder


def write_atomically(target: Path, payload: str) -> None:
    handle, name = tempfile.mkstemp(prefix="data.js.", suffix=".tmp", dir=target.parent)
    temporary = Path(name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    args = sys.argv[1:]
    if args == ["--selftest"]:
        from build_selftest import run_selftest
        return run_selftest(sys.modules[__name__], CONTENT.read_text(encoding="utf-8-sig"))
    check_only = args == ["--check"]
    if args and not check_only:
        print(f"build-data: FAILED: expected no arguments, --check or --selftest, received {args}", file=sys.stderr)
        return 2
    try:
        payload, numbers, builder = build_payload()
        target = HERE / "data.js"
        if check_only:
            current = target.read_text(encoding="utf-8") if target.exists() else None
            if current != payload:
                print(f"build-data: STALE: {target} does not match what its inputs build. Run build-data.py.", file=sys.stderr)
                return 1
        else:
            write_atomically(target, payload)
    except (BuildError, OSError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    print(f"build-data: {'current' if check_only else 'ok'}. {numbers}; {len(builder.passages)} passages; {len(builder.checks)} notes still to check")
    print(f"  quotations bound to their section's readings (sentence had no reference): {len(builder.fallbacks)}")
    for section, phrase, label in builder.fallbacks:
        print(f"    {section}: {phrase!r} in {label}")
    print(f"  text issues needing the owner's word: {list(L.KNOWN_TEXT_ISSUES.values())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
