"""Bible twenty questions: one BatchRunner item per pool member for the model passes (design §5.3, §5.6).

Each item holds everything the call needs: label, brief, the site's story, the settled data values, the tags to decide and
up to 150 BSB verses chosen from the person's verse list (every book they are named in gets a few; the densest chapters
fill the rest). Pass A lists verses in Bible order with the tags in schema order; pass B reverses the book order and
shuffles the tags, so the two passes do not share one reading path (design §5.3 "different verse orderings").
Items are byte-stable (sorted, LF endings), so BatchRunner's resume never redoes a finished person.

Usage: py -3.12 scripts/twenty-questions/tq_items.py OUT_DIR [--pilot]
  writes OUT_DIR/items-A/<id>.txt and OUT_DIR/items-B/<id>.txt (or pilot-A / pilot-B for the 12 design-named pilot people).
"""
import json
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from tq_chain import JESUS, SITE, asked_tags, era_of, load_corrections, settled_values  # noqa: E402
from tq_data import load_sources  # noqa: E402
from tq_refs import Refs  # noqa: E402
from ooo_data import load_people, load_person, read_json  # noqa: E402

VERSE_CAP = 150
PER_BOOK_MIN = 3
PER_CHAPTER_CAP = 8
STORY_WORD_CAP = 1500
PILOT = ["moses-exo-2-10", "samson-jdg-13-24", "ruth-rut-1-4", "jonah-2ki-14-25", "esther-est-2-7", "judas-mat-10-4", "mary-mat-1-16",
         "nicodemus-jhn-3-1", "saul-1sa-9-2", "paul-act-7-58", "herod-mat-14-1", "jehoahaz-2ki-23-30"]


