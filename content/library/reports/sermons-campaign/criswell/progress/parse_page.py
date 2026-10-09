"""Parse one saved W. A. Criswell sermon page into manifest fields (no guessing)."""
import html
import re

BOOK_CHAPTERS = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34, "Joshua": 24,
    "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24, "1 Kings": 22, "2 Kings": 25,
    "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42,
    "Psalm": 150, "Psalms": 150, "Proverbs": 31, "Ecclesiastes": 12, "Song of Solomon": 8,
    "Song of Songs": 8, "Isaiah": 66, "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48,
    "Daniel": 12, "Hosea": 14, "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7,
    "Nahum": 3, "Habakkuk": 3, "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
    "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
    "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6, "Philippians": 4,
    "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3, "1 Timothy": 6, "2 Timothy": 4,
    "Titus": 3, "Philemon": 1, "Hebrews": 13, "James": 5, "1 Peter": 5, "2 Peter": 3,
    "1 John": 5, "2 John": 1, "3 John": 1, "Jude": 1, "Revelation": 22,
}
MONTHS = {m: i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July", "August",
     "September", "October", "November", "December"], 1)}


def clean(fragment):
    text = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def first(pattern, text):
    match = re.search(pattern, text, re.S | re.I)
    return clean(match.group(1)) if match else None


def parse_date(label):
    if not label:
        return None
    match = re.match(r"([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})", label)
    if not match or match.group(1) not in MONTHS:
        return None
    month, day, year = MONTHS[match.group(1)], int(match.group(2)), int(match.group(3))
    return {"value": f"{year:04d}-{month:02d}-{day:02d}", "precision": "day", "label": label}


def check_reference(ref):
    """Return a list of 'misprint' note strings for anything that does not look like a real reference."""
    notes = []
    for part in re.split(r";", ref):
        part = part.strip()
        if not part:
            continue
        match = re.match(r"^((?:[123]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+)", part)
        if not match:
            if re.match(r"^\d", part):
                continue  # continuation like "12:3" after a semicolon
            notes.append(f"misprint? unparsed reference part '{part}'")
            continue
        book, chapter = match.group(1).strip(), int(match.group(2))
        if book not in BOOK_CHAPTERS:
            notes.append(f"misprint? book name '{book}' not a standard book name")
        elif chapter > BOOK_CHAPTERS[book] or chapter == 0:
            notes.append(f"misprint? {book} has {BOOK_CHAPTERS[book]} chapters, page says chapter {chapter}")
    return notes


def parse_sermon(text):
    post_id = re.search(r"<article id=\"post-(\d+)\"", text)
    title = first(r"<h1 class=\"sermonTitle\">(.*?)</h1>", text)
    date_label = first(r"<h2 class=\"sermonDate\">(.*?)</h2>", text)
    reference = first(r"<h3 class=\"sermonScripture\">(.*?)</h3>", text)
    series = re.findall(r"href=\"https://wacriswell\.com/sermon-series/[^\"]+\">(.*?)</a>", text)
    series = sorted({clean(s) for s in series if clean(s)})
    notes = []
    if not title:
        title = first(r"<title>(.*?)(?: &#8211; | – )W\. A\. Criswell", text)
        notes.append("title taken from <title> (no h1.sermonTitle)")
    date = parse_date(date_label)
    if date_label and not date:
        notes.append(f"date label not parseable as a day: '{date_label}'")
    if reference:
        notes.extend(check_reference(reference))
    return {
        "postId": post_id.group(1) if post_id else None,
        "title": title,
        "mainText": reference or None,
        "mainTextLocator": "page header Scripture field (h3.sermonScripture under the sermon date)" if reference else None,
        "date": date,
        "series": "; ".join(series) if series else None,
        "notes": notes,
    }
