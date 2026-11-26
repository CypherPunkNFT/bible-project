"""Historic preachers: one catalogue work per printed sermon, split out of books the library already holds as clean text.

Follows the plan in content/library/reports/sermons-campaign/historic-splitting-20261126/ (plan.json, REPORT.md):
TCP hand-typed TEI (CC0) for Calvin, Bullinger, Flavel and Sibbes, CCEL ThML for Owen. Nothing is downloaded and no
held file is changed. Each sermon is a work that `is-part-of` the book's existing catalogue work (that work and its
edition and asset stay as they are); the passage is recorded only where the book prints it (scripts/historic_sermon_texts.py)
and every verse is checked against our KJV. A sermon whose text is not printed, or cannot be read, is listed in
reports/sermons-campaign/<preacher>/catalogue-run.json with the reason. Copies of one sermon in another book
(Calvin's Ten Commandments inside Deuteronomy, the re-translated Four Sermons) get no second record.

The run stops before writing anything if a preacher would exceed the plan's checked ceiling, or if two of a
preacher's sermons share a series and ordinal.

Usage (from Website/): python -X utf8 scripts/catalog-historic-sermons.py calvin bullinger flavel sibbes owen [--dry-run]
"""

import argparse
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import historic_sermon_texts as texts  # noqa: E402
from bible.books import BOOKS  # noqa: E402
from bible.paths import SITE, SOURCES  # noqa: E402
from bible.study_refs import RefError, Verses  # noqa: E402

_spec = importlib.util.spec_from_file_location("sermon_passages", Path(__file__).with_name("sermon-passages.py"))
sermon_passages = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sermon_passages)

LIBRARY = SITE / "content" / "library"
CATALOG = LIBRARY / "catalog"
REPORTS = LIBRARY / "reports" / "sermons-campaign"
PLAN = REPORTS / "historic-splitting-20261126" / "plan.json"
TODAY = "2026-11-26"
REVIEW = dict(date=TODAY, reviewer="Claude", kind="ai-assisted",
              scope="Historic sermons split (job 61cd017d): sermon boundary, heading and printed main text read from the held clean text; not a full-text proofread.")
TCP_URL = "https://raw.githubusercontent.com/textcreationpartnership/{0}/master/{0}.xml"

