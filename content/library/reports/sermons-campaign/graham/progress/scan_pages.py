"""Resumable scan of a list of billygraham.org pages.

Usage: python -X utf8 scan_pages.py URLLIST CHECKPOINT.jsonl KEEPDIR [--keep-all]
For each URL not already in CHECKPOINT: fetch, record a JSON line with
status/title/description/author/transcript flag. Pages with transcript or body text
(or every page with --keep-all) are saved to KEEPDIR/<slug>.html + <slug>.headers.json
(never overwriting). Stops on HTTP 429/403/captcha and writes STOPPED.txt.
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch import Blocked, fetch  # noqa: E402

META = re.compile(r'<meta (?:name|property)="([^"]+)" content="([^"]*)"')


def page_facts(html):
    metas = {k: v for k, v in META.findall(html)}
    author = re.search(r'class="author-name"[^>]*>([^<]+)<', html)
    duration = re.search(r'class="label"[^>]*>(Audio [0-9:]+|Video [0-9:]+)<', html)
    transcript = re.search(r'class="audio-media-item[^"]*has-transcript', html)
    article = re.search(r'<article class="article"[^>]*>(.*)</article>', html, re.S)
    body_chars = len(re.sub(r"<[^>]+>", "", article.group(1))) if article else 0
    return {
        "title": metas.get("og:title"),
        "description": metas.get("og:description"),
        "author": author.group(1).strip() if author else None,
        "mediaLabel": duration.group(1) if duration else None,
        "hasTranscript": bool(transcript),
        "bodyChars": body_chars,
    }


def main():
    url_list, checkpoint, keep_dir = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    keep_all = "--keep-all" in sys.argv
    keep_dir.mkdir(parents=True, exist_ok=True)
    done = set()
    if checkpoint.exists():
        done = {json.loads(ln)["url"] for ln in checkpoint.read_text("utf-8").splitlines() if ln.strip()}
    urls = [u.strip() for u in url_list.read_text("utf-8").splitlines() if u.strip()]
    todo = [u for u in urls if u not in done]
    print(f"{len(urls)} urls, {len(done)} done, {len(todo)} to go", flush=True)
    with checkpoint.open("a", encoding="utf-8") as out:
        for i, url in enumerate(todo, 1):
            try:
                status, final, headers, body = fetch(url)
            except Blocked as err:
                (checkpoint.parent / "STOPPED.txt").write_text(
                    f"{datetime.now(timezone.utc).isoformat()} {err}\n", "utf-8")
                print(f"STOPPED: {err}", flush=True)
                return
            except Exception as err:  # network error: record and move on
                out.write(json.dumps({"url": url, "error": repr(err)}) + "\n")
                out.flush()
                continue
            html = body.decode("utf-8", errors="replace")
            facts = page_facts(html) if status == 200 else {}
            slug = url.rstrip("/").rsplit("/", 1)[-1]
            kept = None
            is_bgea_article = "/articles/" in url and "/decision-magazine/" not in url
            wanted = (keep_all or facts.get("hasTranscript") or is_bgea_article
                      or (facts.get("author") or "").strip().lower() == "billy graham")
            if status == 200 and wanted:
                target = keep_dir / f"{slug}.html"
                if not target.exists():
                    target.write_bytes(body)
                    (keep_dir / f"{slug}.headers.json").write_text(json.dumps({
                        "url": url, "finalUrl": final, "status": status, "headers": headers,
                        "retrievedAt": datetime.now(timezone.utc).isoformat()}, indent=1), "utf-8")
                kept = str(target.name)
            out.write(json.dumps({"url": url, "status": status, "finalUrl": final,
                                  "kept": kept, **facts}, ensure_ascii=False) + "\n")
            out.flush()
            if i % 50 == 0:
                print(f"{i}/{len(todo)}", flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
