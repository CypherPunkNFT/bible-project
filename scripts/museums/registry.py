"""The curated museum registry behind /study/museum-archaeology.

The artifacts corpus records 180-odd different strings in its `museum` field, written by nine
different cataloguers: "British Museum, London, UK", "British Museum", "British Museum Department of
the Middle East" and "British Museum, London, UK; National Museum of Iraq, Baghdad, Iraq ?" all mean
the British Museum. This file is the only place where those strings are joined up, and it is
deliberately hand-written: a merge is an editorial judgement, not something to infer from a string
distance. Every object keeps and shows the exact string its own source recorded, so a merge the
reader disagrees with is visible rather than hidden.

Two kinds of card, and they must never be added together:

  GROUP_COLLECTIONS  the nine open collections and catalogues the corpus was actually fetched from,
                     selected by a record's `museum_slug` (its source).
  GROUP_HOLDERS      the institutions those records name as holding the object, selected by the
                     `museum` field through the aliases below. The British Museum's records ARE
                     ORACC's and CDLI's records, counted from the other end.

A third group, GROUP_SOON, is for a museum we hold nothing from at all.
"""

from __future__ import annotations

GROUP_COLLECTIONS = "collections"
GROUP_HOLDERS = "holders"
GROUP_SOON = "coming-soon"

# The id used for the "holding institution not recorded" card, which is a real page: half of the 51
# named objects have no recorded holder, and nearly half of the photographs are among them.
UNRECORDED_SLUG = "holder-not-recorded"

# Strings that name no institution. A record carrying one of these is never filed under a museum.
PLACEHOLDERS = {
    "", "not stated", "not stated in wikidata", "not stated by the source", "not resolved",
    "see museum_no", "unlocated", "unlocated (formerly in thetell halaf museum)", "mesopotamia",
    "private: unlocated", "private: uncertain, unlocated", "private: anonymous, unlocated",
    "­",  # a lone soft hyphen, 282 records
}


# --- the collections we fetched from -------------------------------------------------------------
# `source` is the record's own `museum_slug`. `also_holder` marks a collection that is also the
# institution holding its objects, so its card can say so instead of looking like a double count.
COLLECTIONS: list[dict] = [
    {
        "slug": "metropolitan-museum-of-art", "source": "met-museum", "also_holder": True,
        "prefixes": ["the metropolitan museum of art", "metropolitan museum of art"],
        "name": "The Metropolitan Museum of Art", "place": "New York", "kind": "museum",
        "emblem": "met",
        "lead": "The Met publishes its whole collection catalogue as open data, and marks which objects are "
                "free of copyright. It is the largest single source here by a wide margin.",
    },
    {
        "slug": "cleveland-museum-of-art", "source": "cleveland-museum", "also_holder": True,
        "prefixes": ["the cleveland museum of art", "cleveland museum of art"],
        "name": "The Cleveland Museum of Art", "place": "Cleveland, Ohio", "kind": "museum",
        "emblem": "cleveland",
        "lead": "Cleveland's open-access API let the museum itself filter by date, so every record here was "
                "returned as falling inside the biblical period. Most of its photographs are of objects from "
                "elsewhere in the ancient world, and the page says which are which.",
    },
    {
        "slug": "art-institute-of-chicago", "source": "art-institute-chicago", "also_holder": True,
        "prefixes": ["the art institute of chicago", "art institute of chicago"],
        "name": "The Art Institute of Chicago", "place": "Chicago", "kind": "museum",
        "emblem": "art-institute",
        "lead": "The Art Institute's catalogue is open and names a findspot for almost every object. Its image "
                "server refuses a non-browser client, so the picture addresses and licences are recorded and "
                "no file was copied.",
    },
    {
        "slug": "smithsonian", "source": "smithsonian", "also_holder": True,
        "prefixes": ["national museum of american history", "nmnh", "freer gallery", "smithsonian"],
        "name": "Smithsonian Institution", "place": "Washington, DC", "kind": "aggregator",
        "emblem": "smithsonian",
        "lead": "The Smithsonian's open-access search covers every one of its museums. Its holdings from the "
                "biblical world turned out to be thin: a documented demo key allows about thirty calls an "
                "hour, and of the records it returned only a handful carry a date inside the period.",
    },
    {
        "slug": "europeana", "source": "europeana",
        "name": "Europeana", "place": "across Europe", "kind": "aggregator",
        "emblem": "europeana",
        "lead": "Europeana is not a museum. It gathers the catalogues of European institutions and publishes "
                "their descriptions under a single open licence, while each item keeps its own rights "
                "statement. The institutions behind these records have their own cards.",
    },
    {
        "slug": "wikidata-and-wikimedia-commons", "source": "wikidata-notables",
        "extra_sources": ["wikimedia-commons"],
        "name": "Wikidata & Wikimedia Commons", "place": "—", "kind": "catalogue",
        "emblem": "wikidata",
        "lead": "Wikidata holds no object. It is how the named objects were resolved: each one was looked up "
                "once, checked against its expected name, and rejected if it turned out to be a person or a "
                "modern paper. The photographs come from Wikimedia Commons, each with its own licence and "
                "its own photographer.",
    },
    {
        "slug": "oracc", "source": "oracc",
        "name": "ORACC", "place": "University of Pennsylvania", "kind": "catalogue",
        "emblem": "oracc",
        "lead": "The Open Richly Annotated Cuneiform Corpus publishes edited Assyrian and Babylonian texts "
                "project by project. Its records name the museum holding each tablet, which is where most of "
                "the institutions on this page come from. Its licence requires both credit and share-alike.",
    },
    {
        "slug": "cdli", "source": "cdli",
        "name": "CDLI", "place": "an international project", "kind": "catalogue",
        "emblem": "cdli",
        "lead": "The Cuneiform Digital Library Initiative keeps the standard catalogue of cuneiform tablets "
                "wherever they are held. Its own pages ask not to be harvested, so only its published bulk "
                "dump was used, verified against the checksum it publishes with it. Credit and share-alike "
                "are required.",
    },
]


