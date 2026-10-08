#!/usr/bin/env python3
"""Build src/data/people-pages/index.json: a small summary of every ruler, apostle and prophet in the group files
beside it (rulers-*.json, apostles-*.json, church-*.json, prophets-*.json), for the pages that need all of them at once
without loading every group: the person page's entry cards and switch, the guides, and the succession arrows. The
group files themselves are loaded only when a ruler, apostle or prophet page opens (src/lib/people-pages.ts).

    D:/Python/python.exe scripts/build-people-pages-index.py          # writes index.json
    D:/Python/python.exe scripts/build-people-pages-index.py --check  # exit 1 if index.json is out of date

Run it whenever a group file changes (`bun run people-pages`; the site build runs it first). The shapes are
PeoplePagesIndex in src/lib/people-pages-index.ts; the group shapes in src/data/people-pages/types.ts.
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parent.parent
PAGES = SITE / "src" / "data" / "people-pages"
INDEX = PAGES / "index.json"
PEOPLE = SITE / "data" / "study" / "people"
# The main dating system (Research/People/README.md); others follow in this order when it is absent.
DATE_PREFERENCE = ["thiele-mcfall", "galil", "albright", "other", "ussher", "bible"]
VERDICT_CHARS = 110


def short(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(",;:")
    return f"{cut}…"


def main_dates(dates: list[dict]) -> dict | None:
    """The reign's dates in the main system: years BC as positive numbers (AD as negative), for the timelines."""
    ranked = sorted((d for d in dates if isinstance(d.get("from"), (int, float))),
                    key=lambda d: DATE_PREFERENCE.index(d["system"]) if d.get("system") in DATE_PREFERENCE else 99)
    if not ranked:
        return None
    best = ranked[0]
    out = {"from": best["from"], "to": best.get("to", best["from"]), "label": best.get("label", "")}
    if best.get("approx"):
        out["approx"] = True
    return out


def first_verdict(ruler: dict) -> str | None:
    for record in ruler.get("records") or []:
        if record.get("verdict", {}).get("text"):
            return short(record["verdict"]["text"], VERDICT_CHARS)
    for said in ruler.get("scriptureSays") or []:
        if said.get("text"):
            return short(said["text"], VERDICT_CHARS)
    return None


def sex_of(person_id: str) -> str:
    """M or F from the person's own record (data/study/people), so pages can say "his" or "her" before it loads."""
    file = PEOPLE / f"{person_id}.json"
    if not file.exists():
        return ""
    return json.loads(file.read_text(encoding="utf-8")).get("s", "")


def sex_of_page(ids: list[str]) -> str:
    """The page's "his", "her" or "their": "G" when one page covers people of both sexes (Priscilla and Aquila)."""
    found = {sex_of(i) for i in ids} - {""}
    return "G" if len(found) > 1 else sex_of(ids[0])


def middle(dates: dict) -> float:
    return (dates["from"] + dates["to"]) / 2


def place_near(ruler: dict, dated: dict[str, dict], passages: dict[str, list]) -> float | None:
    """Where an undated ruler is drawn on the time lines (never shown as a date): the middle of the dated rulers Scripture
    names beside them on the world stage; failing that, outside the time of the judges, beside the dated ruler whose
    passages sit nearest theirs in the same book (Candace, by Acts). None leaves them in story order (the judges)."""
    near = [middle(dated[p["personId"]]) for w in ruler.get("worldStage") or [] for p in w.get("rulers") or []
            if p.get("personId") in dated and p["personId"] != ruler["id"]]
    if near:
        return round(sum(near) / len(near), 1)
    if ruler.get("realm") == "tribes" or not ruler.get("passages"):
        return None
    first = ruler["passages"][0][0]
    book = first // 1_000_000
    best = None
    for other, spans in passages.items():
        if other == ruler["id"] or other not in dated:
            continue
        for span in spans[:1]:  # where their own story is told, not a later mention (Moses in Acts 7)
            if span[0] // 1_000_000 == book and (best is None or abs(span[0] - first) < best[0]):
                best = (abs(span[0] - first), other)
    return middle(dated[best[1]]) if best else None


