#!/usr/bin/env python3
"""Build data.js for the Genesis 1–11 mock-up from the study's content.md, checking it against the site's Berean text.

Run from Website/: python design/creation-to-babel-directions/build-data.py
  --check     run every check and fail if data.js is not exactly what this build would write (nothing is written)
  --selftest  feed the build wrong inputs in memory and prove each one is refused (nothing is written)
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import copy
import hashlib
import json
import os
import re
import sys
import types
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists  # noqa: E402
from scripture_text import BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402
from study_graphics import check_graphics, chapter_band, later_refs  # noqa: E402
from study_refs import CHAPTER_VERSE, find_refs, footnotes, held_text, reading_list  # noqa: E402

WEBSITE = HERE.parents[1]
PROJECT = WEBSITE.parent
CONTENT = WEBSITE / "content/studies/explore-the-bible/creation-to-babel/content.md"
OUT = HERE / "data.js"
INPUTS = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "study_refs.py", HERE / "study_graphics.py", HERE / "scripture_text.py"]
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')
SITE_LINK = re.compile(r"/[A-Za-z0-9][A-Za-z0-9/_?=&.#-]*")
LABEL_LINE = re.compile(r"\*\*(Main readings|Consider|Reflect|Your question):\*\* (.+)")


class Builder:
    def __init__(self, bible: dict, lists) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}
        self.part_refs: dict = {}
        self.held: dict = {}
        self.outside_used: set = set()

    def passage(self, label: str) -> str:
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        show = re.sub(r"^(Obadiah|Philemon|2 John|3 John|Jude) 1:", lambda m: m.group(1) + " ", label)  # "Jude 14", as the study writes it
        self.passages.setdefault(key, {"label": show, "ref": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]})
        return key

    def covers(self, keys: list, label: str) -> bool:
        code, verses = verses_of(self.bible, label)
        wanted = {(code, c, v) for c, v, _ in verses}
        have = set()
        for key in keys:
            code_k, found = verses_of(self.bible, self.passages[key]["ref"])
            have |= {(code_k, c, v) for c, v, _ in found}
        return wanted <= have

    def held_has(self, name: str, phrase: str) -> bool:
        if name not in self.held:
            self.held[name] = held_text(PROJECT / self.lists.HELD_TEXTS[name])
        return re.sub(r"\s+", " ", fold(phrase)) in self.held[name]

    def line(self, raw: str, where: str, part: str, context: list) -> list:
        """One line of the study to runs, after checking every reference and quotation in it."""
        lists = self.lists
        refs = find_refs(raw, lists.HOME_BOOK, lists.BARE_BOOK_WORDS)
        outside = [(m.start(), m.end()) for m in QUOTE.finditer(raw) if m.group(1) in lists.OUTSIDE_QUOTES]
        refs = [r for r in refs if not any(s <= r[0] < e for s, e in outside)]
        for match in CHAPTER_VERSE.finditer(raw):
            if not any(s <= match.start() < e for s, e, *_ in refs) and not any(s <= match.start() < e for s, e in outside):
                raise BuildError(f"{where}: {match.group(0)!r} looks like a reference but was not read as one")
        keys = [self.passage(label) for _, _, label, _ in refs]
        self.part_refs.setdefault(part, []).extend(keys)
        self.check_quotes(raw, refs, keys, context, where, part)
        return self.runs(raw, refs, keys, where)

    def check_quotes(self, raw: str, refs: list, keys: list, context: list, where: str, part: str) -> None:
        lists = self.lists
        for match in QUOTE.finditer(raw):
            phrase, bracket = match.group(1), match.group(2)
            own = []
            if bracket is not None:
                own = [k for (s, _, _, _), k in zip(refs, keys) if match.start(2) <= s < match.end(2)]
                if not own and re.search(r"\d+:\d+|Jude \d", bracket) and phrase not in lists.OUTSIDE_QUOTES:
                    raise BuildError(f"{where}: the reference after {phrase!r} could not be read: ({bracket})")
            if phrase in lists.OUTSIDE_QUOTES:
                source, allowed, held = lists.OUTSIDE_QUOTES[phrase]
                if allowed != part:
                    raise BuildError(f"{where}: {phrase!r} ({source}) is listed for part {allowed}, found in part {part}")
                if held and not self.held_has(held, phrase):
                    raise BuildError(f"{where}: {phrase!r} is not word for word in the held text of {source}")
                self.outside_used.add(phrase)
            elif phrase in lists.NOTE_QUOTES:
                label = lists.NOTE_QUOTES[phrase]
                code, [(c, v, _)] = verses_of(self.bible, label)
                if not any(fold(phrase) in note for note in footnotes(WEBSITE, code, c, v)):
                    raise BuildError(f"{where}: {phrase!r} is not in the Berean's footnotes at {label}")
                if not self.covers((own or keys) + context, label):
                    raise BuildError(f"{where}: the footnote {phrase!r} is at {label}, which this paragraph does not cite")
            elif phrase in lists.RECALLED:
                if not has_words(fold(phrase), plain_text(self.bible, lists.RECALLED[phrase])):
                    raise BuildError(f"{where}: {phrase!r} is not in {lists.RECALLED[phrase]}")
            else:
                self.check_bible_quote(phrase, own or keys + context, where)

    def check_bible_quote(self, phrase: str, keys: list, where: str) -> None:
        texts = [plain_text(self.bible, self.passages[k]["ref"]).replace("'", "") for k in keys]
        folded = fold(phrase).replace('"', "").replace("*", "").replace("'", "")
        variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
        if not any(has_words(v, t) for v in variants for t in texts):
            cited = ", ".join(self.passages[k]["label"] for k in keys) or "none"
            raise BuildError(f"{where}: quoted words {phrase!r} are not in the verse cited for them ({cited})")

    def runs(self, raw: str, refs: list, keys: list, where: str) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t}. Curly quotes keep every position the same."""
        text = typographic(raw)
        out, last = [], 0
        for match in INLINE.finditer(raw):
            if any(match.start() < s < match.end() for s, *_ in refs):
                raise BuildError(f"{where}: a reference inside bold, italics or a link: {match.group(0)!r}")
            out += self.plain(text, last, match.start(), refs, keys)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.fullmatch(url):
                    raise BuildError(f"{where}: only links within this site are allowed, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic in self.lists.STUDY_LINKS:
                out.append({"s": self.lists.STUDY_LINKS[italic], "t": italic})
            else:
                out.append({"i": typographic(italic)})
            last = match.end()
        return out + self.plain(text, last, len(text), refs, keys)

    def plain(self, text: str, start: int, end: int, refs: list, keys: list) -> list:
        out, last = [], start
        for (s, e, _, _), key in zip(refs, keys):
            if start <= s < end:
                out.append(text[last:s])
                out.append({"r": key, "t": text[s:e]})
                last = e
        out.append(text[last:end])
        return [run for run in out if run != ""]

    def block(self, quote_lines: list, ref_line: str, where: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line.strip():
            raise BuildError(f"{where}: a block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        page, bible = fold(quoted).replace('"', ""), plain_text(self.bible, label)
        # Word for word the whole passage, or one unbroken run of its words (marked on the page as part of the verse).
        if page != bible and not has_words(page, bible):
            raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label, "text": typographic(quoted), "part": page != bible}


def parse(builder: Builder, text: str) -> dict:
    lists = builder.lists
    lines = text.replace("\r\n", "\n").split("\n")
    study: dict = {"intro": [], "parts": [], "carry": []}
    part, close, tier, last_quote = None, None, None, None
    bullets = 0
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        where = f"content.md line {i}"
        n = part["n"] if part else ("close" if close else "00")
        context = (part["readings"] if part else []) + ([last_quote] if last_quote else [])
        if line.startswith("# "):
            if "title" in study or part or close:
                raise BuildError(f"{where}: a second title, or a title after the opening")
            study["title"] = line[2:]
        elif m := re.fullmatch(r"\*\*(Study \d+ · [^*]+)\*\*", line):
            study["status"] = m.group(1)
        elif line.startswith(">"):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: a block quotation at the end of the file has no reference line")
            item = builder.block(quote, lines[i], where); i += 1
            last_quote = item["r"]
            builder.part_refs.setdefault(n, []).append(item["r"])
            if part:
                (tier["blocks"] if tier else part["hook"]).append(item)
            elif not close and "quote" not in study:
                study["quote"] = item
            else:
                raise BuildError(f"{where}: a block quotation the page has no place for")
        elif m := re.fullmatch(r"## (\d\d) (.+)", line):
            part, tier, last_quote = {"n": m.group(1), "title": m.group(2), "hook": [], "tiers": [], "readings": []}, None, None
            study["parts"].append(part)
        elif m := re.fullmatch(r"## (.+)", line):
            if close or not study["parts"]:
                raise BuildError(f"{where}: an unnumbered section the page has no place for: {line!r}")
            part, tier, last_quote = None, None, None
            close = study["close"] = {"title": m.group(1), "paras": []}
        elif m := re.fullmatch(r"### (.+)", line):
            if not part or m.group(1) not in lists.TIERS:
                raise BuildError(f"{where}: a section heading the page does not know: {line!r}")
            tier = {"kind": lists.TIERS[m.group(1)], "title": m.group(1), "blocks": []}
            part["tiers"].append(tier)
        elif m := LABEL_LINE.fullmatch(line):
            label, body = m.groups()
            if label == "Main readings" and part and not part["readings"] and not part["tiers"]:
                part["readings"] = [builder.passage(r) for r in reading_list(body)]
                builder.part_refs.setdefault(n, []).extend(part["readings"])
            elif label in ("Consider", "Reflect") and part and label.lower() not in part:
                part[label.lower()] = builder.line(body, where, n, context)
            elif label == "Your question" and close and "question" not in close:
                close["question"] = builder.line(body, where, n, context)
            else:
                raise BuildError(f"{where}: '{label}:' is out of place here")
        elif m := re.fullmatch(r"- \*\*(.+?)\*\* (.+)", line):
            if not tier:
                raise BuildError(f"{where}: a listed reading outside any section")
            index = sum(1 for t in part["tiers"] for b in t["blocks"] if b["k"] == "view")
            tier["blocks"].append({"k": "view", "label": typographic(m.group(1)).rstrip("."), "tag": lists.VIEW_TAGS.get((n, index)),
                                   "runs": builder.line(m.group(2), where, n, context)})
            bullets += 1
        elif m := re.fullmatch(r"(\d)\. \*\*(.+?)\*\* (.+)", line):
            if part or close:
                raise BuildError(f"{where}: a numbered question outside the opening")
            study["carry"].append({"q": typographic(m.group(2)), "runs": builder.line(m.group(3), where, n, context)})
        elif re.match(r"#|>|- |\d+\. |\*\*", line):
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        elif part:
            (tier["blocks"] if tier else part["hook"]).append({"k": "p", "runs": builder.line(line, where, n, context)})
        elif close:
            close["paras"].append(builder.line(line, where, n, context))
        elif "lead" not in study:
            study["lead"] = builder.line(line, where, n, context)
        else:
            study["intro"].append({"after_carry": bool(study["carry"]), "runs": builder.line(line, where, n, context)})
    check_shape(study, bullets, lists)
    return study


def check_shape(study: dict, bullets: int, lists) -> None:
    for key in ("title", "status", "lead", "quote", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    if len(study["parts"]) != lists.EXPECTED["parts"] or bullets != lists.EXPECTED["bullets"]:
        raise BuildError(f"expected {lists.EXPECTED['parts']} questions and {lists.EXPECTED['bullets']} listed readings, "
                         f"found {len(study['parts'])} and {bullets}")
    for part in study["parts"]:
        kinds = [t["kind"] for t in part["tiers"]]
        if kinds[:2] != ["text", "readings"] or not set(kinds[2:]) & {"stops", "refused", "later"}:
            raise BuildError(f"question {part['n']}: sections must run text, readings, then where it stops; found {kinds}")
        for key in ("readings", "consider", "reflect"):
            if not part.get(key):
                raise BuildError(f"question {part['n']} has no {key}")
    close = study["close"]
    if "question" not in close or not close["paras"]:
        raise BuildError("the close needs its paragraphs and 'Your question:'")


def build_from(text: str, lists, bible: dict) -> str:
    """The whole build, in memory. Returns data.js as text; never touches the disk except to read sources."""
    builder = Builder(bible, lists)
    study = parse(builder, text)
    unused = sorted(set(lists.OUTSIDE_QUOTES) - builder.outside_used)
    if unused:
        raise BuildError(f"outside quotations listed but not in the study: {unused}")
    study["close"]["passage"] = builder.passage("Genesis 12:1–3")
    graphics = check_graphics(builder, lists)
    for part in study["parts"]:
        part["later"] = later_refs(builder, builder.part_refs[part["n"]])
    every_later = later_refs(builder, [k for keys in builder.part_refs.values() for k in keys])
    band = chapter_band(builder, study["parts"])
    numbers = {"questions": len(study["parts"]), "readings": lists.EXPECTED["bullets"], "genesisVerses": band["verses"],
               "later": len(every_later), "references": len(builder.passages)}
    prints = {p.name: hashlib.sha256(p.read_text(encoding="utf-8").replace("\r\n", "\n").encode("utf-8")).hexdigest()[:16]
              for p in INPUTS if p != CONTENT}
    prints[CONTENT.name] = hashlib.sha256(text.replace("\r\n", "\n").encode("utf-8")).hexdigest()[:16]
    data = {"study": study, "passages": builder.passages, "band": band, **graphics, "numbers": numbers,
            "concepts": lists.CONCEPTS, "motto": lists.MOTTO, "sources": lists.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.GB = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def lists_copy():
    return types.SimpleNamespace(**{k: copy.deepcopy(v) for k, v in vars(study_lists).items() if k.isupper()})


def main() -> int:
    try:
        if "--selftest" in sys.argv:
            from study_selftest import selftest
            return selftest(build_from, lists_copy, load_bible(), CONTENT.read_text(encoding="utf-8"), OUT)
        output = build_from(CONTENT.read_text(encoding="utf-8"), lists_copy(), load_bible())
    except BuildError as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    except Exception as error:  # an unexpected fault is still a failed build, never a half-written file
        print(f"build-data: FAILED: unexpected {type(error).__name__}: {error}", file=sys.stderr)
        return 1
    encoded = output.encode("utf-8")
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_bytes() != encoded:
            print("build-data: stale: data.js differs from this build; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temporary = OUT.with_suffix(".js.tmp")
    temporary.write_bytes(encoded)
    os.replace(temporary, OUT)
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(encoded):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
