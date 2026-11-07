#!/usr/bin/env python3
"""Build data.js for the Knowing God mock-up from the study's content.md, checking it against the site's Berean text
and the held outside sources.

Run from anywhere:  python design/knowing-god-directions/build-data.py
  --check      run every check and fail if data.js is missing or stale; writes nothing
  --selftest   feed the build wrong inputs in memory and prove each is refused; writes nothing
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import copy
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path
from types import SimpleNamespace

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists  # noqa: E402
from held_text import answer_words, held_print, held_section  # noqa: E402
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/knowing-god/content.md"
OUT = HERE / "data.js"
CHECK = r"\[check(?:: ((?:[^\[\]]|\[[^\]]*\])+)| (before publishing))\]"
INLINE = re.compile(CHECK + r"|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
SITE_LINK = re.compile(r"^/(?![/\\])[^\s\\]*$")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
FIELDS = ("Concepts", "Motto", "Lead", "Frame", "Selection", "Way", "Close", "Invite", "Further answers", "Question", "Again", "Passage")
MARKERS = {"care": "care", "open": "open", "source": "source"}


def site_link(url: str) -> str:
    if not SITE_LINK.match(url):
        raise BuildError(f"only links on this site are allowed, found {url!r}")
    return url


class Builder:
    def __init__(self, bible: dict, lists: SimpleNamespace, held: dict) -> None:
        self.bible, self.lists, self.held = bible, lists, held
        self.passages: dict = {}

    def whole_chapter(self, label: str) -> str:
        """A main reading may be a whole chapter ("Psalm 96"); it becomes its full verse range."""
        name, _, chapter = label.rpartition(" ")
        if name not in BOOKS or not chapter.isdigit():
            return label
        verses = [int(cv.split(":")[1]) for cv in self.bible[BOOKS[name]] if cv.split(":")[0] == chapter]
        if not verses:
            raise BuildError(f"reference does not resolve in the Berean: {label}")
        return f"{label}:1–{max(verses)}"

    def passage(self, label: str) -> str:
        label = self.whole_chapter(label.replace("-", "–"))
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str) -> list:
        """Every reference in plain text with its span, including short continuations such as "15:6, 9"."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chap = more.group(2) or (match.group(4) or chapter)
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chap}:{more.group(3)}{tail}"))
                end = more.end()
        return found

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t} (a site link), {r,t} (a verse), {s,t} (a study), {c} (a check)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            note, publish, link_text, url, bold, italic = match.groups()
            if note or publish:
                out.append({"c": (note or "before publishing").replace("*", "")})
            elif url:
                out.append({"a": site_link(url), "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic.startswith("Read more in "):
                name = italic.removeprefix("Read more in ").rstrip(".")
                known = {fold(key): key for key in self.lists.STUDY_LINKS}
                if fold(name) not in known:
                    raise BuildError(f"the text names a study not on STUDY_LINKS: {name!r}")
                href = self.lists.STUDY_LINKS[known[fold(name)]]
                out.append({"s": site_link(href) if href else None, "t": typographic(name)})
            else:
                out.append({"i": typographic(italic)})
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start > last:
                out.append(typographic(text[last:start]))
            key = self.passage(label)
            cited.append(key)
            out.append({"r": key, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def outside(self, phrase: str, where: str) -> bool:
        """True if the phrase is a listed outside quotation; checks it against its held source either way."""
        lists = self.lists
        if phrase in lists.OUTSIDE_QUOTES:
            key = lists.OUTSIDE_QUOTES[phrase]
            if fold(phrase).rstrip(".") not in self.held[key]:
                raise BuildError(f"{where}: outside quotation {phrase!r} is not in {lists.HELD[key]['name']}")
            return True
        if phrase in lists.UNMATCHED_OUTSIDE:
            key = lists.UNMATCHED_OUTSIDE[phrase][0]
            if fold(phrase).rstrip(".") in self.held[key]:
                raise BuildError(f"{where}: {phrase[:40]!r} is now matched in {lists.HELD[key]['name']}; move it to OUTSIDE_QUOTES")
            return True
        return False

    def check_quotes(self, raw: str, cited: list, where: str) -> None:
        """Each quoted phrase is in a verse its paragraph cites (or its own reference), or on a named list."""
        clean = re.sub(CHECK, "", raw)
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', clean):
            phrase, after = match.groups()
            if self.outside(phrase, where):
                continue
            if phrase in self.lists.MISQUOTED:
                label, berean = self.lists.MISQUOTED[phrase]
                text = plain_text(self.bible, label)
                if has_words(fold(phrase), text) or not has_words(fold(berean), text):
                    raise BuildError(f"{where}: MISQUOTED entry {phrase!r} is wrong: it should be absent from {label} and {berean!r} present")
                continue
            if phrase in self.lists.SHORTENED:
                label = self.lists.SHORTENED[phrase]
                if not re.search(r"\b" + r"\b.*\b".join(map(re.escape, phrase.lower().split())) + r"\b", plain_text(self.bible, label).lower()):
                    raise BuildError(f"{where}: shortened quotation {phrase!r} is not in order in {label}")
                continue
            if phrase in self.lists.OWN_TERMS:
                continue
            own = [ref_id(label.replace("-", "–")) for _, _, label in self.refs_in(after or "")]
            texts = [plain_text(self.bible, self.passages[k]["label"]).replace("'", "") for k in (own or cited)]
            folded = fold(phrase).replace('"', "").replace("*", "").replace("'", "")
            pieces = [p.strip(" ,.?!;:") for p in folded.split("…") if p.strip(" ,.?!;:")]  # the study's own end punctuation
            # Pieces split by an ellipsis must come in order; the first letter may change case at a sentence start.
            variants = [pieces, [pieces[0][:1].swapcase() + pieces[0][1:]] + pieces[1:]] if pieces else []
            patterns = [r".*".join(r"(?<!\w)" + re.escape(p) + r"(?!\w)" for p in v) for v in variants]
            if not pieces or not any(re.search(p, t) for p in patterns for t in texts):
                raise BuildError(f"{where}: quoted words {phrase!r} are not in any verse this paragraph cites "
                                 f"({', '.join(self.passages[k]['label'] for k in (own or cited)) or 'none'})")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        whole = " ".join(text for _, text in self.passages[key]["verses"])
        if fold(quoted).replace('"', "") == plain_text(self.bible, label):
            return {"k": "quote", "r": key, "label": label, "part": False}
        start = self.lists.PARTIAL_QUOTES.get(label)
        at = fold(whole).find(start) if start else -1
        if at < 0 or len(quoted.split()) < 4 or fold(quoted).replace('"', "") != fold(whole[at:]).replace('"', ""):
            raise BuildError(f"block quotation is not word for word the Berean at {label} (nor a listed part of it):\n"
                             f"  page: {quoted}\n  bible: {plain_text(self.bible, label)}")
        return {"k": "quote", "r": key, "label": label, "part": True, "text": whole[at:]}


def para(builder: Builder, raw: str, where: str, section: dict | None = None, extra: list | None = None) -> list:
    """A paragraph may quote the verses it cites, its section's main readings, or the passage printed just above it."""
    cited: list = []
    runs = builder.runs(typographic(raw), cited)
    nearby = list((section or {}).get("readings", []))
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + nearby + (extra or []) + ([last["r"]] if last else []), where)
    return mark_misquotes(builder, runs)


def mark_misquotes(builder: Builder, runs: list) -> list:
    """After a quotation that is not word for word, add the Berean's own words, so the page never hides the slip."""
    out = []
    for run in runs:
        out.append(run)
        if not isinstance(run, str):
            continue
        for phrase, (label, berean) in builder.lists.MISQUOTED.items():
            if typographic(f'"{phrase}"') in run:
                head, _, tail = run.partition(typographic(f'"{phrase}"'))
                out[-1:] = [head + typographic(f'"{phrase}"'), {"x": typographic(f'The Berean reads "{berean}"'), "r": builder.passage(label), "t": label}, tail]
    return [run for run in out if run != ""]


def place_line(builder: Builder, study: dict, current: dict | None, line: str, where: str) -> dict | None:
    """Place one line of content.md that is not a heading or a block quotation. Returns the current part."""
    if m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line):
        label, body = m.groups()
        if current is None:
            raise BuildError(f"{where}: {label} outside a part")
        if label == "Main readings":
            current["readings"] = [builder.passage(r.strip()) for r in body.split(";")]
        else:
            current[label.lower()] = para(builder, body, where, current)
    elif m := re.match(r"\[([a-z]+)\] (.*)", line):
        if m.group(1) not in MARKERS or current is None:
            raise BuildError(f"{where}: unknown marker [{m.group(1)}] or a marker outside a part")
        current["blocks"].append({"k": MARKERS[m.group(1)], "runs": para(builder, m.group(2), where, current)})
    elif m := re.match(r"- \*\*([^*]+)\*\* (.*)", line):
        current["blocks"].append({"k": "li", "head": typographic(m.group(1)), "runs": para(builder, m.group(2), where, current)})
    elif (m := re.match(r"([A-Z][a-z]+(?: [a-z]+)?): (.*)", line)) and m.group(1) in FIELDS:
        field, body = m.groups()
        target = study["close"] if "close" in study else study
        if field == "Concepts":
            target["concepts"] = body.split(" · ")
        elif field == "Motto":
            target["motto"] = body.split(" / ")
        elif field == "Passage":
            target["passage"] = builder.passage(body)
        else:
            extra = [builder.passage(d["ref"]) for p in builder.lists.PAIRS for d in p["deeds"]] if field == "Way" else []
            extra += [builder.passage(p["ref"]) for p in builder.lists.PAIRS if p["ref"]] if field == "Way" else []
            target[field.lower().replace(" ", "_")] = para(builder, body, where, None, extra)
    elif current is not None:
        if "hook" not in current and not any(b["k"] in ("h3", "p", "quote") for b in current["blocks"]):
            current["hook"] = para(builder, line, where, current)
        else:
            current["blocks"].append({"k": "p", "runs": para(builder, line, where, current)})
    else:
        raise BuildError(f"{where}: a line outside any part that the page does not know how to place: {line[:60]!r}")
    return current


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"parts": []}
    current, i = None, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"], _, study["subtitle"] = line[2:].partition(": ")
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation with no reference line after it")
            item = builder.block(quote, lines[i].strip()); i += 1
            (current["blocks"] if current else study.setdefault("opening", [])).append(item)
        elif m := re.match(r"## (\d\d) (.+?): (.+)", line):
            current = {"n": m.group(1), "name": m.group(2), "turn": m.group(3), "blocks": []}
            study["parts"].append(current)
        elif line.startswith("## "):
            current, study["close"] = None, {"title": line[3:]}
        elif line.startswith("### "):
            if current is None:
                raise BuildError(f"{where}: a sub-heading outside a part")
            current["blocks"].append({"k": "h3", "t": line[4:]})
        else:
            current = place_line(builder, study, current, line, where)
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "selection", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
    return study


def in_readings(builder: Builder, part: dict, label: str) -> None:
    """The verse must lie inside one of the part's main readings."""
    code, found = verses_of(builder.bible, label)
    wanted = {(c, v) for c, v, _ in found}
    for key in part["readings"]:
        r_code, verses = verses_of(builder.bible, builder.passages[key]["label"])
        if r_code == code and wanted <= {(c, v) for c, v, _ in verses}:
            return
    raise BuildError(f"{label} is not inside part {part['n']}'s main readings")


def run_text(runs: list) -> str:
    return "".join(run if isinstance(run, str) else run.get("t") or run.get("i") or run.get("b") or "" for run in runs)


def check_pairs(builder: Builder, study: dict) -> list:
    """The Way paragraph's pairs: each word and deed is in the Way as written; each verse phrase is in its verse,
    and both verses lie inside the same part's main readings."""
    way = fold(run_text(study["close"]["way"]))
    parts = {p["n"]: p for p in study["parts"]}
    out = []
    for pair in builder.lists.PAIRS:
        if fold(pair["word"]) not in way:
            raise BuildError(f"pair word {pair['word']!r} is not in the Way paragraph")
        item = {"word": pair["word"], "deeds": []}
        if pair["ref"]:
            if not has_words(fold(pair["verse"]), plain_text(builder.bible, pair["ref"])):
                raise BuildError(f"pair {pair['word']!r}: {pair['verse']!r} is not in {pair['ref']}")
            item.update(r=builder.passage(pair["ref"]), verse=pair["verse"])
        for deed in pair["deeds"]:
            if fold(deed["deed"]) not in way:
                raise BuildError(f"pair deed {deed['deed']!r} is not in the Way paragraph")
            if not has_words(fold(deed["verse"]), plain_text(builder.bible, deed["ref"])):
                raise BuildError(f"pair deed {deed['deed']!r}: {deed['verse']!r} is not in {deed['ref']}")
            in_readings(builder, parts[deed["part"]], deed["ref"])
            if pair["ref"]:
                in_readings(builder, parts[deed["part"]], pair["ref"])
            item["deeds"].append({**deed, "r": builder.passage(deed["ref"])})
        out.append(item)
    return out


def check_echo(builder: Builder) -> dict:
    """The census of "slow to anger": the found set must equal the two lists exactly. Underlines are computed."""
    lists, bible = builder.lists, builder.bible
    names = {code: name for name, code in BOOKS.items()}
    found = {f"{names[code]} {cv}" for code, book in bible.items() for cv, text in book.items()
             if re.search(r"(?<!\w)" + re.escape(lists.ECHO_PHRASE) + r"(?!\w)", text, re.I)}
    listed = [row["ref"] for row in lists.ECHO_OF_GOD] + list(lists.ECHO_OF_PEOPLE)
    if found != set(listed) or len(listed) != len(set(listed)):
        raise BuildError(f"census of {lists.ECHO_PHRASE!r}: the Berean holds {sorted(found)}, the lists name {sorted(listed)}")
    source = plain_text(bible, "Exodus 34:6–7")
    for word in lists.ECHO_WORDS:
        if not re.search(word, source, re.I):
            raise BuildError(f"echo word {word!r} is not in Exodus 34:6–7")
    rows = []
    for row in lists.ECHO_OF_GOD:
        label, phrase = row["context"]
        if not has_words(fold(phrase), plain_text(bible, label)):
            raise BuildError(f"echo {row['ref']}: the setting {phrase!r} is not in {label}")
        text = builder.passages[builder.passage(row["ref"])]["verses"][0][1]
        pieces, last = [], 0
        for m in re.finditer("|".join(lists.ECHO_WORDS), text, re.I):
            pieces += [text[last:m.start()], {"u": text[m.start():m.end()]}]
            last = m.end()
        rows.append({"r": ref_id(row["ref"]), "who": row["who"], "c": builder.passage(label), "text": [p for p in pieces + [text[last:]] if p]})
    for label, phrase in lists.ECHO_MISSES:
        text = plain_text(bible, label)
        if phrase not in text or lists.ECHO_PHRASE in text:
            raise BuildError(f"echo miss {label}: should hold {phrase!r} and not {lists.ECHO_PHRASE!r}")
    return {"rows": rows, "misses": [{"r": builder.passage(label), "has": phrase} for label, phrase in lists.ECHO_MISSES],
            "god": len(lists.ECHO_OF_GOD), "all": len(found), "people": [builder.passage(r) for r in lists.ECHO_OF_PEOPLE]}


def check_same_answer(lists: SimpleNamespace, held: dict) -> None:
    first, second = lists.SAME_ANSWER
    if answer_words(held[first]) != answer_words(held[second]):
        raise BuildError(f"{lists.HELD[first]['name']} and {lists.HELD[second]['name']} do not give the same answer")


def build(text: str, lists=study_lists, bible: dict | None = None) -> str:
    bible = bible or load_bible()
    held = {key: held_section(spec, lists.PROJECT) for key, spec in lists.HELD.items()}
    builder = Builder(bible, lists, held)
    study = parse(builder, text)
    pairs = check_pairs(builder, study)
    echo = check_echo(builder)
    check_same_answer(lists, held)
    lord = sum(1 for code in bible.values() for verse in code.values() if re.search(r"\bLORD\b", verse))
    if "LORD" not in plain_text(bible, "Exodus 3:15"):
        raise BuildError("Exodus 3:15 should print the name as LORD")
    quoted = {b["r"] for p in study["parts"] for b in p["blocks"] if b["k"] == "quote"} | {b["r"] for b in study["opening"]}
    shown = sum(len(builder.passages[k]["verses"]) for k in quoted | {study["close"]["passage"]})
    numbers = {"parts": len(study["parts"]), "versesShown": shown, "references": len(builder.passages),
               "lord": lord, "verses": sum(len(code) for code in bible.values()), "slowGod": echo["god"], "slowAll": echo["all"]}
    if numbers["parts"] != 10:
        raise BuildError(f"the study should have ten parts, found {numbers['parts']}")
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py", HERE / "held_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    prints.update({f"held:{key}": held_print(spec) for key, spec in sorted(lists.HELD.items())})
    data = {"study": study, "passages": dict(sorted(builder.passages.items())), "pairs": pairs, "echo": echo,
            "numbers": numbers, "sources": lists.SOURCES, "held": {k: v["name"] for k, v in lists.HELD.items()},
            "unmatched": {k: v[1] for k, v in lists.UNMATCHED_OUTSIDE.items()}, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.KG = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


# ── Proof that the build refuses wrong input. Each case changes the text or a list in memory only. ──
def lists_with(**changes) -> SimpleNamespace:
    lists = SimpleNamespace(**{k: copy.deepcopy(v) for k, v in vars(study_lists).items() if k.isupper()})
    for key, change in changes.items():
        setattr(lists, key, change(getattr(lists, key)))
    return lists


SELFTEST = [
    ("a changed word in a block quotation", ("I have indeed seen the affliction", "I have indeed noticed the affliction"), None, "not word for word"),
    ("a block quotation under the wrong reference", ("Exodus 3:14 · BSB", "Exodus 3:15 · BSB"), None, "not word for word"),
    ("a changed word in a quoted phrase", ('"on the far side of the wilderness"', '"on the near side of the wilderness"'), None, "quoted words"),
    ("a quotation cited to the wrong verse", ('"I will surely be with you" (Exodus 3:12)', '"I will surely be with you" (Exodus 3:13)'), None, "quoted words"),
    ("a reference that does not exist", ("(Jonah 4:2)", "(Jonah 5:2)"), None, "does not resolve"),
    ("a link that leaves the site", ("Isaiah sees the King who does not die.", "Isaiah sees [the King](https://example.com)."), None, "only links on this site"),
    ("a protocol-relative link", ("Isaiah sees the King who does not die.", "Isaiah sees [the King](//example.com)."), None, "only links on this site"),
    ("a part of a verse not on the list", ("> The LORD said, “I have indeed seen", "> “I have indeed seen"), None, "nor a listed part"),
    ("a listed part with its case changed", ("> The LORD, the LORD God, is compassionate", "> The Lord, the Lord God, is compassionate"), None, "nor a listed part"),
    ("a changed word in an outside quotation", ('"neither the author of sin"', '"never the author of sin"'), None, "quoted words"),
    ("an outside quotation listed but not in its held source", ('"neither the author of sin"', '"never the author of sin"'),
     {"OUTSIDE_QUOTES": lambda q: {**q, "never the author of sin": "lbc"}}, "is not in Second London"),
    ("a misquotation entry that is no longer true", None,
     {"MISQUOTED": lambda m: {"on the far side of the wilderness": ("Exodus 3:1", "on the far side of the wilderness")}}, "MISQUOTED entry"),
    ("a pair deed not in the Way paragraph", None, {"PAIRS": lambda p: [{**p[0], "deeds": [{**p[0]["deeds"][0], "deed": "I have heard"}]}] + p[1:]}, "not in the Way"),
    ("a census list missing a verse", None, {"ECHO_OF_GOD": lambda rows: rows[:-1]}, "census of"),
    ("a pair whose verse does not hold its words", None, {"PAIRS": lambda p: [{**p[0], "verse": "I AM THAT I AM"}] + p[1:]}, "is not in Exodus 3:14"),
    ("a marker the page does not know", ("[care] The name is not a password", "[aside] The name is not a password"), None, "unknown marker"),
    ("a study the page cannot link or name", ("*Read more in Fear, anxiety and despair.*", "*Read more in Fear and trembling.*"), None, "not on STUDY_LINKS"),
    ("a line outside any part", ("Frame: Scripture does not hand", "Stray line\n\nFrame: Scripture does not hand"), None, "outside any part"),
]


def selftest(text: str) -> int:
    before = OUT.read_bytes() if OUT.exists() else b""
    bible, failures = load_bible(), 0
    for name, edit, list_changes, expected in SELFTEST:
        changed = text
        if edit:
            if edit[0] not in text:
                print(f"selftest: {name}: the text to change is not in content.md: {edit[0]!r}")
                failures += 1
                continue
            changed = text.replace(edit[0], edit[1], 1)
        try:
            build(changed, lists_with(**(list_changes or {})), bible)
            print(f"selftest: NOT REFUSED: {name}")
            failures += 1
        except BuildError as error:
            ok = expected in str(error)
            failures += 0 if ok else 1
            print(f"selftest: {'refused' if ok else 'REFUSED FOR THE WRONG REASON'}: {name}: {str(error).splitlines()[0][:150]}")
    if (OUT.read_bytes() if OUT.exists() else b"") != before:
        print("selftest: data.js changed during the self-test")
        failures += 1
    print(f"selftest: {len(SELFTEST) - failures} of {len(SELFTEST)} wrong inputs refused for the expected reason; data.js untouched")
    return 1 if failures else 0


def write_atomic(path: Path, text: str) -> None:
    temp = path.with_name(path.name + ".tmp")
    temp.write_text(text, encoding="utf-8", newline="\n")
    for attempt in range(3):
        try:
            os.replace(temp, path)
            return
        except PermissionError:
            if attempt == 2:
                raise
            time.sleep(0.5)


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    try:
        text = CONTENT.read_text(encoding="utf-8-sig")
        if "--selftest" in sys.argv:
            return selftest(text)
        output = build(text)
    except BuildError as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    except Exception as error:  # an unexpected failure is still a failed build, never a silent pass
        print(f"build-data: FAILED unexpectedly: {type(error).__name__}: {error}", file=sys.stderr)
        return 1
    if OUT.parent != HERE:
        print(f"build-data: FAILED: refusing to write outside {HERE}", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print("build-data: stale: data.js does not match content.md and the lists; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    write_atomic(OUT, output)
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output.encode('utf-8')):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