def ruler_summary(ruler: dict, group: str) -> dict:
    reign = ruler.get("reign") or {}
    out = {
        "id": ruler["id"], "group": group, "kind": ruler["kind"], "realm": ruler["realm"], "name": ruler["name"],
        "title": ruler["title"], "tagline": ruler.get("tagline", ""), "order": ruler["order"],
        "reignText": reign.get("text", ""), "verdictTone": ruler.get("verdictTone", "none"),
        "prophets": [p["person"]["name"] for p in ruler.get("prophets") or [] if p.get("person", {}).get("name")],
        "sex": sex_of(ruler["id"]),
    }
    optional = {
        "personIds": ruler.get("personIds") or None, "otherNames": ruler.get("otherNames") or None,
        "years": reign.get("years"), "months": reign.get("months"), "days": reign.get("days"),
        "dates": main_dates(ruler.get("dates") or []), "verdict": first_verdict(ruler),
        "predecessor": ruler.get("predecessor"), "successor": ruler.get("successor"), "house": ruler.get("house"),
        "tribe": ruler.get("tribe"), "capital": (ruler.get("capital") or {}).get("name"),
    }
    out.update({key: value for key, value in optional.items() if value not in (None, "", [])})
    return out


def first_text(claims: list[dict]) -> str | None:
    return next((short(c["text"], 120) for c in claims or [] if c.get("text")), None)


def apostle_summary(apostle: dict, group: str) -> dict:
    out = {
        "id": apostle["id"], "group": group, "name": apostle["name"], "otherNames": apostle.get("otherNames") or [],
        "title": apostle["title"], "tagline": apostle.get("tagline", ""), "order": apostle["order"],
        "sex": sex_of_page([apostle["id"], *(apostle.get("personIds") or [])]),
    }
    ending = apostle.get("ending") or {}
    optional = {
        "personIds": apostle.get("personIds") or None,
        "home": (apostle.get("home") or {}).get("text"), "trade": (apostle.get("trade") or {}).get("text"),
        "called": next((c["label"] for c in apostle.get("calling") or [] if c.get("label")), None),
        "ending": first_text(ending.get("scripture")), "tradition": first_text(ending.get("tradition")),
        "lists": [{"book": entry["book"], "position": entry["position"], "name": entry["name"]} for entry in apostle.get("lists") or []] or None,
        "writings": [w["title"] for w in apostle.get("writings") or [] if w.get("title")] or None,
    }
    out.update({key: value for key, value in optional.items() if value not in (None, "", [])})
    return out


# The eras of Prophets through time, in order (ProphetEra in src/data/people-pages/types.ts).
PROPHET_ERA_ORDER = ["wilderness", "judges", "united", "divided", "exile", "nt"]


def prophet_summary(prophet: dict, group: str) -> dict:
    """A prophet page ("the word", /people/<id>/word): enough for the switch, the entry card and the era's arrows."""
    out = {
        "id": prophet["id"], "group": group, "name": prophet["name"], "kind": prophet["kind"], "era": prophet["era"],
        "order": prophet["order"], "title": prophet["title"], "tagline": prophet.get("tagline", ""),
        "kings": list(dict.fromkeys(k["person"]["personId"] for k in prophet.get("kings") or [] if (k.get("person") or {}).get("personId"))),
        "books": [b["code"] for b in prophet.get("books") or [] if b.get("code")],
        "sex": sex_of_page([prophet["id"], *(prophet.get("personIds") or [])]),
    }
    optional = {"personIds": prophet.get("personIds") or None, "otherNames": prophet.get("otherNames") or None}
    out.update({key: value for key, value in optional.items() if value not in (None, "", [])})
    return out


def unique(items: list[dict], what: str, problems: list[str]) -> list[dict]:
    """One page per person in each kind of page: a repeated id keeps the first and is reported."""
    ids = [item["id"] for item in items]
    duplicates = sorted({i for i in ids if ids.count(i) > 1})
    if not duplicates:
        return items
    problems.append(f"the same {what} id is in more than one place: {', '.join(duplicates)}; each person has one page (the first is kept)")
    seen: set[str] = set()
    return [item for item in items if not (item["id"] in seen or seen.add(item["id"]))]