# --- the institutions those records name as the holder --------------------------------------------
# `aliases` are matched casefolded against the whole `museum` string and against each part of a
# multi-holder string split on ";". `prefixes` match the start of the string, for the cataloguers who
# append a city and country.
HOLDERS: list[dict] = [
    {
        "slug": "british-museum", "name": "The British Museum", "place": "London", "kind": "museum",
        "emblem": "british-museum",
        "prefixes": ["british museum"],
        "note": "Nothing was fetched from britishmuseum.org. Its robots.txt reserves AI collection of its "
                "pages and lists this kind of client under Disallow, and its own object photography is "
                "CC BY-NC-SA, which is not an open licence. Everything here is recorded from the open "
                "cuneiform catalogues and from Wikidata, with a link on to the museum's own page — the "
                "reference use its signal does permit. Any photograph shown is a Wikimedia Commons "
                "photograph of the object, not the museum's.",
    },
    {
        "slug": "louvre", "name": "The Louvre", "place": "Paris", "kind": "museum",
        "emblem": "louvre",
        "aliases": ["department of near eastern antiquities of the louvre"],
        "prefixes": ["louvre museum", "musée du louvre", "the louvre"],
    },
    {
        "slug": "israel-museum", "name": "The Israel Museum", "place": "Jerusalem", "kind": "museum",
        "emblem": "israel-museum",
        "aliases": ["israel museum", "the israel museum", "shrine of the book"],
        "prefixes": ["the israel museum", "israel museum"],
        "note": "The Shrine of the Book is this museum's own wing and is counted here. The museum has no open "
                "catalogue API and its object photography is all rights reserved, so nothing was fetched from "
                "it; the records are from the open catalogues and Wikidata, and any photograph is a Wikimedia "
                "Commons photograph of the object.",
    },
    {
        "slug": "israel-antiquities-authority", "name": "The Israel Antiquities Authority",
        "place": "Jerusalem", "kind": "authority", "emblem": "iaa",
        "prefixes": ["israel antiquities authority"],
        "note": "Its own site answers a Cloudflare challenge rather than a page, and that was not worked "
                "around; its images are all rights reserved. What is here is what the open cuneiform "
                "catalogues record as being in its care, with links out. No image of any kind was taken.",
    },
    {
        "slug": "egyptian-museum", "name": "The Egyptian Museum", "place": "Cairo", "kind": "museum",
        "emblem": "egyptian-museum",
        "aliases": ["egyptian museum"],
        "prefixes": ["cairo museum", "the egyptian museum", "egyptian museum, cairo"],
        "note": "No open catalogue API and no open-licence image programme, so this is a link-only "
                "institution: the records come from the open catalogues and Wikidata.",
    },
    {
        "slug": "rijksmuseum-van-oudheden",
        "name": "Rijksmuseum van Oudheden", "place": "Leiden", "kind": "museum",
        "emblem": "leiden",
        "aliases": ["rijksmuseum van oudheden"],
        "prefixes": ["rijksmuseum van oudheden"],
        "note": "The National Museum of Antiquities in Leiden. This is **not** the Rijksmuseum in Amsterdam, "
                "which is a different institution and has its own card. The two are often confused because "
                "both are called a Rijksmuseum — a state museum.",
    },
    {
        "slug": "istanbul-archaeology-museums", "name": "Istanbul Archaeology Museums",
        "place": "Istanbul", "kind": "museum", "emblem": "istanbul",
        "aliases": ["istanbul archaeology museums"],
        "prefixes": ["arkeoloji müzeleri", "arkeoloji müzerleri", "istanbul archaeology"],
        "note": "Several of the objects taken from Jerusalem and Samaria while the region was Ottoman are "
                "here rather than in Israel, which is why a reader looking for the Siloam inscription or the "
                "Gezer calendar finds them in Istanbul.",
    },
    {
        "slug": "chester-beatty", "name": "The Chester Beatty", "place": "Dublin", "kind": "library",
        "emblem": "chester-beatty",
        "aliases": ["chester beatty"],
        "prefixes": ["chester beatty"],
    },
    {
        "slug": "vatican-library", "name": "The Vatican Library", "place": "Vatican City",
        "kind": "library", "emblem": "vatican",
        "aliases": ["vatican library"], "prefixes": ["vatican library", "biblioteca apostolica"],
    },
    {
        "slug": "bodmer-foundation", "name": "The Bodmer Foundation", "place": "Cologny, Geneva",
        "kind": "library", "emblem": "bodmer",
        "aliases": ["bodmer foundation"], "prefixes": ["bodmer"],
    },
    {
        "slug": "bibliotheque-nationale-de-france", "name": "Bibliothèque nationale de France",
        "place": "Paris", "kind": "library", "emblem": "bnf",
        "aliases": ["bnf museum", "national library of france"],
        "prefixes": ["département des monnaies", "bibliothèque nationale"],
    },
    {
        "slug": "yigal-allon-centre", "name": "The Yigal Allon Centre", "place": "Ginosar, Galilee",
        "kind": "museum", "emblem": "galilee-boat",
        "aliases": ["bet yigʼal alon", "bet yig'al alon", "bet yigal alon"],
    },
    {
        "slug": "magdala", "name": "Magdala", "place": "Migdal, Galilee", "kind": "site",
        "emblem": "magdala",
        "aliases": ["magdala"],
        "note": "An archaeological site rather than a museum. The first-century synagogue and the carved "
                "stone found in it are displayed where they were excavated.",
    },
    {
        "slug": "catholic-university-of-leuven", "name": "Catholic University of Leuven",
        "place": "Leuven", "kind": "university", "emblem": None,
        "aliases": ["catholic university of leuven"], "prefixes": ["catholic university of leuven"],
    },
    {
        "slug": "medelhavsmuseet", "name": "The Museum of Mediterranean and Near Eastern Antiquities",
        "place": "Stockholm", "kind": "museum", "emblem": None,
        "aliases": ["the museum of mediterranean and near eastern antiquities"],
        "prefixes": ["medelhavsmuseet", "the museum of mediterranean"],
    },
    {
        "slug": "royal-museums-of-art-and-history", "name": "Royal Museums of Art and History",
        "place": "Brussels", "kind": "museum", "emblem": None,
        "aliases": ["royal museums of art and history"],
        "prefixes": ["musées royaux d’art et d’histoire", "musées royaux d'art et d'histoire",
                     "royal museums of art and history"],
    },
    # --- also named as a holder, by weight of records -------------------------------------------
    {
        "slug": "oriental-institute-chicago", "name": "The Oriental Institute", "kind": "university",
        "place": "University of Chicago", "emblem": None,
        "prefixes": ["pfap, oriental institute", "oriental institute, university of chicago"],
    },
    {
        "slug": "national-museum-of-syria", "name": "The National Museum of Syria", "kind": "museum",
        "place": "Damascus, Aleppo, Der-ez-Zor and Raqqa", "emblem": None,
        "prefixes": ["national museum of syria", "musée national de syrie"],
    },
    {
        "slug": "national-museum-of-iraq", "name": "The National Museum of Iraq", "kind": "museum",
        "place": "Baghdad", "emblem": None,
        "prefixes": ["national museum of iraq", "iraq museum"],
    },
    {
        "slug": "yale-babylonian-collection", "name": "The Yale Babylonian Collection",
        "place": "New Haven, Connecticut", "kind": "university", "emblem": None,
        "prefixes": ["yale babylonian collection", "nies babylonian collection",
                     "j. pierpont morgan library collection", "newell collections",
                     "goucher college babylonian collection", "rosen babylonian collection"],
    },
    {
        "slug": "penn-museum", "name": "The Penn Museum", "place": "Philadelphia", "kind": "university",
        "emblem": None,
        "prefixes": ["university of pennsylvania museum of archaeology"],
    },
    {
        "slug": "vorderasiatisches-museum", "name": "The Vorderasiatisches Museum", "place": "Berlin",
        "kind": "museum", "emblem": None,
        "prefixes": ["vorderasiatisches museum"],
    },
    {
        "slug": "hatay-archaeology-museum", "name": "Hatay Archaeology Museum", "place": "Antakya",
        "kind": "museum", "emblem": None,
        "prefixes": ["archeological museum, antakya", "hatay archaeological museum",
                     "hatay archaeology museum"],
    },
    {
        "slug": "harvard-museum-of-the-ancient-near-east",
        "name": "The Harvard Museum of the Ancient Near East", "place": "Cambridge, Massachusetts",
        "kind": "university", "emblem": None,
        "prefixes": ["harvard museum of the ancient near east", "semitic museum, harvard"],
    },
    {
        "slug": "ashmolean-museum", "name": "The Ashmolean Museum", "place": "Oxford", "kind": "museum",
        "emblem": None, "prefixes": ["ashmolean museum"],
    },
    {
        "slug": "department-of-jordanian-antiquities", "name": "The Department of Antiquities of Jordan",
        "place": "Amman", "kind": "authority", "emblem": None,
        "prefixes": ["department of jordanian antiquities"],
    },
    {
        "slug": "bible-lands-museum-jerusalem", "name": "The Bible Lands Museum", "place": "Jerusalem",
        "kind": "museum", "emblem": None, "aliases": ["bible lands museum, jerusalem"],
        "prefixes": ["bible lands museum, jerusalem"],
    },
    {
        "slug": "national-museum-of-iran", "name": "The National Museum of Iran", "place": "Tehran",
        "kind": "museum", "emblem": None,
        "prefixes": ["national museum, tehran", "national museum of iran"],
    },
    {
        "slug": "columbia-university-library", "name": "Columbia University Library", "place": "New York",
        "kind": "library", "emblem": None, "prefixes": ["columbia university library"],
    },
]


