"""Lists the text still in English on the Spanish and Brazilian Portuguese (or, with --langs, Indonesian) pages of the local preview.

Visits every real page reachable from the home page, in Spanish, Portuguese and English (the English copy is the
reference: any text that reads the same there is untranslated). It also flags half-translated text: a sentence in
which the translator swapped one word ("of" to "de") and left the rest in English, or the reverse.

Mock-ups, review pages, the question test page and design previews are not real pages and are skipped. Pages of
one kind (every chapter, every person) are sampled: at most --per-section pages per section of the site.

Run it against the always-on preview at 127.0.0.1:8931 (never start vite for it):
    py -3.12 scripts/check-translated-pages.py
Exit code 0 when nothing unexplained is left, 1 otherwise. The full report is written to --report as JSON.
"""
import argparse
import json
import re
import sys
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import Browser, sync_playwright

BASE = "http://127.0.0.1:8931"
LANGUAGES = {"es": "es", "pt": "pt-BR", "id": "id", "en": "en"}  # report name -> value of localStorage "bp-language"
REFERENCE = "en"
CHECKED = ["es", "pt"]  # the languages checked against the English (--langs)
FILE_LINK = re.compile(r"\.(pdf|epub|txt|zip|png|jpe?g|webp|gif|svg|mp3|mp4|json|xml|docx?|xlsx?|csv)$", re.I)
EXCLUDED = re.compile(r"^/(mock|mockups|review|banner-emblems|study/questions/test|data_intake|data_analysis|content)(/|$)|_mockup")

# Words that only English uses: finding one in page text means English is still on the page.
ENGLISH_WORDS = set("""the of and for with your you from this that are is to in on by or not an be it our we will all who
what when where how can has have was were their they them about into at but its if than which there these those more
does""".split())
# Words that only the Romance languages use: next to English words they show a half-translated sentence.
TRANSLATED_WORDS = set("""de del la las el los y que en para con una un es por do da dos das uma não é em na no
ao aos às pelo pela yang dan di untuk dengan dari ini itu adalah ke pada""".split())

# English on purpose: source names and licence credits that the owner keeps in English, and the brand.
ENGLISH_ON_PURPOSE = {
    "Bible Guide",
    "ChurchFamily",
}
# Latin is quoted on purpose in the Vulgate and the creeds, so its "in" is not English.
LATIN_MARKERS = re.compile(r"\b(erat|est|sunt|autem|dei|domini|nostri|deus|qui|quod|et)\b", re.I)
ENGLISH_ON_PURPOSE_PATTERN = re.compile(r"^(https?://|www\.|[\w.-]+@[\w.-]+)")

PAGE_SETTLE_MS = 1500
TEXT_KINDS = ("text", "block", "attr-aria-label", "attr-title", "attr-placeholder", "attr-alt")

# Runs in the page: every visible piece of text, with where it sits. "text" is one element's own text nodes;
# "block" is an element's whole text when it mixes its own words with child elements (a sentence split by <em>).
EXTRACT = """() => {
  const norm = (s) => s.replace(/\\s+/g, ' ').trim();
  const skipped = 'script,style,noscript,code,pre,textarea,svg';
  const where = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
  const units = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest(skipped) || el.getClientRects().length === 0) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(' ');
    const text = norm(own);
    if (text) units.push({ kind: 'text', text, where: where(el) });
    if (text && el.children.length > 0) {
      const whole = norm(el.textContent);
      if (whole.length < 400) units.push({ kind: 'block', text: whole, where: where(el) });
    }
    for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = el.getAttribute(name);
      if (value && norm(value)) units.push({ kind: 'attr-' + name, text: norm(value), where: where(el) });
    }
  }
  return { units, links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')) };
}"""


def load_page(page, path, language):
    """Opens one page in one language and returns its text units and its links."""
    page.add_init_script(f"localStorage.setItem('bp-language', '{language}')")
    page.goto(BASE + path, wait_until="load", timeout=45000)
    try:
        page.wait_for_load_state("networkidle", timeout=4000)
    except Exception as error:  # a page that keeps a socket open still has its text on screen
        print(f"note: {path} ({language}) never went idle: {error}", file=sys.stderr)
    page.wait_for_timeout(PAGE_SETTLE_MS)
    return page.evaluate(EXTRACT)


WORKER = threading.local()


def worker_browser() -> Browser:
    """One browser per worker thread, kept for the whole run (a browser per page crashed the driver)."""
    if not hasattr(WORKER, "browser"):
        WORKER.playwright = sync_playwright().start()
        WORKER.browser = WORKER.playwright.chromium.launch()
    return WORKER.browser


def visit(path: str) -> tuple[str, dict]:
    """Visits one path in every language. A page that fails is recorded as an error and the crawl goes on."""
    try:
        results = {}
        for name in (*CHECKED, REFERENCE):
            language = LANGUAGES[name]
            context = worker_browser().new_context()
            try:
                results[name] = load_page(context.new_page(), path, language)
            finally:
                context.close()
        return path, results
    except Exception as error:
        print(f"error on {path}: {error}", file=sys.stderr)
        return path, {"error": f"{type(error).__name__}: {error}"}


