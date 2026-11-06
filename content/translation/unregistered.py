"""Finds English that will stay English in every language because extract.py never registers it for translation.

Three checks, each written to its own section of the report:
  code          text in the page code that looks shown on screen but that extract.py's rules skip (the Apologetics
                menu's {label:'Practice'} was one: single quotes, one word)
  fields        fields of the content files that hold prose but that no SOURCES or RESOURCES path names, and content
                files with prose that no rule reads at all (the debate summaries and venues were missed this way)
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
import site_languages

sys.stdout.reconfigure(encoding="utf-8")
SITE = extract.SITE
REPORT = extract.DEFAULT_OUT / "reports" / "unregistered.md"
REVIEWED = Path(__file__).with_name("unregistered-reviewed.json")
LANGUAGE_FOLDERS = site_languages.folders()  # every translated language, from src/lib/site-languages.json

# JSX text: between tags, or touching a {value} on either side.
JSX_TEXT = re.compile(r"(?:\}|(?<![=\-])>)([^<>{}]{1,600})(?=[<{])")
CAPITALISED_WORD = re.compile(r"[A-Z][a-z]+(?:['’][a-z]+)?")
# Signs a literal is code, not words: markup, calls, units, colours, file names, addresses.
CODE_TEXT = re.compile(r"[{};<>=\\|]|=>|\(\)|https?://|^[/#.@]|\b\d+(?:px|rem|em|ms|s|vh|vw|deg|%)|var\(|rgba?\(|hsla?\("
                       r"|\.(?:tsx?|json|css|svg|png|jpe?g|webp|md|txt|pdf)\b|\$\{|^[\w-]+:[\w-]")
# What sits just before a literal that is code: an attribute or key that holds a name, a comparison, or a call that
# takes a key, a selector or a message for the console.
CODE_ATTRIBUTE = re.compile(
    r"\b(?:className|class|key|id|href|to|src|srcSet|type|role|lang|rel|target|name|htmlFor|viewBox|d|fill|stroke|style"
    r"|as|variant|size|tone|color|icon|path|slug|route|value|defaultValue|mode|accept|autoComplete|inputMode|dir"
    r"|data-[\w-]+|aria-(?!label)[\w-]+|transform|points|x|y|cx|cy|r|width|height|fontFamily|textAnchor)\s*=\s*\{?\s*$")
CODE_KEY = re.compile(
    r"(?:^|[{,\s])(?:id|key|slug|href|to|path|route|src|icon|color|tone|kind|type|variant|className|class|lang|code|value"
    r"|ref|anchor|hash|query|param|field|format|style|mode|status|group|folder|file|url|font|fontFamily|background"
    r"|border|ease|easing|transition|animation|align|justify|position|display|cursor|direction|book|abbr)\s*:\s*$")
CODE_BEFORE = re.compile(
    r"(?:===|!==|==|!=|\bcase|\btype\s+\w+\s*=|\binterface\b.*|\|\s*|&&\s*|\bin\s+)\s*$"
    r"|\b(?:import|from|require|console\.\w+|Error|querySelector(?:All)?|getElementById|addEventListener"
    r"|removeEventListener|fetch|getItem|setItem|removeItem|getAttribute|setAttribute|hasAttribute|removeAttribute"
    r"|includes|startsWith|endsWith|indexOf|split|join|replace|replaceAll|match|test|get|has|set|delete|navigate"
    r"|createElement|closest|matches|toLocale\w*|DateTimeFormat|NumberFormat|describe|it|expect|warn|log|error"
    r"|postMessage|dispatchEvent|Event|CustomEvent|localStorage\.\w+|sessionStorage\.\w+|track|emit|on)\s*\(\s*$"
    r"|\w\[\s*$")
CODE_AFTER = re.compile(r"^\s*(?:===|!==|==|!=|\]|in\b|\?\s*\w+\s*:)")


def reviewed() -> dict[str, set[str]]:
    """check -> the texts (code), field paths (fields) or files already checked and found fine."""
    if not REVIEWED.exists():
        return defaultdict(set)
    entries = json.loads(REVIEWED.read_text("utf-8"))
    found: dict[str, set[str]] = defaultdict(set)
    for entry in entries:
        found[entry["check"]].add(entry["item"])
    return found


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


def looks_like_words(text: str) -> bool:
    """A capitalised word ("Practice"), or a run of words that is not code ("Show all 66 books")."""
    if not text or CODE_TEXT.search(text) or extract.class_like(text):
        return False
    tokens = text.split()
    if len(tokens) == 1:
        return bool(CAPITALISED_WORD.fullmatch(text.rstrip(".:!?")))
    words = [token for token in tokens if re.fullmatch(r"[(“\"‘']?[A-Za-z][a-z'’-]*[)”\"’'.,:;!?]*", token)]
    if len(words) * 2 <= len(tokens):
        return False
    # Two lowercase words are usually a name in code ("sans serif"); a capital, punctuation or three words are not.
    return bool(re.match(r"[A-Z“\"‘(]", text) or re.search(r"[.?!,]", text) or len(words) >= 3)


def code_context(source: str, start: int, end: int) -> bool:
    line_start = source.rfind("\n", 0, start) + 1
    before = source[max(line_start, start - 80):start]
    after = source[end:end + 20]
    return bool(CODE_ATTRIBUTE.search(before) or CODE_KEY.search(before) or CODE_BEFORE.search(before)
                or CODE_AFTER.match(after))


def line_of(original: str, raw: str) -> int:
    found = original.find(raw)
    return original[:found].count("\n") + 1 if found >= 0 else 0


def string_literals(source: str):
    """(start, end, quote, body) for each string in comment-free code, read the way extract.without_comments reads them:
    a backtick string may run over lines and hold ${...}, an apostrophe touching a word opens nothing, and a quote left
    open at the end of its line was not a string."""
    position, size = 0, len(source)
    while position < size:
        char = source[position]
        if char in "\"`" or (char == "'" and not re.match(r"[\w'’]", source[position - 1:position] or " ")):
            end = position + 1
            while end < size and source[end] != char and (char == "`" or source[end] != "\n"):
                end += 2 if source[end] == "\\" else 1
            if end < size and source[end] == char:
                yield position, end + 1, char, source[position + 1:end]
                position = end + 1
                continue
        position += 1


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
    if path.suffix == ".tsx":
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
    for path in extract.page_files():
        relative = path.relative_to(SITE).as_posix()
        if skipped_file(relative, skip["code-files"]):
            continue
        for line, text, reason in code_candidates(path):
            whole, pieces = with_numbers_blanked(text), text.split(" · ")
            if whole in known or all(with_numbers_blanked(piece) in known for piece in pieces) or text in skip["code"]:
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


def unread_fields(spec: tuple, skip: set[str]) -> list[str]:
    counts: dict[str, list] = defaultdict(lambda: [0, ""])
    plain = spec[4]
    for path in sorted(SITE.glob(spec[1])):
        def visit(field: str, text: str) -> None:
            if field not in plain and prose(text):
                counts[field][0] += 1
                counts[field][1] = counts[field][1] or text
        all_strings(json.loads(path.read_text("utf-8")), "", spec, visit)
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
    covered = {path.resolve() for spec in extract.SOURCES + extract.RESOURCES for path in SITE.glob(spec[1])}
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
    fields = [line for spec in extract.SOURCES + extract.RESOURCES for line in unread_fields(spec, skip["fields"])]
    files = unread_files(skip["files"])
    return ([f"{len(fields)} fields hold prose that no SOURCES or RESOURCES path names:", ""] + fields
            + ["", f"{len(files)} content files hold prose and no rule reads them (some are read by other tools; check):", ""]
            + files)


ENGLISH_WORD = re.compile(r"\b(?:the|and|of|to|a|an|in|is|are|for|on|with|by|or|it|this|that|your|you|every|all|from|at|as|not)\b",
                          re.IGNORECASE)


def english(text: str) -> bool:
    """Page text written in English, not a verse the code quotes in another language ("Jehová te bendiga")."""
    if re.search(r"[^\x00-\x7F\u2010-\u201F\u2026\u00A0\u00B7]", text):
        return False
    return len(text.split()) <= 2 or bool(ENGLISH_WORD.search(text))


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
