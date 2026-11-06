"""Finds English that will stay English in every language because extract.py never registers it for translation.

Three checks, each written to its own section of the report:
  code          text in the page code that looks shown on screen but that extract.py's rules skip (the Apologetics
                menu's {label:'Practice'} was one: single quotes, one word)
  fields        fields of the content files that hold prose but that no SOURCES, RESOURCES or PAGE_DATA (page_data.py)
                path names, and content files with prose that no rule reads at all (the debate summaries and venues
                were missed this way)
  untranslated  page text extract.py does register but that a language's ui.json has no translation for yet

The net here is deliberately wider than extract.py's, so some of what it lists is code, not screen text. Anything
checked and found not to be screen text, or English on purpose, goes in unregistered-reviewed.json with the reason, and
is left out of later reports.

Usage: python unregistered.py [--check code|fields|untranslated] [--out FILE]
Reads files only; costs nothing. Default report: ../SiteTranslation/reports/unregistered.md
"""
import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import extract
import page_data
import site_languages
from page_rules import (CAPITALISED_WORD, CODE_AFTER, CODE_ATTRIBUTE, CODE_BEFORE, CODE_KEY, CODE_TEXT,  # noqa: F401
                        ENGLISH_WORD, code_context, english, looks_like_words, string_literals)

sys.stdout.reconfigure(encoding="utf-8")
SITE = extract.SITE
REPORT = extract.DEFAULT_OUT / "reports" / "unregistered.md"
REVIEWED = Path(__file__).with_name("unregistered-reviewed.json")
LANGUAGE_FOLDERS = site_languages.folders()  # every translated language, from src/lib/site-languages.json
# Every rule that reads a content file. Two can read the same file (data/study/people.json: SOURCES and PAGE_DATA).
SPECS = extract.SOURCES + extract.RESOURCES + page_data.PAGE_DATA

# JSX text: between tags, or touching a {value} on either side.
JSX_TEXT = re.compile(r"(?:\}|(?<![=\-])>)([^<>{}]{1,600})(?=[<{])")



def reviewed() -> dict[str, set[str]]:
    """check -> the texts (code), field paths (fields) or files already checked and found fine."""
    if not REVIEWED.exists():
        return defaultdict(set)
    entries = json.loads(REVIEWED.read_text("utf-8"))
    found: dict[str, set[str]] = defaultdict(set)
    for entry in entries:
        if entry["check"] in ("code", "later") and "file" in entry:  # for that file only (english_baseline.scoped_rulings)
            found["scoped"].add(scoped_key(entry["file"], entry["item"]))
        else:
            found[entry["check"]].add(entry["item"])
    return found


def scoped_key(file: str, text: str) -> str:
    """How reviewed()["scoped"] holds a ruling that is for one file only."""
    return f"{file}\t{text}"


def ui_keys(folder: str) -> set[str]:
    path = SITE / "data" / "i18n" / folder / "ui.json"
    return set(json.loads(path.read_text("utf-8"))) if path.exists() else set()


def with_numbers_blanked(text: str) -> str:
    """The site matches a text with other numbers in it ("Chapter 3" by "Chapter 1"), so numbers do not count."""
    return re.sub(r"\d+", "#", text)


def registered_page_text() -> set[str]:
    texts = extract.page_strings() + extract.resource_page_strings() + extract.debate_section_titles()
    for folder in LANGUAGE_FOLDERS:
        texts += list(ui_keys(folder))
    return {with_numbers_blanked(text) for text in texts}


def line_of(original: str, raw: str) -> int:
    found = original.find(raw)
    return original[:found].count("\n") + 1 if found >= 0 else 0


def literal_text(quote: str, body: str) -> str | None:
    """The words of a string as the screen shows them; a template's ${...} becomes {n}, as extract.py writes it."""
    if quote == "`":
        body = extract.TEMPLATE_VALUE.sub("{n}", body)
        if "{" in body.replace("{n}", "") or "$" in body or "\\" in body:
            return None
    return " ".join(body.split())


# Why extract.py passed a string by, tested in the order its own rules apply.
REASONS = {
    "template": "a template with values that extract.py's template rule turned down",
    "one word": "one word, and not under a key extract.py reads one-word labels from (label, title, heading, ...)",
    "lowercase": "no capital and no punctuation, which extract.py's rule for strings requires",
    "code": "extract.py's code filter took it for code",
    "lost": "extract.py lost the quote pairing on the line (usually a `...${}...` string earlier on it)",
    "jsx": "text between tags or around a {value} that extract.py's rules for page text turned down",
}


