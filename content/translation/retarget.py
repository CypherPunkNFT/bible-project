"""Carries the translations across a correction to the English, without re-translating or re-chunking anything.

String ids are sha1(kind + text), so correcting a typo gives the string a new id. A full re-extract would also renumber
the chunks and pick up whatever else changed in the site since, so this changes only what the correction changed:

  python retarget.py build-map --old-creeds DIR --old-hymns DIR --old-extract FILE
      Pairs the site's data as it was (DIR, copies of data/creeds and data/hymns made before the rebuild) with the data
      now, position by position, and writes source-fixes.json beside this file. Reads nothing from the translations.

  python retarget.py apply [--root DIR] [--allow-unfinished]
      In the site-translation repository: renames each corrected string in in/ and every out/<lang>/, in place, in the
      same chunk; corrects reference numbers in the translations directly (REFERENCE_FIXES); removes page strings the
      fixed extractor no longer finds; and files each string whose wording changed in review/<lang>/source-fixes/ for
      the Opus check. Refuses until every language has every chunk, because sessions write to out/ by id.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import extract as ex  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MAP_FILE = HERE / "source-fixes.json"
LANGUAGES = ("es", "pt", "zh", "ar", "hi")
SEP = r"(\s*[:：,.]\s*)"
# (English before the correction contains this, in any language: pattern, replacement). Numbers are the same in every
# language, so only a book name needs one entry per language.
REFERENCE_FIXES = [
    ("Luke 10:87", {"*": (rf"\b10{SEP}87\b", r"10\g<1>37")}),
    ("Gen. 11:7", {"*": (rf"\b11{SEP}7\b", r"2\g<1>7")}),
    ("John 19:13", {"*": (rf"\b19{SEP}13\b", r"14\g<1>13")}),
    ("Revelation 3:18. Because", {"*": (rf"\b3{SEP}18\b", r"3\g<1>17")}),
    ("Eph. 2:810", {"*": (rf"\b2{SEP}810\b", r"2\g<1>8-10")}),
    ("1 Cor. 15:2 2", {"*": (rf"\b15{SEP}2\s?2\b", r"15\g<1>22")}),
    ("to behold iniquity, Heb. 1:13", {
        "es": (r"Hebreos\s*(1:13)", r"Habacuc \1"), "pt": (r"Hebreus\s*(1:13)", r"Habacuque \1"),
        "zh": (r"希伯来书\s*(1:13)", r"哈巴谷书 \1"), "ar": (r"(?:ال)?عبرانيين\s*(1:13)", r"حبقوق \1"),
        "hi": (r"इब्रानियों\s*(1:13)", r"हबक्कूक \1")}),
    # No \b beside the letter: in Chinese it touches 第 and 条, which count as word characters.
    ("Articles P–23", {"*": (r"(?<![A-Za-z])P(\s*[–-]\s*23)", r"1\1")}),
    ("Articles I–24", {"*": (r"(?<![A-Za-z])I(\s*[–-]\s*24)", r"1\1")}),
    ("Articles 50–C", {"*": (r"(50\s*[–-]\s*)C(?![A-Za-z])", r"\g<1>67")}),
]
# The old swap had swallowed a citation or a paragraph break in these eight strings, so their translations lack it and
# no reference fix can restore it. Translated afresh by the briefs; each still goes to the Opus check.
RETRANSLATED_FILE = HERE / "source-fixes-retranslated.json"
TOKEN = re.compile(r"[^\W\d_]+|\d+")
CITATION = re.compile(r"(?<!\d)(\d+):(\d+)(?!\d)")


def spec_of(pattern: str) -> tuple:
    return next(spec for spec in ex.SOURCES if spec[1] == pattern)


def walked(path: Path, spec: tuple) -> list[str]:
    found: list[str] = []
    ex.walk(json.loads(path.read_text("utf-8")), "", spec, lambda text: found.append(text))
    return found


def sections_of(directory: Path, name: str) -> list[dict]:
    """A document's sections in reading order, whichever bundles they fall in now."""
    bundles = [p for p in directory.glob(f"{name}.b*.json") if re.fullmatch(rf"{re.escape(name)}\.b\d+\.json", p.name)]
    bundles.sort(key=lambda p: int(p.name.rsplit(".b", 1)[1].split(".")[0]))
    return [section for path in bundles for section in json.loads(path.read_text("utf-8"))["sections"]]