def internal_path(href):
    """The site path a link points to, or None for links that leave the site or are not pages."""
    if not href or href.startswith(("mailto:", "tel:", "sms:", "javascript:")):
        return None
    parts = urlsplit(href)
    if parts.netloc and parts.netloc not in ("127.0.0.1:8931", "localhost:8931"):
        return None
    path = parts.path
    if not path.startswith("/") or path.startswith("/data/") or path.startswith("/public/"):
        return None
    if FILE_LINK.search(path):  # a PDF, an EPUB or a picture is a download, not a page
        return None
    return path.rstrip("/") or "/"


def section_of(path: str) -> str:
    """The part of the site a page is in: /people, /topics, /read and so on."""
    return "/" + path.strip("/").split("/")[0]


def letters(text):
    return re.findall(r"[^\W\d_]", text)


def classify(text, reference_texts):
    """Returns the reasons a text is English, or an empty list when it is fine."""
    if len(letters(text)) < 2 or text in ENGLISH_ON_PURPOSE or ENGLISH_ON_PURPOSE_PATTERN.match(text):
        return []
    words = set(re.findall(r"[a-zà-ÿ']+", text.lower()))
    reasons = []
    english = words & ENGLISH_WORDS
    if LATIN_MARKERS.search(text):
        english = english - {"in"}
    if english and words & TRANSLATED_WORDS:
        reasons.append("half-translated: " + ", ".join(sorted(english)) + " left in English")
    elif english:
        reasons.append("English words: " + ", ".join(sorted(english)))
    if len(letters(text)) >= 4 and text.lower() in reference_texts:
        reasons.append("same as the English page")
    return reasons


def findings_for(path: str, results: dict) -> list[dict]:
    """Every English or half-translated text on one page, for the Spanish and the Portuguese copy."""
    if "error" in results:
        return [{"lang": "-", "path": path, "kind": "error", "where": "", "text": results["error"], "reason": "page failed"}]
    reference = {unit["text"].lower() for unit in results[REFERENCE]["units"]}
    found = []
    for name in CHECKED:
        for unit in results[name]["units"]:
            if unit["kind"] not in TEXT_KINDS:
                continue
            for reason in classify(unit["text"], reference):
                found.append({"lang": name, "path": path, "kind": unit["kind"], "where": unit["where"],
                              "text": unit["text"], "reason": reason})
    return found


def crawl(max_per_section: int, workers: int) -> tuple[dict[str, dict], set[str]]:
    """Visits the home page, then every page its links reach, a level at a time, sampling large sections."""
    seen = {"/"}
    per_section: dict[str, int] = defaultdict(int)
    frontier = ["/"]
    visited: dict[str, dict] = {}
    while frontier:
        next_frontier: list[str] = []
        with ThreadPoolExecutor(max_workers=workers) as pool:
            for path, results in pool.map(visit, frontier):
                visited[path] = results
                print(f"visited {path}", flush=True)
                if CHECKED[0] not in results:
                    continue
                for href in results[CHECKED[0]]["links"]:
                    link = internal_path(href)
                    if not link or link in seen or EXCLUDED.search(link):
                        continue
                    seen.add(link)
                    if per_section[section_of(link)] >= max_per_section:
                        continue
                    per_section[section_of(link)] += 1
                    next_frontier.append(link)
        frontier = next_frontier
    return visited, seen


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--per-section", type=int, default=25, help="pages sampled per section of the site")
    parser.add_argument("--workers", type=int, default=4, help="browsers open at once")
    parser.add_argument("--report", default="check-translated-pages.json", help="where the full JSON report goes")
    parser.add_argument("--langs", default="es,pt", help=f"languages to check, from {', '.join(n for n in LANGUAGES if n != REFERENCE)}")
    args = parser.parse_args()
    CHECKED[:] = args.langs.split(",")
    if not CHECKED or any(n not in LANGUAGES or n == REFERENCE for n in CHECKED):
        parser.error(f"--langs {args.langs!r}: expected a comma-separated list from {', '.join(n for n in LANGUAGES if n != REFERENCE)}")

    visited, discovered = crawl(args.per_section, args.workers)
    findings = []
    for path, results in visited.items():
        findings.extend(findings_for(path, results))

    grouped = defaultdict(lambda: {"pages": set(), "where": set(), "reasons": set(), "langs": set()})
    for item in findings:
        key = (item["lang"], item["text"])
        grouped[key]["pages"].add(item["path"])
        grouped[key]["where"].add(item["where"])
        grouped[key]["reasons"].add(item["reason"])
        grouped[key]["langs"].add(item["lang"])

    print(f"\npages visited: {len(visited)} (discovered {len(discovered)}), languages: {', '.join(CHECKED)}, en reference")
    print(f"unique texts flagged: {len(grouped)} ({len(findings)} occurrences)")
    for (lang, text), info in sorted(grouped.items(), key=lambda entry: (entry[0][0], -len(entry[1]["pages"]))):
        print(f"[{lang}] {text!r} on {len(info['pages'])} page(s), e.g. {sorted(info['pages'])[0]} ({sorted(info['reasons'])[0]})")

    report = {
        "pages_visited": sorted(visited),
        "pages_discovered": len(discovered),
        "findings": findings,
    }
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"report: {args.report}")
    return 0 if not grouped else 1


if __name__ == "__main__":
    sys.exit(main())
