"""Extract reviewable facts from kept billygraham.org pages.

Usage: python -X utf8 -I extract.py KEEPDIR OUT.jsonl
One JSON line per kept page: url, title (h1), publishDate, topic, author, paragraphs
(text of every <article class="article"> block, in order), and helper fields.
"""
import json
import re
import sys
from html import unescape
from pathlib import Path

TAG = re.compile(r"<[^>]+>")
CID = re.compile(r' data-astro-cid-[a-z0-9]+')


def clean(fragment):
    return re.sub(r"\s+", " ", unescape(TAG.sub("", fragment))).strip()


def paragraphs(html):
    """Paragraph-level text from every article.article block (the page's main text)."""
    out = []
    for block in re.findall(r'<article class="article"[^>]*>(.*?)</article>', html, re.S):
        for piece in re.findall(r"<(p|h2|h3|h4|blockquote|li)[^>]*>(.*?)</\1>", block, re.S):
            text = clean(piece[1])
            if text:
                out.append({"tag": piece[0], "text": text})
    return out


def facts(path):
    html = CID.sub("", path.read_text("utf-8", errors="replace"))
    meta_url = re.search(r'<meta property="og:url" content="([^"]+)"', html)
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    head = re.search(r'author-date-topic subheading"><div><span>([^<]+)</span>(?:<span>\|</span><span><a href="([^"]+)">([^<]+)</a>)?', html)
    pub = re.search(r'publish-date">([^<]+)<', html)
    author = re.search(r'class="author-name"[^>]*>([^<]+)<', html)
    paras = paragraphs(html)
    full = "\n".join(p["text"] for p in paras)
    return {
        "file": path.name,
        "url": meta_url.group(1).replace("http://", "https://") if meta_url else None,
        "title": clean(h1.group(1)) if h1 else None,
        "publishDate": (head.group(1) if head else (pub.group(1) if pub else None)),
        "topic": head.group(3) if head and head.group(3) else None,
        "author": author.group(1).strip() if author else None,
        "chars": len(full),
        "copyrightLines": re.findall(r"[^.\n]{0,80}©\s*[0-9][^\n]{0,60}", full),
        "provenanceHints": [p["text"][:300] for p in paras if re.search(
            r"preached|delivered|adapted|excerpt|taken from|originally|broadcast|Hour of Decision|crusade|sermon|message",
            p["text"], re.I)][:8],
        "paragraphs": paras,
    }


def main():
    keep, out = Path(sys.argv[1]), Path(sys.argv[2])
    with out.open("w", encoding="utf-8") as fh:
        for path in sorted(keep.glob("*.html")):
            fh.write(json.dumps(facts(path), ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
