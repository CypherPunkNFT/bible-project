"""Build graham/acquisition-manifest.json from every held billygraham.org Graham page (2026-11-26, job 90e68650).

Usage: python -X utf8 -I manifest.py LIBRARYDIR
Reads each asset-sermons-graham-* folder (the 52 pages held on 2026-10-09 and those collect.py holds), collect.py's
checkpoint and the hand decisions in decisions.json beside this file, and writes ../acquisition-manifest.json for
scripts/catalog-campaign-sermons.py (key "graham"). Nothing is guessed: a main text, a date the automatic patterns do
not read, a page not bylined Graham, a duplicate the signature misses, and every exclusion come from decisions.json.
Work numbers never move: an existing manifest's numbers are kept by URL; the first build numbers the 52 older pages
by asset id, then the new pages in checkpoint order. Duplicates and exclusions keep their numbers too.
"""
import json
import re
import sys
from html import unescape
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "acquisition-manifest.json"
OLD_ASSET = re.compile(r"^asset-sermons-graham-(?!(?:classic|sermon|decision|article)-)")
TITLE_PREFIX = re.compile(r"^\[(?:VIDEO|AUDIO)\]\s*|^Billy Graham(?: Classics?)?:\s*", re.I)
RIGHTS = ("© Billy Graham Evangelistic Association{printed}. Held for private study only; the site links to the BGEA page "
          "and hosts no text or audio.")
# Dates the pages print in a fixed form (each read is shown in its label); any other date comes from decisions.json.
RECORDED = re.compile(r"recorded in (\d{4})")                                    # "Hour of Decision radio message, recorded in 1967"
FROM_YEAR = re.compile(r"message from ([^–]+?),? [–-]{1,2} (\d{4})\b")           # "message from Columbia, SC, USA – 1987" (or "-", "--")
YEAR_FROM = re.compile(r"\b(?:this|a|his) (\d{4}) (?:message|sermon|classic) (?:from|in|at) ([A-Z].*?)(?=,? (?:Ruth and )?(?:Billy|where|when|as|he)\b|(?<!St)(?<!Mt)(?<![A-Z])\.(?: |$)|$)")  # "this 1973 message from St. Louis, Missouri, Billy Graham urged"
YEAR_ONLY = re.compile(r"\b(?:this|a|his|Graham['’]s) (\d{4}) (?:message|sermon|Crusade)\b|\bmessage from (\d{4})\b")  # "In this 1993 sermon", "message from 1977"
IN_YEAR = re.compile(r"\b(?:shared|delivered|preached) (?:this|his|the) (?:message|sermon)\b[^.]*?\b(?:in|during (?:his|the|this)) (\d{4})\b")  # "delivered this message in 1973 in Minneapolis"
# BGEA's own name and its ministries' names say nothing about who speaks on a page.
BOILERPLATE = re.compile(r"founded by Billy Graham|Billy Graham Evangelistic Association|Billy Graham (?:Library|Rapid Response|24/7|Training Center)", re.I)
OTHER_SPEAKER = re.compile(r"\bguest\b|Cliff Barrows|George Beverly Shea|Franklin Graham|Ruth Graham|Will Graham", re.I)
PART = re.compile(r"\s*[-–(]?\s*\b(?:Part|Pt\.?)\s*(\d+)\)?\s*$", re.I)        # "(Part 2)", "pt. 1", "Part 1"


def clean(fragment):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def page(folder):
    """Facts from one held folder: provenance, section, title, description, byline, text paragraphs."""
    prov = json.loads((folder / "provenance.json").read_text("utf-8"))
    original = next(folder.glob("original.*"))
    url = prov["url"]
    section = ("pdf" if original.suffix == ".pdf" else
               next((s for s in ("classic", "sermon", "decision", "article") if folder.name.startswith(f"asset-sermons-graham-{s}-")), None)
               or ("decision" if "/decision-magazine/" in url else "article"))
    facts = dict(url=url, assetId=folder.name, section=section, title=prov.get("title"), description=None, author=None,
                 paragraphs=[], mediaLabel=None, htmlTitle=None)
    if original.suffix == ".html":
        html = re.sub(r' data-astro-cid-[a-z0-9]+', "", original.read_text("utf-8", errors="replace"))
        metas = {k: unescape(v) for k, v in re.findall(r'<meta (?:name|property)="([^"]+)" content="([^"]*)"', html)}
        if title_tag := re.search(r"<title>(.*?)</title>", html, re.S):
            facts["htmlTitle"] = clean(title_tag.group(1))
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        author = re.search(r'class="author-name"[^>]*>([^<]+)<', html)
        media = re.search(r'class="label"[^>]*>(Audio [0-9:]+|Video [0-9:]+)<', html)
        blocks = re.findall(r'<article class="article"[^>]*>(.*?)</article>', html, re.S)
        facts.update(description=metas.get("og:description") or metas.get("description"),
                     author=author.group(1).strip() if author else None, mediaLabel=media.group(1) if media else None,
                     paragraphs=[t for b in blocks for _, inner in re.findall(r"<(p|h2|h3|h4|blockquote|li)[^>]*>(.*?)</\1>", b, re.S)
                                 if (t := clean(inner))])
        if OLD_ASSET.match(folder.name) is None:  # the 52 older pages keep the title their review gave them
            facts["title"] = TITLE_PREFIX.sub("", TITLE_PREFIX.sub("", clean(h1.group(1)) if h1 else prov.get("title") or ""))
    return facts


