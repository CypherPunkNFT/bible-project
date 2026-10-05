"""Parse explicit Scripture references without inferring links from surrounding prose."""
import re


def parse_reference(query, catalog):
    match = re.fullmatch(r"(.+?)\s*(\d+):(\d+)(?:[-–](?:(\d+):)?(\d+))?", query.strip())
    if not match:
        return None
    normalize = lambda text: re.sub(r"[^a-z0-9]", "", text.lower())
    alias = normalize(match[1])
    if alias == "psalm":
        alias = "psalms"
    book = next((book for book in catalog["books"] if alias in (normalize(book["name"]), normalize(book["code"]))), None)
    if not book:
        return None
    chapter, first = int(match[2]), int(match[3])
    last_chapter, last = int(match[4] or chapter), int(match[5] or first)
    if (last_chapter, last) < (chapter, first):
        raise ValueError("The reference range is reversed")
    return book, chapter, first, last_chapter, last
