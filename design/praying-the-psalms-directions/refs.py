"""Finding the Scripture references in The book of Psalms text. A reference becomes one of three things:
a passage ("p", a label such as "Psalm 41:13" or "2 Samuel 22:1–51"), a whole psalm ("ps", its number), or a run of
psalms ("pr", first and last). Anything the finder cannot read with certainty is refused, not guessed."""
import re

from scripture_text import BOOKS, BuildError
from study_lists import BARE_REFS, PSALM_LISTS

NAMES = sorted(list(BOOKS) + ["Psalms"], key=len, reverse=True)
NO_MORE = r"(?!\d)(?!:\d)"
FULL = re.compile(r"\b(" + "|".join(map(re.escape, NAMES)) + r") (\d+)(?::(\d+)(?:–(?:(\d+):)?(\d+))?|–(\d+))?" + NO_MORE)
MORE = re.compile(r"(, and |; |, | and )(?:(\d+):)?(\d+)(?:–(\d+))?" + NO_MORE + r"(?! [A-Z])")  # "; 1 Chronicles" starts a new book
BARE = re.compile(r"\((\d+):(\d+)(?:–(\d+))?(?= · BSB\)|\))")


def last_verse(bible: dict, code: str, chapter: int) -> int:
    verses = [int(key.split(":")[1]) for key in bible[code] if int(key.split(":")[0]) == chapter]
    if not verses:
        raise BuildError(f"chapter {chapter} of {code} is not in the Berean")
    return max(verses)


class Finder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible

    def item(self, book: str, chapter: int, verse=None, end_chapter=None, end_verse=None, chapter_end=None):
        """One reference as (kind, value). A Psalm with no verse is a whole psalm or a run of psalms."""
        book = "Psalm" if book == "Psalms" else book
        if verse is None:
            if book == "Psalm":
                if not 1 <= chapter <= (chapter_end or chapter) <= 150:
                    raise BuildError(f"there is no Psalm {chapter}" + (f"–{chapter_end}" if chapter_end else ""))
                return ("pr", (chapter, chapter_end)) if chapter_end else ("ps", chapter)
            last_chapter = chapter_end or chapter
            if chapter_end is not None and chapter_end <= chapter:
                raise BuildError(f"chapter range runs backwards: {book} {chapter}–{chapter_end}")
            return ("p", f"{book} {chapter}:1–{last_chapter}:{last_verse(self.bible, BOOKS[book], last_chapter)}" if chapter_end
                    else f"{book} {chapter}:1–{last_verse(self.bible, BOOKS[book], chapter)}")
        tail = f"–{end_chapter}:{end_verse}" if end_chapter else (f"–{end_verse}" if end_verse else "")
        return ("p", f"{book} {chapter}:{verse}{tail}")

    def find(self, text: str) -> list:
        """Every reference in plain text as (start, end, kind, value), in order, spans never overlapping."""
        found = []
        for match in FULL.finditer(text):
            book, chapter, verse, end_chapter, end_verse, chapter_end = match.groups()
            found.append((match.start(), match.end(), *self.item(book, int(chapter), verse and int(verse), end_chapter and int(end_chapter), end_verse and int(end_verse), chapter_end and int(chapter_end))))
            has_verse, chapter, end = verse is not None, int(chapter), match.end()
            while (more := MORE.match(text, end)):
                _, new_chapter, number, upto = more.groups()
                start = more.start() + len(more.group(1))
                if new_chapter:
                    kind = self.item(book, int(new_chapter), int(number), None, upto and int(upto))
                    chapter, has_verse = int(new_chapter), True
                elif has_verse:
                    kind = self.item(book, chapter, int(number), None, upto and int(upto))
                else:
                    kind = self.item(book, int(number), None, None, None, upto and int(upto))
                found.append((start, more.end(), *kind))
                end = more.end()
        found += self.bare(text)
        found += self.lists(text)
        found.sort()
        for (_, end_a, *_), (start_b, _, *_) in zip(found, found[1:]):
            if start_b < end_a:
                raise BuildError(f"two references overlap in: {text[:80]!r}")
        return found

    def bare(self, text: str) -> list:
        """A chapter:verse in brackets with no book: a Psalm when a quotation stands just before it, else it must be
        named in BARE_REFS. Never guessed."""
        found = []
        for match in BARE.finditer(text):
            before = text[:match.start()].rstrip()
            named = [book for words, book in BARE_REFS.items() if before.endswith(words[:words.rindex("(")].rstrip()) and words[words.rindex("("):].startswith(match.group(0))]
            if named:
                book = named[0]
            elif before.endswith(('"', "”")):
                book = "Psalm"
            else:
                raise BuildError(f"a reference with no book and no quotation before it: {text[max(0, match.start() - 50):match.end()]!r}; name its book in BARE_REFS")
            chapter, verse, upto = match.groups()
            found.append((match.start() + 1, match.end(), *self.item(book, int(chapter), int(verse), None, upto and int(upto))))
        return found

    def lists(self, text: str) -> list:
        """Psalm numbers in brackets, read only when the bracket is on the PSALM_LISTS list word for word."""
        found = []
        for listed in PSALM_LISTS:
            for match in re.finditer(re.escape(listed), text):
                for number in re.finditer(r"(\d+)(?:–(\d+))?", listed):
                    first, last = int(number.group(1)), number.group(2) and int(number.group(2))
                    start = match.start() + number.start()
                    found.append((start, match.start() + number.end(), *self.item("Psalm", first, None, None, None, last)))
        return found
