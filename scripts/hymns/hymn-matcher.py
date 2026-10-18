"""Step 2 of the hymns pipeline: for every line of every hymn, the King James verses it shares wording with.

Plain counting, no model. Every KJV verse is indexed once by its words (lower-cased, elisions expanded, spellings made
one, lightly stemmed). A line is scored against a verse by the rare words they share (each weighted by how rare it is
in the whole Bible) and by the two- and three-word phrases they share in order. A verse in the hymn's own heading
passage, or in its chapter, scores a bonus, since the author told us where he was reading.

A line keeps its top 3 candidates only when the match is STRONG: at least two shared rare words, or a shared phrase
of three words with a rare word in it, and a score above the threshold. Most lines keep none.

Reads Research/Hymns/pipeline/hymns.json and data/plain/kjv. Writes Research/Hymns/pipeline/candidates.json.

    python scripts/hymns/hymn-matcher.py                      # every hymn
    python scripts/hymns/hymn-matcher.py --report <hymn id>   # one hymn, every line's top 5, to tune by eye
"""

from __future__ import annotations

import argparse
import math
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from hymns_common import CANDIDATES_FILE, CANON, HYMNS_FILE, STOP, bible, read_json, ref_label, stem, stems, words, write_json  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")

THRESHOLD = 15.0      # the least score a kept candidate may have (set on Amazing Grace and 20 random hymns)
RARE_IDF = 3.0        # a word this rare or rarer counts as "rare" (in at most ~1 verse in 20)
CANDIDATE_IDF = 2.6   # words commoner than this never pull a verse in on their own
PHRASE2, PHRASE3 = 2.5, 6.0
HEADING_BONUS, CHAPTER_BONUS = 6.0, 3.0
CLOSE_BONUS = 3.0     # shared words standing close together in the verse, as they do in the line
BOOK_PRIOR = 2.0      # most for the book these hymn writers head their hymns with most often
NEIGHBOUR_SHARE, NEIGHBOUR_CAP = 0.5, 6.0  # rare words the verse shares with the lines either side (an echo can run on)
KEEP = 3              # candidates kept per line
STRONGEST = 10        # verses kept per hymn for the "main passage" question


def segments(text: str) -> list[list[str]]:
    """The stems of each run of words between punctuation marks: phrases never cross a comma or a full stop."""
    import re
    return [stems(part) for part in re.split(r"[,;:.!?()—–-]+", text) if part.strip()]


def grams(text: str, n: int) -> set[tuple[str, ...]]:
    return {tuple(seg[i:i + n]) for seg in segments(text) for i in range(len(seg) - n + 1)}


@dataclass(frozen=True)
class Verse:
    code: str
    chapter: int
    verse: int
    sequence: tuple[str, ...]
    content: frozenset[str]

    @property
    def ref(self) -> str:
        return ref_label(self.code, self.chapter, self.verse)


class Index:
    def __init__(self) -> None:
        self.verses: list[Verse] = []
        for code, *_rest in CANON:
            for key, text in bible("kjv")[code].items():
                chapter, verse = (int(x) for x in key.split(":"))
                sequence = tuple(stems(text))
                self.verses.append(Verse(code, chapter, verse, sequence, frozenset(s for s in sequence if s not in STOP and len(s) > 2)))
        df: dict[str, int] = defaultdict(int)
        self.postings: dict[str, list[int]] = defaultdict(list)
        for i, v in enumerate(self.verses):
            for s in v.content:
                df[s] += 1
                self.postings[s].append(i)
        n = len(self.verses)
        self.idf = {s: math.log(n / c) for s, c in df.items()}
        texts = [bible("kjv")[v.code][f"{v.chapter}:{v.verse}"] for v in self.verses]
        self.bigrams = [frozenset(grams(t, 2)) for t in texts]
        self.trigrams = [frozenset(grams(t, 3)) for t in texts]
        self.position = {(v.code, v.chapter, v.verse): i for i, v in enumerate(self.verses)}
        self.prior: dict[str, float] = {}

    def set_prior(self, hymns: list[dict]) -> None:
        """How often these hymn writers print each book above a hymn, as a small bonus (log scale, at most BOOK_PRIOR)."""
        counts: dict[str, int] = defaultdict(int)
        for h in hymns:
            for r in (h.get("heading") or {}).get("ranges") or []:
                counts[r["code"]] += 1
        top = math.log1p(max(counts.values()))
        self.prior = {code: BOOK_PRIOR * math.log1p(n) / top for code, n in counts.items()}


def heading_zone(hymn: dict) -> tuple[set[tuple[str, int, int]], set[tuple[str, int]]]:
    """The heading's own verses, and its chapters."""
    verses, chapters = set(), set()
    for r in (hymn.get("heading") or {}).get("ranges") or []:
        chapters.add((r["code"], r["chapter"]))
        if r["first"] is not None:
            for n in range(r["first"], (r["last"] or r["first"]) + 1):
                verses.add((r["code"], r["chapter"], n))
    return verses, chapters


def content_of(index: Index, text: str) -> set[str]:
    return {s for s in stems(text) if s not in STOP and len(s) > 2 and s in index.idf}


