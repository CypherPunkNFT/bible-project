"""Every version the site offers, in the order the picker shows them.

numbering: the verse-numbering tradition. "english" = KJV numbering; "hebrew" = Masoretic (Psalm titles are
verse 1, Malachi has 3 chapters); "greek" = Septuagint (Psalms 10-147 one behind); "vulgate" = Latin Vulgate
numbering (same Psalm offset as the Greek); "mixed" = partly Hebrew, partly KJV (Louis Segond); "synodal" = Russian
Synodal (Psalm titles are verse 1 and the Psalms follow the Greek order, but Malachi has 4 chapters). Reported by
build-data.py's numbering report; nothing enforces it. Anything but "english" hides the KJV-numbered
cross-references and reading progress for that version.
strongs: keep Strong's numbers from this source (only where they are reliable and licence-clean).
"""

TRANSLATIONS = [
    # id,          abbr,    name,                                         year, lang,  dir,   numbering, strongs
    ("eng-kjv",     "KJV",   "King James Version",                          1611, "en",  "ltr", "english", True),
    ("engbsb",      "BSB",   "Berean Standard Bible",                       2023, "en",  "ltr", "english", False),
    ("engwebp",     "WEB",   "World English Bible",                         2020, "en",  "ltr", "english", False),
    ("eng-asv",     "ASV",   "American Standard Version",                   1901, "en",  "ltr", "english", False),
    ("engylt",      "YLT",   "Young's Literal Translation",                 1898, "en",  "ltr", "english", False),
    ("engDBY",      "DBY",   "Darby Translation",                           1890, "en",  "ltr", "english", False),
    ("eng-rv",      "RV",    "Revised Version",                             1895, "en",  "ltr", "english", False),
    ("engwebster",  "WBT",   "Noah Webster Bible",                          1833, "en",  "ltr", "english", False),
    ("enggnv",      "GNV",   "Geneva Bible",                                1599, "en",  "ltr", "english", False),
    ("engtnt",      "TNT",   "Tyndale New Testament",                       1534, "en",  "ltr", "english", False),
    ("engWycliffe", "WYC",   "Wycliffe Bible",                              1395, "enm", "ltr", "english", False),
    ("engDRA",      "DRA",   "Douay-Rheims",                                1899, "en",  "ltr", "vulgate", False),
    ("engBBE",      "BBE",   "Bible in Basic English",                      1949, "en",  "ltr", "english", False),
    ("engmsb",      "MSB",   "Majority Standard Bible",                     2023, "en",  "ltr", "english", False),
    ("eng-web",     "WEBC",  "World English Bible Classic (Deuterocanon)",  2000, "en",  "ltr", "english", False),
    ("engjps",      "JPS",   "JPS Tanakh",                                  1917, "en",  "ltr", "english", False),
    ("eng-Brenton", "LXXE",  "Brenton English Septuagint",                  1844, "en",  "ltr", "greek",   False),
    ("hboWLC",      "WLC",   "Westminster Leningrad Codex (Hebrew)",        1008, "he",  "rtl", "hebrew",  False),
    ("grcbrent",    "LXX",   "Septuagint (Greek)",                          1844, "grc", "ltr", "greek",   False),
    ("grctr",       "TR",    "Textus Receptus (Greek)",                     1894, "grc", "ltr", "english", True),
    ("grcmt",       "BYZ",   "Byzantine Majority Text (Greek)",             2018, "grc", "ltr", "english", True),
    ("grcbyz",      "PAT",   "Patriarchal Text 1904 (Greek)",               1904, "grc", "ltr", "english", True),
    ("grc-tisch",   "TIS",   "Tischendorf 8th Edition (Greek)",             1872, "grc", "ltr", "english", True),
    ("latVUC",      "VUL",   "Clementine Vulgate (Latin)",                  1598, "la",  "ltr", "vulgate", False),
    # Translations into other languages (owner, 2026-10-03), in the owner's order. "mixed": follows the Hebrew
    # numbering in some books and the KJV in others (Louis Segond), so KJV-numbered links are not trusted.
    ("spaRV1909",   "RVR",   "Reina-Valera 1909 (Spanish)",                 1909, "es",  "ltr", "english", False),
    ("arb-vd",      "SVD",   "Van Dyck Bible (Arabic)",                     1865, "ar",  "rtl", "english", False),
    ("cmn-cu89s",   "CUV",   "Chinese Union Version (Chinese, simplified)", 1919, "zh-Hans", "ltr", "english", False),
    # Public domain beyond doubt (the CUV's 1989 punctuation may not be); eBible calls it a draft.
    ("cmnswcb",     "WCB",   "World Chinese Bible (Chinese, simplified)",   2026, "zh-Hans", "ltr", "english", False),
    ("fraLSG",      "LSG",   "Louis Segond 1910 (French)",                  1910, "fr",  "ltr", "mixed",   False),
    ("deu1912",     "LUT",   "Lutherbibel 1912 (German)",                   1912, "de",  "ltr", "english", False),
    # More languages (owner, 2026-10-03), by number of speakers. Hindi is the one text that is not public domain
    # (CC BY-SA 4.0, credited below). Korean is left out: eBible's 1910 text is missing verses throughout.
    ("hin2017",     "IRV",   "Indian Revised Version (Hindi)",              2019, "hi",  "ltr", "english", False),
    ("porbrbsl",    "BPM",   "Bíblia Portuguesa Mundial (Portuguese)",      2026, "pt",  "ltr", "english", False),
    ("russyn",      "SYN",   "Russian Synodal Bible (Russian)",             1876, "ru",  "ltr", "synodal", False),
    ("jpnm",        "JFB",   "Japanese Freedom Bible (Japanese)",           2026, "ja",  "ltr", "english", False),
    ("vie1934",     "BTT",   "Vietnamese Bible 1923 (Vietnamese)",          1923, "vi",  "ltr", "english", False),
    ("pesOPV",      "OPV",   "Old Persian Version (Persian)",               1895, "fa",  "rtl", "english", False),
    ("ita1927",     "RIV",   "Riveduta 1927 (Italian)",                     1927, "it",  "ltr", "english", False),
]

# Versions whose \it marks the phrase a study note comments on, not emphasis: shown as ordinary text.
PLAIN_ITALIC = {"hin2017"}

# Versions that are not public domain: the credit their licence asks for, shown wherever the text is read.
CREDITS = {
    "hin2017": {
        "text": "Indian Revised Version (IRV) Hindi, © 2017, 2018, 2019 Bridge Connectivity Solutions",
        "url": "https://ebible.org/details.php?id=hin2017",
        "licence": "CC BY-SA 4.0",
        "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "changes": "Converted to this site's format; book introductions omitted; the Bible text is otherwise unchanged.",
    },
}

FIELDS = ("id", "abbr", "name", "year", "lang", "dir", "numbering", "strongs")


def as_dicts() -> list[dict]:
    rows = [dict(zip(FIELDS, row)) for row in TRANSLATIONS]
    ids = [row["id"] for row in rows]
    abbrs = [row["abbr"] for row in rows]
    if len(set(ids)) != len(ids) or len(set(abbrs)) != len(abbrs):
        raise ValueError(f"translations: duplicate id or abbreviation in {ids} / {abbrs}")
    return rows
