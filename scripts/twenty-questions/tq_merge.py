"""Bible twenty questions: settle the two model passes into model.values.json (design §5.3 output rules, §5.4 merge).

Reads BatchRunner's output folders for pass A and pass B (and the resolver's, when it has run), validates every answer, and
writes model.values.json next to this script: for every pool member except Jesus, one value per tag the model was asked.

Rules, per pass: an id not asked is ignored; a duplicate id with differing values is unsure; a missing id is unsure; a yes
without a verse that belongs to the person is unsure; a no with a bad verse keeps the no and drops the verse; a book tag is
never no; a family tag's no needs a verse. A pass whose answer covers under 80 % of the asked tags is absent.
Merge: agree -> stands (pass A's verse first); one unsure -> unsure; yes against no -> the resolver decides, else unsure.
Afterwards a yes that breaks an implies/excludes rule against the settled data values becomes unsure. Every drop is listed.

Usage: py -3.12 scripts/twenty-questions/tq_merge.py BATCH_DIR [--pilot] [--allow-missing]
  BATCH_DIR holds items-A/, items-B/, out-A/, out-B/ (pilot-A/, out-pilot-A/ ... with --pilot) and resolver-items/, out-resolver/.
  Without --allow-missing the merge refuses while any person lacks a usable answer in either pass.
"""
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from tq_chain import BOOK_TAGS_YES_UNSURE, FAMILY_NEEDS_VERSE_FOR_NO, JESUS, asked_tags, load_corrections, settled_values  # noqa: E402
from tq_data import load_sources  # noqa: E402
from tq_refs import OWN_LETTERS, Refs, names_of  # noqa: E402
from ooo_data import load_people, load_person, read_json  # noqa: E402

LETTER = {"yes": "y", "no": "n", "unsure": "?"}
COVERAGE = 0.8
WHY_CAP = 100


def clean_text(text) -> str:
    """One printable line, capped: model text is echoed into notes and the review sheet."""
    if not isinstance(text, str):
        return ""
    return "".join(ch for ch in text if ch.isprintable()).replace("|", "/").strip()[:WHY_CAP]


