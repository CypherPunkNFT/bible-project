"""The site's languages for the Python tools, read from src/lib/site-languages.json, the one definition of each language.

Every translation and audit tool takes its languages from here instead of keeping its own list (translation system,
stage 3; SiteTranslation/system/HANDOFF.md). The file is checked as strictly as the site checks it
(src/lib/site-languages-check.ts): a value here reaches a file path, a command or a regular expression, so a broken
file stops the tool with the field, what was expected and what was found, and no tool ever runs on a wrong list.

    import site_languages
    site_languages.folders()          # each translated language's folder, in menu order: ['es', 'pt', 'zh', ...]
    site_languages.by_folder("pt")    # its entry: code 'pt-BR', bible 'bpm', script 'Latn', english_name, ...

Made-up test languages (pseudo) are left out unless asked for: a script generates them, so nothing may translate,
apply or count them as if they were real.
"""
import functools
import json
import re
import time
from dataclasses import dataclass
from pathlib import Path

FILE = Path(__file__).resolve().parents[2] / "src" / "lib" / "site-languages.json"
FIELDS = ("code", "folder", "bible", "name", "englishName", "dir", "script", "plurals", "digits", "font", "released",
          "pseudo")
PLURAL_CATEGORIES = ("zero", "one", "two", "few", "many", "other")
SOURCE_CODE = "en"
CODE = re.compile(r"[a-z]{2,3}(-[A-Za-z0-9]{2,8})*")
FOLDER = re.compile(r"[a-z][a-z0-9-]{1,15}")
BIBLE = re.compile(r"[a-z0-9][a-z0-9-]{0,31}")
SCRIPT = re.compile(r"[A-Z][a-z]{3}")
DIGITS = re.compile(r"[a-z]{3,8}")
FONT_FORBIDDEN = re.compile(r"[;{}<>\\]")


@dataclass(frozen=True)
class Language:
    code: str
    folder: str | None
    bible: str | None
    name: str
    english_name: str
    dir: str
    script: str
    plurals: tuple[str, ...]
    digits: str
    font: str | None
    released: bool
    pseudo: bool


def _matches(pattern: re.Pattern, value) -> bool:
    return isinstance(value, str) and pattern.fullmatch(value) is not None


# The characters JavaScript's String.trim() removes, so a name blank to the site's checker is blank here too (Python's
# own strip() also removes \x1c-\x1f and \x85, which trim() keeps, and keeps \ufeff, which trim() removes).
JS_SPACE = "\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"


def _text(value) -> bool:
    return isinstance(value, str) and value.strip(JS_SPACE) != ""


def entry_problems(entry, index: int) -> list[str]:
    """What is wrong with one entry, each line saying the field, what was expected and what was found."""
    if not isinstance(entry, dict):
        return [f"languages[{index}]: expected an object, got {entry!r}"]
    label, problems = f"languages[{index}] ({entry.get('code')!r})", []

    def expect(ok: bool, field: str, wanted: str) -> None:
        if not ok:
            problems.append(f"{label}.{field}: expected {wanted}, got {entry.get(field)!r}")
    problems += [f"{label}: unknown field {key!r} (known: {', '.join(FIELDS)})" for key in entry if key not in FIELDS]
    problems += [f"{label}: missing field {key!r}" for key in FIELDS if key not in entry]
    plurals = entry.get("plurals")
    expect(_matches(CODE, entry.get("code")), "code", "a web standard tag such as 'pt-BR'")
    expect(entry.get("folder") is None or _matches(FOLDER, entry.get("folder")), "folder", "null or lowercase letters, digits and hyphens")
    expect(entry.get("bible") is None or _matches(BIBLE, entry.get("bible")), "bible", "null or a Bible id such as 'rvr'")
    expect(_text(entry.get("name")), "name", "the menu's name")
    expect(_text(entry.get("englishName")), "englishName", "the name in English")
    expect(entry.get("dir") in ("ltr", "rtl"), "dir", "'ltr' or 'rtl'")
    expect(_matches(SCRIPT, entry.get("script")), "script", "an ISO 15924 code such as 'Latn'")
    expect(isinstance(plurals, list) and all(isinstance(category, str) for category in plurals)
           and "other" in plurals and len(set(plurals)) == len(plurals)
           and all(category in PLURAL_CATEGORIES for category in plurals), "plurals",
           f"distinct categories from {'/'.join(PLURAL_CATEGORIES)}, including 'other'")
    expect(_matches(DIGITS, entry.get("digits")), "digits", "a numbering system such as 'latn'")
    expect(entry.get("font") is None or (_text(entry.get("font")) and not FONT_FORBIDDEN.search(entry["font"])), "font",
           "null or a font stack with no ; { } < > or backslash")
    expect(type(entry.get("released")) is bool, "released", "true or false (not a string)")
    expect(type(entry.get("pseudo")) is bool, "pseudo", "true or false (not a string)")
    if entry.get("pseudo") is True and entry.get("released") is True:
        problems.append(f"{label}: a made-up test language (pseudo) can never be released")
    if "folder" in entry and entry.get("folder") is None and entry.get("bible") is None:
        problems.append(f"{label}.bible: the source language (folder null) needs a Bible; got null")
    return problems


