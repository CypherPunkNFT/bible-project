"""The build check's language nets (translation system, stage 4 job 9; SiteTranslation/system/HANDOFF.md).

english_build_check.py stops the build on unregistered English (job 8). These nets stop it, against the same
english-baseline.json, on five more things a translation cannot fix by itself:
  pieced  a sentence built from pieces: text beside {values} in JSX, or "text " + value + " text"
  plural  a hand-written singular/plural choice (n === 1 ? "book" : "books"), or a call to a page's own plural helper
  format  a number or date format fixed to one language ("en-US") or left to the browser (no language given)
  title   a tab title or description written in the code from a text the collector never registers (the page
          translator swaps the head like the body, by the same phrase list, so only an unregistered word stays English)
  data    data the site reads that TRANSLATED_DATA (src/lib/language.ts) does not list, or that it lists with no
          translated copy in a released language
The first four are read from each page file's syntax tree by language_nets.mjs (the site's own TypeScript); the data
net reads TRANSLATED_DATA from the tree and the folders on disk (data/ is not in git, so it judges the disk as it is).
Keys write names and properties as {n}, so renaming a variable or reformatting a line does not make a finding new.
"""
import json
import os
import re
import shutil
import subprocess
from collections import Counter
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import site_languages
from english_baseline import NETS, Refused, read_json

NODE_SCRIPT = Path(__file__).resolve().with_name("language_nets.mjs")
PAGE_HEAD = "src/lib/page-head.ts"
LANGUAGE_FILE = "src/lib/language.ts"
FORMAT_MODULE = "src/lib/site-format.ts"  # the site's own number, date, sort and plural helpers: the nets leave it alone
STUDY_LOADER = "src/lib/study.ts"  # its loaders put "study/" in front of the paths they are given
AT_RELEASE = {"study/people-packs/"}  # listed in TRANSLATED_DATA but made only by the release (release-translations.ts)
TIMEOUT_SECONDS = 120
FOLDER_NAME = re.compile(r"^[a-z0-9-]+$")
BEFORE = "before:"

WHY = {
    "pieced": "the translator gets each piece alone and cannot reorder them for the language (\"2 of 9\" read \"9 out "
              "of 2\" in Hindi), and the collector never registers the whole line",
    "plural": "the translator cannot choose plural forms: Arabic has six, Chinese none",
    "format": "it writes numbers or dates, or sorts, in one fixed language, or in the browser's language, not the site's",
    "title": "the page translator swaps a tab title or description by the phrase lists, and this one is written from "
             "words the collector never registers, so they stay English in every language",
    "data": "the site shows this data in English in every language",
}
HOW = {
    "pieced": "write the whole sentence as one template string with its values inside, e.g. {`${done} of ${total} "
              "debates`}; then `python content/translation/extract.py --pages` collects it",
    "plural": "use plural(n, \"{n} book\", \"{n} books\") from src/lib/site-format.ts, with both forms written out as "
              "texts (each language's forms are translated for it); a choice between two different sentences can be "
              "plural(n, \"The book\", \"{n} books\")",
    "format": "use the helpers in src/lib/site-format.ts: formatNumber(n), formatDate(d), formatDateTime(d), "
              "formatList(items), compareText(a, b) for names a reader sees, compareCode(a, b) for ids and keys, "
              "countryName(code)",
    "title": "set no title of your own (usePageHead names the page from its main heading, which is translated), or "
             "write it as one text or one template string, `${name} · Hymns · Bible Guide`, whose words the collector "
             "registers; a word it skips (one word beside a value) goes in content/translation/page-register.json "
             "with its file",
    "data": "translate it (apply.py writes data/i18n/<folder>/) and list its folder in TRANSLATED_DATA in "
            "src/lib/language.ts; or narrow a TRANSLATED_DATA entry that claims a folder with no copy",
}


@dataclass(frozen=True)
class Finding:
    net: str
    file: str
    line: int
    key: str


