"""retarget.py's work done while collecting (translation system, stage 5): when extract.py collects a kind again,
English edited since the last collection keeps its translation, filed for a re-check, instead of going back to English.

A string's id is sha1(kind + text), so an edit gives the English a new id and, before this, no translation. Now
extract.py's own modes (--pages, --resources, --documents) first pair each newly collected text with the text it
replaced, and carry the translation across in the same chunk:
  - in/<chunk>.json gets the new id and text right after the old one, and every out/<lang>/<chunk>.json that holds the
    old id gets the new id with the old translation. The old string stays (the collector cannot prove no screen shows
    it; retarget.py's build-map and apply remove strings);
  - review/<lang>/source-fixes/<chunk>.json gets a flag for each carried string ("english-corrected", by "collect",
    serious): the needs-re-check list that review/compile.py reads and the catalog counts as needs_recheck.

Only text extract.py itself collected last time can have been edited: collected.json in the site-translation folder
holds, per kind, the texts that were collected and held in a chunk at the last collection. Strings other tools append
to the same kind (studies/tools) and strings long gone are never candidates. A pair must be close (same numbers and
{n} or {{n}} marks, 4 words or more, difflib ratio 0.85 or more, each the other's clear best match) and must not differ
by a negation or a listed opposite ("read" and "unread", "show" and "hide").

Writes go file by file through a temporary file and a rename, translations and flags first, the chunk itself and
chunks.json last, and each step is skipped when already done, so a run cut short can be run again. Nothing is written
while a file it would change has uncommitted changes in the site-translation repository.
"""
import difflib
import json
import os
import re
import subprocess
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

SNAPSHOT = "collected.json"
FEWEST_WORDS = 4
SIMILAR = 0.85
CLEAR_LEAD = 0.02
NEGATIONS = {"not", "no", "never", "none", "nor", "cannot", "without", "nothing", "nobody", "neither", "isn", "aren",
             "doesn", "don", "didn", "won", "wasn", "weren"}
OPPOSITES = {frozenset(pair) for pair in (
    ("show", "hide"), ("shown", "hidden"), ("open", "close"), ("opened", "closed"), ("read", "unread"),
    ("earliest", "latest"), ("first", "last"), ("before", "after"), ("more", "fewer"), ("more", "less"),
    ("older", "newer"), ("older", "younger"), ("oldest", "newest"), ("oldest", "youngest"), ("add", "remove"),
    ("start", "end"), ("next", "previous"), ("up", "down"), ("in", "out"), ("yes", "no"), ("all", "none"),
    ("always", "never"), ("true", "false"), ("include", "exclude"), ("includes", "excludes"), ("with", "without"))}
PREFIXES = ("un", "in", "im", "non", "dis", "ir", "il")


@dataclass(frozen=True)
class Pair:
    chunk: str
    old_id: str
    old: str
    new_id: str
    new: str


class Refused(RuntimeError):
    """A file this would change has uncommitted changes, or the folder is not as expected; nothing was written."""


def read(path: Path):
    return json.loads(path.read_text("utf-8"))