def score_line(index: Index, text: str, zone: tuple[set, set], around: str = "") -> list[dict]:
    """Every verse sharing wording with one line, best first, with why. `around` is the lines either side."""
    content = content_of(index, text)
    neighbours = {s for s in content_of(index, around) if index.idf[s] >= RARE_IDF} - content
    bigrams, trigrams = grams(text, 2), grams(text, 3)
    pull = [s for s in content if index.idf[s] >= CANDIDATE_IDF]
    acc: dict[int, float] = defaultdict(float)
    for s in pull:
        for i in index.postings[s]:
            acc[i] += index.idf[s]
    out = []
    for i, _ in sorted(acc.items(), key=lambda kv: -kv[1])[:60]:
        v = index.verses[i]
        shared = sorted(content & v.content, key=lambda s: -index.idf[s])
        rare = [s for s in shared if index.idf[s] >= RARE_IDF]
        words_score = sum(index.idf[s] for s in shared)
        b = [g for g in bigrams & index.bigrams[i] if any(w not in STOP for w in g)]
        t = [g for g in trigrams & index.trigrams[i] if any(index.idf.get(w, 0) >= RARE_IDF and w not in STOP for w in g)]
        near = [s for s in neighbours if s in v.content]
        score = words_score + PHRASE2 * len(b) + PHRASE3 * len(t) + index.prior.get(v.code, 0.0)
        score += min(NEIGHBOUR_CAP, NEIGHBOUR_SHARE * sum(index.idf[s] for s in near))
        if len(shared) >= 2:
            spots = [k for k, w in enumerate(v.sequence) if w in shared]
            score += CLOSE_BONUS * min(1.0, (len(shared) + 1) / (spots[-1] - spots[0] + 1))
        in_heading = (v.code, v.chapter, v.verse) in zone[0]
        if in_heading:
            score += HEADING_BONUS
        elif (v.code, v.chapter) in zone[1]:
            score += CHAPTER_BONUS
        # Strong: two rare words, or a three-word phrase; in the author's own heading verse, one rare word or phrase.
        strong = score >= THRESHOLD and (len(rare) >= 2 or bool(t) or (in_heading and (bool(rare) or bool(b)))
                                         or (len(rare) == 1 and len(near) >= 2))
        out.append({"i": i, "ref": v.ref, "code": v.code, "chapter": v.chapter, "verse": v.verse, "score": round(score, 1),
                    "shared": shared + [f"+{s}" for s in near], "phrases": [" ".join(g) for g in t + b], "strong": strong})
    out.sort(key=lambda c: -c["score"])
    return out


def around(stanza: list[str], l: int) -> str:
    return " ".join(stanza[max(0, l - 1):l] + stanza[l + 1:l + 2])


def match_hymn(index: Index, hymn: dict) -> dict:
    zone = heading_zone(hymn)
    lines, best_by_verse = [], defaultdict(float)
    for s, stanza in enumerate(hymn["stanzas"]):
        for l, text in enumerate(stanza):
            ranked = score_line(index, text, zone, around(stanza, l))
            for c in ranked[:5]:
                best_by_verse[c["i"]] = max(best_by_verse[c["i"]], c["score"])
            kept, chapters = [], set()
            for c in ranked:  # the best verse of each chapter, so one passage's near-copies do not fill all three places
                if c["strong"] and (c["code"], c["chapter"]) not in chapters:
                    chapters.add((c["code"], c["chapter"]))
                    kept.append({k: c[k] for k in ("ref", "code", "chapter", "verse", "score", "shared", "phrases")})
            kept = kept[:KEEP]
            lines.append({"stanza": s, "line": l, "text": text, "candidates": kept})
    strongest = sorted(best_by_verse.items(), key=lambda kv: -kv[1])[:STRONGEST]
    return {"id": hymn["id"], "lines": lines,
            "strongest": [{"ref": index.verses[i].ref, "code": index.verses[i].code, "chapter": index.verses[i].chapter,
                           "verse": index.verses[i].verse, "score": round(score, 1)} for i, score in strongest]}


def report(index: Index, hymn: dict) -> None:
    zone = heading_zone(hymn)
    for s, stanza in enumerate(hymn["stanzas"]):
        for l, text in enumerate(stanza):
            print(f"[{s}.{l}] {text}")
            for c in score_line(index, text, zone, around(stanza, l))[:5]:
                print(f"     {'KEEP' if c['strong'] else '    '} {c['score']:5.1f} {c['ref']:<22} {', '.join(c['shared'])}"
                      f"{' | ' + '; '.join(c['phrases']) if c['phrases'] else ''}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--report", metavar="HYMN_ID", help="print one hymn's lines with their top 5 verses instead of writing")
    args = parser.parse_args()
    hymns = read_json(HYMNS_FILE)["hymns"]
    index = Index()
    index.set_prior(hymns)
    if args.report:
        hymn = next((h for h in hymns if h["id"] == args.report), None)
        if hymn is None:
            raise SystemExit(f"no hymn with id {args.report!r} in {HYMNS_FILE}")
        report(index, hymn)
        return
    results = [match_hymn(index, h) for h in hymns]
    write_json(CANDIDATES_FILE, {"schema": "bibleproject.hymn-candidates/v1", "threshold": THRESHOLD, "hymns": results}, compact=True)
    lines = [l for r in results for l in r["lines"]]
    with_candidates = [l for l in lines if l["candidates"]]
    print(f"{len(results)} hymns, {len(lines):,} lines; {len(with_candidates):,} lines with a strong candidate "
          f"({len(with_candidates) / len(lines):.0%}), {sum(len(l['candidates']) for l in lines):,} candidates in all; "
          f"{sum(1 for r in results if any(l['candidates'] for l in r['lines']))} hymns with at least one")


if __name__ == "__main__":
    main()
