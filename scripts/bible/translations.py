"""Every version the site offers, in the order the picker shows them.

numbering: the verse-numbering tradition. "english" = KJV numbering; "hebrew" = Masoretic (Psalm titles are
verse 1, Malachi has 3 chapters); "greek" = Septuagint (Psalms 10-147 one behind); "vulgate" = Latin Vulgate
numbering (same Psalm offset as the Greek); "mixed" = partly Hebrew, partly KJV (Louis Segond). Checked by build-data.py's numbering report, not just asserted.
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
    ("fraLSG",      "LSG",   "Louis Segond 1910 (French)",                  1910, "fr",  "ltr", "mixed",   False),
    ("deu1912",     "LUT",   "Lutherbibel 1912 (German)",                   1912, "de",  "ltr", "english", False),
]

FIELDS = ("id", "abbr", "name", "year", "lang", "dir", "numbering", "strongs")


def as_dicts() -> list[dict]:
    rows = [dict(zip(FIELDS, row)) for row in TRANSLATIONS]
    ids = [row["id"] for row in rows]
    abbrs = [row["abbr"] for row in rows]
    if len(set(ids)) != len(ids) or len(set(abbrs)) != len(abbrs):
        raise ValueError(f"translations: duplicate id or abbreviation in {ids} / {abbrs}")
    return rows
