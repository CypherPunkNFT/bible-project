"""Parse M. G. Easton's *Illustrated Bible Dictionary* (1897, public domain; CCEL edition, sources/ccel/ebd2.xml).

Each article becomes a list of paragraphs; a paragraph is a list of parts, either plain text or a verse reference
[start id, end id, label]. Only the dictionary's text and references are used; CCEL's markup is not republished.
"""
import html
import re
from pathlib import Path

EASTON = Path(__file__).resolve().parents[2] / "sources" / "ccel" / "ebd2.xml"
REF = re.compile(r'<scripRef[^>]*parsed="([^"]+)"[^>]*>(.*?)</scripRef>', re.S)


def text(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment)))


def paragraph(raw: str, span) -> list:
    parts: list = []
    position = 0
    for match in REF.finditer(raw):
        before = text(raw[position:match.start()])
        if before:
            parts.append(before)
        ref = span(match.group(1))
        label = text(match.group(2)).strip()
        if ref:
            parts.append([ref[0], ref[1], label])
        elif label:
            parts.append(label)
        position = match.end()
    tail = text(raw[position:])
    if tail:
        parts.append(tail)
    if parts and isinstance(parts[0], str):
        parts[0] = parts[0].lstrip()
    if parts and isinstance(parts[-1], str):
        parts[-1] = parts[-1].rstrip()
    return [part for part in parts if part != ""]


def parse(span) -> dict[str, list]:
    """Headword (lower case) -> paragraphs. Easton's numbered senses of one headword stay in one article."""
    source = EASTON.read_text(encoding="utf-8")
    articles: dict[str, list] = {}
    for term, body in re.findall(r'<term id="[^"]+">(.*?)</term>\s*<def[^>]*>(.*?)</def>', source, re.S):
        paragraphs = [paragraph(p, span) for p in re.findall(r"<p[^>]*>(.*?)</p>", body, re.S)]
        paragraphs = [p for p in paragraphs if p]
        if paragraphs:
            articles.setdefault(text(term).strip().lower(), []).extend(paragraphs)
    if len(articles) < 3500:
        raise SystemExit(f"easton: only {len(articles)} articles parsed from {EASTON}; expected about 3,900")
    return articles