def choose_verses(refs: list[int]) -> list[int]:
    """Up to VERSE_CAP verse ids: first and last, a few from every book, then the densest chapters (capped per chapter)."""
    refs = sorted(set(refs))
    if len(refs) <= VERSE_CAP:
        return refs
    chosen = {refs[0], refs[-1]}
    by_book = defaultdict(list)
    for ref in refs:
        by_book[ref // 1_000_000].append(ref)
    for verses in by_book.values():
        picks = [verses[0], verses[len(verses) // 2], verses[-1]][: max(PER_BOOK_MIN, 1)]
        chosen.update(picks[: min(len(verses), PER_BOOK_MIN)])
    chapters = Counter(ref // 1000 for ref in refs)
    for chapter, _ in sorted(chapters.items(), key=lambda item: (-item[1], item[0])):
        if len(chosen) >= VERSE_CAP:
            break
        in_chapter = [ref for ref in refs if ref // 1000 == chapter]
        room = max(0, PER_CHAPTER_CAP - sum(1 for ref in in_chapter if ref in chosen))
        step = max(1, len(in_chapter) // max(room, 1))
        for ref in in_chapter[::step][:room]:
            if len(chosen) >= VERSE_CAP:
                break
            chosen.add(ref)
    return sorted(chosen)


def story_text(person: dict) -> str:
    story = person.get("story")
    if story and story.get("paragraphs"):
        words = " ".join(p["text"] for p in story["paragraphs"]).split()
        return " ".join(words[:STORY_WORD_CAP]) + (" […]" if len(words) > STORY_WORD_CAP else "")
    return person.get("article") or person.get("short") or ""


def namesakes(row: dict, people: list[dict]) -> list[str]:
    first = row["n"].split()[0]
    others = [p for p in people if p["id"] != row["id"] and p["n"].split()[0] == first and not p.get("g")]
    return [f"{p['n']} ({p.get('b') or 'no brief'})" for p in others[:8]] + (["and others"] if len(others) > 8 else [])


def family_line(person: dict, people: dict[str, dict]) -> str:
    name = lambda pid: people.get(pid, {}).get("n", pid)
    parts = []
    for key, word in (("pa", "parents"), ("sp", "spouse"), ("ch", "children"), ("si", "siblings")):
        ids = person.get(key) or []
        parts.append(f"{word}: {', '.join(name(i) for i in ids) if ids else 'none named in the site data'}")
    return "; ".join(parts)


def item_text(ctx: dict, entry: dict, which: str) -> str:
    pid = entry["id"]
    row, person = ctx["people"][pid], load_person(pid)
    settled = settled_values(ctx["src"], ctx["tags"], entry, ctx["pool_ids"], ctx["corrections"], ctx["refs"])
    asked = asked_tags(ctx["tags"], settled)
    if which == "B":
        rng = random.Random(pid)
        rng.shuffle(asked)
    refs_all = sorted(set(person.get("refs") or []))
    verses = choose_verses(refs_all)
    if which == "B":
        verses.sort(key=lambda v: (-(v // 1_000_000), v))
    books = Counter(ref // 1_000_000 for ref in refs_all)
    book_name = lambda number: next(b["name"] for b in ctx["refs"].catalogue.by_code.values() if b["num"] == number)
    named_in = ", ".join(f"{book_name(number)} ({count})" for number, count in sorted(books.items()))
    others = namesakes(row, ctx["people_list"])
    settled_lines = [f"- {tag}: {'yes' if value['v'] == 'y' else 'no' if value['v'] == 'n' else 'unsure'}" for tag, value in settled.items()
                     if tag in ctx["tag_ids"] and value["v"] in "yn?"]
    coverage = (f"These are all {len(verses)} verses in the Bible that name {entry['label']}." if len(verses) == len(refs_all)
                else f"A selection of {len(verses)} of the {len(refs_all)} verses that name {entry['label']} (every book is represented).")
    lines = [
        f"PERSON: {entry['label']}",
        f"Brief: {row.get('b') or person.get('short') or ''}",
        f"Site data: sex {'woman' if person.get('s') == 'F' else 'man' if person.get('s') == 'M' else 'unknown'}; era {era_of(person)}; "
        f"tribe or nation field: {person.get('t') or 'none'}; description: {person.get('d') or 'none'}",
        f"Family in the site data: {family_line(person, ctx['people'])}",
        f"Named in these books (mention counts, not participation): {named_in or 'none'}",
        "Other Bible people with the same name (NOT your person): " + ("; ".join(others) if others else "none") + ".",
        "",
        "STORY (the site's own account):",
        story_text(person) or "(none)",
        "",
        "ALREADY SETTLED from the site's data (do not answer these; do not contradict them):",
        *(settled_lines or ["- none"]),
        "",
        f"VERSES. {coverage}",
        *(f"{ctx['refs'].label(v)}  {ctx['refs'].bible.text(v)}" for v in verses),
        "",
        f"TAGS TO DECIDE ({len(asked)}; answer each exactly once, in this order):",
        *(f"- {t['id']} | {t['question']} | {t['definition']} | allowed: {t['allowed']}" for t in asked),
    ]
    return "\n".join(lines) + "\n"


def build_context() -> dict:
    tags = read_json(HERE / "tags.source.json")["tags"]
    pool = read_json(HERE / "pool.source.json")["people"]
    people_list = load_people()
    return {"tags": tags, "tag_ids": {t["id"] for t in tags}, "pool": pool, "pool_ids": {e["id"] for e in pool},
            "people": {p["id"]: p for p in people_list}, "people_list": people_list, "src": load_sources(),
            "corrections": load_corrections(), "refs": Refs()}


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    out, pilot = Path(sys.argv[1]), "--pilot" in sys.argv
    ctx = build_context()
    members = [e for e in ctx["pool"] if e["id"] != JESUS and (not pilot or e["id"] in PILOT)]
    if pilot and len(members) != len(PILOT):
        raise SystemExit(f"pilot people missing from the pool: {sorted(set(PILOT) - {e['id'] for e in members})}")
    sizes = []
    for which in ("A", "B"):
        folder = out / (("pilot-" if pilot else "items-") + which)
        folder.mkdir(parents=True, exist_ok=True)
        for entry in members:
            if not entry["id"].replace("-", "").isalnum():
                raise SystemExit(f"unexpected id {entry['id']!r}")
            text = item_text(ctx, entry, which)
            (folder / f"{Path(entry['id']).name}.txt").write_text(text, encoding="utf-8", newline="\n")
            sizes.append(len(text))
    asked_counts = [len(asked_tags(ctx["tags"], settled_values(ctx["src"], ctx["tags"], e, ctx["pool_ids"], ctx["corrections"], ctx["refs"])))
                    for e in members]
    print(f"{len(members)} people × 2 passes written under {out}; item size min {min(sizes)} / median {sorted(sizes)[len(sizes) // 2]} / "
          f"max {max(sizes)} chars; tags asked per person min {min(asked_counts)} / median {sorted(asked_counts)[len(asked_counts) // 2]} / "
          f"max {max(asked_counts)}; total asked {sum(asked_counts)}")
    (out / "asked.json").write_text(json.dumps({e["id"]: n for e, n in zip(members, asked_counts)}, indent=0), encoding="utf-8")


if __name__ == "__main__":
    main()
