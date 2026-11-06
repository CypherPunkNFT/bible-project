"""english-baseline.json for the build check (english_build_check.py): its shape, the rule that it may only shrink, and
the rulings file it honours. No site reading here, so each rule can be tested on its own.

The file: {"about": [...], "widenings": [{"date", "reason", "added"}], "code": {text: times it occurs},
"reading": [text, ...], and one {key: count} per language net (NETS)}. "code" is what the check's own net found when
the baseline was written; "reading" is English the browser reading of the made-up languages traced to page code (stage
3, job 6) that this net does not see, kept so a wider net later does not block on it. The language nets (stage 4, job
9; build_nets.py) are sentences built from pieces, hand-written plurals, fixed or browser-default formats, tab titles
and descriptions, and data the site reads untranslated. A widening names its "section"; one without counts for "code"
and "reading".
"""
import json
import subprocess
import time
from collections import Counter
from pathlib import Path

ABOUT = [
    ("Unregistered on-screen English already in the page code when the build check began (translation system, stage 4; "
     "SiteTranslation/system/HANDOFF.md). The build check (english_build_check.py) fails only on text beyond this."),
    ("code: text -> how many times the check's net finds it. reading: English the stage 3 browser reading traced to "
     "page code that the net does not see."),
    ("It may only shrink: run `python content/translation/english_build_check.py --shrink` after registering text. "
     "Growth is refused unless a new entry in widenings records the reason and the exact number added."),
]


NETS = ("pieced", "plural", "format", "title", "data")
COUNTED = ("code",) + NETS


class Refused(RuntimeError):
    """A file the check reads is not as expected; nothing is judged until it is put right."""


class NotARepository(RuntimeError):
    """The tree has no git history, so the baseline's history cannot be checked."""


def read_json(path: Path):
    """The file's JSON; read twice, a second apart, before giving up, since another chat may be writing it."""
    for attempt in (1, 2):
        try:
            return json.loads(path.read_text("utf-8"))
        except json.JSONDecodeError as error:
            if attempt == 2:
                raise Refused(f"{path} is not valid JSON: {error}") from error
            time.sleep(1)


def git(root: Path, *args: str) -> str:
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True, encoding="utf-8", check=False)
    if result.returncode:
        if "not a git repository" in result.stderr:
            raise NotARepository(f"{root} is not a git repository")
        raise RuntimeError(f"git {' '.join(args)} failed in {root}: {result.stderr.strip()}")
    return result.stdout


def rulings(path: Path, root: Path) -> tuple[set[str], set[str]]:
    """The texts and file prefixes ruled not to need registering (unregistered-reviewed.json, check "code" and
    "code-files"). Each ruling needs its reason ("why", as README.md writes it); a file ruling must name a file or folder (ending in /) that exists."""
    if not path.exists():
        return set(), set()
    entries = read_json(path)
    if not isinstance(entries, list):
        raise Refused(f"{path}: expected a list of rulings, got {type(entries).__name__}")
    texts, files = set(), set()
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict) or not all(isinstance(entry.get(key), str) and entry[key].strip()
                                                  for key in ("check", "item", "why")):
            raise Refused(f"{path} entry {index}: expected check, item and a non-empty why (the reason), got {entry!r}")
        if entry["check"] == "code" and "file" not in entry:
            if len(entry["item"].split()) < 3:
                raise Refused(f"{path} entry {index}: a code ruling for a one- or two-word text applies everywhere, so "
                              f"it must name its file (\"file\": \"src/...\"); got {entry!r}")
            texts.add(entry["item"])
        elif entry["check"] == "code-files":
            item = entry["item"]
            target = root / item
            if item.strip("/") in ("", "src") or not (target.is_file() or (item.endswith("/") and target.is_dir())):
                raise Refused(f"{path} entry {index}: a code-files ruling must name one existing file or folder "
                              f"(ending in /) under src/, not all of it; got {item!r}")
            files.add(item)
    return texts, files


SCOPED = ("code", "later")