def creed_pairs(old_root: Path, new_root: Path) -> list[tuple[str, str]]:
    old_dir, new_dir = old_root / "doc", new_root / "doc"
    names = lambda d: {p.name for p in d.glob("*.json") if not re.search(r"\.b\d+\.json$", p.name)}  # noqa: E731
    if names(old_dir) != names(new_dir):
        raise SystemExit(f"documents differ: {sorted(names(old_dir) ^ names(new_dir))}")
    pairs: list[tuple[str, str]] = []
    spec = spec_of("data/creeds/doc/*.json")
    for name in sorted(names(old_dir)):
        before, after = walked(old_dir / name, spec), walked(new_dir / name, spec)
        if len(before) != len(after):
            raise SystemExit(f"{name}: {len(before)} top-level strings before, {len(after)} now")
        pairs += zip(before, after)
        stem = name.removesuffix(".json")
        old_sections, new_sections = sections_of(old_dir, stem), sections_of(new_dir, stem)
        if [s["id"] for s in old_sections] != [s["id"] for s in new_sections]:
            raise SystemExit(f"{stem}: the section ids or their order changed")
        for old, new in zip(old_sections, new_sections):
            for field in ("heading", "question", "text"):
                if bool(old.get(field)) != bool(new.get(field)):
                    raise SystemExit(f"{stem} section {old['id']}: {field} appeared or vanished")
                if old.get(field):
                    pairs.append((old[field], new[field]))
    index = spec_of("data/creeds/index.json")
    pairs += zip(walked(old_root / "index.json", index), walked(new_root / "index.json", index))
    return pairs


def hymn_pairs(old_root: Path, new_root: Path) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for spec in ex.SOURCES:
        if spec[0] != "hymn":
            continue
        pattern = spec[1].removeprefix("data/hymns/")
        for old_path in sorted(old_root.glob(pattern)):
            relative = old_path.relative_to(old_root)
            before, after = walked(old_path, spec), walked(new_root / relative, spec)
            if len(before) != len(after):
                raise SystemExit(f"{relative}: {len(before)} strings before, {len(after)} now")
            pairs += zip(before, after)
    return pairs


def change_class(old: str, new: str) -> str:
    """punctuation: same words and numbers. reference: only numbers or a citation changed. wording: anything else."""
    old_tokens, new_tokens = TOKEN.findall(old.lower()), TOKEN.findall(new.lower())
    if old_tokens == new_tokens:
        return "punctuation"
    letters = lambda tokens: [t for t in tokens if not t.isdigit()]  # noqa: E731
    if letters(old_tokens) == letters(new_tokens) or any(key in old for key, _ in REFERENCE_FIXES) and (
            len(old_tokens) == len(new_tokens)
            and sum(a != b for a, b in zip(old_tokens, new_tokens)) <= 2):
        return "reference"
    return "wording"


def load_old_extractor(path: Path):
    spec = importlib.util.spec_from_file_location("extract_before_fix", path)
    module = importlib.util.module_from_spec(spec)
    source = path.read_text("utf-8").replace("Path(__file__).resolve().parents[2]", f"Path(r'{ex.SITE}')")
    exec(compile(source, str(path), "exec"), module.__dict__)  # our own earlier version, read from git
    return module


def removed_page_strings(old_extract: Path) -> list[dict]:
    """What the old extractor made up and the new one does not. Text a page really shows stays, even if it reached the
    chunks only by accident, so that no translation on screen is lost."""
    code = "\n".join(ex.without_comments(p.read_text("utf-8")) for p in sorted((ex.SITE / "src").rglob("*.ts*"))
                     if not {"generated", "mockup", "dev", "test"} & set(p.parts) and ".test." not in p.name)
    now = set(ex.page_strings())
    out = []
    for text in load_old_extractor(old_extract).page_strings():
        if text in now:
            continue
        shown = text in code and re.match(r"[A-Z0-9]", text) and not ex.CODE_LIKE.search(text)
        if not shown:
            out.append({"id": ex.string_id(ex.PAGE_KIND, text), "text": text})
    return out