def run_node(files: dict[str, str]) -> dict:
    """language_nets.mjs's reading of the files; any failure to read them all is an error, never "nothing found"."""
    node = shutil.which("node")
    if not node:
        raise RuntimeError("node was not found on PATH; the language nets need it (the build itself runs on Node)")
    request = json.dumps({"files": files, "pageHead": PAGE_HEAD, "languageFile": LANGUAGE_FILE, "formatModule": FORMAT_MODULE}, ensure_ascii=False)
    try:
        result = subprocess.run([node, str(NODE_SCRIPT)], input=request.encode("utf-8"), capture_output=True,
                                timeout=TIMEOUT_SECONDS, check=False)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f"{NODE_SCRIPT.name} did not finish within {TIMEOUT_SECONDS} s") from error
    if result.returncode:
        raise RuntimeError(f"{NODE_SCRIPT.name} failed (exit {result.returncode}): "
                           f"{result.stderr.decode('utf-8', 'replace')[-1500:]}")
    try:
        output = json.loads(result.stdout.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise RuntimeError(f"{NODE_SCRIPT.name} gave output that is not JSON ({error})") from error
    if sorted(output.get("processed", [])) != sorted(files):
        raise RuntimeError(f"{NODE_SCRIPT.name} read {len(output.get('processed', []))} of the {len(files)} files sent")
    return output


def unreadable(output: dict, uncommitted: set[str]) -> set[str]:
    """Files the parser could not read whole. Another chat's half-saved file is left out with a note; a committed file
    that does not parse stops the check (its findings would silently vanish)."""
    skipped = set()
    for name, problems in output["errors"].items():
        if name.startswith(BEFORE) or name in uncommitted:
            print(f"note: {name.removeprefix(BEFORE)} does not parse ({problems[0]}); left out of the language nets")
            skipped.add(name)
        else:
            raise RuntimeError(f"{name} does not parse ({'; '.join(problems)}); expected committed page code to parse")
    return skipped


def translated_data(output: dict, name: str, required: bool) -> tuple[int, list[str]]:
    """TRANSLATED_DATA's line and prefixes as `name` (a version of src/lib/language.ts) holds them."""
    found = output["translatedData"].get(name)
    if not found:
        if required:
            raise Refused(f"{LANGUAGE_FILE}: expected `const TRANSLATED_DATA = [...]`, the data folders with a "
                          f"translated copy; found none")
        return 0, []
    if "error" in found:
        raise Refused(f"{LANGUAGE_FILE}:{found['line']}: TRANSLATED_DATA {found['error']}; expected a list of texts")
    for prefix in found["prefixes"]:
        if not prefix or ".." in prefix or prefix.startswith("/") or "\\" in prefix:
            raise Refused(f"{LANGUAGE_FILE}:{found['line']}: TRANSLATED_DATA entry {prefix!r} is not a path under "
                          f"data/; expected e.g. \"topics/\" or \"questions/bank.json\"")
    return found["line"], found["prefixes"]


def data_path(root: Path, file: str, text: str) -> str | None:
    """The data/ path a text names (a folder ends in /), or None when it names nothing under data/."""
    path = text.removeprefix("/data/")
    if ".." in path or "\\" in path or path.startswith(("/", ".", "i18n/")):
        return None
    for candidate in [path] + (["study/" + path] if file == STUDY_LOADER else []):
        segments = candidate.split("/")
        head = "/".join(segments[:2]) if segments[0] == "study" else segments[0]
        if head and (root / "data" / head.rstrip("/")).exists():
            return candidate + "/" if not candidate.endswith("/") and (root / "data" / candidate).is_dir() else candidate
    return None


def read_in_english(root: Path, paths: list[Finding], prefixes: list[str]) -> list[Finding]:
    found = []
    for mention in paths:
        path = data_path(root, mention.file, mention.key)
        if not path or path == "study/" or any(path.startswith(prefix) for prefix in prefixes):
            continue
        if any(prefix.startswith(path) for prefix in prefixes):
            continue  # a folder some entry lists only in part: the code adds the rest at run time, unseen here
        found.append(Finding("data", mention.file, mention.line, f"read in English: {path}"))
    return found


def released_folders(root: Path) -> list[str]:
    folders = [language.folder for language in site_languages.translated() if language.released]
    bad = [folder for folder in folders if not FOLDER_NAME.match(folder)]
    if bad:
        raise Refused(f"language folders {bad} are not plain names; expected lowercase letters, digits and dashes")
    present = [folder for folder in folders if (root / "data" / "i18n" / folder).is_dir()]
    if not (root / "data").is_dir() or not present:
        raise Refused(f"no translated data under {root / 'data' / 'i18n'} for {', '.join(folders)}; without it every "
                      f"listed folder would look untranslated")
    for folder in sorted(set(folders) - set(present)):
        print(f"note: {root / 'data' / 'i18n' / folder} is missing; that language's data copies are not checked")
    return present


def has_file(folder: Path) -> bool:
    return folder.is_dir() and any(entry.is_file() for entry in os.scandir(folder))


def without_copy(root: Path, line: int, prefixes: list[str], folders: list[str]) -> list[Finding]:
    """A listed folder holding English files with no translated file at all in some released language: each request
    fails before the English is shown. (A single new file without its copy is not judged: it shows in English.)"""
    data, found = root / "data", []
    for prefix in prefixes:
        english = data / prefix
        if prefix in AT_RELEASE:
            continue
        if not (english.is_dir() if prefix.endswith("/") else english.is_file()):
            found.append(Finding("data", LANGUAGE_FILE, line, f"listed with no English copy: {prefix}"))
            continue
        places = [Path(path).relative_to(data).as_posix() + "/" for path, _, files in os.walk(english) if files] \
            if prefix.endswith("/") else [prefix]
        for place in places:
            target = data / "i18n"
            if any(not (has_file(target / folder / place) if place.endswith("/") else (target / folder / place).is_file())
                   for folder in folders):
                found.append(Finding("data", LANGUAGE_FILE, line, f"listed with no translated copy: {place}"))
    return found


def net_rulings(path: Path, root: Path) -> tuple[set[tuple[str, str, str]], dict[str, set[str]]]:
    """Rulings for the language nets in unregistered-reviewed.json: {"check": <net>, "file": <path>, "item": <key>,
    "why"} for one finding, or {"check": "<net>-files", "item": <file or folder/>, "why"} for every finding of one net in
    a file that shows nothing to a reader. A file ruling may not cover page-head.ts for titles."""
    keys, files = set(), {net: set() for net in NETS}
    for index, entry in enumerate(read_json(path) if path.exists() else []):
        check = entry.get("check", "")
        if check in NETS:
            if not isinstance(entry.get("file"), str) or not (root / entry["file"]).is_file():
                raise Refused(f"{path} entry {index}: a {check} ruling must name the existing file it applies to "
                              f"(\"file\"), so it cannot excuse the same code everywhere; got {entry!r}")
            keys.add((check, entry["file"], entry["item"]))
        elif check.removesuffix("-files") in NETS and check.endswith("-files"):
            net, item = check.removesuffix("-files"), entry["item"]
            if (net == "title" and PAGE_HEAD.startswith(item)) or item.strip("/") in ("", "src") or not (
                    (root / item).is_file() or (item.endswith("/") and (root / item).is_dir())):
                raise Refused(f"{path} entry {index}: a {check} ruling must name one existing file or folder (ending "
                              f"in /), not all of src/ and not {PAGE_HEAD} for titles; got {item!r}")
            files[net].add(item)
    return keys, files


WORDS = re.compile(r"[^\W\d_]{2,}")
SITE_NAME = "Bible Guide"


def title_registered(texts: list[str], registered: Callable[[str], bool]) -> bool:
    """Whether the page translator can put a title into each language: every text it is written from is registered
    whole, or piece by piece between " · " (a piece that is only a value, or the site's name, needs nothing)."""
    def piece_known(piece: str) -> bool:
        piece = piece.strip(" ·")
        return piece == SITE_NAME or not WORDS.search(piece.replace("{n}", "")) or registered(piece)
    return all(registered(text.strip(" ·")) or all(piece_known(piece) for piece in re.split(r"\s+·\s+|^\s*·\s+", text))
               for text in texts)


def judged(root: Path, output: dict, names: set[str], before: bool, rulings,
           registered: Callable[[str], bool] | None = None) -> list[Finding]:
    """One version of the tree: `names` are the files read (with or without the before: mark). With `registered` (the
    build check's own test of a text), a title written only from registered texts is no finding."""
    keys, files = rulings
    found, paths = [], []
    for item in output["findings"]:
        if item["file"] not in names:
            continue
        if item["net"] == "title" and registered and title_registered(item.get("texts", []), registered):
            continue
        finding = Finding(item["net"], item["file"].removeprefix(BEFORE), item["line"], item["key"])
        (paths if finding.net == "datapath" else found).append(finding)
    language = (BEFORE if before and BEFORE + LANGUAGE_FILE in output["translatedData"] else "") + LANGUAGE_FILE
    line, prefixes = translated_data(output, language, required=not before)
    found += read_in_english(root, paths, prefixes)
    found += without_copy(root, line, prefixes, released_folders(root)) if prefixes else []
    return [finding for finding in found if (finding.net, finding.file, finding.key) not in keys
            and not any(finding.file.startswith(prefix) for prefix in files[finding.net])]


def judge(root: Path, after: dict[str, str], uncommitted: set[str], rulings, before: dict[str, str] | None = None,
          changed: set[str] = frozenset(), registered: Callable[[str], bool] | None = None
          ) -> tuple[list[Finding], list[Finding]]:
    """The findings in the tree as it is, and, when files `changed`, in the tree as it was: `before` holds the older
    version of each changed file that existed then. With nothing changed there is no second list. `registered` tells
    a registered text (english_build_check.Site.registered); without it every title written in code is a finding."""
    if PAGE_HEAD not in after:
        raise Refused(f"{PAGE_HEAD} is missing; the tab-title net reads it (it names every page)")
    before = before or {}
    output = run_node({**after, **{BEFORE + name: text for name, text in before.items()}})
    skipped = unreadable(output, uncommitted)
    now = judged(root, output, set(after) - skipped, False, rulings, registered)
    if not changed:
        return now, []
    earlier = {BEFORE + name for name in before} | (set(after) - set(changed))
    return now, judged(root, output, earlier - skipped, True, rulings, registered)


def counted(findings: list[Finding]) -> dict[str, Counter]:
    """Per net, how many times each key is found; data counts each key once however many pages read it."""
    counts = {net: Counter() for net in NETS}
    for finding in findings:
        counts[finding.net][finding.key] = 1 if finding.net == "data" else counts[finding.net][finding.key] + 1
    return counts


def report(new: dict[str, Counter], places: list[Finding], allowed: dict[str, dict], uncommitted: set[str],
           recent: set[str]) -> None:
    """One section per net: each new key, its places (recently changed files first), why, how to fix, the ruling."""
    for net in NETS:
        if not new[net]:
            continue
        print(f"\nNEW {net.upper()} FINDINGS ({len(new[net])}): {WHY[net]}.\n")
        for key in sorted(new[net]):
            where = sorted({(f.file, f.line) for f in places if f.net == net and f.key == key},
                           key=lambda place: (place[0] not in recent and place[0] not in uncommitted, place))
            known = f" (the baseline allows {allowed[net][key]} of these)" if allowed[net].get(key) else ""
            print(f"  {key}{known}")
            for file, line in where[:8]:
                note = "  [not committed: may be another chat's work in progress]" if file in uncommitted else ""
                print(f"    {file}:{line}{note}")
            if len(where) > 8:
                print(f"    ... and {len(where) - 8} more places")
        print(f"\n  To fix: {HOW[net]}.\n  If it is right as it is (never shown to a reader, or English on purpose), "
              f"record a ruling in content/translation/unregistered-reviewed.json:\n"
              f'    {{"check": "{net}", "file": "<the file>", "item": "<the finding as printed>", "why": "<the reason>"}}')