def problems_in(data) -> list[str]:
    """Every problem in a parsed site-languages.json, as site-languages-check.ts finds them; empty means sound."""
    if not isinstance(data, dict) or not isinstance(data.get("languages"), list):
        return [f"expected an object with a 'languages' list, got {str(data)[:80]!r}"]
    problems = [f"unknown top-level field {key!r} (known: about, languages)" for key in data if key not in ("about", "languages")]
    entries = data["languages"]
    for index, entry in enumerate(entries):
        problems += entry_problems(entry, index)
    objects = [entry for entry in entries if isinstance(entry, dict)]
    for field in ("code", "folder"):
        seen: set[str] = set()
        for value in (entry.get(field) for entry in objects):
            if isinstance(value, str) and value.lower() in seen:
                problems.append(f"languages: {field} {value!r} appears more than once (compared ignoring case)")
            if isinstance(value, str):
                seen.add(value.lower())
    sources = [entry for entry in objects if "folder" in entry and entry["folder"] is None]
    if len(sources) != 1:
        problems.append(f"languages: expected exactly one source language (folder null), got {len(sources)}")
    elif sources[0].get("code") != SOURCE_CODE or sources[0].get("released") is not True:
        problems.append(f"languages: the source language (folder null) must be {SOURCE_CODE!r} and released; got "
                        f"{sources[0].get('code')!r}, released {sources[0].get('released')!r}")
    return problems


def read(path: Path = FILE) -> tuple[Language, ...]:
    """Reads and checks the file at path. Another chat may be saving it, so a half-written file is read again twice."""
    for attempt in range(3):
        try:
            data = json.loads(Path(path).read_text(encoding="utf-8"))
            break
        except json.JSONDecodeError as error:
            if attempt == 2:
                raise ValueError(f"{path}: not valid JSON ({error}); expected the site's language list") from error
            time.sleep(0.5)
    problems = problems_in(data)
    if problems:
        raise ValueError(f"{path} is not sound, so no tool may use it:\n  " + "\n  ".join(problems))
    return tuple(Language(entry["code"], entry["folder"], entry["bible"], entry["name"], entry["englishName"],
                          entry["dir"], entry["script"], tuple(entry["plurals"]), entry["digits"], entry["font"],
                          entry["released"], entry["pseudo"]) for entry in data["languages"])


@functools.lru_cache(maxsize=None)
def languages() -> tuple[Language, ...]:
    """Every site language, the source (English) first, in menu order; read once per run."""
    return read(FILE)


def source() -> Language:
    return next(language for language in languages() if language.folder is None)


def translated(pseudo: bool = False) -> list[Language]:
    """Every language with a translated copy, in menu order; made-up test languages only when asked."""
    return [language for language in languages() if language.folder and (pseudo or not language.pseudo)]


def folders(pseudo: bool = False) -> list[str]:
    return [language.folder for language in translated(pseudo)]


def by_folder(folder: str) -> Language:
    for language in translated(pseudo=True):
        if language.folder == folder:
            return language
    raise ValueError(f"{folder!r} is not a language folder in {FILE.name}; expected one of {', '.join(folders(True))}")


def by_code(code: str) -> Language:
    for language in languages():
        if language.code.lower() == code.lower():
            return language
    raise ValueError(f"{code!r} is not a language code in {FILE.name}; expected one of "
                     f"{', '.join(language.code for language in languages())}")