def build_map(args: argparse.Namespace) -> None:
    by_old: dict[tuple[str, str], list[str]] = {}
    for kind, pairs in (("creed", creed_pairs(args.old_creeds, ex.SITE / "data/creeds")),
                        ("hymn", hymn_pairs(args.old_hymns, ex.SITE / "data/hymns"))):
        for old, new in pairs:
            if old != new:
                news = by_old.setdefault((kind, old), [])
                if new not in news:
                    news.append(new)
    current = ex.collect()
    changes = []
    for (kind, old), news in by_old.items():
        old_id = ex.string_id(kind, old)
        changes.append({"kind": kind, "old_id": old_id, "old": old, "still_used": old_id in current[kind],
                        "new": [{"id": ex.string_id(kind, new), "text": new, "class": change_class(old, new)} for new in news]})
    removed = removed_page_strings(args.old_extract)
    MAP_FILE.write_text(json.dumps({"changes": changes, "page_removed": removed}, ensure_ascii=False, indent=0) + "\n",
                        "utf-8", newline="\n")
    tally: dict[str, int] = {}
    for change in changes:
        for new in change["new"]:
            tally[new["class"]] = tally.get(new["class"], 0) + 1
    print(f"{len(changes)} strings changed {tally}; {sum(c['still_used'] for c in changes)} old texts still used elsewhere; "
          f"{len(removed)} page strings to remove; wrote {MAP_FILE.name}")


def read(path: Path) -> dict:
    return json.loads(path.read_text("utf-8"))


def save(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1) + "\n", "utf-8", newline="\n")


def fix_reference(lang: str, old_english: str, new_english: str, translation: str) -> str:
    for key, by_language in REFERENCE_FIXES:
        if key in old_english:
            pattern, replacement = by_language.get(lang) or by_language["*"]
            translation = re.sub(pattern, replacement, translation)
    # Any other corrected verse number: the citations stand in the same order in both Englishes.
    before, after = CITATION.findall(old_english), CITATION.findall(new_english)
    if len(before) == len(after):
        for (old_chapter, old_verse), (chapter, verse) in zip(before, after):
            if (old_chapter, old_verse) != (chapter, verse):
                translation = re.sub(rf"(?<!\d){old_chapter}{SEP}{old_verse}(?!\d)", rf"{chapter}\g<1>{verse}", translation)
    return translation


def renamed(strings: dict, changes: dict, in_use: set[str], removed: set[str], value_of) -> dict:
    """The chunk's strings in the same order, each corrected id in its old place."""
    out = {}
    for key, value in strings.items():
        if key in removed:
            continue
        change = changes.get(key)
        if change is None:
            out[key] = value
            continue
        if change["still_used"]:
            out[key] = value
        for new in change["new"]:
            if new["id"] not in in_use:
                out[new["id"]] = value_of(value, new)
    return out


def review_flags(lang: str, change: dict, new: dict, translated: str) -> list[dict]:
    flags = []
    if new["class"] == "wording":
        flags.append({"id": new["id"], "type": "english-corrected", "by": "source fix", "serious": False,
                      "problem": f"The English was corrected from: {change['old']!r}. Check this translation against the new English.",
                      "fix": ""})
    gone = set(ex.re.findall(r"\b\d+\b", change["old"])) - set(ex.re.findall(r"\b\d+\b", new["text"]))
    stale = sorted(number for number in gone if re.search(rf"(?<!\d){number}(?!\d)", translated))
    if stale:
        flags.append({"id": new["id"], "type": "stale-number", "by": "source fix", "serious": True,
                      "problem": f"Holds {', '.join(stale)}, which the corrected English no longer has.", "fix": ""})
    return flags


