"""Resumable collection of the rest of billygraham.org's Graham sermon pages (2026-11-26, job 90e68650).

The 2026-10-08 scan list was lost with its scratch folder; the list is rebuilt from today's sitemap (urls.txt beside
this file: /classics/, /sermons/, every /decision-magazine/articles/ page, and /articles/ pages with "graham" in the
slug). Every request goes through the machine-wide polite gate (Jarvis/Tools/PoliteFetch: 5 s between requests to
billygraham.org, shared cool-down, honest user agent). Only HTML pages are read: no audio, video, image or PDF.

Usage: python -X utf8 -I collect.py URLLIST CHECKPOINT.jsonl LIBRARYDIR [MINUTES]
MINUTES: stop cleanly after that long (between pages), for runs inside a time-limited shell.
A page is held when it may be a Graham sermon (see wanted()); the manifest step decides which held pages are sermons.
Held: LIBRARYDIR/asset-sermons-graham-<section>-<slug>/original.html + provenance.json, built in a .partial- folder
and renamed when complete, never overwriting. Checkpoint: one line per URL; only "done" lines are skipped on resume,
so a network failure is tried again next run. Stops on a cool-down, an HTTP 403, a challenge page or 5 failures in a row.
"""
import hashlib
import json
import re
import shutil
import sys
import time
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.parse import urlsplit

sys.path.insert(0, "D:/FortressOfSolitude/Jarvis/Tools/PoliteFetch")
import fortress_polite as polite  # noqa: E402

POLICY_URL = "https://billygraham.org/legal-permissions"
SECTIONS = {"/classics/": "classic", "/sermons/": "sermon", "/decision-magazine/articles/": "decision", "/articles/": "article"}
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
META = re.compile(r'<meta (?:name|property)="([^"]+)" content="([^"]*)"')
CHALLENGE = re.compile(r"<title>\s*Just a moment|cf-chl|challenge-platform", re.I)
# Body cues that a page not bylined Graham presents a Graham sermon (from list_nonauthor.py); held for a hand check.
SERMON_CUE = re.compile(r"Billy Graham (preached|delivered|sermon|message)|message from Billy Graham|sermon (by|from) Billy Graham|"
                        r"Graham.s (\d{4} )?(sermon|message)|Excerpted from a (sermon|message)", re.I)


class Stop(Exception):
    """The site refused or challenged us: stop this run."""


def section_of(url):
    path = urlsplit(url).path
    for prefix, name in SECTIONS.items():
        if path.startswith(prefix):
            return name, path[len(prefix):].strip("/")
    return None, None


def page_facts(html):
    metas = {k: unescape(v) for k, v in META.findall(html)}
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    author = re.search(r'class="author-name"[^>]*>([^<]+)<', html)
    media = re.search(r'class="label"[^>]*>(Audio [0-9:]+|Video [0-9:]+)<', html)
    article = re.findall(r'<article class="article"[^>]*>(.*?)</article>', html, re.S)
    body = unescape(re.sub(r"<[^>]+>", " ", " ".join(article)))
    return {
        "title": re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", h1.group(1)))).strip() if h1 else None,
        "ogTitle": metas.get("og:title"),
        "description": metas.get("og:description") or metas.get("description"),
        "author": author.group(1).strip() if author else None,
        "mediaLabel": media.group(1) if media else None,
        "bodyChars": len(re.sub(r"\s+", " ", body).strip()),
        "sermonCue": bool(SERMON_CUE.search(body)),
    }


def wanted(section, facts):
    """Hold anything that may be a Graham sermon; the manifest step confirms speaker and kind by hand."""
    named = "billy graham" in f"{facts['title']} {facts['ogTitle']} {facts['description']}".lower()
    if section == "classic":  # "Billy Graham Classics" is his series; some descriptions do not repeat his name
        return True
    if section == "sermon":
        return named
    return (facts["author"] or "").lower() == "billy graham" or facts["sermonCue"]