def signature(facts):
    """Normalised title + the first 200 letters of the text: the same sermon posted twice."""
    letters = re.sub(r"[^a-z0-9]", "", " ".join(facts["paragraphs"]).lower())[:200]
    return (re.sub(r"[^a-z0-9]", "", (facts["title"] or "").lower()), letters) if letters else None


def media_date(description):
    """(date, place) printed in an audio or video page's description, else (None, None)."""
    text = (description or "").strip()
    if m := RECORDED.search(text):
        return dict(value=m.group(1), precision="year", label=f"Printed on the page: '{m.group(0)}'"), None
    if m := FROM_YEAR.search(text):
        return dict(value=m.group(2), precision="year", label=f"Printed on the page: '{m.group(0)}'"), m.group(1).strip()
    if m := YEAR_FROM.search(text):
        return dict(value=m.group(1), precision="year", label=f"Printed on the page: '{m.group(0)}'"), m.group(2).strip()
    if m := YEAR_ONLY.search(text):
        return dict(value=m.group(1) or m.group(2), precision="year", label=f"Printed on the page: '{m.group(0)}'"), None
    if m := IN_YEAR.search(text):
        return dict(value=m.group(1), precision="year", label=f"Printed on the page: '{m.group(0)}'"), None
    return None, None


def copyright_line(facts):
    found = [m.group(0).strip() for p in facts["paragraphs"] for m in re.finditer(r"©\s*\d{4}[^.\n]{0,60}?BGEA", p)]
    return found[0] if found else None


def is_graham(facts, decisions):
    """(include?, reason). Text pages: bylined Billy Graham, or confirmed by hand. Classics: his own series. Sermon
    audio pages: Graham named as the speaker in the description, or confirmed by hand. Hand exclusions win."""
    url = facts["url"]
    if url in decisions["exclude"]:
        return False, decisions["exclude"][url]
    if url in decisions["include"] or facts["section"] in ("pdf", "classic") or OLD_ASSET.match(facts["assetId"]):
        return True, None
    if facts["section"] in ("decision", "article"):
        if (facts["author"] or "").lower() == "billy graham":
            return True, None
        return False, "not bylined Billy Graham and not confirmed by hand as a Graham sermon"
    # A /sermons/ page is BGEA's own audio page; one that names Billy Graham (beyond BGEA's name) and no one else is his.
    if not facts["title"]:
        return False, "an empty page: no title, only BGEA's general description"
    if OTHER_SPEAKER.search(facts["description"] or ""):
        return False, "the description names another speaker; not confirmed by hand"
    if re.search(r"Billy Graham", BOILERPLATE.sub("", f"{facts['description']} {facts['title']} {facts['htmlTitle']}"), re.I):
        return True, None
    return False, "the page does not name Billy Graham as the speaker; not confirmed by hand"


def dated(facts, decisions):
    """(date, place) for a page: the hand-read date if there is one, else the date its media description prints."""
    hand = decisions["dates"].get(facts["url"])
    date, place = (dict(hand), hand.get("place")) if hand else media_date(facts["description"]) if facts["section"] in ("classic", "sermon") else (None, None)
    if date:
        date.pop("place", None)
    return date, place


def entry(facts, number, decisions, also=()):
    url, section = facts["url"], facts["section"]
    date, place = dated(facts, decisions)
    printed = copyright_line(facts)
    notes = [RIGHTS.format(printed=f" (the page prints '{printed}')" if printed else "")]
    if section in ("classic", "sermon"):
        label = f" ({facts['mediaLabel']})" if facts["mediaLabel"] else ""
        notes.append(f"BGEA {'video' if section == 'classic' else 'audio'} page{label}: no transcript offered; "
                     "the held page gives the title and description only.")
    if url in decisions["notes"]:
        notes.append(decisions["notes"][url])
    if also:
        notes.append("BGEA also posts this sermon at " + "; ".join(f"{u} ({why})" for u, why in also) + ".")
    text = decisions["texts"].get(url)
    where = {"classic": "BGEA 'Billy Graham Classics' video page", "sermon": "BGEA sermon audio page",
             "decision": "Decision magazine page on billygraham.org", "article": "BGEA article page", "pdf": "BGEA sermon PDF"}[section]
    return dict(number=number, url=url, title=facts["title"], assetId=facts["assetId"], section=section,
                description=facts["description"], mainText=text["reference"] if text else None,
                mainTextLocator=text["locator"] if text else None, date=date, place=place, notes=" ".join(notes),
                locator=where, evidenceNote="Held by the sermons campaign; see reports/sermons-campaign/graham/acquisition-manifest.json.",
                alsoAt=[u for u, _ in also])