def apply(args: argparse.Namespace) -> None:
    root: Path = args.root
    index = read(root / "chunks.json")
    if not args.allow_unfinished:
        short = {lang: sum((root / "out" / lang / f"{c['chunk']}.json").exists() for c in index) for lang in LANGUAGES}
        if any(count != len(index) for count in short.values()):
            raise SystemExit(f"translation is not finished ({short} of {len(index)} chunks); nothing changed")
    plan = read(MAP_FILE)
    retranslated = read(RETRANSLATED_FILE)
    changes = {c["old_id"]: c for c in plan["changes"]}
    removed = {r["id"] for r in plan["page_removed"]}
    chunks = {c["chunk"]: read(root / "in" / f"{c['chunk']}.json") for c in index}
    held = {key for body in chunks.values() for key in body["strings"]}
    unseen = [c["old_id"] for c in plan["changes"] if c["old_id"] not in held]
    in_use = set(held) - set(changes) | {key for key, c in changes.items() if c["still_used"]}
    flags_total = 0
    for name, body in chunks.items():
        strings = body["strings"]
        if not (set(strings) & (set(changes) | removed)):
            continue
        body["strings"] = renamed(strings, changes, in_use, removed, lambda _, new: new["text"])
        save(root / "in" / f"{name}.json", body)
        entry = next(c for c in index if c["chunk"] == name)
        entry["strings"], entry["words"] = len(body["strings"]), sum(ex.words(t) for t in body["strings"].values())
        for lang in LANGUAGES:
            path = root / "out" / lang / f"{name}.json"
            if not path.exists():
                continue
            translated = read(path)
            flags: list[dict] = []

            def carried(value: str, new: dict, lang: str = lang, flags: list = flags) -> str:
                change = next(c for c in plan["changes"] if any(n["id"] == new["id"] for n in c["new"]) and c["old_id"] in translated)
                value = retranslated.get(new["id"], {}).get(lang) or fix_reference(lang, change["old"], new["text"], value)
                flags.extend(review_flags(lang, change, new, value))
                return value

            save(path, renamed(translated, changes, in_use, removed, carried))
            if flags:
                save(root / "review" / lang / "source-fixes" / f"{name}.json", {"flags": flags})
                flags_total += len(flags)
    (root / "chunks.json").write_text(json.dumps(index, indent=1) + "\n", "utf-8", newline="\n")
    in_use.update(new["id"] for c in plan["changes"] for new in c["new"])
    print(f"renamed {len(changes) - len(unseen)} strings ({len(unseen)} were not in the chunks); removed {len(removed & held)} page "
          f"strings; {flags_total} review entries filed")
    verify(root, chunks)


def verify(root: Path, chunks: dict) -> None:
    """Every id must again be the hash of its text; every non-page string must match what the site's data now holds."""
    bad = [(name, key) for name, body in chunks.items() for key, text in read(root / "in" / f"{name}.json")["strings"].items()
           if hashlib.sha1(f"{body['kind']}\0{text}".encode()).hexdigest()[:12] != key]
    print(f"ids that do not match their text: {len(bad)} {bad[:8]}")
    current = ex.collect()
    held: dict[str, set[str]] = {}
    for name, body in chunks.items():
        held.setdefault(body["kind"], set()).update(read(root / "in" / f"{name}.json")["strings"])
    for kind, wanted in current.items():
        missing, extra = set(wanted) - held.get(kind, set()), held.get(kind, set()) - set(wanted)
        print(f"{kind}: {len(missing)} in the site but not the chunks, {len(extra)} in the chunks but not the site")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)
    build = commands.add_parser("build-map")
    build.add_argument("--old-creeds", type=Path, required=True)
    build.add_argument("--old-hymns", type=Path, required=True)
    build.add_argument("--old-extract", type=Path, required=True)
    run = commands.add_parser("apply")
    run.add_argument("--root", type=Path, default=ex.DEFAULT_OUT)
    run.add_argument("--allow-unfinished", action="store_true", help="only for a trial on a copy")
    args = parser.parse_args()
    (build_map if args.command == "build-map" else apply)(args)


if __name__ == "__main__":
    main()