# Each held book: its TCP id (or CCEL asset), a series slug for the work ids, a short title, and how its main text is printed:
#   heading  chapter named in the heading ("the third vpon the eight Chapter"), verses = numbers printed in the quoted text
#   bibl     a printed reference at the head ("CANT. V. I."); a chapter-only one takes the printed verse numbers
#   fixed    the book and chapter printed on the title page or heading, stated here with its wording
#   none     no text printed at the head: listed with the reason given
CALVIN = [
    dict(tcp="A17698", series="deut", short="Sermons upon Deuteronomy", mode="heading", book="Deuteronomy", ordinal="n", dated=True,
         fix={69: (73, "the heading prints 'The Lxx. Sermon, which is the fifth vpon the tenth Chapter' (14 September 1555), but it "
                       "follows the Lxxii. (13 September) and the Lxx. is the second upon the tenth chapter (11 September): a misprint for the Lxxiii.")},
         manual={140: dict(reference="Deuteronomy 26:18-19; Deuteronomy 27:1-10",
                           printed="heading: 'The CXLIX. Sermon which is the first vpon the seuen and twentith Chapter'; the quoted text opens "
                                   "'18 19 And the Lord hath set thee:' (the first words of 26:18, cut short), then 'The xxvii. Chapter' and "
                                   "verses 1-10")},
         # Ten headings fell in pages missing from the copy TCP transcribed: each sermon's text runs on inside the division of
         # the sermon before it, after a <gap reason="missing" extent="2 pages">, which is 1.5-2 times a sermon's length.
         lost={39: 38, 48: 47, 61: 60, 67: 66, 84: 83, 107: 106, 111: 110, 115: 114, 117: 116, 157: 156}),
    dict(tcp="A69056", series="job", short="Sermons upon Job", mode="heading", book="Job", versification={
        40: "Golding numbers Job 40 and 41 as the French Bible does, not as the KJV (his 40:7 'Cast abroad the rage of thy wrath' is the KJV's 40:11)",
        41: "Golding numbers Job 40 and 41 as the French Bible does, not as the KJV (his 40:7 'Cast abroad the rage of thy wrath' is the KJV's 40:11)"}),
    dict(tcp="A17705", series="eph", short="Sermons upon Ephesians", mode="heading", book="Ephesians"),
    dict(tcp="A17706", series="gal", short="Sermons upon Galatians", mode="heading", book="Galatians"),
    dict(tcp="A17690", series="divers", short="Divers sermons (nativity, passion, resurrection, Pentecost)", mode="bibl", manual={
        13: dict(reference="Isaiah 53:9-10", printed="printed: 'Isaiah. L.iij' (Liij., the fifty-third chapter, set with a stray point, "
                                                     "as the sermons before and after print 'Liij.' and 'Liii.'); verses 9 and 10 printed in the quoted text")}),
    dict(tcp="A17724", series="ps119", short="Two and twenty sermons upon Psalm 119", mode="fixed", book="Psalms", chapter=119,
         printed="heading: 'vpon the hundreth and ninteene Psalme'"),
    dict(tcp="A17722", series="jacob-esau", short="Thirteen sermons on Jacob and Esau", mode="bibl", manual={
        9: dict(reference="Genesis 26:26-32", printed="heading: 'The tenth Sermon of Iacob and Esau, Genesis 26.'; verses 26-32 printed in "
                "the quoted text, then 'Chapter. 27. verse. 1.' and a verse '2' whose words ('Who were a greefe of minde to Isaack and "
                "Rebecca') are Genesis 26:35 in the KJV: that tail is not recorded")}),
    dict(tcp="A17696", series="melchizedek", short="Sermons on Melchizedek and Abraham", mode="bibl"),
    dict(tcp="A17692", series="four-sermons", short="Four godly sermons against idolatry", mode="bibl", manual={
        1: dict(reference="Psalms 16:4", printed="heading: 'taken out of the .iij. verse of the .xvj. Psalme' (Horne, 1561); Fielde's 1579 translation (TCP A17694) prints 'vpon the 4. verse of the 16. Psalme', the verse the quoted words are in the KJV"),
        2: dict(reference="Hebrews 13:13", printed="heading: 'taken of this saying, in the .13. Cap. to the Hebrues'; the same sermon in TCP A17693 prints 'Heb. 13.13.'"),
        3: dict(reference="Psalms 27:4", printed="heading: 'this sentence of the. Psalm. 27.'; Fielde's translation (TCP A17694) prints 'the 27. Psalme ... Ver. 4.'"),
        4: dict(reference="Psalms 27:8", printed="heading: 'this sentence of the .27. Psalme'; Fielde's translation (TCP A17694) prints 'a Theame out of the 27. Psalme ... Vers. 8.'"),
    }),
    dict(tcp="A17716", series="hezekiah", short="Sermons upon the song of Hezekiah", mode="fixed", book="Isaiah", chapter=38,
         printed="title page: 'conteyned in the 38. Chapiter of Esay'"),
    dict(tcp="A69062", series="two-1555", short="Two godly and notable sermons (1555)", mode="bibl", dated=True),
]
# Misprints found by reading, where the automatic check cannot tell (the printed verse shares the quoted words):
# (TCP id, division): what the page prints and what the quoted words are. Listed unplaced, not corrected.
MISPRINTS = {
    ("A12167", 19): "printed 'CANT. VI. II.', but the words quoted ('I am my Beloveds and my Beloved is mine, he feedeth among the Lillies') are Song 6:3 in the KJV",
    ("A12167", 20): "printed 'CANT. VI. II.', but the words quoted ('I am my Beloveds and my Beloved is mine, he feedeth among the Lillies') are Song 6:3 in the KJV",
    ("A12185", 1): "printed '2 COR. 2. 9.', but the words quoted ('Eye hath not seen, nor Eare heard') are 1 Corinthians 2:9, the text the "
                   "book's other three sermons print",
    ("A39663", 38): "printed 'ISAIAH LIII.II.', but the words quoted ('He shall see the Travel of his Soul and be satisfied') are Isaiah 53:11 in the KJV",
    ("A69056", 124): "the heading prints 'the third vpon the .xxxiiij. Chapter', but the words quoted ('God vvill speake once or tvvice') "
                     "are Job 33:14-17, and the sermons before and after are the second and fourth upon chapter 33",
    ("A69056", 126): "the quoted text is numbered '29', but its words ('He shal pray, God and appease him') are Job 33:26 in the KJV, "
                     "and the sermon's own note says it is still upon verses 23-25 'and then vpon that which is added heere'",
}
WITNESSES = {  # held books whose sermons are already counted in another book above: no records, listed in the run report
    "calvin": [dict(tcp="A17717", note="Sermons upon the Ten Commandments (16): the same sermons as Deuteronomy 4:44-6:4 in A17698"),
               dict(tcp="A17636", note="Certain homilies (3): the same sermons as the Four godly sermons, A17692"),
               dict(tcp="A17694", note="Four sermons, Fielde's translation (1579): the same four sermons as A17692"),
               dict(tcp="A17725", note="Two godly and learned sermons (Munday): the first two of the Four sermons, A17692"),
               dict(tcp="A17693", note="A sermon ... exhortation to suffer persecution (Heb. 13:13): the second of the Four sermons, A17692")],
}
PREACHERS = {
    "calvin": dict(author="author-john-calvin", era="reformation", texts=CALVIN),
    "bullinger": dict(author="author-heinrich-bullinger", era="reformation", texts=[
        dict(tcp="A17183", series="decades", short="Fifty sermons divided into five decades", mode="none", ordinal="decade",
             reason="a doctrinal sermon: its heading names a topic and no Bible text is printed at its head"),
        dict(tcp="B11837", series="apocalypse", short="A hundred sermons upon the Apocalypse", mode="none",
             reason="the sermon opens by quoting Revelation with no chapter or verse printed"),
        dict(tcp="A17215", series="end-of-world", short="Of the end of the world (two sermons)", mode="none",
             reason="no Bible reference printed at the head"),
        dict(tcp="A17190", series="lords-supper", short="A sermon of the Lord's Supper", mode="none", reason="no Bible reference printed at the head"),
        dict(tcp="A17223", series="magistrates", short="A treatise or sermon concerning magistrates and subjects", mode="none",
             reason="no Bible reference printed at the head"),
    ]),
    "flavel": dict(author="author-john-flavel", era="post-reformation", texts=[
        dict(tcp="A39663", series="fountain", short="The Fountain of Life", mode="bibl",
             skip={43: "'The General Use of the whole', the book's closing application after its 42 sermons, not a sermon"},
             manual={23: dict(reference="Matthew 26:47-49",
                              printed="printed: 'MAT. XXVI.XL VII, XL VIII, XLIX.' (XLVII and XLVIII set with a space inside the numeral)")}),
        dict(tcp="A39669", series="method-grace", short="The Method of Grace", mode="bibl"),
        dict(tcp="A39660", series="englands-duty", short="England's Duty (Rev. 3:20)", mode="bibl"),
    ]),
    "sibbes": dict(author="author-richard-sibbes", era="post-reformation", texts=[
        dict(tcp=t, series=s, short=title, mode="bibl") for t, s, title in [
            ("A12167", "bowels", "Bowels Opened"), ("A12190", "backslider", "The Returning Backslider"),
            ("A12166", "beams", "Beams of Divine Light"), ("A93248", "glorious-feast", "The Glorious Feast of the Gospel"),
            ("A12197", "saints-safety", "The Saints' Safety in Evil Times"), ("A12177", "christians-end", "The Christian's End"),
            ("A12185", "glance-heaven", "A Glance of Heaven"), ("A12180", "exaltation", "Christ's Exaltation Purchased by Humiliation"),
            ("A12187", "miracle", "A Miracle of Miracles"), ("A12205", "john14", "Two Sermons upon John 14:1"),
            ("A12209", "two-sermons", "Two Sermons (The Spouse; The Power of Christ's Resurrection)"),
            ("A12170", "brides-longing", "The Bride's Longing"), ("A12178", "christians-portion", "The Christian's Portion"),
            ("B00698", "fountain-sealed", "A Fountain Sealed")]]),
    "owen": dict(author="author-john-owen", era="post-reformation", texts=[
        dict(ccel="source-ccel-expansion/asset-expanded-7c2360b3c3a34c57f625", url="https://ccel.org/ccel/o/owen/sermons.xml",
             series="ccel", short="Sermons of John Owen (CCEL; Goold's Works vols. 8-9)", mode="ccel")]),
}
DATE = re.compile(r"(?:On\s+)?(?:\w+day|Sondaye|Sonday)\s+the\s+[^.]*?\.?\s*of\s+\w+\.?\s*(1[56]\d\d)", re.I)


