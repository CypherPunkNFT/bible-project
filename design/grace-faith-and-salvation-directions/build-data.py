#!/usr/bin/env python3
"""Build data.js for the Saved by grace mock-up from the study's content.md, checking it against the site's Berean text.

Run from Website/: python design/grace-faith-and-salvation-directions/build-data.py
  --check     rebuild in memory, run the refusal tests, and fail if data.js is stale or a file the page loads is missing
  --selftest  only the refusal tests: wrong inputs, tried in memory, each of which must be refused
Exit 1 with a message, and data.js unchanged, if any check fails. Nothing outside this folder is written.
"""
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists  # noqa: E402
from scripture_text import BOOKS, REF_RE, BuildError, fold, load_bible, ref_id, typographic, verses_of  # noqa: E402
from page_checks import check_crisis, check_lists, check_page_files, mark_verses  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/grace-faith-and-salvation/content.md"
OUT = HERE / "data.js"
LIST_NAMES = ("KINDS", "VERB_CHART", "NO_TURN", "PRAYERS", "DECLARING", "STANDING", "ABRAHAM", "CHAIN", "TWO_VERBS", "CRISIS",
              "TEXT_PATCHES", "STUDY_LINKS", "OUTSIDE_QUOTES", "OWN_TERMS", "SOURCES")
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
SITE_LINK = re.compile(r"^/(?![/\\])[A-Za-z0-9/_\-?=&#.]*$")
CHECK_NOTE = re.compile(r" ?\[check(?: before publishing|: [^\]\n]*?)\]")
BOOK_NAMED = re.compile(r"\b(?:" + "|".join(map(re.escape, BOOKS)) + r") \d")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(?:(\d+):)?(\d+))?(?![\d:])")
NEGATIONS = {"not", "no", "never", "nor", "neither", "without"}
FIELDS = ("Concepts", "Motto", "Lead", "Hook", "Setting", "Way", "Invite", "Question", "Again", "Passage")
PREFIXES = {"[care] ": "care", "[other] ": "other", "[read] ": "read", "[source:calvin-antidote] ": "source"}
LIMITS = re.compile(r"(What the (?:passage|parable) does not (?:do|teach)): (.*)")


class Builder:
    def __init__(self, bible: dict, lists: dict) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}
        self.checks: list = []

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def text_of(self, label: str) -> str:
        """The verses of a reference as one string, compared regardless of quote and dash kind."""
        _, verses = verses_of(self.bible, label.replace("-", "–"))
        return fold(" ".join(v[2] for v in verses)).replace('"', "").replace("'", "")

    def refs_in(self, text: str) -> list:
        """Every reference in plain text, with its span, including short continuations such as "3:28 and 4:5"."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(4) or match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4) + ':' if more.group(4) else ''}{more.group(5)}" if more.group(5) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                chapter = more.group(4) or chapter
                end = more.end()
        return found

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t} (a site link), {r,t} (a reference), {s,t} (a named study)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.match(url):
                    raise BuildError(f"only links to this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": bold})
            elif italic in self.lists["STUDY_LINKS"]:
                out.append({"s": self.lists["STUDY_LINKS"][italic], "t": italic})
            else:
                out.append({"i": italic})
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start > last:
                out.append(text[last:start])
            key = self.passage(label)
            cited.append(key)
            out.append({"r": key, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(text[last:])
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, cited: list, where: str) -> None:
        """Each quoted phrase is in a verse its own reference names, else one its paragraph cites, or on a named list."""
        if raw.count('"') % 2:
            raise BuildError(f"{where}: an odd number of quotation marks, so a quotation cannot be told from the prose")
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            if phrase in self.lists["OUTSIDE_QUOTES"] or phrase in self.lists["OWN_TERMS"]:
                continue
            own = [ref_id(label.replace("-", "–")) for _, _, label in self.refs_in(after or "")]
            if after and not own and BOOK_NAMED.search(after):
                raise BuildError(f"{where}: the reference after {phrase!r} does not resolve: ({after})")
            for key in own:
                if key not in self.passages:
                    self.passage(next(label for _, _, label in self.refs_in(after) if ref_id(label.replace('-', '–')) == key))
            labels = [self.passages[k]["label"] for k in (own or cited)]
            if not any(self.quote_in(phrase, label) for label in labels):
                raise BuildError(f"{where}: quoted words {phrase!r} are not in any verse this paragraph cites ({', '.join(labels) or 'none'})")

    def quote_in(self, phrase: str, label: str) -> bool:
        """True if the phrase is in the reference as whole words; pieces split by an ellipsis must come in order, and a
        piece the verse puts straight after "not" (or a like word) does not count, so a quote cannot reverse its verse."""
        text = self.text_of(label)
        pieces = [p.strip(" ,.") for p in re.split(r"\.\.\.|…", phrase) if p.strip(" ,.")]
        folded = [fold(p).replace('"', "").replace("*", "").replace("'", "") for p in pieces]
        for first in {folded[0], folded[0][:1].lower() + folded[0][1:], folded[0][:1].upper() + folded[0][1:]}:
            pattern = r"(?<!\w)" + r"(?!\w).+?(?<!\w)".join(map(re.escape, [first] + folded[1:])) + r"(?!\w)"
            for found in re.finditer(pattern, text):
                before = re.findall(r"\w+", text[:found.start()])
                if not before or before[-1].lower() not in NEGATIONS or first.split()[0].lower() in NEGATIONS:
                    return True
        return False

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        bible = fold(" ".join(v[1] for v in self.passages[key]["verses"]))
        if fold(quoted) != bible:
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label}

    def para(self, raw: str, where: str, section: dict | None = None) -> list:
        """A paragraph may quote the verses it cites, its section's main readings, or the passage printed just above it."""
        cited: list = []
        clean = self.strip_checks(raw, where)
        runs = self.runs(typographic(clean), cited)
        nearby = list((section or {}).get("readings", []))
        last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
        self.check_quotes(clean, cited + nearby + ([last["r"]] if last else []), where)
        return runs

    def strip_checks(self, raw: str, where: str) -> str:
        """Editorial "[check ...]" notes are kept off the page and listed in data.js, so the README can name them."""
        for note in CHECK_NOTE.findall(raw):
            self.checks.append({"where": where, "note": note.strip(" []")})
        clean = CHECK_NOTE.sub("", raw)
        if "[check" in clean:
            raise BuildError(f"{where}: a [check ...] note the build could not read: {clean[clean.index('[check'):][:60]!r}")
        return clean


