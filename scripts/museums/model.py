"""Shaping one artifacts record into what the museum pages show.

Everything here is a pure function of a record, so it can be tested without the 104 MB corpus and
reproduces byte-identically on a machine that has the corpus but not the 590 MB of images.
"""

from __future__ import annotations

import hashlib
import re

# --- images ---------------------------------------------------------------------------------------
# Deny by default. These are the only licence strings a copied image file carries in the corpus, and
# the test is an exact casefolded match against this set: a substring test would accept
# "item rights: .../by-nc-nd/2.5/; Europeana metadata CC0", which is NOT an open licence, and a
# startswith("CC") test would reject the twenty public-domain files and the two under the GNU
# documentation licence. A licence string that is not on this list means no image, ever.
OPEN_IMAGE_LICENCES = {
    "cc0", "cc by 4.0", "cc by 3.0", "cc by-sa 4.0", "cc by-sa 3.0", "cc by-sa 2.0 fr",
    "public domain", "gfdl",
}

# Of those, the ones that put the work in the public domain, where the law asks for no credit. Only
# these may be shown when the source recorded no photographer; everything else is a build failure,
# because a Creative Commons attribution licence is not satisfied by an empty credit line.
NO_CREDIT_REQUIRED = {"cc0", "public domain"}

# Licences that pass their own terms on to anything built from them.
SHARE_ALIKE = {"cc by-sa 4.0", "cc by-sa 3.0", "cc by-sa 2.0 fr", "gfdl"}


def image_licence(record: dict) -> str | None:
    """The record's image licence if the file was copied and its licence is open, else None.

    Only `image.licence` is ever consulted. The record-level `licence` describes the metadata and, for
    the eight Europeana items whose rights are reserved, happens to contain the text "CC0" while the
    item itself is not open at all.
    """
    image = record.get("image") or {}
    if not image.get("downloaded"):
        return None
    licence = str(image.get("licence") or "").strip().casefold()
    return licence if licence in OPEN_IMAGE_LICENCES else None


def credit_line(record: dict, licence: str) -> str:
    """The credit shown under a photograph. Never empty.

    Raises when an attribution licence has no attribution, which is a corpus fault worth stopping for
    rather than publishing an uncredited photograph.
    """
    attribution = str((record.get("image") or {}).get("attribution") or "").strip()
    if attribution:
        return attribution
    if licence in NO_CREDIT_REQUIRED:
        return "Wikimedia Commons · no author recorded by the source"
    raise ValueError(
        f"{record.get('title', '?')} ({record.get('object_id', '?')}): image licence {licence!r} "
        f"requires attribution and the corpus records none. Refusing to show it uncredited."
    )


# --- identifiers ----------------------------------------------------------------------------------
_UNSAFE = re.compile(r"[^A-Za-z0-9._-]+")


def file_id(museum_slug: str, raw_id: str) -> str:
    """A filesystem-safe, collision-free name for a derivative image.

    Object ids come from museum catalogues and are not safe to join to a path: 111 Europeana ids begin
    with "/" (pathlib drops everything to the left of an absolute part, so the file would land at the
    drive root), and some Wikimedia ids carry a colon, which NTFS reads as an alternate data stream.
    The digest suffix keeps the name unique even where two different raw ids clean up the same way.
    """
    cleaned = _UNSAFE.sub("-", f"{museum_slug}-{raw_id}").strip("-.")[:72]
    digest = hashlib.sha1(f"{museum_slug}|{raw_id}".encode()).hexdigest()[:8]
    return f"{cleaned or 'object'}-{digest}"


# --- dates ----------------------------------------------------------------------------------------
def _year(value: int) -> str:
    return f"{abs(value)} BC" if value < 0 else f"AD {value}"