def read_answer(folder: Path, pid: str) -> list | None:
    """The structured answer's tag entries, or None when the call did not finish usably."""
    file = folder / f"{Path(pid).name}.json"
    if not file.is_file():
        return None
    try:
        raw = json.loads(file.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    answer = raw.get("structured_output") if isinstance(raw, dict) else None
    tags = answer.get("tags") if isinstance(answer, dict) else None
    return tags if isinstance(tags, list) else None


def normalise_pass(entries: list, asked: dict, person: dict, names: list[str], refs: Refs, notes: list, who: str,
                   person_id: str = "") -> dict | None:
    """{tag: {"v", "ref", "slip", "why"}} for one pass, after the output rules; None when the pass is absent."""
    seen: dict[str, dict] = {}
    for entry in entries:
        if not isinstance(entry, dict) or entry.get("id") not in asked:
            notes.append(f"{who}: ignored an answer for an unasked or malformed tag {clean_text(str(entry.get('id')) if isinstance(entry, dict) else '?')}")
            continue
        tag = entry["id"]
        value = {"v": LETTER.get(entry.get("v"), "?"), "raw": entry.get("ref") or "", "slip": bool(entry.get("slip")), "why": clean_text(entry.get("why"))}
        if tag in seen and (seen[tag]["v"], seen[tag]["raw"]) != (value["v"], value["raw"]):
            notes.append(f"{who}: {tag} answered twice with different values; unsure")
            value = {"v": "?", "raw": "", "slip": False, "why": ""}
        seen[tag] = value
    if len(seen) < COVERAGE * len(asked):
        return None
    out = {}
    for tag, spec in asked.items():
        value = seen.get(tag)
        if value is None:
            notes.append(f"{who}: no answer for {tag}; unsure")
            out[tag] = {"v": "?", "ref": None, "slip": False, "why": ""}
            continue
        verse = refs.parse(value["raw"]) if value["raw"] else None
        problem = refs.fits(verse, person, names, OWN_LETTERS.get(person_id, frozenset())) if verse else ("unreadable reference" if value["raw"] else None)
        if value["v"] == "y" and verse is None:
            notes.append(f"{who}: {tag} yes with {value['raw']!r} ({problem or 'no verse'}); dropped to unsure")
            out[tag] = {"v": "?", "ref": None, "slip": False, "why": value["why"]}
            continue
        if value["v"] == "y" and problem:
            # a pending yes: it stands only if the other pass agrees with a valid verse, or cites this same verse
            out[tag] = {"v": "y", "ref": None, "pending": verse, "problem": problem, "raw": value["raw"], "slip": value["slip"], "why": value["why"]}
            continue
        if value["v"] == "n" and spec["group"] in BOOK_TAGS_YES_UNSURE:
            notes.append(f"{who}: {tag} no is not allowed for a book the person is named in; unsure")
            out[tag] = {"v": "?", "ref": None, "slip": False, "why": value["why"]}
            continue
        if value["v"] == "n" and tag in FAMILY_NEEDS_VERSE_FOR_NO and (verse is None or problem):
            notes.append(f"{who}: {tag} no without a verse that states it; unsure")
            out[tag] = {"v": "?", "ref": None, "slip": False, "why": value["why"]}
            continue
        if problem and value["v"] == "n":
            notes.append(f"{who}: {tag} no cites {value['raw']!r} ({problem}); the verse is dropped, the no stands")
            verse = None
        out[tag] = {"v": value["v"], "ref": verse if not problem else None, "slip": value["slip"] and value["v"] != "?", "why": value["why"]}
    return out


def merge_passes(a: dict | None, b: dict | None, asked: dict, notes: list, who: str) -> tuple[dict, list[str]]:
    """Design §5.4: agree stands; one unsure wins; yes against no is a dispute for the resolver."""
    merged, disputes = {}, []
    if a is None or b is None:
        only = a or b or {}
        for tag in asked:
            value = dict(only.get(tag, {"v": "?", "ref": None, "slip": False, "why": ""}))
            if value.pop("pending", None):
                value.update({"v": "?", "slip": False})  # a yes whose verse is not the person's cannot stand on one pass
            value.pop("problem", None)
            value.pop("raw", None)
            merged[tag] = {**value, "by": "single-pass" if only else "missing-pass"}
        return merged, disputes
    for tag in asked:
        x, y = a[tag], b[tag]
        if x["v"] == y["v"] == "y":
            ref = x["ref"] if x["ref"] is not None else y["ref"]
            if ref is None and x.get("pending") and x.get("pending") == y.get("pending"):
                ref = x["pending"]
                notes.append(f"{who}: {tag} yes stands on {x['raw']!r} ({x['problem']}): both passes cite that verse")
            if ref is None:
                notes.append(f"{who}: {tag} yes in both passes, but neither verse belongs to the person "
                             f"({x.get('raw') or '-'} / {y.get('raw') or '-'}); dropped to unsure")
                merged[tag] = {"v": "?", "ref": None, "slip": False, "why": "", "by": "model"}
            else:
                merged[tag] = {"v": "y", "ref": ref, "slip": x["slip"] and y["slip"], "why": x["why"] or y["why"], "by": "model"}
        elif x["v"] == y["v"]:
            merged[tag] = {"v": x["v"], "ref": x["ref"] if x["ref"] is not None else y["ref"], "slip": x["slip"] and y["slip"] and x["v"] != "?",
                           "why": x["why"] or y["why"], "by": "model"}
        elif "?" in (x["v"], y["v"]):
            merged[tag] = {"v": "?", "ref": None, "slip": False, "why": "", "by": "model"}
        else:
            disputes.append(tag)
            merged[tag] = {"v": "?", "ref": None, "slip": False, "why": "", "by": "unresolved",
                           "a": {"v": x["v"], "ref": x["ref"] or x.get("pending"), "why": x["why"]},
                           "b": {"v": y["v"], "ref": y["ref"] or y.get("pending"), "why": y["why"]}}
    return merged, disputes


def apply_rules(merged: dict, settled: dict, tags: list[dict], notes: list, who: str) -> None:
    """A model yes that breaks implies/excludes against the chained values drops to unsure (design §5.5 check 1)."""
    final = {tag: value["v"] for tag, value in settled.items()}
    final.update({tag: value["v"] for tag, value in merged.items()})
    for tag in tags:
        if tag["id"] not in merged or merged[tag["id"]]["v"] != "y":
            continue
        broken = [o for o in tag.get("implies", []) if final.get(o) == "n"] + [o for o in tag.get("excludes", []) if final.get(o) == "y"]
        if broken:
            notes.append(f"{who}: {tag['id']} yes breaks a rule with {', '.join(broken)}; unsure")
            merged[tag["id"]] = {"v": "?", "ref": None, "slip": False, "why": "", "by": "rule"}
            final[tag["id"]] = "?"
    for tag in tags:  # a settled or agreed yes decides its implied tags (yes) and excluded tags (no) where the model was unsure
        if final.get(tag["id"]) != "y":
            continue
        for other in tag.get("excludes", []):
            if other in merged and merged[other]["v"] == "?":
                merged[other] = {"v": "n", "ref": None, "slip": False, "why": f"excluded by {tag['id']}", "by": "rule"}
                final[other] = "n"
        for other in tag.get("implies", []):
            if other in merged and merged[other]["v"] == "?":
                source = merged.get(tag["id"]) or settled.get(tag["id"]) or {}
                merged[other] = {"v": "y", "ref": source.get("ref"), "slip": False, "why": f"implied by {tag['id']}", "by": "rule"}
                final[other] = "y"
    for tag in tags:  # and a no on an implied tag decides the tags that imply it
        for other in tag.get("implies", []):
            if final.get(other) == "n" and tag["id"] in merged and merged[tag["id"]]["v"] == "?":
                merged[tag["id"]] = {"v": "n", "ref": None, "slip": False, "why": f"{other} is no", "by": "rule"}
                final[tag["id"]] = "n"
    if final.get("israelite") == "y" and final.get("foreign") == "y":
        for tag in ("israelite", "foreign"):
            if tag in merged:
                merged[tag] = {"v": "?", "ref": None, "slip": False, "why": "", "by": "rule"}
        notes.append(f"{who}: israelite and foreign both yes; both unsure")


def ledger_sha(out_folder: Path, pid: str) -> str | None:
    """The item sha of the last successful attempt BatchRunner logged for this item."""
    ledger = out_folder / "_runner" / "attempts.jsonl"
    if not ledger.is_file():
        return None
    found = None
    for line in ledger.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except ValueError:
            continue
        if row.get("kind") == "attempt" and row.get("item") == pid and row.get("status") == "ok":
            found = row.get("sha")
    return found


def apply_resolver(batch: Path, pid: str, merged: dict, disputes: list[str], asked: dict, person: dict, names: list[str], refs: Refs,
                   notes: list, who: str) -> None:
    """The resolver's answer is final (design §5.4), if it answered the current dispute list."""
    item = batch / "resolver-items" / f"{Path(pid).name}.txt"
    if not disputes or not item.is_file():
        return
    sha = hashlib.sha256(item.read_bytes()).hexdigest()
    if ledger_sha(batch / "out-resolver", pid) != sha:
        notes.append(f"{who}: the resolver has not answered the current disputes ({', '.join(disputes)}); unsure")
        return
    entries = read_answer(batch / "out-resolver", pid)
    answer = normalise_pass(entries or [], {t: asked[t] for t in disputes}, person, names, refs, notes, who + " resolver", pid) if entries else None
    if answer is None:
        notes.append(f"{who}: resolver answer unusable; disputes stay unsure")
        return
    for tag in disputes:
        value = answer[tag]
        if value.get("pending"):
            notes.append(f"{who}: resolver's yes for {tag} cites {value['raw']!r} ({value['problem']}); unsure")
            value = {"v": "?", "ref": None, "slip": False, "why": ""}
        merged[tag] = {"v": value["v"], "ref": value["ref"], "slip": value["slip"], "why": value["why"], "by": "resolved"}


def merge(batch: Path, pilot: bool, allow_missing: bool) -> dict:
    tags = read_json(HERE / "tags.source.json")["tags"]
    pool = read_json(HERE / "pool.source.json")["people"]
    pool_ids = {e["id"] for e in pool}
    people = {p["id"]: p for p in load_people()}
    src, corrections, refs = load_sources(), load_corrections(), Refs()
    out_a, out_b = batch / ("out-pilot-A" if pilot else "out-A"), batch / ("out-pilot-B" if pilot else "out-B")
    members = [e for e in pool if e["id"] != JESUS and (not pilot or (out_a / f"{e['id']}.json").is_file())]
    result, notes, missing, disputed = {}, [], [], {}
    stats = Counter()
    for entry in members:
        pid, who = entry["id"], entry["label"]
        person = load_person(pid)
        settled = settled_values(src, tags, entry, pool_ids, corrections, refs)
        asked = {t["id"]: t for t in asked_tags(tags, settled)}
        names = names_of(entry["label"], people[pid])
        passes = []
        for letter, folder in (("A", out_a), ("B", out_b)):
            entries = read_answer(folder, pid)
            passes.append(normalise_pass(entries, asked, person, names, refs, notes, f"{who} {letter}", pid) if entries is not None else None)
            if passes[-1] is None:
                missing.append(f"{pid} pass {letter}")
        merged, disputes = merge_passes(passes[0], passes[1], asked, notes, who)
        if disputes:
            disputed[pid] = disputes
            apply_resolver(batch, pid, merged, disputes, asked, person, names, refs, notes, who)
        apply_rules(merged, settled, tags, notes, who)
        for value in merged.values():
            stats[value["by"]] += 1
            stats["v=" + value["v"]] += 1
        result[pid] = {tag: {k: v for k, v in value.items() if k not in ("a", "b", "pending", "problem", "raw") and (k != "why" or v)}
                       for tag, value in merged.items()}
    if missing and not allow_missing:
        raise SystemExit(f"{len(missing)} pass answers are missing or unusable; rerun BatchRunner for them (or pass --allow-missing):\n  "
                         + "\n  ".join(missing))
    unresolved = {pid: tags for pid, tags in disputed.items() if any(result[pid][t]["by"] == "unresolved" for t in tags)}
    return {"about": "Bible twenty questions: the model passes' values (design §5.3-§5.4), merged by tq_merge.py. Not hand-edited. "
                     "by: model (passes agree), resolved (the resolver settled a yes-against-no), unresolved (dispute pending; unsure), "
                     "rule (a yes broke implies/excludes; unsure), single-pass / missing-pass (a pass had no usable answer).",
            "pilot": pilot, "people": result, "disputes": disputed, "unresolved": unresolved, "missing": missing, "notes": notes,
            "stats": dict(sorted(stats.items()))}


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    batch, pilot, allow = Path(sys.argv[1]), "--pilot" in sys.argv, "--allow-missing" in sys.argv
    out = merge(batch, pilot, allow)
    target = batch / "model.values.pilot.json" if pilot else HERE / "model.values.json"
    target.write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", encoding="utf-8", newline="\n")
    print(f"{target.name}: {len(out['people'])} people; values {out['stats']}; {len(out['disputes'])} people with disputes "
          f"({sum(len(v) for v in out['disputes'].values())} tags), {len(out['unresolved'])} still unresolved; {len(out['missing'])} missing passes; "
          f"{len(out['notes'])} notes")


if __name__ == "__main__":
    main()