def apply_patches(text: str, patches: list) -> str:
    for patch in patches:
        count = text.count(patch["old"])
        if count != 1:
            raise BuildError(f"text patch should match content.md exactly once, matched {count} times: {patch['old'][:50]!r}. "
                             "If content.md has been corrected, remove the patch from study_lists.py.")
        text = text.replace(patch["old"], patch["new"])
    return text


def place(builder: Builder, study: dict, current: dict | None, line: str, where: str) -> dict | None:
    """Put one line of content.md on the page. Returns the section later lines belong to."""
    if line.startswith("## "):
        head = line[3:]
        if head.startswith("Close: "):
            study["close"] = {"title": head[7:]}
            return study["close"]
        if re.match(r"\d\d ", head):
            part = {"n": head[:2], "title": head[3:], "blocks": []}
            study["parts"].append(part)
            return part
        intro = {"title": head, "blocks": []}
        study["intro"].append(intro)
        return intro
    if current is None and not re.match(r"(Concepts|Motto|Lead): ", line):
        raise BuildError(f"{where}: a line outside any section that the page does not know how to place: {line[:60]!r}")
    if line.startswith("### "):
        current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
    elif m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line):
        label, body = m.groups()
        if label == "Main readings":
            cited: list = []
            current["readingsText"] = builder.runs(typographic(body), cited)
            current["readings"] = cited
        else:
            current[label.lower()] = builder.para(body, where, current)
    elif prefix := next((p for p in PREFIXES if line.startswith(p)), None):
        current["blocks"].append({"k": PREFIXES[prefix], "runs": builder.para(line[len(prefix):], where, current)})
    elif m := LIMITS.match(line):
        current["blocks"].append({"k": "limits", "label": m.group(1), "runs": builder.para(m.group(2), where, current)})
    elif re.fullmatch(r"Read more in \*[^*]+\*\.", line):
        current["blocks"].append({"k": "more", "runs": builder.para(line, where, current)})
    elif (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
        place_field(builder, study, current, m.group(1), m.group(2), where)
    else:
        current["blocks"].append({"k": "p", "runs": builder.para(line, where, current)})
    return current


def place_field(builder: Builder, study: dict, current: dict | None, field: str, body: str, where: str) -> None:
    target = current if field in ("Hook", "Setting", "Way", "Invite", "Question", "Again", "Passage") else study
    if target is None:
        raise BuildError(f"{where}: {field} before any section")
    if field == "Concepts":
        target["concepts"] = body.split(" · ")
    elif field == "Motto":
        target["motto"] = body.split(" / ")
    elif field == "Passage":
        target["passage"] = builder.passage(body)
    elif field == "Setting":
        target["blocks"].append({"k": "setting", "runs": builder.para(body, where, target)})
    else:
        target[field.lower()] = builder.para(body, where, target)


def parse(builder: Builder, text: str) -> dict:
    lines = text.split("\n")
    study: dict = {"parts": [], "intro": [], "opening": []}
    current, placed, i = None, 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        placed += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"], _, study["subtitle"] = line[2:].partition(": ")
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; placed += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; placed += 1
            (current["blocks"] if current else study["opening"]).append(builder.block(quote, ref_line))
        else:
            current = place(builder, study, current, line, where)
    if placed != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    for key in ("title", "concepts", "motto", "lead", "opening", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    if len(study["parts"]) != 7 or [p["n"] for p in study["parts"]] != [f"0{n}" for n in range(1, 8)]:
        raise BuildError(f"the page is drawn for parts 01 to 07, found {[p['n'] for p in study['parts']]}")
    return study


def build_from(bible: dict, text: str, lists: dict, life: dict) -> tuple:
    """Everything the page needs, from the given inputs; touches no file. Returns (data.js text, builder)."""
    builder = Builder(bible, lists)
    study = parse(builder, apply_patches(text, lists["TEXT_PATCHES"]))
    extras = check_lists(builder, lists, study)
    crisis = check_crisis(text, lists["CRISIS"], life)
    quoted = {b["r"] for part in study["parts"] + study["intro"] for b in part["blocks"] if b["k"] == "quote"}
    quoted |= {b["r"] for b in study["opening"]} | {study["close"]["passage"]}
    printed = {(builder.passages[k]["label"].split(" ")[0], cv) for k in quoted for cv, _ in builder.passages[k]["verses"]}
    marks = mark_verses(builder, extras["verbs"], extras["chain"], extras["twoVerbs"])
    numbers = {"parts": len(study["parts"]), "walked": len(lists["VERB_CHART"]), "versesPrinted": len(printed),
               "godVerbs": extras.pop("godCount"),
               "turns": sum(1 for col in extras["chart"] if col["hinge"]), "references": len(builder.passages)}
    data = {"study": study, "passages": builder.passages, "marks": marks, "numbers": numbers, "crisis": crisis,
            "checks": builder.checks, "patches": [{"why": p["why"]} for p in lists["TEXT_PATCHES"]],
            "sources": lists["SOURCES"], "outside": lists["OUTSIDE_QUOTES"], "kinds": lists["KINDS"], **extras}
    body = json.dumps(data, ensure_ascii=False, indent=1).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.SG = " + body + ";\n", builder


def inputs() -> tuple:
    text = CONTENT.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    life = json.loads((WEBSITE / "src/data/resources/life.json").read_text(encoding="utf-8"))
    lists = {name: getattr(study_lists, name) for name in LIST_NAMES}
    return load_bible(), text, lists, life


def fingerprint(output: str, text: str) -> str:
    """data.js ends with the hashes of what it was built from (line endings normalised), so a stale file is plain to see."""
    parts = {"content.md": text} | {p.name: p.read_text(encoding="utf-8").replace("\r\n", "\n") for p in sorted(HERE.glob("*.py"))}
    prints = {name: hashlib.sha256(body.encode("utf-8")).hexdigest()[:16] for name, body in parts.items()}
    return output + "window.SG_BUILT_FROM = " + json.dumps(prints) + ";\n"


def write_atomically(path: Path, body: bytes) -> None:
    if path.resolve().parent != HERE:
        raise BuildError(f"refusing to write outside this folder: {path}")
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with open(temp, "wb") as handle:
            handle.write(body)
            handle.flush()
            os.fsync(handle.fileno())
        for attempt in range(4):
            try:
                os.replace(temp, path)
                return
            except PermissionError:
                if attempt == 3:
                    raise
                time.sleep(0.25)
    finally:
        if temp.exists():
            temp.unlink()


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    try:
        bible, text, lists, life = inputs()
        output, builder = build_from(bible, text, lists, life)
        output = fingerprint(output, text)
        if not output.endswith(";\n"):
            raise BuildError("the built data.js is incomplete")
        if "--selftest" in sys.argv or "--check" in sys.argv:
            from selftest import run_selftest
            print(run_selftest(build_from, bible, text, lists, life, OUT))
            if "--selftest" in sys.argv:
                return 0
        if "--check" in sys.argv:
            missing = check_page_files(HERE)
            if missing:
                raise BuildError(f"files the page loads are missing: {', '.join(missing)}")
            if not OUT.exists() or OUT.read_bytes() != output.encode("utf-8"):
                print("build-data: stale: data.js does not match content.md and the lists; run without --check", file=sys.stderr)
                return 1
            print(f"build-data: all checks pass; data.js is current ({len(builder.passages)} references, {len(builder.checks)} editorial notes listed)")
            return 0
        write_atomically(OUT, output.encode("utf-8"))
    except Exception as error:  # every failure is reported and leaves data.js as it was
        print(f"build-data: FAILED ({type(error).__name__}): {error}", file=sys.stderr)
        return 1
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} characters, {len(builder.passages)} references)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
