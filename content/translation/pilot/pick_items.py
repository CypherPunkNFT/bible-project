"""Picks the 50 real items of the translation pilot (owner, 2026-10-31) from every part of the site.

Each item is a JSON object of English strings, the shape the site's string files will have; a translator returns the
same keys. Writes items/NN-kind.txt and items.json (where each item came from). Same seed, same items.
"""
import json
import random
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
SITE = HERE.parents[2]
ITEMS = HERE / "items"
rng = random.Random(20261031)


def load(path):
    return json.loads(path.read_text("utf-8"))


def words(text):
    return len(re.findall(r"[A-Za-z]+", text))


def page_text(count):
    """Text written into the page code: headings, buttons, paragraphs, as the string files will hold it."""
    files = [p for p in (SITE / "src/pages").rglob("*.tsx") if "mockup" not in p.parts and p.stat().st_size > 6000]
    picks = []
    for path in rng.sample(sorted(files), len(files)):
        source = path.read_text("utf-8")
        found = re.findall(r">\s*([^<>{}]*[A-Za-z][^<>{}]*?)\s*<", source) + re.findall(r'(?:label|title|text|line|note|subtitle|lead)="([^"]{8,})"', source)
        strings = []
        for text in found:
            text = " ".join(text.split())
            if words(text) >= 2 and not re.search(r"className|=>|[;{}]|^\W", text) and text not in strings:
                strings.append(text)
        if len(strings) >= 8:
            picks.append((str(path.relative_to(SITE)), {f"s{i + 1}": text for i, text in enumerate(strings[:30])}))
        if len(picks) == count:
            return picks
    raise SystemExit(f"page text: found only {len(picks)} pages with 8+ strings, expected {count}")


def people(count):
    out = []
    for path in rng.sample(sorted((SITE / "data/study/people").glob("*.json")), 400):
        record = load(path)
        if words(record.get("article", "")) > 80:
            out.append((str(path.relative_to(SITE)), {key: record[key] for key in ("d", "b", "short", "article") if record.get(key)}))
        if len(out) == count:
            return out
    raise SystemExit("people: not enough articles")


def topics(count):
    out = []
    for path in rng.sample(sorted((SITE / "data/topics/t").glob("*.json")), 60):
        for topic in load(path).values():
            points = [point["text"] for point in topic.get("points", []) if point.get("text")]
            if len(points) >= 6:
                item = {"title": topic["title"]}
                item.update({f"point{i + 1}": text for i, text in enumerate(points[:25])})
                out.append((f"{path.relative_to(SITE)}#{topic['id']}", item))
                break
        if len(out) == count:
            return out
    raise SystemExit("topics: not enough topics")


def summaries(count):
    out = []
    for path in rng.sample(sorted((SITE / "data/summaries").glob("*.json")), count):
        chapters = load(path)["chapters"]
        number = rng.choice(sorted(chapters))
        out.append((f"{path.relative_to(SITE)}#{number}", {"title": chapters[number]["title"], "summary": chapters[number]["summary"]}))
    return out


def questions(count):
    bank = load(SITE / "data/questions/bank.json")
    pool = bank["questions"] if isinstance(bank, dict) and "questions" in bank else bank
    out = []
    for index in rng.sample(range(len(pool)), count):
        q = pool[index]
        item = {"question": q["question"], "answer": q["answer"]}
        item.update({f"option{i + 1}": option for i, option in enumerate(q.get("options") or [])})
        out.append((f"data/questions/bank.json#{index}", item))
    return out


def directory(count):
    data = load(SITE / "public/content/sources/directory.json")
    out = [("public/content/sources/directory.json#collections", {f"{c['id']}.label": c["label"] for c in data["collections"]} | {f"{c['id']}.definition": c["definition"] for c in data["collections"]})]
    profiles = sorted((SITE / "public/content/teacher-profiles").glob("*.json"))
    for path in rng.sample(profiles, count - 1):
        works = load(path)
        out.append((str(path.relative_to(SITE)), {f"work{i + 1}.title": w["title"] for i, w in enumerate(works[:12])} | {f"work{i + 1}.genre": w["genre"] for i, w in enumerate(works[:12]) if w.get("genre")}))
    return out