def save(path: Path, value, indent: int | None = 1) -> None:
    """Through a temporary file and a rename, so a crash leaves the old file or the new one, never half of one."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=indent) + "\n", "utf-8", newline="\n")
    os.replace(temporary, path)


def tokens(text: str) -> list[str]:
    return re.findall(r"[^\W\d_]+|\d+", text.lower())


def marks(text: str) -> tuple:
    """What a translation carries over unchanged: numbers, {n} slots and {{n}} references."""
    return (text.count("{n}"), sorted(re.findall(r"\{\{\d+\}\}", text)), sorted(re.findall(r"\d+", text)))


def opposite(old: str, new: str) -> bool:
    """The edit adds or drops a negation, turns a word into its un-/in-/non-/dis- form, or swaps a listed opposite."""
    before, after = Counter(tokens(old)), Counter(tokens(new))
    lost, gained = set(before - after), set(after - before)
    if (lost | gained) & NEGATIONS:
        return True
    for word in lost | gained:
        other = gained if word in lost else lost
        if any(word == prefix + rest or rest == prefix + word for rest in other for prefix in PREFIXES):
            return True
    return any(frozenset((a, b)) in OPPOSITES for a in lost for b in gained)


def similarity(old: str, new: str) -> float:
    a, b = " ".join(old.lower().split()), " ".join(new.lower().split())
    if not 0.7 <= len(a) / max(len(b), 1) <= 1.43 or marks(old) != marks(new):
        return 0.0
    matcher = difflib.SequenceMatcher(None, a, b, autojunk=False)
    if matcher.real_quick_ratio() < SIMILAR or matcher.quick_ratio() < SIMILAR:
        return 0.0
    return matcher.ratio()


def pairs(gone: dict[str, str], fresh: list[str]) -> list[tuple[str, str, str]]:
    """(old id, old text, new text) for each fresh text that is an edit of a gone one: close, each the other's clear
    best match, and not an opposite."""
    scores: dict[tuple[str, str], float] = {}
    for new in fresh:
        if len(tokens(new)) < FEWEST_WORDS:
            continue
        for old_id, old in gone.items():
            if len(tokens(old)) >= FEWEST_WORDS and (score := similarity(old, new)) >= SIMILAR:
                scores[(old_id, new)] = score

    def clear_best(options: list[tuple[float, str]]) -> str | None:
        ranked = sorted(options, reverse=True)
        return ranked[0][1] if len(ranked) == 1 or ranked[0][0] - ranked[1][0] >= CLEAR_LEAD else None

    best_old = {new: clear_best([(s, o) for (o, n), s in scores.items() if n == new]) for _, new in scores}
    best_new = {old: clear_best([(s, n) for (o, n), s in scores.items() if o == old]) for old, _ in scores}
    return [(old_id, gone[old_id], new) for (old_id, new) in scores
            if best_old.get(new) == old_id and best_new.get(old_id) == new and not opposite(gone[old_id], new)]


def held_strings(out: Path, kind: str) -> dict[str, tuple[str, str]]:
    """id -> (chunk, text) for every string of the kind in the chunks."""
    found = {}
    for entry in read(out / "chunks.json"):
        if entry["kind"] == kind:
            for key, text in read(out / "in" / f"{entry['chunk']}.json")["strings"].items():
                found[key] = (entry["chunk"], text)
    return found


def plan(out: Path, kind: str, texts: list[str], skip: set[str], string_id) -> list[Pair]:
    """The edits to carry; none for a kind collected for the first time since the snapshot began."""
    snapshot = read(out / SNAPSHOT) if (out / SNAPSHOT).exists() else {}
    if kind not in snapshot:
        return []
    held, now = held_strings(out, kind), set(texts)
    gone = {key: text for text in snapshot[kind] if text not in now and (key := string_id(kind, text)) in held}
    fresh = [text for text in dict.fromkeys(texts) if text not in skip and string_id(kind, text) not in held]
    return [Pair(held[old_id][0], old_id, old, string_id(kind, new), new) for old_id, old, new in pairs(gone, fresh)]


def uncommitted(out: Path, paths: list[Path]) -> list[str]:
    result = subprocess.run(["git", "-C", str(out), "status", "--porcelain", "--", *[str(p) for p in paths]],
                            capture_output=True, encoding="utf-8", check=False)
    if result.returncode:
        if "not a git repository" in result.stderr:
            return []
        raise Refused(f"git status failed in {out}: {result.stderr.strip()}")
    return result.stdout.splitlines()


def inserted(strings: dict, after: dict[str, tuple[str, str]]) -> dict:
    """The strings in the same order, each new id right after the old one it replaces (once)."""
    result = {}
    for key, value in strings.items():
        result[key] = value
        if key in after and after[key][0] not in strings:
            result[after[key][0]] = after[key][1]
    return result


def flag(pair: Pair) -> dict:
    return {"id": pair.new_id, "type": "english-corrected", "by": "collect", "serious": True,
            "problem": f"The English was edited from {pair.old!r} to {pair.new!r}; the translation was carried over. "
                       "Check it against the new English.", "fix": ""}


def carry(out: Path, kind: str, texts: list[str], skip: set[str], string_id, words, dry_run: bool) -> list[Pair]:
    """Carries each edit's translation into the new id (see the module's notes) and returns the pairs carried."""
    found = plan(out, kind, texts, skip, string_id)
    for pair in found:
        print(f"  carried ({kind}, chunk {pair.chunk}): {pair.old!r} -> {pair.new!r}")
    if dry_run or not found:
        return found
    by_chunk: dict[str, list[Pair]] = {}
    for pair in found:
        by_chunk.setdefault(pair.chunk, []).append(pair)
    languages = sorted(path.name for path in (out / "out").iterdir() if path.is_dir()) if (out / "out").is_dir() else []
    touched = [out / "chunks.json", out / SNAPSHOT] + [out / folder / f"{chunk}.json" for chunk in by_chunk for folder in
               ["in"] + [f"out/{lang}" for lang in languages] + [f"review/{lang}/source-fixes" for lang in languages]]
    if dirty := uncommitted(out, touched):
        raise Refused("these files have uncommitted changes (perhaps another chat's); commit them first, so a run cut "
                      "short can be undone with git: " + ", ".join(dirty[:10]))
    for chunk, chunk_pairs in by_chunk.items():
        for lang in languages:
            path = out / "out" / lang / f"{chunk}.json"
            if not path.exists():
                continue  # this language has not translated the chunk yet: it will translate the new string with it
            translated = read(path)
            after = {p.old_id: (p.new_id, translated[p.old_id]) for p in chunk_pairs if p.old_id in translated}
            if any(new_id not in translated for new_id, _ in after.values()):
                save(path, inserted(translated, after))
            filed = out / "review" / lang / "source-fixes" / f"{chunk}.json"
            flags = read(filed)["flags"] if filed.exists() else []
            new_flags = [flag(p) for p in chunk_pairs if p.old_id in translated
                         and not any(f["id"] == p.new_id and f.get("by") == "collect" for f in flags)]
            if new_flags:
                save(filed, {"flags": flags + new_flags})
        body = read(out / "in" / f"{chunk}.json")
        if any(p.new_id not in body["strings"] for p in chunk_pairs):
            body["strings"] = inserted(body["strings"], {p.old_id: (p.new_id, p.new) for p in chunk_pairs})
            save(out / "in" / f"{chunk}.json", body)
    index = read(out / "chunks.json")
    for entry in index:
        if entry["chunk"] in by_chunk:
            strings = read(out / "in" / f"{entry['chunk']}.json")["strings"]
            entry["strings"], entry["words"] = len(strings), sum(words(text) for text in strings.values())
    save(out / "chunks.json", index)
    return found


def write_snapshot(out: Path, kind: str, texts: list[str], string_id) -> None:
    """The kind's texts that were collected now and are held in a chunk: next time, the only candidates for an edit."""
    snapshot = read(out / SNAPSHOT) if (out / SNAPSHOT).exists() else {}
    held = held_strings(out, kind)
    snapshot[kind] = sorted({text for text in texts if string_id(kind, text) in held})
    save(out / SNAPSHOT, dict(sorted(snapshot.items())), indent=0)
