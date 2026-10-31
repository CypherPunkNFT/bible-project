"""Writes the translated copies of the site's content files from the site-translation repository's chunks.

For each language, every data file named in extract.SOURCES is walked exactly as extract.py walked it, each English
string swapped for its translation, and the copy written to data/i18n/<lang>/<same path under data/>. The page
code's own text goes to data/i18n/<lang>/ui.json as {English: translation}, which the site swaps on screen
(src/lib/page-translator.ts); seed/<lang>.json fills page strings the chunks have not translated yet.
A string with no translation stays English. data/ is git-ignored, so rerun this after a data rebuild or new chunks.
Files under public/ are not translated yet. Usage: python apply.py [--repo DIR] [es pt ...]
"""
import argparse
import json
import sys
from pathlib import Path

from extract import DEFAULT_OUT, PAGE_KIND, SITE, SOURCES, string_id, walk

sys.stdout.reconfigure(encoding="utf-8")
SEED = Path(__file__).resolve().parent / "seed"


def translations(repo: Path, lang: str) -> dict[str, dict[str, str]]:
    """kind -> {id: translation}, from every chunk translated so far."""
    by_kind: dict[str, dict[str, str]] = {}
    for entry in json.loads((repo / "chunks.json").read_text("utf-8")):
        done = repo / "out" / lang / f"{entry['chunk']}.json"
        if done.exists():
            by_kind.setdefault(entry["kind"], {}).update(json.loads(done.read_text("utf-8")))
    return by_kind


def page_strings(repo: Path, lang: str, translated: dict[str, str]) -> dict[str, str]:
    seed_file = SEED / f"{lang}.json"
    strings = json.loads(seed_file.read_text("utf-8")) if seed_file.exists() else {}
    for entry in json.loads((repo / "chunks.json").read_text("utf-8")):
        if entry["kind"] != PAGE_KIND:
            continue
        english = json.loads((repo / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"]
        strings.update({text: translated[key] for key, text in english.items() if key in translated})
    return strings


def apply(repo: Path, lang: str) -> None:
    by_kind = translations(repo, lang)
    target = SITE / "data" / "i18n" / lang
    files = swapped = kept = 0
    for spec in SOURCES:
        kind, pattern = spec[0], spec[1]
        if not pattern.startswith("data/"):
            continue
        known = by_kind.get(kind, {})

        def visit(text: str) -> str | None:
            nonlocal swapped, kept
            found = known.get(string_id(kind, text))
            swapped, kept = swapped + bool(found), kept + (not found)
            return found

        for path in sorted(SITE.glob(pattern)):
            copy = walk(json.loads(path.read_text("utf-8")), "", spec, visit)
            out = target / path.relative_to(SITE / "data")
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(copy, ensure_ascii=False, separators=(",", ":")), "utf-8")
            files += 1
    ui = page_strings(repo, lang, by_kind.get(PAGE_KIND, {}))
    target.mkdir(parents=True, exist_ok=True)
    (target / "ui.json").write_text(json.dumps(ui, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"{lang}: {files} files, {swapped} strings translated, {kept} left in English; {len(ui)} page strings")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", type=Path, default=DEFAULT_OUT, help="the site-translation repository folder")
    parser.add_argument("languages", nargs="*", default=["es", "pt"])
    args = parser.parse_args()
    for lang in args.languages:
        apply(args.repo, lang)


if __name__ == "__main__":
    main()
