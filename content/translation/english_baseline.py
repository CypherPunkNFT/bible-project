"""english-baseline.json for the build check (english_build_check.py): its shape, the rule that it may only shrink, and
the rulings file it honours. No site reading here, so each rule can be tested on its own.

The file: {"about": [...], "widenings": [{"date", "reason", "added"}], "code": {text: times it occurs},
"reading": [text, ...]}. "code" is what the check's own net found when the baseline was written; "reading" is English
the browser reading of the made-up languages traced to page code (stage 3, job 6) that this net does not see, kept so
a wider net later does not block on it.
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
        if entry["check"] == "code":
            texts.add(entry["item"])
        elif entry["check"] == "code-files":
            item = entry["item"]
            target = root / item
            if item.strip("/") in ("", "src") or not (target.is_file() or (item.endswith("/") and target.is_dir())):
                raise Refused(f"{path} entry {index}: a code-files ruling must name one existing file or folder "
                              f"(ending in /) under src/, not all of it; got {item!r}")
            files.add(item)
    return texts, files


def validated(data, where: str) -> dict:
    def fail(what: str):
        raise Refused(f"{where}: expected {what}")
    if not isinstance(data, dict) or set(data) != {"about", "widenings", "code", "reading"}:
        fail(f"an object with about, widenings, code and reading; got {sorted(data) if isinstance(data, dict) else data!r}")
    if not isinstance(data["code"], dict) or not all(isinstance(text, str) and type(count) is int and count >= 1
                                                     for text, count in data["code"].items()):
        fail("code to map each text to a count of 1 or more")
    if not isinstance(data["reading"], list) or not all(isinstance(text, str) for text in data["reading"]) \
            or len(set(data["reading"])) != len(data["reading"]):
        fail("reading to be a list of distinct texts")
    if not isinstance(data["widenings"], list) or not all(
            isinstance(item, dict) and isinstance(item.get("reason"), str) and item["reason"].strip()
            and type(item.get("added")) is int and item["added"] >= 1 and isinstance(item.get("date"), str)
            for item in data["widenings"]):
        fail('widenings to be a list of {"date", "reason", "added": a count of 1 or more}')
    return data


def added(old: dict, new: dict) -> list[str]:
    """What new holds beyond old, one line per text."""
    lines = [f'code "{text}": {old["code"].get(text, 0)} -> {count}' for text, count in new["code"].items()
             if count > old["code"].get(text, 0)]
    old_reading = set(old["reading"])
    return lines + [f'reading "{text}": added' for text in new["reading"] if text not in old_reading]


def growth(old: dict, new: dict, label: str) -> list[str]:
    """The growth from old to new that no new widening accounts for; empty if none."""
    lines = added(old, new)
    if not lines:
        return []
    count = sum(new["code"][text] - old["code"].get(text, 0) for text in new["code"]
                if new["code"][text] > old["code"].get(text, 0)) + sum(text not in set(old["reading"]) for text in new["reading"])
    recorded = sum(item["added"] for item in new["widenings"] if item not in old["widenings"])
    if recorded == count:
        return []
    return [f"{label}: {count} more than before, {recorded} recorded in widenings"] + lines[:20] + \
        ([f"... and {len(lines) - 20} more"] if len(lines) > 20 else [])


EMPTY = {"about": [], "widenings": [], "code": {}, "reading": []}


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


def fresh(found: Counter, reading: list[str]) -> dict:
    return {"about": ABOUT, "widenings": [], "code": dict(found), "reading": reading}


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
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", "utf-8", newline="\n")