# --- museums we hold nothing from at all ----------------------------------------------------------
COMING_SOON: list[dict] = [
    {
        "slug": "rijksmuseum", "name": "The Rijksmuseum", "place": "Amsterdam", "kind": "museum",
        "emblem": "rijksmuseum",
        "lead": "The Netherlands' national museum, in Amsterdam.",
        "why_coming_soon": "Its old collection API answers HTTP 410 Gone, and the replacement needs a "
                           "registered key this work did not have, so nothing was taken. Nothing here is a "
                           "judgement about the museum: it is simply a door that needs a key. The one object "
                           "on this page a reader might expect to find in Amsterdam, the Ipuwer Papyrus, is "
                           "in fact in the Rijksmuseum van Oudheden in Leiden, which is a different "
                           "institution and has its own page.",
    },
]


def holder_index() -> tuple[dict[str, str], list[tuple[str, str]]]:
    """Casefolded exact aliases, and (prefix, slug) pairs longest-first so the most specific wins.

    The collections that are also the holder are included, so a Met object recorded by the cuneiform
    catalogue under "Metropolitan Museum of Art, New York, New York, USA" lands on the Met's card
    rather than in the list of institutions with no card.
    """
    exact: dict[str, str] = {}
    prefixes: list[tuple[str, str]] = []
    for entry in [*HOLDERS, *(c for c in COLLECTIONS if c.get("also_holder"))]:
        for alias in entry.get("aliases", ()):
            exact[alias.casefold()] = entry["slug"]
        for prefix in entry.get("prefixes", ()):
            prefixes.append((prefix.casefold(), entry["slug"]))
    prefixes.sort(key=lambda pair: -len(pair[0]))
    return exact, prefixes
