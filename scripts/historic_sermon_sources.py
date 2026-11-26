"""Held books for the second round of the historic sermons split (job 4b5ae800, 2026-11-26): Rutherford, Boston,
Goodwin, Watson, Perkins's Jude and Whitefield's Eighteen Sermons. Read by scripts/catalog-historic-sermons.py, which
merges PREACHERS, MISPRINTS and WITNESSES into its own.

Each book is a TCP hand-typed TEI file (tcp=) or a Monergism e-book (epub=, the held asset folder under
sources/library). Besides the modes in catalog-historic-sermons.py:
  epub        the reference printed after the dash in the sermon's heading, else at the end of its opening quotation
  toc         Goodwin's Ephesians: the body prints only '—VER. 3.'; the contents page prints 'SERMON XL.—EPHESIANS 2 2'.
              The chapter is taken from the contents page only where its verses agree with the body's.
  verse-unit  Perkins's Jude: units of an exposition with no sermon break printed; genre "commentary" (the vocabulary has no "exposition"), never "sermon"
expect is the number of sermons the book is read to hold (after skip): a different count stops the run.
strict turns on the check of the quoted words against the printed verses for every sermon of the book.
Single-sermon books already catalogued as one record are not here: scripts/relabel-historic-sermons.py marks those.
"""

import json
import os
import re
import sys

import historic_sermon_texts as texts
from bible.paths import SITE

PRIVATE_CATALOG = SITE / "content" / "library" / "reports" / "campaign-reconciliation" / "catalogue" / "private-catalog.jsonl"
REVIEW = dict(date="2026-11-26", reviewer="Claude", kind="ai-assisted",
              scope="Historic sermons split, second round (job 4b5ae800): sermon boundary, heading and printed main text read from "
                    "the held clean text, quoted words checked against the printed verses; not a full-text proofread.")
BOSTON_HEADING = r"^SERMON\s+[IVXLC]+:?$"
TOC_SKIP = "a contents-page entry: the TCP transcription tags each line of the book's table of contents as a sermon"
BOD_SKIP = "a head of the catechism exposition (Body of Practical Divinity): a topic unit with no sermon break printed, not a sermon"

