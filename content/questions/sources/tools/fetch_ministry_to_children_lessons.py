"""Fetch Ministry-to-Children lesson pages (CC BY-SA 4.0) listed in the site's post sitemaps, one every 2 s.

Resumable: a page already saved is skipped. Each page is written to a .tmp file and renamed. A log line per URL goes to
fetch-log.tsv (url, status, bytes, file). Usage: python fetch_lessons.py <url-list> <out-dir>
"""
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DELAY_SECONDS = 2.0
HEADERS = {"User-Agent": "BibleGuide-research/1.0 (nonprofit Bible site; bibleguide.io)"}


def slug_of(url: str) -> str:
    return url.rstrip("/").rsplit("/", 1)[-1] or "index"


def main() -> None:
    urls = [u.strip() for u in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines() if "lesson" in u.lower()]
    out = Path(sys.argv[2]).resolve()
    pages = out / "pages"
    pages.mkdir(parents=True, exist_ok=True)
    (out / "lesson-urls.txt").write_text("\n".join(urls) + "\n", encoding="utf-8")
    with (out / "fetch-log.tsv").open("a", encoding="utf-8") as log:
        for n, url in enumerate(urls, 1):
            target = pages / f"{slug_of(url)}.html"
            if target.exists():
                continue
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as response:
                    body, status = response.read(), response.status
            except urllib.error.HTTPError as error:
                body, status = b"", error.code
            except (urllib.error.URLError, TimeoutError) as error:
                body, status = b"", f"error: {error}"
            if body:
                tmp = target.with_suffix(".tmp")
                tmp.write_bytes(body)
                tmp.replace(target)
            log.write(f"{url}\t{status}\t{len(body)}\t{target.name if body else ''}\n")
            log.flush()
            if n % 50 == 0:
                print(f"{n}/{len(urls)}", flush=True)
            time.sleep(DELAY_SECONDS)
    print("done", flush=True)


if __name__ == "__main__":
    main()
