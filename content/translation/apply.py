"""Writes the translated copies of the site's content files from the site-translation repository's chunks.

For each language, every data file named in extract.SOURCES is walked exactly as extract.py walked it, each English
string swapped for its translation, and the copy written to data/i18n/<lang>/<same path under data/>. The page
code's own text goes to data/i18n/<lang>/ui.json as {English: translation}, which the site swaps on screen
(src/lib/page-translator.ts); seed/<lang>.json fills page strings the chunks have not translated yet, and
seed/bible/<lang>.json, the home page's verses cut from that language's Bible (src/components/home/banner-verses.tsx),
is written over both, since a quotation is the Bible's wording and never a translator's. The Resources
files bundled with the code (extract.RESOURCES, src/data/resources/) get copies in data/i18n/<lang>/resources/.
A string with no translation stays English. data/ is git-ignored, so rerun this after a data rebuild or new chunks.
The debate transcripts (content/apologetics/transcripts/*.txt) get a translated copy of the whole text in
data/i18n/<lang>/transcripts/<name>.json as {"text": ...}, which the debate viewer reads (src/lib/debate-transcripts.ts).
The study pages' own text (kind "studytext": the Academic study dossiers, study data files and study page code, see
SiteTranslation/studies/) goes to data/i18n/<lang>/ui-study.json as {English: translation}; the page translator reads it
on /study and /teachers pages only (src/lib/page-translator.ts), because it is large. The ruler, prophet and apostle
pages' own text (kind "peopletext", src/data/people-pages/) goes the same way to ui-people.json, read on /people pages only.
Text pages show from data bundled with their code (page_data.py) joins them: "peopledata" (the Moses page) in
ui-people.json, "studydata" (the circles explorer, the people list's names, and since stage 5 job 19 the teachers'
pages, letters, Names of God and manuscripts) in ui-study.json; a text the older kind already translates keeps that
translation. "sitedata" (job 19: data pages that load only ui.json show, such as Resources and the atlas) joins ui.json
last (add_site_data). The source directory's words (kind "sources") go to
data/i18n/<lang>/sources.json as {English: translation}: the directory itself is rebuilt with every build, so the
site applies the words to whatever English it has (src/components/sources/useSourceDirectory.ts) rather than reading a
copy that would go stale. Other files under public/ are not translated yet. Last, every language's ui.json is split
into the small per-page lists the site reads first (data/i18n/<lang>/phrases/, scripts/phrase-lists.mjs).
Usage: python apply.py [--repo DIR] [es pt ...]
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from extract import DEFAULT_OUT, PAGE_KIND, PLURAL_KIND, RESOURCES, SITE, SOURCES, paragraphs, string_id, walk
import site_languages
from page_data import PEOPLE_DATA_KIND, SITE_DATA_KIND, STUDY_DATA_KIND

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


def page_strings(repo: Path, lang: str, translated: dict[str, str], translated_plurals: dict[str, str] | None = None
                 ) -> dict[str, str]:
    """ui.json's {English: translation}: the seed, then the page chunks, the plural messages' forms, and last the
    home page's verses in the language's Bible."""
    seed_file = SEED / f"{lang}.json"
    strings = json.loads(seed_file.read_text("utf-8")) if seed_file.exists() else {}
    for entry in json.loads((repo / "chunks.json").read_text("utf-8")):
        if entry["kind"] != PAGE_KIND:
            continue
        english = json.loads((repo / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"]
        strings.update({text: translated[key] for key, text in english.items() if key in translated})
    strings.update(plural_forms(repo, lang, translated_plurals or {}))
    strings.update(bible_wording(lang))
    return strings


def plural_forms(repo: Path, lang: str, translated: dict[str, str]) -> dict[str, str]:
    """The plural messages (extract.py --plurals) translated so far, {plural:[one, many]: forms as JSON}. A translation
    that is not a JSON object of texts for this language's plural categories, with "other", is left out with a message,
    so the site shows the English (src/lib/site-format.ts checks the same)."""
    forms: dict[str, str] = {}
    for entry in json.loads((repo / "chunks.json").read_text("utf-8")):
        if entry["kind"] != PLURAL_KIND:
            continue
        categories = set(site_languages.by_folder(lang).plurals)
        english = json.loads((repo / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"]
        for key, message in english.items():
            if key not in translated:
                continue
            try:
                value = json.loads(translated[key])
            except (TypeError, ValueError):
                value = None
            if (not isinstance(value, dict) or "other" not in value or not set(value) <= categories
                    or not all(isinstance(form, str) and form.strip() for form in value.values())):
                print(f"apply.py {lang}: the plural forms for {message} (chunk {entry['chunk']}) are not a JSON object of "
                      f"texts for {', '.join(sorted(categories))} with \"other\"; got {translated[key][:200]!r}; left out")
                continue
            forms[message] = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return forms


def bible_wording(lang: str) -> dict[str, str]:
    """The home page's verses in this language's Bible, {English: wording} (seed/bible/<lang>.json), checked."""
    path = SEED / "bible" / f"{lang}.json"
    if not path.exists():
        return {}
    wording = json.loads(path.read_text("utf-8"))
    if not isinstance(wording, dict) or not all(isinstance(key, str) and isinstance(value, str) and value.strip()
                                                for key, value in wording.items()):
        raise ValueError(f"{path}: expected an object of English verse -> that language's Bible wording (non-empty text), "
                         f"got {str(wording)[:200]}")
    return wording


STUDY_KIND = "studytext"
PEOPLE_KIND = "peopletext"
SOURCES_KIND = "sources"
# The {English: translation} lists written beside ui.json, each with the kinds it holds; where two kinds hold the same
# English, the first kind's translation is kept (the older kinds come first).
PHRASE_LISTS = {"ui-study.json": (STUDY_KIND, STUDY_DATA_KIND), "ui-people.json": (PEOPLE_KIND, PEOPLE_DATA_KIND),
                "sources.json": (SOURCES_KIND,)}


def study_strings(repo: Path, translated: dict[str, str], kind: str = STUDY_KIND) -> dict[str, str]:
    """{English: translation} for every chunk of this kind (study or people text) translated so far."""
    strings: dict[str, str] = {}
    for entry in json.loads((repo / "chunks.json").read_text("utf-8")):
        if entry["kind"] != kind:
            continue
        english = json.loads((repo / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"]
        strings.update({text: translated[key] for key, text in english.items() if key in translated})
    return strings


def add_site_data(ui: dict[str, str], repo: Path, by_kind: dict[str, dict[str, str]]) -> None:
    """Adds to ui.json the text from data that pages loading no other phrase list show (page_data_specs.py SITE_DATA),
    last: a translation ui.json already has for the same English wins."""
    for text, found in study_strings(repo, by_kind.get(SITE_DATA_KIND, {}), SITE_DATA_KIND).items():
        ui.setdefault(text, found)


def phrase_lists(repo: Path, by_kind: dict[str, dict[str, str]]) -> dict[str, dict[str, str]]:
    """file name -> its {English: translation} (PHRASE_LISTS)."""
    lists = {}
    for name, kinds in PHRASE_LISTS.items():
        merged: dict[str, str] = {}
        for kind in reversed(kinds):
            merged.update(study_strings(repo, by_kind.get(kind, {}), kind))
        lists[name] = merged
    return lists


TRANSCRIPT_KIND = "transcript"
TRANSCRIPTS = SITE / "content" / "apologetics" / "transcripts"
BLOCK_BREAK = re.compile(r"(\n\s*\n)")
# The Lennox-Dawkins transcript has no line map: the viewer finds its turns by these labels (src/lib/debate-transcripts.ts),
# so a translation that rewrote or dropped one gets the English label put back.
SPEAKER_LABEL = re.compile(r"^(?:Larry Taunton|Bill Pryor|Richard Dawkins|John Lennox|Dr\. Lennox): ")


def translated_transcript(text: str, known: dict[str, str]) -> tuple[str, int, int, int]:
    """The transcript with every block of text between blank lines replaced by its translation, the blank lines kept.
    Returns the text and how many blocks were translated, left in English, and kept English because the translation's
    line count differed (the viewer finds speaker turns by line number, so a block must keep its lines)."""
    parts = BLOCK_BREAK.split(text)
    done = missing = reshaped = 0
    for index in range(0, len(parts), 2):
        block = parts[index].strip()
        if not block:
            continue
        pieces = paragraphs(block)
        if not pieces:
            continue
        found = [known.get(string_id(TRANSCRIPT_KIND, piece)) for piece in pieces]
        if not all(found):
            missing += 1
            continue
        joined = " ".join(found)
        label = SPEAKER_LABEL.match(block)
        if label and not joined.startswith(label.group()):
            joined = label.group() + (joined.split(":", 1)[1].lstrip() if ":" in joined[:60] else joined)
        if joined.count("\n") != block.count("\n") or BLOCK_BREAK.search(joined):
            reshaped += 1
            continue
        lead = parts[index][: len(parts[index]) - len(parts[index].lstrip())]
        trail = parts[index][len(parts[index].rstrip()):]
        parts[index] = lead + joined + trail
        done += 1
    return "".join(parts), done, missing, reshaped


def apply_transcripts(by_kind: dict[str, dict[str, str]], target: Path) -> str:
    known = by_kind.get(TRANSCRIPT_KIND, {})
    out = target / "transcripts"
    out.mkdir(parents=True, exist_ok=True)
    totals = [0, 0, 0]
    for path in sorted(TRANSCRIPTS.glob("*.txt")):
        text, *counts = translated_transcript(path.read_text("utf-8"), known)
        (out / f"{path.stem}.json").write_text(json.dumps({"text": text}, ensure_ascii=False, separators=(",", ":")), "utf-8")
        totals = [a + b for a, b in zip(totals, counts)]
    return f"{totals[0]} transcript blocks translated, {totals[1]} left in English, {totals[2]} kept English for their line count"


def apologetics_strings(by_kind: dict[str, dict[str, str]]) -> dict[str, str]:
    """{English: translation} for the debate and study documents in public/content/apologetics/*.json. The Apologetics
    pages show these words from code generated from the same documents (src/generated/apologetics.ts), so they are
    swapped on screen like the page text, through ui.json."""
    pairs: dict[str, str] = {}
    for spec in SOURCES:
        if not spec[1].startswith("public/content/apologetics/"):
            continue
        known = by_kind.get(spec[0], {})

        def visit(text: str) -> str | None:
            found = known.get(string_id(spec[0], text))
            if found:
                pairs[text] = found
            return found

        for path in sorted(SITE.glob(spec[1])):
            walk(json.loads(path.read_text("utf-8")), "", spec, visit)
    return pairs


_page_code_texts: list[set[str]] = []


def held_page_strings(repo: Path, translated: dict[str, str]) -> dict[str, str]:
    """{English: translation} for page-code text that an apologetics chunk holds and has translated. extract.py --pages
    leaves such text out (a chunk already holds it), and apologetics_strings finds only what the documents hold today,
    so a page literal the documents no longer hold would otherwise stay English (stage 5 job 13). `translated` is the
    apologetics kind's {id: translation}."""
    if not _page_code_texts:  # read once for all languages
        import extract  # here: apply.py has its own page_strings
        _page_code_texts.append(set(extract.page_strings()))
    page_code = _page_code_texts[0]
    pairs: dict[str, str] = {}
    for entry in json.loads((repo / "chunks.json").read_text("utf-8")):
        if entry["kind"] == "apologetics":
            english = json.loads((repo / "in" / f"{entry['chunk']}.json").read_text("utf-8"))["strings"]
            pairs.update({text: translated[key] for key, text in english.items() if key in translated and text in page_code})
    return pairs


def keep_english_notes(english: object, copy: object) -> None:
    """Puts a contact's English note beside its translation as "english": the Help for life page reads "press 1",
    "Office" and "text HOME" from it (src/pages/resources/life/format.ts), so its buttons stay right in every language."""
    if isinstance(english, dict) and isinstance(copy, dict):
        if "value" in english and isinstance(english.get("note"), str) and copy.get("note") != english["note"]:
            copy["english"] = english["note"]
        for key, value in english.items():
            if key in copy:
                keep_english_notes(value, copy[key])
    elif isinstance(english, list) and isinstance(copy, list):
        for item, copied in zip(english, copy):
            keep_english_notes(item, copied)


def apply(repo: Path, lang: str) -> None:
    by_kind = translations(repo, lang)
    target = SITE / "data" / "i18n" / lang
    files = swapped = kept = 0
    # Each spec with the folder its files' copies are placed relative to: data/x -> i18n/<lang>/x,
    # src/data/resources/x -> i18n/<lang>/resources/x.
    specs = [(spec, SITE / "data") for spec in SOURCES if spec[1].startswith("data/")]
    specs += [(spec, SITE / "src" / "data") for spec in RESOURCES]
    for spec, home in specs:
        kind, pattern = spec[0], spec[1]
        known = by_kind.get(kind, {})

        def visit(text: str) -> str | None:
            nonlocal swapped, kept
            found = known.get(string_id(kind, text))
            swapped, kept = swapped + bool(found), kept + (not found)
            return found

        for path in sorted(SITE.glob(pattern)):
            text = path.read_text("utf-8")
            copy = walk(json.loads(text), "", spec, visit)
            if spec in RESOURCES:
                keep_english_notes(json.loads(text), copy)
            out = target / path.relative_to(home)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(copy, ensure_ascii=False, separators=(",", ":")), "utf-8")
            files += 1
    ui = page_strings(repo, lang, by_kind.get(PAGE_KIND, {}), by_kind.get(PLURAL_KIND, {}))
    ui.update({text: found for text, found in apologetics_strings(by_kind).items() if text not in ui})
    ui.update({text: found for text, found in held_page_strings(repo, by_kind.get("apologetics", {})).items()
               if text not in ui})
    add_site_data(ui, repo, by_kind)
    target.mkdir(parents=True, exist_ok=True)
    # Whole or not at all: the phrase-list split (split_phrase_lists) and the preview read it while this runs.
    temporary = target / "ui.json.apply-tmp"
    temporary.write_text(json.dumps(ui, ensure_ascii=False, separators=(",", ":")), "utf-8")
    os.replace(temporary, target / "ui.json")
    lists = phrase_lists(repo, by_kind)
    for name, phrases in lists.items():
        (target / name).write_text(json.dumps(phrases, ensure_ascii=False, separators=(",", ":")), "utf-8")
    counts = ", ".join(f"{name} {len(phrases)}" for name, phrases in lists.items())
    transcripts = apply_transcripts(by_kind, target)
    print(f"{lang}: {files} files, {swapped} strings translated, {kept} left in English; {len(ui)} page strings; {counts}; {transcripts}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", type=Path, default=DEFAULT_OUT, help="the site-translation repository folder")
    parser.add_argument("languages", nargs="*", help="language folders (default: every translated language in "
                        "src/lib/site-languages.json)")
    args = parser.parse_args()
    for lang in args.languages or site_languages.folders():
        refused = refusal(args.repo, lang)
        if refused:
            raise SystemExit(f"apply.py {lang}: {refused}; nothing written")
    for lang in args.languages or site_languages.folders():
        apply(args.repo, lang)
    split_phrase_lists()


def split_phrase_lists() -> None:
    """Every language's ui.json split again by the built code (scripts/phrase-lists.mjs; all languages at once, since
    their parts must match). A failure only warns: the site reads the whole ui.json when the parts do not fit its code."""
    try:
        done = subprocess.run(["node", "scripts/phrase-lists.mjs"], cwd=SITE, capture_output=True, text=True,
                              encoding="utf-8", timeout=600)
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"Phrase lists not split ({error}); the site reads each whole ui.json until the next build")
        return
    if done.returncode != 0:
        print(f"Phrase lists not split (exit {done.returncode}: {(done.stderr or done.stdout).strip()[-400:]}); "
              "the site reads each whole ui.json until the next build")
    else:
        print(done.stdout.strip()[:300])


def refusal(repo: Path, lang: str) -> str | None:
    """Why a folder must not be written: unknown, a made-up test language, or nothing translated into it yet. Writing
    one from nothing would put an all-English copy (or, for a made-up language, wipe the generated one) on the site."""
    try:
        language = site_languages.by_folder(lang)
    except ValueError as error:
        return str(error)
    if language.pseudo:
        return "a made-up test language, generated by its own script, never applied from chunks"
    if not (repo / "out" / lang).is_dir():
        return f"no translations yet ({repo / 'out' / lang} does not exist)"
    return None


if __name__ == "__main__":
    main()