def base_title(title):
    """The title other pages of the same sermon share: no "Part N", "Billy Graham on", trailing " - 1984" or "(Chicago)"."""
    text = re.sub(r"^(?:\[(?:VIDEO|AUDIO)\]\s*)?Billy Graham(?: on|:)\s*", "", PART.sub("", title or ""), flags=re.I)
    text = re.sub(r"\s*(?:[-–—]\s*\d{4}(?:\s*-\s*Review)?|\([^)]*\))\s*$", "", text)
    return re.sub(r"[^a-z0-9]", "", text.lower())


def same_sermon_groups(kept, decisions, numbers, primaries):
    """Join the pages of one sermon: by hand (sameAs), the same text posted twice, "Part N" audio pages of one title, year and
    place, a classic video page and the one audio page of its title, year and place, and audio reposts identical in title,
    description and length. Returns ([[primary, *others]], [same-title groups left separate]). A page that was a primary in
    the last manifest stays one, so work numbers never move; two of them in one group stop the run."""
    by_url = {f["url"]: f for f in kept}
    parent, why = {u: u for u in by_url}, {}

    def find(u):
        while parent[u] != u:
            parent[u] = parent[parent[u]]
            u = parent[u]
        return u

    def join(page_url, other_url, reason):
        parent[find(page_url)] = find(other_url)
        why.setdefault(page_url, reason)
        why.setdefault(other_url, reason)

    for url, same in decisions["sameAs"].items():
        if url not in by_url or same not in by_url:
            sys.exit(f"decisions.json sameAs names a page that is not a kept Graham page: {url} -> {same}")
        join(url, same, "the same sermon, decided by hand")
    seen = {}
    for f in kept:
        if (sig := signature(f)) and sig in seen:
            join(f["url"], seen[sig], "the same text posted twice")
        elif sig:
            seen[sig] = f["url"]
    when = {}
    for f in kept:
        date, place = dated(f, decisions)
        when[f["url"]] = ((date or {}).get("value", "")[:4] or None, place.split(",")[0].strip().lower() if place else None)
    unsure, parts = [], {}
    for f in kept:
        if f["section"] == "sermon" and (m := PART.search(f["title"] or "")):
            year, city = when[f["url"]]
            loose = None if year or city else PART.sub("", re.sub(r"Part \d+", "", f["description"] or ""))
            parts.setdefault((base_title(f["title"]), year, city, loose), []).append((int(m.group(1)), f))
    for key, members in parts.items():
        numbers_seen = [n for n, _ in members]
        if len(set(numbers_seen)) < len(numbers_seen):
            unsure.append(dict(title=key[0], reason="a part number appears twice: probably two crusades", urls=[f["url"] for _, f in members]))
        elif len(members) > 1:
            for _, f in members[1:]:
                join(f["url"], members[0][1]["url"], "another part of the same sermon")
    audio = {}
    for f in kept:
        if f["section"] == "sermon" and when[f["url"]][0]:
            audio.setdefault((base_title(f["title"]), when[f["url"]][0]), set()).add(find(f["url"]))
    claims = {}
    for f in kept:
        year, city = when[f["url"]]
        if f["section"] != "classic" or not year:
            continue
        roots = audio.get((base_title(f["title"]), year), set())
        if city:
            roots = {r for r in roots if any(find(u) == r and when[u][1] == city for u in by_url)}
        if len(roots) == 1:
            claims.setdefault(next(iter(roots)), []).append(f["url"])
    for root, classics in claims.items():
        if len(classics) == 1:
            join(root, classics[0], "BGEA's audio page of this recording")
    reposts = {}
    for f in kept:
        if f["section"] == "sermon" and f["mediaLabel"] and f["description"] and not PART.search(f["title"] or ""):
            reposts.setdefault((base_title(f["title"]), f["description"].strip(), f["mediaLabel"]), []).append(f["url"])
    for urls in reposts.values():
        for url in urls[1:]:
            join(url, urls[0], "the same recording posted twice (same title, description and length)")
    groups = {}
    for f in kept:
        groups.setdefault(find(f["url"]), []).append(f)
    result = []
    for members in groups.values():
        held_before = [m for m in members if m["url"] in primaries]
        if len(held_before) > 1:
            sys.exit(f"pages that were separate works now look like one sermon; decide by hand: {[m['url'] for m in held_before]}")
        part = lambda m: int(p.group(1)) if (p := PART.search(m["title"] or "")) else 0  # noqa: E731
        members.sort(key=lambda m: (m["url"] not in primaries, m["section"] != "classic", part(m), numbers[m["url"]]))
        result.append([members[0]] + [dict(m, why=why[m["url"]]) for m in members[1:]])
    return result, unsure