def held_path(cfg):
    if "tcp" in cfg:
        return SOURCES / "library" / "source-tcp-bulk" / f"asset-bulk-tcp-{cfg['tcp'].lower()}" / "original.xml"
    return SOURCES / "library" / cfg["ccel"] / "original.xml"


def containers():
    """{sha256 prefix (12): work id} for every held book already catalogued, read from asset records and from the
    reconciled edition labels ('... held source edition 959031f365b8')."""
    editions, found = {}, {}
    for path in (CATALOG / "editions").glob("*.json"):
        record = json.loads(path.read_text(encoding="utf-8"))
        editions[record["id"]] = record["workId"]
        match = re.search(r"held source edition ([0-9a-f]{12})", record.get("label") or "")
        if match:
            found.setdefault(match.group(1), record["workId"])
    for path in (CATALOG / "assets").glob("asset-bulk-tcp-*.json"):
        record = json.loads(path.read_text(encoding="utf-8"))
        if record.get("sha256") and record.get("editionId") in editions:
            found[record["sha256"][:12]] = editions[record["editionId"]]
    return found


def head_reference(head):
    """'The second Sermon, Genesis 25. Chapter.' -> the book and chapter the heading prints, or None."""
    for match in re.finditer(r"((?:[1-3]\s)?[A-Z][a-zſ]{2,})\.?\s+(\d+|[ivxlc]+)\b\.?", texts.plain(head)):
        read, _ = texts.printed_reference(match.group(0))
        if read and _book_ok(read[0]):
            return read
    return None