PREACHERS = {
    "rutherford": dict(author="author-l13-samuel-rutherford", era="post-reformation", role="historical-context", texts=[
        dict(tcp="A57982", series="trial-triumph", short="The Trial and Triumph of Faith", mode="bibl", expect=27, strict=True, ordinal="n",
             skip={i: TOC_SKIP for i in range(1, 28)}),
        dict(epub="source-monergism-library/asset-expanded-461145d293c0ad7ad574", series="communion", expect=14, strict=True,
             short="Fourteen Communion Sermons (ed. A. A. Bonar)",
             mode="epub", heading=r"(?i)^SERMON\s+[IVXLC]+\b"),
        dict(epub="source-monergism-library/asset-expanded-cf5df9865129d364996a", series="quaint", expect=18, strict=True,
             short="Eighteen Quaint Sermons",
             mode="epub", heading=r"^(?!By Samuel|Preface$|Eighteen Quaint)"),
        dict(tcp="A57979", series="commons-1644", short="A sermon preached to the House of Commons (1644)", mode="bibl", expect=1, strict=True),
        dict(tcp="A92145", series="lords-1645", short="A sermon preached before the House of Lords (1645)", mode="bibl", expect=1, strict=True),
    ]),
    "boston": dict(author="author-thomas-boston", era="eighteenth-century", ceiling=81, texts=[
        dict(epub="source-monergism/asset-historical-ready-21390df828806cbcf1", series="sixty-six", expect=66, strict=True,
             short="Sixty-Six Sermons", mode="epub", heading=BOSTON_HEADING),
        dict(epub="source-monergism-library/asset-expanded-2112a2fac9adf2c369dc", series="duly-prized", expect=8, strict=True,
             short="Christ Jesus Duly Prized", mode="epub", heading=BOSTON_HEADING),
        dict(epub="source-monergism-library/asset-expanded-be752e820127fadd1b3c", series="amiable", expect=7, strict=True,
             short="Amiable Professors Falling Short of Heaven",
             mode="epub", heading=BOSTON_HEADING),
    ]),
    "goodwin": dict(author="author-thomas-goodwin", era="post-reformation", texts=[
        dict(epub="source-monergism/asset-historical-ready-cf987f89f3072f7a0d", series="ephesians", expect=60, strict=True,
             short="Sermons on Ephesians 1:1-2:11", mode="toc",
             heading=r"^SERMON\s+[IVXLC]+\.?$", contents=r"^SERMON\s+[IVXLC]+\.?\s*[—–]"),
        dict(epub="source-monergism/asset-historical-ready-cf987f89f3072f7a0d", series="ephesians-other", expect=3, strict=True,
             short="Sermons on Ephesians (appended to the Ephesians volume)",
             mode="epub", heading=r"^(?:A|THE SECOND) SERMON ON\b",
             skip={1: "Part I of 'A Sermon on Ephesians 2:14-16': one sermon in two parts, held as its own book, Christ the "
                      "Universal Peace-maker (TCP A85431, 1651), which carries its record",
                   2: "Part II of 'A Sermon on Ephesians 2:14-16': see Part I"}),
        dict(epub="source-monergism-library/asset-expanded-f36138a756836cceac69", series="repentance", expect=2, strict=True,
             short="On Repentance (two sermons)", mode="epub", heading=r"^SERMON\s+[IVX]+$"),
    ]),
    "watson": dict(author="author-thomas-watson", era="post-reformation", texts=[
        dict(tcp="A65313", series="seven", short="Seven Sermons on Several Select Subjects", mode="bibl", expect=6, strict=True,
             skip={6: "the same sermon as Light in Darkness (TCP A65301, printed on its own in 1679; 887 shared six-word runs), "
                      "which carries its record"}),
        dict(tcp="A96093", series="beatitudes-added", short="The Beatitudes: the sermons added to it", mode="bibl", expect=10, strict=True),
        dict(tcp="A65299", series="drawing-near", short="The Happiness of Drawing Near to God (printed with Heaven Taken by Storm)",
             mode="bibl", expect=1, strict=True,
             skip={1: "Heaven Taken by Storm: a treatise of 40,842 words with no sermon break printed (TCP tags it as one sermon)"}),
        dict(tcp="A65285", series="body-divinity-added", short="A Body of Practical Divinity: the sermons added to it", mode="bibl",
             expect=5, strict=True, skip={**{i: BOD_SKIP for i in range(1, 83)},
                                         83: "the exposition of the Lord's Prayer (180,571 words), not a sermon"}),
    ]),
    "perkins": dict(author="author-william-perkins", era="post-reformation", texts=[
        dict(tcp="A09434", series="jude", short="A Godly and Learned Exposition upon the Whole Epistle of Jude", mode="verse-unit",
             genre="commentary", expect=21,
             note="The title page says 'containing threescore and six sermons preached in Cambridge'; the printed book divides "
                  "the exposition by verse and prints no sermon break, so the 66 sermons cannot be recovered from it. This "
                  "record is one verse unit of that exposition, not a sermon."),
    ]),
    "whitefield": dict(author="author-george-whitefield", era="eighteenth-century", ceiling=18, texts=[
        dict(tcp="N25065", series="eighteen-gurney", short="Eighteen Sermons (taken in shorthand by Joseph Gurney, 1771)",
             mode="bibl", expect=18, strict=True,
             note="Taken down in shorthand as preached and published by Joseph Gurney after Whitefield's death (1771)."),
    ]),
}

# (source, division): what the page prints, where the automatic checks cannot tell. Listed unplaced, not corrected.
MISPRINTS = {
    ("A96093", 7): "printed 'Titus 2. • 3.': one figure is illegible in the copy transcribed (the • is the transcriber's mark), "
                   "and the words quoted ('Looking for that blessed hope, and the glorious appearing') are Titus 2:13 in the KJV",
}

