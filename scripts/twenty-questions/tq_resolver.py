"""Bible twenty questions: one BatchRunner item per person whose two passes disagree yes against no (design §5.4).

Reads the merged file tq_merge.py wrote (its "disputes" and the raw pass outputs), and writes BATCH_DIR/resolver-items/<id>.txt:
the person's header and verse list exactly as pass A saw them, then each disputed tag with both readers' values, verses and
reasons. The resolver (a stronger model) answers with the same schema; tq_merge.py applies its answer when rerun.

Usage: py -3.12 scripts/twenty-questions/tq_resolver.py BATCH_DIR [--pilot]
"""
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from tq_chain import JESUS  # noqa: E402
from tq_refs import Refs  # noqa: E402
from ooo_data import read_json  # noqa: E402


def pass_entries(folder: Path, pid: str) -> dict:
    file = folder / f"{Path(pid).name}.json"
    if not file.is_file():
        return {}
    raw = json.loads(file.read_text(encoding="utf-8"))
    tags = ((raw.get("structured_output") or {}).get("tags")) or []
    return {t["id"]: t for t in tags if isinstance(t, dict) and "id" in t}


def header_of(item_text: str) -> str:
    """Everything in the pass A item up to the tag list: person, story, settled values and verses."""
    marker = "\nTAGS TO DECIDE"
    at = item_text.find(marker)
    return item_text[:at] if at >= 0 else item_text


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    batch, pilot = Path(sys.argv[1]), "--pilot" in sys.argv
    merged_file = batch / "model.values.pilot.json" if pilot else HERE / "model.values.json"
    merged = read_json(merged_file)
    tags = {t["id"]: t for t in read_json(HERE / "tags.source.json")["tags"]}
    labels = {e["id"]: e["label"] for e in read_json(HERE / "pool.source.json")["people"]}
    items_a, out_a, out_b = (batch / ("pilot-A" if pilot else "items-A"), batch / ("out-pilot-A" if pilot else "out-A"),
                             batch / ("out-pilot-B" if pilot else "out-B"))
    folder = batch / "resolver-items"
    folder.mkdir(parents=True, exist_ok=True)
    refs = Refs()
    written = 0
    for pid, disputed in sorted(merged["disputes"].items()):
        if pid == JESUS or not disputed:
            continue
        a, b = pass_entries(out_a, pid), pass_entries(out_b, pid)
        header = header_of((items_a / f"{Path(pid).name}.txt").read_text(encoding="utf-8"))
        lines = [header.rstrip("\n"), "", f"DISPUTED TAGS ({len(disputed)}; decide each exactly once, in this order):"]
        for tag in disputed:
            spec = tags[tag]
            lines.append(f"- {tag} | {spec['question']} | {spec['definition']}")
            for who, entries in (("Reader A", a), ("Reader B", b)):
                entry = entries.get(tag, {})
                verse = refs.parse(entry.get("ref") or "")
                shown = f"{refs.label(verse)}: {refs.bible.text(verse)}" if verse else (entry.get("ref") or "no verse")
                lines.append(f"    {who}: {entry.get('v', '?')} | {shown} | {entry.get('why', '')}")
        (folder / f"{Path(pid).name}.txt").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
        written += 1
    print(f"{written} resolver items under {folder} ({sum(len(v) for v in merged['disputes'].values())} disputed tags)"
          + ("" if written else "; nothing to resolve"))


if __name__ == "__main__":
    main()