def _book_ok(book):
    try:
        sermon_passages.normalise_book(book)
        return True
    except RefError:
        return False


def chapter_verses(chapters, sermon):
    """Heading mode: the chapters the heading names, and the verse numbers printed in the quoted text, chapter by
    chapter (a number lower than the last starts the next chapter the heading names; with none left it is skipped)."""
    numbers, values, at = texts.verse_numbers(sermon["lead"]), {}, 0
    if not chapters:
        return {}, []
    skipped = []
    starts_unnumbered = sermon["lead"] and not re.match(r"\d", sermon["lead"])
    if chapters[0][1] and (starts_unnumbered or not numbers):
        values.setdefault(chapters[0][0], []).append(1)
    for value in numbers:
        current = values.get(chapters[at][0], [])
        if current and value < current[-1]:
            if at + 1 < len(chapters):
                at += 1
            else:
                skipped.append(value)
                continue
        values.setdefault(chapters[at][0], []).append(value)
    for chapter, first in chapters[1:]:
        if first and 1 not in values.get(chapter, []):
            values.setdefault(chapter, []).insert(0, 1)
    for chapter, _ in chapters:
        values.setdefault(chapter, [])
    return values, skipped


def main_text(cfg, sermon):
    """(modern reference, what the page prints, problem) for one sermon, by its book's mode."""
    if sermon.get("lost"):
        return None, None, f"heading lost in two pages missing from the transcribed copy; the text runs on inside sermon {sermon['lost']}'s division, boundary not verified"
    manual = cfg.get("manual", {}).get(sermon["index"])
    if manual:
        return manual["reference"], manual["printed"], None
    mode = cfg["mode"]
    if mode == "none":
        return None, None, cfg["reason"]
    if mode == "heading":
        chapters = texts.chapters_in_heading(sermon["head"])
        if not chapters and sermon.get("parentType") == "chapter" and (sermon.get("parentN") or "").isdigit():
            chapters = [(int(sermon["parentN"]), False)]
        values, skipped = chapter_verses(chapters, sermon)
        if not values:
            return None, None, f"no chapter printed in the heading: '{sermon['head'][:80]}'"
        differs = [cfg.get("versification", {}).get(c) for c in values if c in cfg.get("versification", {})]
        if differs:
            return None, None, f"heading: '{sermon['head'][:100]}': {differs[0]}"
        pieces = [texts.modern(cfg["book"], c, texts.spans_of(v)) for c, v in values.items()]
        printed = f"heading: '{sermon['head'][:140]}'; verse numbers printed at its head: {texts.verse_numbers(sermon['lead']) or 'none'}"
        return "; ".join(pieces), printed + (f" (out of order, not used: {skipped})" if skipped else ""), None
    if mode == "fixed":
        spans = texts.spans_of(texts.verse_numbers(sermon["lead"]))
        return texts.modern(cfg["book"], cfg["chapter"], spans), cfg["printed"] + (f"; verse numbers printed: {texts.verse_numbers(sermon['lead'])}" if spans else ""), None
    read, problem = texts.printed_reference(sermon["bibl"]) if sermon["bibl"] else (None, "no reference printed at the head")
    if read and not _book_ok(read[0]):
        read, problem = None, f"book not recognised in the printed reference '{sermon['bibl'][:60]}'"
    printed = f"printed: '{sermon['bibl'][:80]}'"
    if not read:
        from_head = head_reference(sermon["head"])
        if not from_head:
            return None, None, f"{problem}" + (f" ('{sermon['bibl'][:40]}')" if sermon["bibl"] else "")
        read, printed = from_head, f"heading: '{sermon['head'][:100]}'"
        if sermon["bibl"]:
            printed += f"; printed at the head: '{sermon['bibl'][:40]}'"
    book, chapter, spans = read
    book = BOOK_NAME[sermon_passages.normalise_book(book)]  # the record names the book as the site does: 'JOH' -> 'John'
    if not spans:
        # 'Chapter xxvij.' printed inside the quoted text (Calvin's Divers sermons): the verses after it are that chapter's
        parts = re.split(r"\bChap(?:ter|\.)?\s+([ivxlcjIVXLCJ]+)\b\.?", texts.plain(sermon["lead"]))
        numbers = texts.verse_numbers(parts[0])
        if sermon["bibl"].strip().isdigit() and printed.startswith("heading"):  # Jacob and Esau tags each verse number as a
            numbers = [int(sermon["bibl"])] + numbers  # reference: the first one, read as the head's, is the first verse
        pieces = [(chapter, numbers)] + [(texts.number(c), texts.verse_numbers(t)) for c, t in zip(parts[1::2], parts[2::2])]
        if numbers or len(pieces) > 1:
            printed += f"; verse numbers printed in the quoted text: {numbers}" + "".join(
                f", then 'Chapter {c}': {v}" for c, v in pieces[1:])
        if len(pieces) > 1:
            return "; ".join(texts.modern(book, c, texts.spans_of(v)) for c, v in pieces if v), printed, None
        spans = texts.spans_of(numbers)
    return texts.modern(book, chapter, spans), printed, None