def scoped_rulings(path: Path) -> dict[str, set[str]]:
    """file -> the texts ruled for that file only: a "code" ruling that names its file, and "later" (on-screen English
    handed to the job that owns it: {"check": "later", "file", "item", "job", "why"}). A file that is gone is no error
    (the ruling then does nothing)."""
    found: dict[str, set[str]] = {}
    if not path.exists():
        return found
    for index, entry in enumerate(read_json(path)):
        if entry.get("check") not in SCOPED or (entry["check"] == "code" and "file" not in entry):
            continue
        keys = ("file", "item", "why") + (("job",) if entry["check"] == "later" else ())
        if not all(isinstance(entry.get(key), str) and entry[key].strip() for key in keys):
            raise Refused(f"{path} entry {index}: expected {', '.join(keys)} (a later ruling names the job that owns "
                          f"the text), got {entry!r}")
        found.setdefault(entry["file"], set()).add(entry["item"])
    return found


def reading_rulings(path: Path) -> set[str]:
    """Texts any ruling names (code, later or reading: {"check": "reading", "item", "why"} for a browser-reading text that
    is in no page file as written, with what builds it). --shrink drops such a text from the baseline's reading."""
    return {entry["item"] for entry in (read_json(path) if path.exists() else [])
            if entry.get("check") in ("code", "later", "reading")}


def later_jobs(path: Path) -> Counter:
    """job -> how many texts the rulings hand to it ("later")."""
    return Counter(entry["job"] for entry in (read_json(path) if path.exists() else []) if entry.get("check") == "later")


def validated(data, where: str) -> dict:
    """The baseline, checked; a language-net section an older commit lacks reads as empty, and "present" names the
    sections the file itself holds."""
    def fail(what: str):
        raise Refused(f"{where}: expected {what}")
    required = {"about", "widenings", "code", "reading"}
    if not isinstance(data, dict) or not required <= set(data) <= required | set(NETS):
        fail(f"an object with about, widenings, code and reading, and optionally {', '.join(NETS)}; "
             f"got {sorted(data) if isinstance(data, dict) else data!r}")
    for section in COUNTED:
        if section in data and (not isinstance(data[section], dict) or not all(
                isinstance(text, str) and type(count) is int and count >= 1 for text, count in data[section].items())):
            fail(f"{section} to map each text to a count of 1 or more")
    if not isinstance(data["reading"], list) or not all(isinstance(text, str) for text in data["reading"]) \
            or len(set(data["reading"])) != len(data["reading"]):
        fail("reading to be a list of distinct texts")
    if not isinstance(data["widenings"], list) or not all(
            isinstance(item, dict) and isinstance(item.get("reason"), str) and item["reason"].strip()
            and type(item.get("added")) is int and item["added"] >= 1 and isinstance(item.get("date"), str)
            and item.get("section", "code") in COUNTED for item in data["widenings"]):
        fail('widenings to be a list of {"date", "reason", "added": a count of 1 or more, "section": optional, one of '
             + ", ".join(COUNTED) + "}")
    return {**{net: {} for net in NETS}, **data, "present": {net for net in NETS if net in data}}


def added(old: dict, new: dict, section: str) -> tuple[int, list[str]]:
    """How much more one section of new holds than old ("code" takes "reading" with it), and one line per text."""
    before, after = old.get(section, {}), new.get(section, {})
    grown = {text: count - before.get(text, 0) for text, count in after.items() if count > before.get(text, 0)}
    lines = [f'{section} "{text}": {before.get(text, 0)} -> {after[text]}' for text in grown]
    if section == "code":
        old_reading = set(old["reading"])
        reading = [text for text in new["reading"] if text not in old_reading]
        return sum(grown.values()) + len(reading), lines + [f'reading "{text}": added' for text in reading]
    return sum(grown.values()), lines