def literal_reason(quote: str, text: str) -> str:
    if quote == "`" and "{n}" in text:
        return "template"
    if len(extract.WORD.findall(text)) < 2:
        return "one word"
    if not re.search(r"[A-Z]|[.?!,]", text):
        return "lowercase"
    if extract.CODE_LIKE.search(text) or extract.class_like(text):
        return "code"
    return "lost"


def code_candidates(path: Path) -> list[tuple[int, str, str]]:
    """(line, text, reason) for each piece of the file's code that looks like words shown on screen."""
    original = path.read_text("utf-8")
    source = extract.without_comments(original)
    found: list[tuple[int, str, str]] = []
    for start, end, quote, body in string_literals(source):
        text = literal_text(quote, body)
        if text and looks_like_words(text.replace("{n}", "1")) and not code_context(source, start, end):
            found.append((line_of(original, source[start:end]), text, literal_reason(quote, text)))
    if path.suffix in (".tsx", ".jsx"):
        for match in JSX_TEXT.finditer(source):
            text = " ".join(match.group(1).split())
            if (looks_like_words(text) and extract.balanced(text) and not extract.EDGE_CODE.search(text)
                    and not re.search(r"&&|\|\||\?\s|=>|\.\w+\(|\(\s*\"|\",\s*\"", text)):
                found.append((line_of(original, match.group(1).strip()), text, "jsx"))
    return found


def skipped_file(relative: str, prefixes: set[str]) -> bool:
    return any(relative.startswith(prefix) for prefix in prefixes)


def check_code(skip: dict[str, set[str]]) -> list[str]:
    known = registered_page_text()
    by_reason: dict[str, dict[str, list[str]]] = {reason: {} for reason in REASONS}
    for path in extract.page_files(include_generated=False):  # src/generated/: see english_build_check.Site
        relative = path.relative_to(SITE).as_posix()
        if skipped_file(relative, skip["code-files"]):
            continue
        for line, text, reason in code_candidates(path):
            whole, pieces = with_numbers_blanked(text), text.split(" · ")
            if whole in known or all(with_numbers_blanked(piece) in known for piece in pieces) or text in skip["code"] \
                    or scoped_key(relative, text) in skip["scoped"]:
                continue
            by_reason[reason].setdefault(text, []).append(f"{relative}:{line}")
    total = sum(len(texts) for texts in by_reason.values())
    lines = [f"{total} pieces of text in the page code look shown on screen but are not registered."]
    lines += [f"  {len(by_reason[reason]):>5}  {REASONS[reason]}" for reason in REASONS] + [""]
    for reason, texts in by_reason.items():
        lines += [f"### {REASONS[reason][0].upper()}{REASONS[reason][1:]} ({len(texts)})", ""]
        for text, places in sorted(texts.items(), key=lambda item: item[1][0]):
            more = f" (+{len(places) - 1} more)" if len(places) > 1 else ""
            lines.append(f"- `{text}` — {places[0]}{more}")
        lines.append("")
    return lines


def all_strings(value, path: str, spec: tuple, visit, depth: int = 0) -> None:
    """Every string in a content file with its path written the way SOURCES writes it (extract.walk's rules)."""
    _, _, record_map, wild_parents, _, stanzas, mixed = spec
    if isinstance(value, dict):
        parent = path.rsplit(".", 1)[-1]
        for key, child in value.items():
            wild = key.isdigit() or (record_map and depth == 0) or parent in wild_parents
            all_strings(child, f"{path}.{'*' if wild else key}", spec, visit, depth + 1)
    elif isinstance(value, list):
        item_path = path + "[]"
        if item_path in stanzas or item_path in mixed:
            return
        for item in value:
            all_strings(item, item_path, spec, visit, depth + 1)
    elif isinstance(value, str):
        visit(path, value)


def prose(text: str) -> bool:
    """Words a reader would read: three words or more, not an address, a code or a file name."""
    text = " ".join(text.split())
    return (len(extract.WORD.findall(text)) >= 3 and " " in text and not CODE_TEXT.search(text)
            and bool(re.search(r"[a-z]{3}", text)))


def named_fields(glob: str) -> set[str]:
    """Every path a rule names in this file (SOURCES, RESOURCES or PAGE_DATA; two can read the same file)."""
    return {field for spec in SPECS if spec[1] == glob for field in spec[4]}