def museums(count):
    out = []
    for path in rng.sample(sorted((SITE / "data/museums").glob("*.json")), 12):
        record = load(path)
        texts = {}
        for obj in record.get("objects", [])[:40]:
            for key, value in obj.items():
                if isinstance(value, str) and words(value) >= 4 and not value.startswith("http"):
                    texts[f"{obj.get('id', 'object')}.{key}"] = value
            if len(texts) >= 10:
                break
        if texts:
            out.append((str(path.relative_to(SITE)), {"name": record["name"], "place": record.get("place", "")} | texts))
        if len(out) == count:
            return out
    raise SystemExit("museums: not enough records with text")


def creeds(count):
    out = []
    for path in rng.sample(sorted((SITE / "data/creeds/doc").glob("*.b1.json")), count):
        sections = [s for s in load(path)["sections"] if s.get("text")]
        start = rng.randrange(max(1, len(sections) - 3))
        item, total = {}, 0
        for section in sections[start:]:
            if section.get("heading"):
                item[f"{section['id']}.heading"] = section["heading"]
            item[f"{section['id']}.text"] = section["text"]
            total += words(section["text"])
            if total > 350:
                break
        out.append((f"{path.relative_to(SITE)}#{start}", item))
    return out


def hymns(count):
    out = []
    for path in rng.sample(sorted((SITE / "data/hymns/pages").glob("*.json")), count):
        hymn = rng.choice(list(load(path).values()))
        item = {"firstLine": hymn["firstLine"]}
        if hymn.get("subtitle"):
            item["subtitle"] = hymn["subtitle"]
        item.update({f"stanza{i + 1}": "\n".join(lines) for i, lines in enumerate(hymn["stanzas"][:6])})
        out.append((f"{path.relative_to(SITE)}#{hymn['id']}", item))
    return out


def debates(count):
    files = [p for p in sorted((SITE / "public/content/apologetics").glob("debate-*.md")) if p.stat().st_size > 1500]
    out = []
    for path in rng.sample(files, count):
        paragraphs = [p.strip() for p in path.read_text("utf-8").split("\n\n") if words(p) >= 12 and "](" not in p]
        start = rng.randrange(max(1, len(paragraphs) - 4))
        item, total = {}, 0
        for i, paragraph in enumerate(paragraphs[start:]):
            item[f"p{i + 1}"] = paragraph
            total += words(paragraph)
            if total > 400:
                break
        out.append((f"{path.relative_to(SITE)}#{start}", item))
    return out


PLAN = [("page", page_text, 8), ("person", people, 6), ("topic", topics, 4), ("summary", summaries, 6), ("question", questions, 6),
        ("directory", directory, 3), ("museum", museums, 3), ("creed", creeds, 5), ("hymn", hymns, 4), ("debate", debates, 5)]

if __name__ == "__main__":
    if ITEMS.exists() and any(ITEMS.iterdir()):
        raise SystemExit(f"{ITEMS} already holds items; move it aside before picking again")
    ITEMS.mkdir(parents=True, exist_ok=True)
    manifest, number = [], 0
    for kind, pick, count in PLAN:
        for source, item in pick(count):
            number += 1
            name = f"{number:02d}-{kind}"
            (ITEMS / f"{name}.txt").write_text(json.dumps(item, ensure_ascii=False, indent=1), "utf-8", newline="\n")
            manifest.append({"item": name, "kind": kind, "source": source, "words": sum(words(v) for v in item.values())})
    (HERE / "items.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), "utf-8", newline="\n")
    print(number, "items,", sum(m["words"] for m in manifest), "English words")
    for kind, _, _ in PLAN:
        print(f"  {kind:<10}{sum(m['words'] for m in manifest if m['kind'] == kind):>6} words")
