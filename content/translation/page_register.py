"""Page text registered by hand (page-register.json): on-screen text in a page file that extract.py's page rules pass by,
checked by a person and named here with its file and the reason, so the collector takes it (stage 5 job 13).

The file: {"about": [...], "register": [{"file": "src/...", "why": "...", "texts": ["...", ...]}, ...]}. A text is
collected from its file only, and only while the file still shows exactly that text: one of its string literals (each
${...} written {n}, as extract.py writes a template), a JSX text, or a " · " piece of either. A file that is gone, or a text no longer in it, is
stale: it does nothing, so a rename by another chat breaks no tool; stale() lists them for the tests and the build check.
extract.page_strings calls texts_for() for each page file it reads, so the collector (--pages), the net (unregistered.py,
english_build_check.py) and the catalog's file-by-file reading all see the same registrations.
"""
import json
import re
from pathlib import Path

from page_rules import JSX_EDGE, JSX_TEXT, TEMPLATE_VALUE, string_literals, without_comments

REGISTER = "content/translation/page-register.json"
HERE = Path(__file__).resolve().parent
MOST_VALUES = 3  # the page translator learns lines with at most three values (MOST_SLOTS in src/lib/page-translator.ts)
ENTITY = re.compile(r"&#?\w+;")

_loaded: dict[tuple, dict[str, list[str]]] = {}
_shown: dict[tuple, set[str]] = {}


class Refused(RuntimeError):
    """page-register.json is not as expected; what failed, what was expected and what was found."""


def register_path(site: Path) -> Path:
    """The tree's own file, else this folder's (a release tree read with the main folder's rules, as the build check does)."""
    own = site / REGISTER
    return own if own.exists() else HERE / "page-register.json"


def _validated(data, path: Path) -> dict[str, list[str]]:
    def fail(where: str, expected: str, got) -> None:
        raise Refused(f"{path} {where}: expected {expected}, got {got!r}")

    if not isinstance(data, dict) or not isinstance(data.get("register"), list):
        fail("", 'an object with a "register" list', type(data).__name__ if not isinstance(data, dict) else sorted(data))
    found: dict[str, list[str]] = {}
    for index, group in enumerate(data["register"]):
        where = f"register[{index}]"
        if not isinstance(group, dict) or set(group) != {"file", "why", "texts"}:
            fail(where, "exactly file, why and texts", group)
        file, why, texts = group["file"], group["why"], group["texts"]
        if not isinstance(file, str) or not file.startswith("src/") or ".." in file.split("/") or "\\" in file:
            fail(f"{where}.file", "one page file under src/ (posix, no ..)", file)
        if not isinstance(why, str) or not why.strip():
            fail(f"{where}.why", "the reason the texts are screen text", why)
        if not isinstance(texts, list) or not texts:
            fail(f"{where}.texts", "a list of one or more texts", texts)
        for text in texts:
            if not isinstance(text, str) or not text.strip() or text != " ".join(text.split()):
                fail(f"{where}.texts", "texts with single spaces and no space at either end", text)
            if "\\" in text or ENTITY.search(text):
                fail(f"{where}.texts", "text as the screen shows it (no \\ escape or &...; entity)", text)
            if text.count("{n}") > MOST_VALUES:
                fail(f"{where}.texts", f"at most {MOST_VALUES} values ({{n}}): split the sentence", text)
        found.setdefault(file, []).extend(texts)
    return found


def registrations(site: Path) -> dict[str, list[str]]:
    """file -> its registered texts; read once per version of the file."""
    path = register_path(site)
    if not path.exists():
        return {}
    stat = path.stat()
    key = (str(path), stat.st_mtime_ns, stat.st_size)
    if key not in _loaded:
        try:
            data = json.loads(path.read_text("utf-8"))
        except json.JSONDecodeError as error:
            raise Refused(f"{path} is not valid JSON: {error}") from error
        _loaded.clear()
        _loaded[key] = _validated(data, path)
    return _loaded[key]


def shown_texts(original: str) -> set[str]:
    """Every text a page file can show as written: its string literals (comment-free; a template's ${...} as {n}) and its
    JSX texts, between tags or beside a {value} (read on the raw file, so text after a // inside a regex survives)."""
    found = set()
    for _, _, quote, body in string_literals(without_comments(original)):
        if quote == "`":
            body = TEMPLATE_VALUE.sub("{n}", body)
        found.add(" ".join(body.split()))
    for pattern in (JSX_TEXT, JSX_EDGE):
        found.update(" ".join(match.group(1).split()) for match in pattern.finditer(original))
    # a title the page shows in parts ("Orthodox perspective · The Orthodox Faith"): the build check, too, takes each
    # " · " piece of a text as registered on its own (english_build_check.Site.registered)
    found.update(piece.strip() for text in list(found) if " · " in text for piece in text.split(" · "))
    found.discard("")
    return found


def _shown_in(path: Path) -> set[str]:
    stat = path.stat()
    key = (str(path), stat.st_mtime_ns, stat.st_size)
    if key not in _shown:
        _shown[key] = shown_texts(path.read_text("utf-8"))
    return _shown[key]


def texts_for(site: Path, path: Path) -> list[str]:
    """The registered texts one page file shows now, in the file's order of registration."""
    try:
        relative = path.resolve().relative_to(site.resolve()).as_posix()
    except ValueError:
        return []
    wanted = registrations(site).get(relative)
    if not wanted or not path.is_file():
        return []
    shown = _shown_in(path)
    return [text for text in dict.fromkeys(wanted) if text in shown]


def stale(site: Path) -> list[str]:
    """Registrations that do nothing: the file is gone, or no longer shows the text ("file: text")."""
    found = []
    for relative, texts in registrations(site).items():
        path = site / relative
        shown = _shown_in(path) if path.is_file() else set()
        found += [f"{relative}: {text}" for text in dict.fromkeys(texts) if text not in shown]
    return found