def growth(old: dict, new: dict, label: str) -> list[str]:
    """The growth from old to new that no new widening for the same section accounts for; empty if none."""
    found = []
    for section in COUNTED:
        count, lines = added(old, new, section)
        recorded = sum(item["added"] for item in new["widenings"]
                       if item not in old["widenings"] and item.get("section", "code") == section)
        if recorded != count:
            found += [f"{label}, {section}: {count} more than before, {recorded} recorded in widenings"] + lines[:20] + \
                ([f"... and {len(lines) - 20} more"] if len(lines) > 20 else [])
    return found


EMPTY = {"about": [], "widenings": [], "code": {}, "reading": [], **{net: {} for net in NETS}, "present": set()}


def committed(root: Path, relative: str, commit: str, where: str) -> dict:
    """The baseline as a commit holds it; one the commit deleted counts as empty."""
    result = subprocess.run(["git", "-C", str(root), "show", f"{commit}:./{relative}"], capture_output=True, check=False)
    if result.returncode:
        return EMPTY
    try:
        return validated(json.loads(result.stdout.decode("utf-8")), where)
    except json.JSONDecodeError as error:
        raise Refused(f"{where} is not valid JSON: {error}") from error


def load_checked(path: Path, root: Path, relative: str) -> tuple[dict, list[str]]:
    """The working baseline, and its growth: working against the last commit of it, that commit against the one before
    (first parents only, so a merge cannot reorder them). A tree with no git history is not checked for growth."""
    if not path.exists():
        raise Refused(f"{path} is missing; the check needs it (it is committed with the site)")
    working = validated(read_json(path), str(path))
    try:
        commits = git(root, "log", "--first-parent", "-n", "2", "--format=%H", "--", relative).split()
    except NotARepository as error:
        print(f"note: {error}; the baseline's growth is not checked")
        return working, []
    if not commits:
        return working, []
    last = committed(root, relative, commits[0], f"{relative} at {commits[0][:9]}")
    found = growth(last, working, f"working copy against {commits[0][:9]}")
    found += [f"working copy against {commits[0][:9]}: section {net} was dropped; it may only shrink, so empty it "
              f"instead" for net in sorted(last["present"] - working["present"])]
    if len(commits) == 2:
        before = committed(root, relative, commits[1], f"{relative} at {commits[1][:9]}")
        found += growth(before, last, f"commit {commits[0][:9]} against {commits[1][:9]}")
    return working, found


def shrunk(baseline: dict, found: Counter, registered) -> dict:
    """The baseline without what is gone: each code text down to how often it is found now, each reading text kept
    only while it is still unregistered. Never adds."""
    code = {text: min(count, found[text]) for text, count in baseline["code"].items() if found[text]}
    reading = [text for text in baseline["reading"] if not registered(text)]
    return {**baseline, "code": code, "reading": reading}


def shrunk_nets(baseline: dict, found: dict[str, Counter]) -> dict:
    """The language-net sections without what is gone, each key down to how often it is found now. Never adds."""
    return {**baseline, **{net: {key: min(count, found[net][key]) for key, count in baseline[net].items() if found[net][key]}
                           for net in NETS}}


def fresh(found: Counter, reading: list[str]) -> dict:
    return {"about": ABOUT, "widenings": [], "code": dict(found), "reading": reading, "present": set()}


def job6_texts(by_cause: dict, causes: tuple[str, ...]) -> list[str]:
    """The English of the browser reading's page-code causes, spaces squeezed, each once."""
    texts: dict[str, None] = {}
    for cause in causes:
        if cause not in by_cause:
            raise Refused(f"the browser reading's by-cause.json has no cause {cause!r}; expected {', '.join(causes)}")
        for piece in by_cause[cause]["pieces"]:
            if text := " ".join(str(piece.get("english", "")).split()):
                texts.setdefault(text)
    return list(texts)


def write(path: Path, baseline: dict) -> None:
    """Sorted, one text per line, so a change reads as a short diff."""
    data = {"about": baseline["about"] or ABOUT, "widenings": baseline["widenings"],
            "code": dict(sorted(baseline["code"].items())), "reading": sorted(baseline["reading"])}
    data.update({net: dict(sorted(baseline[net].items())) for net in NETS if net in baseline.get("present", set())})
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", "utf-8", newline="\n")