def hold(url, final, body, section, slug, facts, library):
    asset_id = f"asset-sermons-graham-{section}-{slug}"
    folder, partial = library / asset_id, library / f".partial-{asset_id}"
    if folder.exists():
        held_url = json.loads((folder / "provenance.json").read_text("utf-8")).get("url")
        return asset_id, "already held" if held_url == url else f"folder exists for {held_url}"
    if partial.exists():
        shutil.rmtree(partial)  # an interrupted earlier hold of this same page; never a finished folder
    partial.mkdir()
    with (partial / "original.html").open("xb") as fh:
        fh.write(body)
    audio_video = section in ("classic", "sermon")
    provenance = {
        "url": url, "finalUrl": final, "mimeType": "text/html", "byteCount": len(body),
        "sha256": hashlib.sha256(body).hexdigest(),
        "retrievedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "headers": None, "fetchedVia": "Jarvis/Tools/PoliteFetch (fortress_polite.get); response headers not kept",
        "assetId": asset_id, "author": "Billy Graham", "title": facts["title"], "format": "html",
        "relativePath": f"library/source-billy-graham/{asset_id}/original.html", "sourcePage": url,
        "textKind": "sermon-media-page" if audio_video else "official-sermon-transcript",
        "rightsCategory": "restricted-license", "useScope": "private-noncommercial-reading",
        "publicHostingAllowed": False, "publicFullTextIndexAllowed": False, "policyUrl": POLICY_URL,
    }
    if audio_video:
        provenance["transcriptOffered"] = False
    with (partial / "provenance.json").open("x", encoding="utf-8") as fh:
        json.dump(provenance, fh, indent=2, ensure_ascii=False)
    partial.rename(folder)
    return asset_id, "held"


def visit(url, library, held_urls):
    """One URL -> checkpoint line. Raises Stop on a refusal or challenge."""
    section, slug = section_of(url)
    if not section or not SLUG.fullmatch(slug or "") or len(slug) > 120:
        return {"url": url, "done": True, "outcome": "skipped: not a sermon section or an unusable slug"}
    try:
        answer = polite.get(url, accept="text/html", max_wait_s=300, timeout_s=60)
    except polite.CoolingDown as err:
        raise Stop(f"cool-down: {err}") from err
    except polite.FetchFailed as err:
        if err.status == 403:
            raise Stop(f"HTTP 403 at {url}") from err
        return {"url": url, "done": err.status == 404, "outcome": f"failed: {err}", "status": err.status}
    html = answer.body.decode("utf-8", errors="replace")
    facts = page_facts(html)
    if CHALLENGE.search(html[:20000]) and not facts["ogTitle"]:
        raise Stop(f"challenge page at {url}")
    line = {"url": url, "done": True, "status": answer.status, "finalUrl": answer.final_url, **facts}
    if answer.content_type != "text/html":
        return {**line, "outcome": f"not held: content type {answer.content_type}"}
    if answer.final_url != url and (section_of(answer.final_url)[0] != section or answer.final_url in held_urls):
        return {**line, "outcome": "not held: redirected to another section or an already-held page"}
    if not wanted(section, facts):
        return {**line, "outcome": "not held: not a possible Graham sermon"}
    asset_id, outcome = hold(url, answer.final_url, answer.body, section, slug, facts, library)
    return {**line, "assetId": asset_id, "outcome": outcome}


def main():
    url_list, checkpoint, library = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    deadline = time.monotonic() + float(sys.argv[4]) * 60 if len(sys.argv) > 4 else None
    held_urls = {json.loads(p.read_text("utf-8"))["url"] for p in library.glob("asset-sermons-graham-*/provenance.json")}
    done = set()
    if checkpoint.exists():
        done = {rec["url"] for rec in map(json.loads, checkpoint.read_text("utf-8").splitlines()) if rec.get("done")}
    urls = [u.strip() for u in url_list.read_text("utf-8").splitlines() if u.strip()]
    todo = [u for u in urls if u not in done and u not in held_urls]
    print(f"{len(urls)} urls, {len(done)} done, {len(urls) - len(todo) - len(done)} held before, {len(todo)} to go", flush=True)
    failures = 0
    with checkpoint.open("a", encoding="utf-8") as out:
        for i, url in enumerate(todo, 1):
            if deadline and time.monotonic() > deadline:
                print(f"PAUSED after {i - 1} pages: time budget used; run again to resume", flush=True)
                return
            try:
                line = visit(url, library, held_urls)
            except Stop as err:
                (checkpoint.parent / "STOPPED.txt").write_text(f"{datetime.now(timezone.utc).isoformat()} {err}\n", "utf-8")
                print(f"STOPPED: {err}", flush=True)
                return
            out.write(json.dumps(line, ensure_ascii=False) + "\n")
            out.flush()
            failures = 0 if line["done"] else failures + 1
            if failures >= 5:
                print(f"STOPPED: 5 failures in a row, last {line['outcome']}", flush=True)
                return
            if i % 50 == 0:
                print(f"{i}/{len(todo)}", flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