WITNESSES = {  # held books whose sermons are counted in a book above or in a record of their own: no new records
    "rutherford": [
        dict(tcp="A57965", note="Christ's Napkin (1633), Rev. 21:4-8: the same sermon as Communion Sermons X (Rev. 21:4-7); no catalogue record held"),
        dict(tcp="A11197", note="Christ and the Doves (1630s), Cant. 2:14-17: the same sermon as Communion Sermons XI; no catalogue record held"),
        dict(epub="source-monergism-library/asset-expanded-d9667eb4336238a48adb", note="The Forlorn Son: Eighteen Quaint Sermons IX-XV"),
        dict(epub="source-monergism-library/asset-expanded-9c77df4ce57bcfa9a077", note="The Unshakeable Kingdom: the Commons sermon of 1644 (TCP A57979, Dan. 6:26)"),
        dict(epub="source-monergism-library/asset-expanded-2bb3fd2f0aee728479ec", note="The Trial and Triumph of Faith, modern e-book of TCP A57982"),
    ],
    "boston": [
        dict(epub="source-monergism-library/asset-expanded-003e741dbdf81560e502", note="Christ's Invitation to the Labouring and Heavy Laden (4): Sixty-Six Sermons XVIII-XXI"),
        dict(epub="source-monergism-library/asset-expanded-396296b4e3b39d9803cb", note="Liberty to the Captives (10): Sixty-Six Sermons XLVI-LV"),
        dict(epub="source-monergism-library/asset-expanded-b7e498fe021f6aa51cfe", note="I Count All Things But Loss (8): the same eight sermons on Phil. 3:8-9 as Christ Jesus Duly Prized"),
    ],
    "goodwin": [
        dict(tcp="A85442", note="The World to Come (two lectures on Eph. 1:21-22): Ephesians sermons XXXIII-XXXIV (the first lecture opens with the same words as XXXIII; the second's argument is XXXIV's)"),
        dict(tcp="A85438", note="A Sermon of the Fifth Monarchy (Rev. 5:9-10): attribution to Goodwin disputed; not counted"),
        dict(tcp="A41543", note="Thomas Goodwin d. 1658, a namesake: not counted"),
        dict(tcp="A01894", note="Aggravation of Sin and Sinning against Knowledge and Mercy: the title page says 'delivered in several "
                                "sermons', but the book prints three discourses (Rom. 7:13, Rom. 1:21, Rom. 2:4-5) with no sermon break: "
                                "sermon-derived, not counted as sermons and not split"),
    ],
}


def epub_rows(cfg, path):
    """The sermons of an e-book (historic_sermon_texts.epub_sermons), each with its contents-page line in toc mode."""
    rows = texts.epub_sermons(path, re.compile(cfg["heading"]))
    contents = texts.epub_contents(path, re.compile(cfg["contents"])) if cfg["mode"] == "toc" else []
    if contents and len(contents) != len(rows):
        sys.exit(f"{cfg['series']}: the contents page lists {len(contents)} sermons and the body heads {len(rows)}")
    for k, row in enumerate(rows):
        row.update(ordinal=row["index"], toc=contents[k] if contents else None,
                   where=f"{cfg['short']} (held e-book), sermon heading {row['index']} of {len(rows)}: '{row['head'][:60]}'")
    return rows


def toc_reading(sermon):
    """Goodwin's Ephesians: (book, chapter, spans) from the contents page when its verses are the ones the body prints
    ('—VER. 4, 5, &c.'), else (None, why)."""
    listed, problem = texts.printed_reference(re.split(r"[—–]", sermon["toc"], maxsplit=1)[-1])
    body = re.search(r"[—–]\s*VER\.?\s*([\d,\s–-]+(?:&c\.?)?)\.?\s*$", sermon["lead"], re.I)
    if not listed or not body:
        return None, f"contents page: '{sermon['toc']}'; the sermon's head prints {'no verse' if not body else body.group(0)}: {problem or ''}"
    printed, _ = texts.printed_reference(f"{listed[0]} {listed[1]}:{body.group(1)}")
    if not printed or printed[2] != listed[2]:
        return None, f"contents page prints '{sermon['toc']}' but the sermon's head prints '{body.group(0).strip('—– ')}': they do not agree"
    return listed, None


def verse_unit_rows(cfg, path):
    """Perkins's Jude: one row per verse unit, its verses as printed (historic_sermon_texts.tei_verse_units)."""
    rows = texts.tei_verse_units(path)
    for row in rows:
        row.update(ordinal=row["index"], bibl="", lead="", gaps=0,
                   where=f"TCP {cfg['tcp']}, <div type=\"verse\"> {row['index']} of {len(rows)} (n={row['n']})")
    return rows


def source_url(cfg, sha, tcp_url):
    """Where the held text came from: the TCP repository, the CCEL address, or the e-book's address as the
    reconciliation catalogue recorded it when the file was acquired (matched by checksum)."""
    if "tcp" in cfg:
        return tcp_url.format(cfg["tcp"])
    if "url" in cfg:
        return cfg["url"]
    with PRIVATE_CATALOG.open(encoding="utf-8") as lines:
        for line in lines:
            record = json.loads(line)
            if record.get("sha256") == sha and record.get("url"):
                return record["url"]
    sys.exit(f"{cfg['series']}: no source address recorded for held file {sha[:12]} in {PRIVATE_CATALOG.name}")


def write_json(path, data):
    """Write whole or not at all: a temporary file beside the target, then a rename over it."""
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    os.replace(temporary, path)