def unread_fields(spec: tuple, skip: set[str]) -> list[str]:
    counts: dict[str, list] = defaultdict(lambda: [0, ""])
    plain = named_fields(spec[1])
    for path in sorted(SITE.glob(spec[1])):
        def visit(field: str, text: str) -> None:
            if field not in plain and prose(text):
                counts[field][0] += 1
                counts[field][1] = counts[field][1] or text
        all_strings(page_data.read_data(path), "", spec, visit)
    lines = []
    for field, (count, example) in sorted(counts.items(), key=lambda item: -item[1][0]):
        if f"{spec[1]} {field}" not in skip:
            lines.append(f"- {spec[1]} `{field}` — {count} texts, e.g. “{example[:90]}”")
    return lines


# Where the pages read content files from. Skipped: Scripture (text, plain), the translations themselves (i18n), and
# generated cross-reference and graph indexes. A file over MAX_FILE_BYTES is a data dump, not page content.
CONTENT_ROOTS = ["data", "public/content", "src/data"]
NOT_CONTENT = {"text", "plain", "i18n", "xref", "xref-links", "graph", "generated", "node_modules"}
MAX_FILE_BYTES = 5_000_000


def content_files():
    for root in CONTENT_ROOTS:
        for folder, folders, files in os.walk(SITE / root):
            folders[:] = sorted(name for name in folders if name not in NOT_CONTENT)
            for name in sorted(files):
                if name.endswith(".json"):
                    yield Path(folder) / name


def prose_count(path: Path) -> int:
    count = 0

    def visit(_field: str, text: str) -> None:
        nonlocal count
        count += prose(text)
    all_strings(json.loads(path.read_text("utf-8")), "", ("", "", False, (), set(), set(), set()), visit)
    return count


def unread_files(skip: set[str]) -> list[str]:
    """Content files no SOURCES or RESOURCES rule reads, counted by folder: folder -> [files, texts of prose]."""
    covered = {path.resolve() for spec in SPECS for path in SITE.glob(spec[1])}
    by_folder: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for path in content_files():
        relative = path.relative_to(SITE).as_posix()
        if path.resolve() in covered or skipped_file(relative, skip) or path.stat().st_size > MAX_FILE_BYTES:
            continue
        if count := prose_count(path):
            by_folder[path.parent.relative_to(SITE).as_posix()][0] += 1
            by_folder[path.parent.relative_to(SITE).as_posix()][1] += count
    return [f"- {folder}/ — {files} files, {texts} texts of prose"
            for folder, (files, texts) in sorted(by_folder.items(), key=lambda item: -item[1][1])]


def check_fields(skip: dict[str, set[str]]) -> list[str]:
    first = {spec[1]: spec for spec in reversed(SPECS)}  # one report per file, whichever rules read it
    fields = [line for spec in SPECS if first[spec[1]] is spec for line in unread_fields(spec, skip["fields"])]
    files = unread_files(skip["files"])
    return ([f"{len(fields)} fields hold prose that no SOURCES, RESOURCES or PAGE_DATA path names:", ""] + fields
            + ["", f"{len(files)} content files hold prose and no rule reads them (some are read by other tools; check):", ""]
            + files)


def check_untranslated(skip: dict[str, set[str]]) -> list[str]:
    page = list(dict.fromkeys(extract.page_strings() + extract.resource_page_strings() + extract.debate_section_titles()))
    lines = []
    for folder in LANGUAGE_FOLDERS:
        keys = ui_keys(folder)
        missing = [text for text in page if text not in keys and english(text) and text not in skip["untranslated"]]
        lines.append(f"### {folder}: {len(missing)} of {len(page)} registered page texts have no translation")
        lines += [f"- `{text}`" for text in missing[:200]]
        if len(missing) > 200:
            lines.append(f"- … and {len(missing) - 200} more")
        lines.append("")
    return lines


CHECKS = {"code": check_code, "fields": check_fields, "untranslated": check_untranslated}
TITLES = {"code": "Page code: on-screen text not registered", "fields": "Content files: prose no rule reads",
          "untranslated": "Registered page text with no translation yet"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", choices=list(CHECKS), action="append", help="run only this check (repeatable)")
    parser.add_argument("--out", type=Path, default=REPORT, help="where to write the report")
    args = parser.parse_args()
    skip = reviewed()
    report = ["# English the translation never registers", "",
              "Written by Website/content/translation/unregistered.py. Each item below would stay English in every "
              "language. Items checked and found fine belong in unregistered-reviewed.json.", ""]
    for name in args.check or list(CHECKS):
        section = CHECKS[name](skip)
        report += [f"## {TITLES[name]}", ""] + section + [""]
        print(f"{name}: {section[0]}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("\n".join(report), "utf-8", newline="\n")
    print(f"report: {args.out}")


if __name__ == "__main__":
    main()