def build(problems: list[str]) -> dict:
    rulers: list[dict] = []
    apostles: list[dict] = []
    prophets: list[dict] = []
    full_rulers: dict[str, dict] = {}
    groups: list[dict] = []
    for file in sorted(PAGES.glob("*.json")):
        if file == INDEX:
            continue
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            # A file being written while the site builds must not stop the build; --check reports it.
            problems.append(f"{file.name}: not valid JSON ({error}); left out of the index")
            continue
        group = file.stem
        found_r = [ruler_summary(r, group) for r in data.get("rulers") or []]
        for r in data.get("rulers") or []:
            full_rulers.setdefault(r["id"], r)
        found_a = [apostle_summary(a, group) for a in data.get("apostles") or []]
        try:
            found_p = [prophet_summary(p, group) for p in data.get("prophets") or []]
        except (KeyError, TypeError) as error:
            # A prophets file still being written must not stop the build; --check reports it.
            problems.append(f"{file.name}: a prophet is missing a required field ({error}); file left out of the index")
            continue
        if not found_r and not found_a and not found_p:
            print(f"{file.name}: no 'rulers', 'apostles' or 'prophets' list; skipped")
            continue
        rulers += found_r
        apostles += found_a
        prophets += found_p
        groups.append({"id": group, "title": data.get("title", group), "rulers": len(found_r), "apostles": len(found_a), "prophets": len(found_p)})
    ids = [r["id"] for r in rulers] + [a["id"] for a in apostles]
    duplicates = sorted({i for i in ids if ids.count(i) > 1})
    if duplicates:
        problems.append(f"the same id is in more than one place: {', '.join(duplicates)}; each person has one page (the first is kept)")
        seen: set[str] = set()
        rulers = [r for r in rulers if not (r["id"] in seen or seen.add(r["id"]))]
        apostles = [a for a in apostles if not (a["id"] in seen or seen.add(a["id"]))]
    dated = {r["id"]: r["dates"] for r in rulers if r.get("dates")}
    for r in rulers:
        for other in r.get("personIds") or []:
            if r["id"] in dated:
                dated.setdefault(other, dated[r["id"]])
    for r in rulers:
        if "dates" not in r:
            near = place_near(full_rulers[r["id"]], dated, {i: full_rulers[i].get("passages") or [] for i in full_rulers})
            if near is not None:
                r["near"] = near
    rulers.sort(key=lambda r: (r["realm"], r["order"]))
    apostles.sort(key=lambda a: a["order"])
    # A prophet page may share its person with a ruler page (Moses, Samuel, Deborah): the word beside the rule.
    prophets = unique(prophets, "prophet", problems)
    prophets.sort(key=lambda p: (PROPHET_ERA_ORDER.index(p["era"]) if p["era"] in PROPHET_ERA_ORDER else 99, p["order"], p["id"]))
    return {"groups": groups, "rulers": rulers, "apostles": apostles, "prophets": prophets}


def main() -> int:
    problems: list[str] = []
    text = json.dumps(build(problems), ensure_ascii=False, separators=(",", ":")) + "\n"
    for problem in problems:
        print(f"warning: {problem}")
    if "--check" in sys.argv:
        if problems:
            return 1
        current = INDEX.read_text(encoding="utf-8") if INDEX.exists() else ""
        if current != text:
            print(f"{INDEX.relative_to(SITE)} is out of date; run scripts/build-people-pages-index.py")
            return 1
        print(f"{INDEX.relative_to(SITE)} is up to date")
        return 0
    INDEX.write_text(text, encoding="utf-8", newline="\n")
    data = json.loads(text)
    print(f"Wrote {INDEX.relative_to(SITE)}: {len(data['rulers'])} rulers, {len(data['apostles'])} apostles, {len(data['prophets'])} prophets from {len(data['groups'])} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