def link_transcripts(sermons, duplicates, chosen):
    """Hand-matched transcripts (decisions.json transcriptPages: title -> {url, evidence}) take over their page's work, so the
    sermon has one work: the page leaves `sermons`, its other pages go with it, and its duplicates point at the transcript."""
    by_url = {s["url"]: s for s in sermons}
    unknown = sorted(info["url"] for info in chosen.values() if info["url"] not in by_url)
    if unknown:
        sys.exit(f"transcriptPages names pages that are not primary held Graham sermons: {unknown}")
    linked = {}
    for title, info in chosen.items():
        s = by_url[info["url"]]
        sermons.remove(s)
        record = f"graham-transcripts record '{title}' (catalog-campaign-sermons.py links it to this page)"
        duplicates.append(dict(number=s["number"], url=s["url"], title=s["title"], assetId=s["assetId"], sameAs=record,
                               reason="a held transcript of this recording"))
        for d in duplicates:
            if d["sameAs"] == s["url"]:
                d["sameAs"] = record
        linked[title] = dict(info, alsoAt=s["alsoAt"])
    duplicates.sort(key=lambda d: d["number"])
    return linked


def main():
    library = Path(sys.argv[1])
    decisions = {k: {} for k in ("texts", "dates", "include", "exclude", "notes", "sameAs", "transcriptPages")}
    decisions.update(json.loads((HERE / "decisions.json").read_text("utf-8")))
    old = json.loads(OUT.read_text("utf-8")) if OUT.exists() else {}
    numbers = dict(old.get("numbers", {}))
    order = [json.loads(ln)["url"] for ln in (HERE / "checkpoint.jsonl").read_text("utf-8").splitlines() if ln.strip()]
    folders = sorted(f for f in library.glob("asset-sermons-graham-*") if (f / "provenance.json").is_file())
    pages = [page(f) for f in folders]
    older = [p for p in pages if OLD_ASSET.match(p["assetId"])]
    newer = sorted((p for p in pages if not OLD_ASSET.match(p["assetId"])), key=lambda p: order.index(p["url"]) if p["url"] in order else len(order))
    for facts in older + newer:
        numbers.setdefault(facts["url"], max(numbers.values(), default=0) + 1)
    sermons, duplicates, excluded, kept = [], [], [], []
    for facts in sorted(older + newer, key=lambda p: numbers[p["url"]]):
        keep, reason = is_graham(facts, decisions)
        if keep:
            kept.append(facts)
        else:
            excluded.append(dict(number=numbers[facts["url"]], url=facts["url"], title=facts["title"], assetId=facts["assetId"], reason=reason))
    groups, unsure = same_sermon_groups(kept, decisions, numbers, set(old.get("primaries", [])))
    for members in groups:  # members[0] is the primary: one work, every page linked
        primary, rest = members[0], members[1:]
        sermons.append(entry(primary, numbers[primary["url"]], decisions, [(m["url"], m["why"]) for m in rest]))
        duplicates += [dict(number=numbers[m["url"]], url=m["url"], title=m["title"], assetId=m["assetId"], sameAs=primary["url"], reason=m["why"]) for m in rest]
    sermons.sort(key=lambda s: s["number"])
    transcripts = link_transcripts(sermons, duplicates, decisions["transcriptPages"])
    primaries = sorted({s["url"] for s in sermons} | {t["url"] for t in transcripts.values()})
    manifest = dict(preacher="graham", source="https://billygraham.org/", generatedBy="content/library/reports/sermons-campaign/graham/progress/manifest.py",
                    terms="progress/TERMS.md (read 2026-10-08, re-read 2026-11-26)", counts=dict(held=len(pages), sermons=len(sermons),
                    duplicates=len(duplicates), excluded=len(excluded), withMainText=sum(bool(s["mainText"]) for s in sermons),
                    linkedToTranscripts=len(transcripts), leftForHand=len(unsure)),
                    sermons=sermons, duplicates=duplicates, excluded=excluded, sameTitleLeftSeparate=unsure, transcriptPages=transcripts,
                    primaries=primaries, numbers=numbers)
    OUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(manifest["counts"]))


if __name__ == "__main__":
    main()
