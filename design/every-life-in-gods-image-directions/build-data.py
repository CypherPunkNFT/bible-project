#!/usr/bin/env python3
"""Build data.js for the Every life in God's image mock-up from the study's content.md, checking it against the site's
Berean text and the outside sources held on this PC.

Run from Website/: python -B design/every-life-in-gods-image-directions/build-data.py
  --check     run every check and fail if data.js is not what this build would write
  --selftest  feed the checks wrong inputs in memory and confirm each one is refused (writes nothing)
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists as L  # noqa: E402
from figures import build_figures  # noqa: E402
from held import check_differs, check_outside, load_held  # noqa: E402
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/every-life-in-gods-image/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
CHAPTER_RE = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+)(?![\d:–-])")
CHECK_NOTE = re.compile(r"\[check(?: before publishing)?(?:: ([^\]]*))?\]")
SITE_LINK = re.compile(r"^/(?![/\\])")
MARKERS = {"[care] ": "care", "[read] ": "read", "[open] ": "open", "[limit] ": "limit"}
FIELDS = ("Subtitle", "Concepts", "Motto", "Lead", "Frame", "Selection", "Hook", "Text", "Way", "Close", "Question", "Again", "Passage")
READINGS_SPLIT = re.compile(r";\s*|,\s*|\s+and\s+")


class Builder:
    def __init__(self, bible: dict, held: dict) -> None:
        self.bible, self.held = bible, held
        self.passages: dict = {}
        self.used = {"exceptions": set(), "own": set(), "outside": set(), "links": set(), "italics": set(), "misquotes": set(), "differs": set(), "partial": set()}

    def passage(self, label: str) -> str:
        """A verse reference ("Genesis 9:6") or a whole chapter ("2 Samuel 9"). Returns its key."""
        label = label.replace("-", "–").strip()
        chapter = re.fullmatch(r"(.+) (\d+)", label)
        if chapter and chapter.group(1) in BOOKS:
            code, number = BOOKS[chapter.group(1)], int(chapter.group(2))
            verses = sorted((int(k.split(":")[1]), text) for k, text in self.bible[code].items() if int(k.split(":")[0]) == number)
            if not verses:
                raise BuildError(f"chapter does not exist in the Berean: {label}")
            key = f"{code}.{number}"
            self.passages[key] = {"label": label, "verses": [[f"{number}:{v}", text] for v, text in verses]}
            return key
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def text_of(self, key: str) -> str:
        return fold(" ".join(v[1] for v in self.passages[key]["verses"])).replace('"', "")

    def refs_in(self, text: str) -> list:
        """Every reference in plain text, with its span: verses, short continuations ("9:7, 10, 11, 13") and chapters."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                end = more.end()
        taken = [(s, e) for s, e, _ in found]
        for match in CHAPTER_RE.finditer(text):
            if not any(s <= match.start() < e for s, e in taken):
                found.append((match.start(), match.end(), match.group(0)))
        return sorted(found)

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {c} (a note still to check)."""
        out, last = [], 0
        for match in CHECK_NOTE.finditer(text):
            out += self.markup_runs(text[last:match.start()], cited)
            out.append({"c": (match.group(1) or "").strip() or "before publishing"})
            last = match.end()
        return out + self.markup_runs(text[last:], cited)

    def markup_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.match(url):
                    raise BuildError(f"only links on this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": bold})
            else:
                plain = italic.replace("’", "'")
                if plain in L.STUDY_LINKS:
                    self.used["links"].add(plain)
                    out.append({"s": f"../{L.STUDY_LINKS[plain]}/", "t": italic})
                elif plain in L.ITALIC_TERMS:
                    self.used["italics"].add(plain)
                    out.append({"i": italic})
                else:
                    raise BuildError(f"italic {italic!r} is neither a study on STUDY_LINKS nor a term on ITALIC_TERMS")
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

    def check_quotes(self, raw: str, allowed: list, where: str, section: str) -> None:
        """Each quoted phrase is Scripture in the verses it cites (every one of them), or in a verse its paragraph cites,
        its section's readings or the passage printed just above it; or a named outside source, or one of the study's
        own terms."""
        raw = CHECK_NOTE.sub("", raw)
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            plain = phrase.replace("’", "'")
            if (section, plain) in L.OWN_TERMS:
                self.used["own"].add((section, plain))
                continue
            if plain in L.OUTSIDE_QUOTES:
                check_outside(self.held, plain, L.OUTSIDE_QUOTES[plain])
                self.used["outside"].add(plain)
                continue
            if plain in L.OUTSIDE_DIFFERS:
                check_differs(self.held, plain, L.OUTSIDE_DIFFERS[plain])
                self.used["differs"].add(plain)
                continue
            if (section, plain) in L.MISQUOTES:
                self.check_misquote(section, plain)
                continue
            if not after:  # a reference later in the same sentence, before any other quotation, is still this quote's own
                rest = re.split(r'"|(?<=[.!?])\s', raw[match.end():], maxsplit=1)[0]
                later = re.search(r"\(([^)]*)\)", rest)
                after = later.group(1) if later else ""
            own = [label.replace("-", "–") for _, _, label in self.refs_in(after)]
            pieces = [p.strip(" ,.!?;:") for p in re.split(r"…|\.\.\.", phrase) if p.strip(" ,.!?;:")]
            for piece in pieces:
                folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                found = lambda key: any(has_words(v, self.text_of(key).replace("'", "")) for v in variants)  # noqa: E731
                if own:
                    for label in own:
                        if not found(self.passage(label)):
                            if (piece, label) in L.QUOTE_EXCEPTIONS:
                                self.used["exceptions"].add((piece, label))
                                continue
                            raise BuildError(f"{where}: quoted words {piece!r} are not in {label}, which is cited for them")
                elif not any(found(key) for key in allowed):
                    names = ", ".join(self.passages[k]["label"] for k in allowed) or "none"
                    raise BuildError(f"{where}: quoted words {piece!r} are not in any verse this paragraph may quote ({names})")

    def check_misquote(self, section: str, phrase: str) -> None:
        label, berean = L.MISQUOTES[(section, phrase)]
        text = self.text_of(self.passage(label)).replace("'", "")
        if has_words(fold(phrase).replace("'", ""), text):
            raise BuildError(f"MISQUOTES lists {phrase!r}, but it is word for word in {label}; remove the entry")
        if not has_words(fold(berean).replace("'", ""), text):
            raise BuildError(f"MISQUOTES gives {berean!r} as the Berean at {label}, but the verse does not have it")
        self.used["misquotes"].add((section, phrase))

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = fold(" ".join(line.removeprefix(">").strip() for line in quote_lines)).replace('"', "")
        key = self.passage(label)
        bible = plain_text(self.bible, label)
        frame = L.SPOKEN_BLOCKS.get(label)
        if frame and bible.startswith(frame + " ") and bible[len(frame) + 1:] == quoted:
            return {"k": "quote", "r": key, "label": label, "frame": frame}
        rest = bible[len(quoted):]
        if label in L.PARTIAL_BLOCKS and rest and bible.startswith(quoted) and quoted[-1] in ".!?" and rest[0] == " ":
            self.used["partial"].add(label)
            return {"k": "quote", "r": key, "label": label, "partial": L.PARTIAL_BLOCKS[label],
                    "text": " ".join(line.removeprefix(">").strip() for line in quote_lines)}
        if quoted != bible:
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label}


def readings(builder: Builder, body: str, holder: dict) -> None:
    """Main readings: references split on ";", "," and "and", with any note in brackets kept as its own runs."""
    note = re.fullmatch(r"(.*?)\s*\((.*)\)", body)
    refs, aside = (note.group(1), note.group(2)) if note else (body, None)
    holder["readings"] = [builder.passage(r) for r in READINGS_SPLIT.split(refs)]
    if aside:
        holder["readingsNote"] = builder.runs(typographic(aside), [])


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"opening": [], "parts": [], "questions": []}
    current, section, deferred = None, "opening", []
    used = i = 0

    def para(raw: str, where: str) -> list:
        """Runs for a line, after its quotations are checked against what this line may quote."""
        cited: list = []
        shown = raw
        for phrase in (k for k, v in L.OUTSIDE_QUOTES.items() if v[1] is None):
            if not re.search(re.escape(f'"{phrase}"') + r"\s*\[check", shown):
                shown = shown.replace(f'"{phrase}"', f'"{phrase}"[check: not held on this PC; wording not yet compared]')
        for phrase, (name, _, _, held_words) in L.OUTSIDE_DIFFERS.items():
            shown = shown.replace(f'"{phrase}"', f'"{phrase}"[check: the copy of {name} held on this PC reads “{held_words}”]')
        for (where_at, phrase), (label, berean) in L.MISQUOTES.items():
            if where_at == section:
                shown = shown.replace(f'"{phrase}"', f'"{phrase}"[check: the Berean at {label} reads “{berean}”]')
        runs = builder.runs(typographic(shown), cited)
        if section == "close":
            deferred.append((raw, cited, where))
            return runs
        holder = current if current is not None else {"blocks": study["opening"], "readings": [builder.passage(r) for r in L.OPENING_READINGS]}
        last = next((b["r"] for b in reversed(holder["blocks"]) if b["k"] == "quote"), None)
        builder.check_quotes(raw, cited + holder.get("readings", []) + ([last] if last else []), where, section)
        return runs

    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        target = current["blocks"] if current is not None else study["opening"]
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; used += 1
            target.append(builder.block(quote, ref_line))
        elif line.startswith("## "):
            head = line[3:]
            if head.startswith("Question: "):
                section = f"q{len(study['questions']) + 1}"
                current = {"id": section, "title": head[10:], "blocks": []}
                study["questions"].append(current)
            elif head.startswith("Close: "):
                section, current = "close", None
                study["close"] = {"title": head[7:]}
            else:
                number, _, title = head.partition(" ")
                section = number
                current = {"n": number, "title": title, "blocks": []}
                study["parts"].append(current)
        elif line.startswith("- "):
            if not target or target[-1]["k"] != "care":
                raise BuildError(f"{where}: a list item that does not follow a care note: {line[:60]!r}")
            target[-1].setdefault("items", []).append(para(line[2:], where))
        elif line.startswith("### "):
            para(line[4:], where)
            current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line):
            label, body = m.groups()
            if label == "Main readings":
                readings(builder, body, current)
            else:
                current[label.lower()] = para(body, where)
        elif m := re.match(r"\[source:([a-z]+)\] (.*)", line):
            if m.group(1) not in L.SOURCE_LABELS:
                raise BuildError(f"{where}: unknown source marker [source:{m.group(1)}]")
            target.append({"k": "source", "id": m.group(1), "runs": para(m.group(2), where)})
        elif marker := next((k for k in MARKERS if line.startswith(k)), None):
            target.append({"k": MARKERS[marker], "runs": para(line[len(marker):], where)})
        elif (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
            field, body = m.groups()
            holder = study["close"] if section == "close" else (current if current is not None else study)
            if field == "Concepts":
                holder["concepts"] = body.split(" · ")
            elif field == "Motto":
                holder["motto"] = body.split(" / ")
            elif field in ("Passage", "Text"):
                holder[field.lower()] = builder.passage(body)
            elif field == "Subtitle":
                holder["subtitle"] = typographic(body)
            else:
                holder[field.lower()] = para(body, where)
        elif current is not None:
            current["blocks"].append({"k": "p", "runs": para(line, where)})
        elif study["opening"] and study["opening"][-1]["k"] == "care":  # the care note at the top runs on after its list
            study["opening"][-1].setdefault("more", []).append(para(line, where))
        else:
            raise BuildError(f"{where}: a line outside any section that the page does not know how to place: {line[:60]!r}")
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    finish(builder, study, deferred)
    return study


def finish(builder: Builder, study: dict, deferred: list) -> None:
    """Checks that need the whole text: the close's quotations, the questions' verses, and what must be there."""
    for key in ("title", "subtitle", "concepts", "motto", "lead", "frame", "selection", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    if " ".join(L.TITLE) != study["title"]:
        raise BuildError(f"TITLE {L.TITLE} does not make the study's title {study['title']!r}")
    for key in ("way", "close", "question", "again", "passage"):
        if key not in study["close"]:
            raise BuildError(f"the close has no {key.title()}:")
    every_quote = [b["r"] for s in [{"blocks": study["opening"]}] + study["parts"] + study["questions"] for b in s["blocks"] if b["k"] == "quote"]
    for raw, cited, where in deferred:
        builder.check_quotes(raw, cited + every_quote + [study["close"]["passage"]], where, "close")
    for question in study["questions"]:
        if "text" not in question:
            raise BuildError(f"question {question['title']!r} has no Text: verse")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
    unused = [("QUOTE_EXCEPTIONS", set(L.QUOTE_EXCEPTIONS) - builder.used["exceptions"]),
              ("OWN_TERMS", set(L.OWN_TERMS) - builder.used["own"]),
              ("OUTSIDE_QUOTES", set(L.OUTSIDE_QUOTES) - builder.used["outside"]),
              ("STUDY_LINKS", set(L.STUDY_LINKS) - builder.used["links"]),
              ("ITALIC_TERMS", set(L.ITALIC_TERMS) - builder.used["italics"]),
              ("MISQUOTES", set(L.MISQUOTES) - builder.used["misquotes"]),
              ("OUTSIDE_DIFFERS", set(L.OUTSIDE_DIFFERS) - builder.used["differs"]),
              ("PARTIAL_BLOCKS", set(L.PARTIAL_BLOCKS) - builder.used["partial"])]
    for name, left in unused:
        if left:
            raise BuildError(f"{name} has entries the text does not use: {sorted(left)}")


def build() -> str:
    builder = Builder(load_bible(), load_held(L.HELD))
    text = CONTENT.read_text(encoding="utf-8")
    study = parse(builder, text)
    figures = build_figures(builder, L, text, study)
    quoted = {b["r"] for s in [{"blocks": study["opening"]}] + study["parts"] + study["questions"] for b in s["blocks"] if b["k"] == "quote"}
    numbers = {"rooms": len(figures["rooms"]), "parts": len(study["parts"]), "questions": len(study["questions"]),
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted | {study["close"]["passage"]}),
               "atTable": len(figures["table"]["atTable"]), "speaker": figures["speaker"]["count"]}
    inputs = [CONTENT] + sorted(HERE.glob("*.py"))
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    outside = {**{k: v[0] for k, v in L.OUTSIDE_QUOTES.items()}, **{k: v[0] for k, v in L.OUTSIDE_DIFFERS.items()}}
    data = {"study": study, "passages": builder.passages, "figures": figures, "numbers": numbers,
            "closeActs": L.CLOSE_ACTS, "sources": L.SOURCES, "sourceLabels": L.SOURCE_LABELS, "outside": outside,
            "notHeld": sorted(k for k, v in L.OUTSIDE_QUOTES.items() if v[1] is None), "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.EL = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def warn_missing_links() -> None:
    for name, folder in L.STUDY_LINKS.items():
        if not (HERE.parent / folder / "index.html").is_file():
            print(f"build-data: warning: {name!r} links to design/{folder}/, which has no index.html yet", file=sys.stderr)


def main() -> int:
    if "--selftest" in sys.argv:
        from build_selftest import run_selftest
        return run_selftest(sys.modules[__name__])
    try:
        output = build()
    except (BuildError, OSError, KeyError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    warn_missing_links()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print(f"build-data: stale: {OUT.name}; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temporary = OUT.with_suffix(".js.tmp")
    temporary.write_text(output, encoding="utf-8", newline="\n")
    os.replace(temporary, OUT)
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