def date_display(record: dict) -> str:
    """What the date line reads. The source's own wording wins; otherwise the parsed range."""
    text = str(record.get("date_text") or "").strip()
    if text:
        return text
    begin, end = record.get("date_begin"), record.get("date_end")
    if begin is None and end is None:
        return ""
    if begin is None or end is None:
        return _year(begin if begin is not None else end)
    if begin == end:
        return _year(begin)
    if (begin < 0) == (end < 0):
        era = "BC" if begin < 0 else "AD"
        first, second = (abs(begin), abs(end)) if begin < 0 else (begin, end)
        return f"{first}–{second} {era}" if era == "BC" else f"AD {first}–{second}"
    return f"{_year(begin)} – {_year(end)}"


# --- how a record came to be here -------------------------------------------------------------------
# The corpus is explicit that most of its "biblical links" are word matches rather than
# identifications, and says so record by record. The reader is told the same thing, in the same place.
BASIS_LABELS = {
    "catalog-crosswalk": "Matches a row of this project's archaeology catalogue",
    "source-stated": "The museum's own record names a biblical person or place",
    "term-match": "A place-name match in the museum's text — a search hit, not an identification",
    "none": "No biblical link recorded",
}


def basis_label(basis: str, match: str = "object") -> str:
    if basis == "catalog-crosswalk" and match != "object":
        return "Shares a name with a row of this project's archaeology catalogue — a name match, not the same object"
    return BASIS_LABELS.get(basis, BASIS_LABELS["none"])


_PUNCTUATION = re.compile(r"[^a-z0-9 ]+")


def normalise_title(value: object) -> str:
    return " ".join(_PUNCTUATION.sub(" ", str(value or "").casefold()).split())


def catalogue_match(record: dict, row_name: str) -> str:
    """Whether a catalogue row is about THIS object, or merely shares a name with it.

    The corpus crosswalks most records to a catalogue row by matching words in the title, so the Met's
    "Bead Amulet of Merneptah" is tied to the row for the Merneptah Stele. The amulet is not the
    stele, and printing the stele's "what it supports" sentence beneath the amulet would be precisely
    the overreach the project's own methods study exists to argue against.

    Identity is only claimed for the 51 named objects, which were crosswalked by hand one at a time,
    and for a record whose title actually contains the row's own name. Everything else is a pointer.
    """
    if record.get("_notable"):
        return "object"
    title, name = normalise_title(record.get("title")), normalise_title(row_name)
    if name and (name in title or (len(title) > 6 and title in name)):
        return "object"
    return "related"


def rank(record: dict) -> int:
    """Ordering within a museum: the audited crosswalk first, word matches last."""
    relevance = record.get("biblical_relevance") or {}
    has_photo = image_licence(record) is not None
    if relevance.get("ba_ids"):
        return 0
    if relevance.get("basis") == "source-stated":
        return 1 if has_photo else 2
    return 3 if has_photo else 4


def sort_key(record: dict) -> tuple:
    return (rank(record), str(record.get("title") or "").casefold(), str(record.get("object_id") or ""))


# --- holder strings ---------------------------------------------------------------------------------
def holder_parts(recorded: str) -> list[str]:
    """The institutions a `museum` string names, and whether the cataloguer was unsure.

    A cataloguer writes "British Museum, London, UK; National Museum of Iraq, Baghdad, Iraq ?" when an
    object is split between two collections or its whereabouts are uncertain. The trailing "?" is the
    source's own doubt and is kept, not cleaned away.
    """
    return [part.strip() for part in recorded.split(";") if part.strip()]


def is_uncertain(recorded: str) -> bool:
    return recorded.rstrip().endswith("?")


def strip_doubt(part: str) -> str:
    return part.rstrip().rstrip("?").strip()


def trim(text: object, limit: int) -> str:
    """A description cut to a readable length on a word boundary, with the cut made visible."""
    value = " ".join(str(text or "").split())
    if len(value) <= limit:
        return value
    cut = value[:limit].rsplit(" ", 1)[0]
    return f"{cut}…"