KJV_TEXT, CODES, BOOK_NAME = {}, [code for code, *_ in BOOKS], {code: name for code, name, *_ in BOOKS}


def kjv_words(verse):
    """Content words of one KJV verse, by verse id."""
    code, chapter, number = CODES[verse // 1000000 - 1], verse // 1000 % 1000, verse % 1000
    if code not in KJV_TEXT:
        KJV_TEXT[code] = json.loads((SITE / "data" / "plain" / "kjv" / f"{code}.json").read_text(encoding="utf-8"))
    return texts.content_words(KJV_TEXT[code].get(f"{chapter}:{number}", ""))


def quoted_check(passages, lead):
    """None, or why the printed reference is a misprint: the words quoted at the sermon's head are, in the KJV, a verse
    of the same chapter outside the printed range (Flavel 'ISAIAH LIII.II.' quoting 'He shall see the travel of his
    soul', 53:11). Only a clear case counts: five or more quoted words, under a third of them in the printed verses,
    two thirds or more in one other verse. A sermon that quotes nothing, or only '&c.', is not judged."""
    quoted = texts.content_words(" ".join(lead.split()[:40]))
    if len(quoted) < 5 or not passages:
        return None
    def share(verse):
        words = kjv_words(verse)
        return len(words & quoted) / max(1, min(len(words), len(quoted)))
    inside = max(share(v) for p in passages for v in range(p["start"], p["end"] + 1) if v % 1000)
    if inside >= 1 / 3:
        return None
    first = passages[0]["start"] // 1000 * 1000
    best = max(range(first + 1, first + 177), key=lambda v: share(v) if kjv_words(v) else 0)
    if best == passages[0]["start"] - 1 and passages[0]["start"] % 1000 in texts.verse_numbers(lead):
        return None  # the head quotes the end of the verse before the numbered ones it prints (Deuteronomy 22)
    if share(best) >= 2 / 3:
        return f"the words quoted at the head ('{' '.join(lead.split()[:12])}') are {CODES[best // 1000000 - 1]} {best // 1000 % 1000}:{best % 1000} in the KJV"
    return None


def sermons_of(cfg):
    path = held_path(cfg)
    if not path.is_file():
        return None
    if "tcp" in cfg:
        rows = texts.tei_sermons(path)
        for row in rows:
            row["ordinal"] = row["index"]
            if cfg.get("ordinal") == "n":  # the printed number: TCP's n, else the heading's ("The threescore Sermon")
                printed = re.search(r"The\.?\s+([\w .]+?)\s+Sermon", texts.plain(row["head"]))
                row["ordinal"] = int(row["n"]) if (row["n"] or "").isdigit() else (printed and texts.ordinal(printed.group(1))) or row["index"]
            if row["index"] in cfg.get("fix", {}):
                row["ordinal"], row["fixed"] = cfg["fix"][row["index"]]
            if cfg.get("ordinal") == "decade":
                row["ordinal"] = row["index"]
                row["head"] = f"Decade {row['parentN']}, sermon {row['n']}: {row['head']}"
            row["where"] = f"TCP {cfg['tcp']}, <div type=\"sermon\"> {row['index']} of {len(rows)}" + (f" (n={row['n']})" if row["n"] else "")
        return rows
    rows = texts.thml_sermons(path)
    for row in rows:
        row.update(ordinal=row["index"], head=row["title"], bibl=re.split(r"\.\s(?=(?:[1-3]\s)?[A-Z][a-z]+\.?\s[ivxlc]+\b)", row["title"])[-1], lead="",
                   where=f"CCEL owen/sermons.xml, <div2 id=\"{row['id']}\"> in '{row['part']}'")
    return rows


def sermon_work(name, preacher, cfg, sermon, container, passages, notes):
    ident = f"work-sermons-{name}-{cfg['series']}-{sermon['ordinal']:03d}"
    url = TCP_URL.format(cfg["tcp"]) if "tcp" in cfg else cfg["url"]
    title = sermon["head"] if "ccel" in cfg else f"{cfg['short']}, sermon {sermon['ordinal']}"
    dates = []
    date = DATE.search(texts.plain(sermon["head"])) if cfg.get("dated") else None
    if date:
        dates.append(dict(event="delivery", value=date.group(1), precision="year", label=f"As printed: '{date.group(0)}' (not converted)",
                          evidence=[dict(url=url, locator=sermon["where"], note="Preaching day and year as printed in the sermon's heading.", checkedOn=TODAY)]))
    work = {"$schema": "../../schema.json", "schemaVersion": 1, "kind": "work", "id": ident, "editorialState": "catalogued",
            "notes": notes, "reviews": [REVIEW], "title": title,
            "alternateTitles": [sermon["head"]] if sermon["head"] and sermon["head"] != title else [],
            "creators": [dict(authorId=preacher["author"], role="preacher")], "genre": "sermon", "role": "core-teaching",
            "collections": ["sermons"], "subjects": [], "occasions": [], "audiences": ["general"], "depth": "unknown",
            "era": preacher["era"], "dates": dates, "passages": passages,
            "related": [dict(relation="is-part-of", targetId=container, locator=sermon["where"])] if container else [],
            "externalIds": dict(officialDestination=[url]),
            "evidence": [dict(url=url, locator=sermon["where"], note="Sermon boundary and heading as marked in the held clean text; split by scripts/catalog-historic-sermons.py.", checkedOn=TODAY)]}
    return work


def catalogue(name, verses, owners, ceiling, dry_run):
    preacher, works, unplaced, missing, skipped, counts = PREACHERS[name], [], [], [], [], Counter()
    for cfg in preacher["texts"]:
        rows = sermons_of(cfg)
        if rows is None:
            missing.append(dict(source=cfg.get("tcp") or cfg.get("ccel"), path=str(held_path(cfg))))
            continue
        for index, reason in cfg.get("skip", {}).items():  # a division the transcription tags as a sermon that is not one
            skipped.append(dict(source=cfg["tcp"], division=index, reason=reason))
        rows = [r for r in rows if r["index"] not in cfg.get("skip", {})]
        sha = __import__("hashlib").sha256(held_path(cfg).read_bytes()).hexdigest()
        container = owners.get(sha[:12])
        if not container:
            counts["sermons in a book with no catalogue work to belong to"] += len(rows)
        for ordinal, before in cfg.get("lost", {}).items():
            host = next(r for r in rows if r["ordinal"] == before)
            rows.append(dict(index=None, n=None, head="", bibl="", lead="", gaps=0, ordinal=ordinal, lost=before,
                             where=f"inside {host['where']} (the sermon numbered {before}), after its missing-pages gap"))
        for sermon in rows:
            reference, printed, problem = main_text(cfg, sermon)
            passages, notes = [], [f"Split from {cfg['short']}; held file {held_path(cfg).relative_to(SOURCES).as_posix()} (sha256 {sha[:12]}…)."]
            if sermon.get("lost"):
                notes.append(f"The heading of this sermon is lost: it fell in two pages missing from the copy the Text Creation Partnership "
                             f"transcribed. The printed series runs {sermon['lost']}, then {sermon['ordinal'] + 1}, and the division of sermon "
                             f"{sermon['lost']} holds about twice a sermon's text with a 'missing, 2 pages' gap inside it, so this sermon is "
                             "held as the text after that gap. Its boundary is not verified; no Bible text or date is recorded.")
            if sermon.get("fixed"):
                notes.append(f"Numbered {sermon['ordinal']}: {sermon['fixed']}.")
            if sermon.get("gaps"):
                notes.append(f"The held transcription marks {sermon['gaps']} illegible or missing passage(s) in this sermon.")
            if reference:
                try:
                    passages = sermon_passages.passages(reference, verses, f"{sermon['where']}; {printed}")
                except RefError as error:
                    problem = f"{printed}: {error}"
                misprint = quoted_check(passages, sermon["lead"]) if passages and not cfg.get("manual", {}).get(sermon["index"]) else None
                misprint = MISPRINTS.get((cfg.get("tcp"), sermon["index"]), misprint)
                if misprint:
                    passages, problem = [], f"{printed}; misprint, not corrected: {misprint}"
            ident = f"work-sermons-{name}-{cfg['series']}-{sermon['ordinal']:03d}"
            if problem:
                unplaced.append(dict(workId=ident, title=sermon["head"][:120], reason=problem))
            counts["placed" if passages else "listed without a passage"] += 1
            works.append(sermon_work(name, preacher, cfg, sermon, container, passages, notes))
    ids = Counter(w["id"] for w in works)
    clashes = [i for i, n in ids.items() if n > 1]
    if clashes:
        sys.exit(f"{name}: two sermons share a series and ordinal: {clashes[:10]}")
    if len(works) > ceiling:
        sys.exit(f"{name}: {len(works)} sermons exceed the plan's checked ceiling of {ceiling}")
    if not dry_run:
        for work in works:
            (CATALOG / "works" / f"{work['id']}.json").write_text(json.dumps(work, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    report = dict(preacher=name, generatedBy="scripts/catalog-historic-sermons.py", generatedOn=TODAY,
                  plan="reports/sermons-campaign/historic-splitting-20261126/plan.json", counts=dict(counts, sermons=len(works)),
                  ceiling=ceiling, unplaced=unplaced, missingHeldFiles=missing, notSermons=skipped, witnessesNotCounted=WITNESSES.get(name, []))
    if not dry_run:
        (REPORTS / name).mkdir(exist_ok=True)
        (REPORTS / name / "catalogue-run.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("preachers", nargs="+", choices=sorted(PREACHERS))
    parser.add_argument("--dry-run", action="store_true", help="read and check everything; write nothing")
    args = parser.parse_args()
    plan = {p["id"]: p for p in json.loads(PLAN.read_text(encoding="utf-8"))["preachers"]}
    verses, owners = Verses(SITE / "data"), containers()
    for name in args.preachers:
        report = catalogue(name, verses, owners, plan[PREACHERS[name]["author"]]["checkedCeiling"], args.dry_run)
        print(name, report["counts"], "unplaced:", len(report["unplaced"]), "missing files:", len(report["missingHeldFiles"]))
        if args.dry_run:
            for entry in report["unplaced"]:
                print("  ", entry["workId"], "|", entry["reason"])


if __name__ == "__main__":
    main()
