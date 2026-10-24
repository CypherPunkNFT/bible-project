"""Extract question banks from the trivia sources into extracted/.

Reads only from raw/ and writes only to extracted/. Raw files are never modified.
Container shape matches extract_catechisms.py so normalize.py has one code path.

Three of these sources are general-knowledge trivia sets that merely contain some
Bible questions, so they are filtered. Filtering runs in two passes:

  pass 1  a generous keyword net collects candidates, each tagged with the keyword
          that matched, and writes them to extracted/<source>.candidates.json
  pass 2  a human-reviewed exclusion list (tools/bible_filter_exclusions.json) drops
          the false positives by exact question text

So every judgement about what counts as a Bible question is recorded on disk rather
than buried in a regex.

Run: python tools/extract_trivia.py
"""

import base64
import binascii
import html
import json
import re
import sys
import time
from pathlib import Path

CORPUS_ROOT = Path(__file__).resolve().parent.parent
RAW = CORPUS_ROOT / "raw"
EXTRACTED = CORPUS_ROOT / "extracted"
EXCLUSIONS_PATH = Path(__file__).resolve().parent / "bible_filter_exclusions.json"

# Unambiguous Bible markers. A match here is a Bible question with no further checking.
STRONG_MARKERS = [
    "bible", "biblical", "old testament", "new testament", "gospel", "scripture",
    "apostle", "jesus", "christ", "pharisee", "sadducee", "crucifi", "pentateuch",
    "epistle", "garden of eden", "ten commandments", "beatitude", "john the baptist",
    "virgin mary", "holy ghost", "holy spirit", "israelite", "nazareth", "bethlehem",
    "golgotha", "calvary", "gethsemane", "last supper", "sermon on the mount",
    "noah's ark", "noahs ark", "tower of babel", "burning bush", "red sea parted",
    "prodigal son", "good samaritan", "lot's wife", "mount sinai", "philistine",
    "king herod", "pontius pilate", "judas iscariot", "mary magdalene", "st. paul",
    "saint paul", "methuselah", "nebuchadnezzar", "gomorrah", "sodom", "goliath",
    "bathsheba", "jezebel", "delilah", "zacchaeus", "barabbas", "sanhedrin",
    "septuagint", "vulgate", "king james version", "psalms", "deuteronomy",
    "leviticus", "ecclesiastes", "corinthians", "thessalonians", "philippians",
    "colossians", "galatians", "ephesians", "hebrews 1", "book of job",
    "book of genesis", "book of exodus", "book of revelation", "book of daniel",
    "book of jonah", "book of ruth", "book of esther", "book of acts",
]

# Bible-specific names and terms that are rarely anything else in a general trivia set.
# Wide enough to catch a Bible question that never says the word "Bible", narrow enough
# that the candidate list stays small enough to read. Reviewed, not trusted blindly.
MEDIUM_MARKERS = [
    "moses", "noah", "abraham", "pharaoh", "elijah", "elisha", "samson", "tabernacle",
    "levite", "manna", "passover", "pentecost", "eden", "babel", "nineveh", "jericho",
    "canaan", "galilee", "nazarene", "messiah", "commandment", "sabbath", "parable",
    "disciple", "prophet", "archangel", "gabriel", "lucifer", "satan", "covenant",
    "resurrection", "ark", "ezekiel", "jeremiah", "isaiah", "hosea", "habakkuk",
    "zephaniah", "haggai", "zechariah", "malachi", "nehemiah", "ecclesiast",
    "philistia", "bethsaida", "capernaum", "samaritan", "rabboni", "eucharist",
]

# Words that often mean a Bible question but have common non-Bible senses: Genesis the
# band, Exodus the film, Israel the modern state, Jordan the river or the player, Job
# the noun, John and James and Michael as ordinary first names. Matches here go to the
# candidates file for review.
WEAK_MARKERS = [
    "genesis", "exodus", "revelation", "leviticus", "numbers", "joshua", "judges",
    "samuel", "kings", "chronicles", "nehemiah", "esther", "proverbs", "isaiah",
    "jeremiah", "ezekiel", "daniel", "hosea", "joel", "amos", "jonah", "micah",
    "nahum", "habakkuk", "zephaniah", "haggai", "zechariah", "malachi", "matthew",
    "mark", "luke", "john", "acts", "romans", "titus", "philemon", "james", "peter",
    "jude", "moses", "noah", "abraham", "isaac", "jacob", "joseph", "aaron", "david",
    "solomon", "samson", "elijah", "elisha", "ezra", "job", "ruth", "naomi", "sarah",
    "rebecca", "rachel", "leah", "eve", "adam", "cain", "abel", "seth", "enoch",
    "methuselah", "babel", "eden", "nineveh", "jericho", "canaan", "galilee",
    "jerusalem", "judah", "israel", "egypt", "sinai", "jordan", "disciple",
    "prophet", "messiah", "commandment", "sabbath", "passover", "manna", "ark",
    "parable", "psalm", "testament", "resurrection", "baptis", "pentecost",
    "archangel", "gabriel", "michael", "lucifer", "satan", "devil", "angel",
    "plague", "tabernacle", "covenant", "circumcis", "levite", "pharaoh",
]


def write_source(container, candidates=None):
    """Write one source's extraction, refusing any path inside raw/."""
    EXTRACTED.mkdir(parents=True, exist_ok=True)
    out_path = EXTRACTED / f"{container['source_id']}.json"
    if RAW in out_path.parents:
        raise RuntimeError(f"refusing to write inside raw/: {out_path}")
    out_path.write_text(
        json.dumps(container, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    if candidates is not None:
        (EXTRACTED / f"{container['source_id']}.candidates.json").write_text(
            json.dumps(candidates, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    total = sum(bank["question_count"] for bank in container["banks"])
    banks = ", ".join(f"{b['bank_id']}={b['question_count']}" for b in container["banks"])
    print(f"  wrote {out_path.name}: {total} questions ({banks})", flush=True)
    return total


def collapse(text):
    return re.sub(r"\s+", " ", (text or "").replace(" ", " ")).strip()


def load_exclusions():
    """Question texts a human reviewed and ruled not about the Bible."""
    if not EXCLUSIONS_PATH.exists():
        print("  (no exclusion list yet - candidates are unfiltered)", flush=True)
        return {}
    data = json.loads(EXCLUSIONS_PATH.read_text(encoding="utf-8"))
    return {
        source: {collapse(item["question"]): item.get("reason", "") for item in items}
        for source, items in data.get("excluded", {}).items()
    }


# Markers meant as word stems rather than whole words, so they keep matching inflections
# ("crucified", "crucifixion"; "baptise", "baptism", "baptist").
STEM_MARKERS = {"crucifi", "baptis", "circumcis"}


def marker_pattern(marker):
    """Whole-word pattern for a marker, so 'christ' cannot match 'Christmas'."""
    trailing = "" if marker in STEM_MARKERS else r"\b"
    return re.compile(rf"\b{re.escape(marker)}{trailing}", re.IGNORECASE)


# Contexts that make an ambiguous match not a Bible question. These veto medium and
# weak matches only: a strong marker like "bible" or "jesus" is trusted on its own, and
# vetoing it would throw away real questions about Saint Paul or the Gospels.
#
# The three big false-positive families this kills are US history (Abraham Lincoln),
# film and pop culture (Raiders of the Lost Ark, Schindler's Ark, Michael Jackson), and
# religion that is not the Bible: other faiths, Catholic devotion to later saints, and
# post-biblical Judaism. Questions drawn from the Torah or Pentateuch are biblical and
# are deliberately not vetoed here.
VETO_PATTERNS = [
    # US history and other named people who share a biblical first name
    r"abraham lincoln", r"plains of abraham", r"heights of abraham", r"abraham darby",
    r"abraham zapruder", r"abraham de lucena", r"moses alexander", r"manuel noah",
    r"emancipation proclamation", r"thanksgiving", r"gettysburg", r"civil war",
    r"\bpresident\b", r"prime minister", r"dollar bill", r"mount rushmore",
    # film, television, music, brands
    r"lost ark", r"indiana jones", r"schindler", r"keneally", r"raiders of",
    r"different strokes", r"grandpa simpson", r"amadeus", r"michael jackson",
    r"michael jordan", r"papa john", r"archangel cat", r"\boscar\b", r"\bfilm\b",
    r"\bmovie\b", r"\btv show\b", r"booker prize", r"jurassic park", r"disney",
    r"spotify", r"twitch", r"world trade center", r"\bak-47\b", r"roulette",
    # other faiths and later religious movements
    r"scientolog", r"mormon", r"buddh", r"islam", r"muslim", r"caliphate", r"hindu",
    r"sikh", r"shinto", r"witch", r"\bpagan\b", r"greek god", r"roman god",
    # Catholic devotion and church history after the New Testament
    r"\bsaint\b", r"patron of", r"patron saint", r"\bpope\b", r"supreme pontiff",
    r"vatican", r"coptic", r"monaster", r"desert fathers", r"theotokos",
    r"holy grail", r"canoniz", r"canonis",
    # post-biblical Judaism: practice, rabbinic literature, the modern state
    r"baal shem tov", r"chassidic", r"hasidic", r"ashkenazi", r"marrano", r"mishna",
    r"talmud", r"synagogue", r"\brabbi\b", r"\byom\b", r"kosher", r"bar mitzvah",
    r"menorah", r"hanukkah", r"\bshema\b", r"zionis", r"tel aviv", r"six day war",
    r"golda meir", r"israeli army", r"bureau of statistics", r"sister city",
    r"mayor of", r"\bikea\b", r"\bghetto\b", r"jewish reform", r"jewish institution",
]
VETO_REGEX = re.compile("|".join(VETO_PATTERNS), re.IGNORECASE)


def veto_reason(text):
    """The non-Bible context that disqualifies an ambiguous match, if any."""
    match = VETO_REGEX.search(text)
    return match.group(0).lower() if match else None


TIERED_PATTERNS = [
    ("strong", [(m, marker_pattern(m)) for m in STRONG_MARKERS]),
    ("medium", [(m, marker_pattern(m)) for m in MEDIUM_MARKERS]),
    ("weak", [(m, marker_pattern(m)) for m in WEAK_MARKERS]),
]
TIER_RANK = {"strong": 3, "medium": 2, "weak": 1}


def classify(text, min_tier="weak"):
    """Return (tier, matched_keyword) for one question's text, or (None, None).

    min_tier sets how strong a match has to be to count, so a huge general-knowledge
    file can demand a Bible-specific marker while a small religion file can accept a
    loose one and have the result read by hand.
    """
    floor = TIER_RANK[min_tier]
    for tier, patterns in TIERED_PATTERNS:
        if TIER_RANK[tier] < floor:
            continue
        for marker, pattern in patterns:
            if not pattern.search(text):
                continue
            if tier != "strong":
                veto = veto_reason(text)
                if veto:
                    return None, f"vetoed:{veto}"
            return tier, marker
    return None, None


# --------------------------------------------------------- ministry-to-children


def visible_text(raw_html):
    """Flatten HTML to text, breaking lines only at block boundaries.

    Inline tags are removed without a line break, so a question that contains a link
    stays on one line instead of arriving in fragments.
    """
    text = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", raw_html)
    text = re.sub(r"(?i)<(br|hr)\s*/?>", "\n", text)
    text = re.sub(
        r"(?i)</?(p|div|li|ul|ol|tr|td|th|table|h[1-6]|section|article|header|"
        r"footer|nav|aside|main|blockquote|figure|figcaption|form)\b[^>]*>",
        "\n",
        text,
    )
    text = re.sub(r"(?s)<[^>]+>", "", text)
    text = html.unescape(text).replace(" ", " ")
    return [line.strip() for line in text.split("\n") if line.strip()]


def extract_ministry_to_children():
    """The 300 kids' Bible trivia questions, from the saved page HTML."""
    source_id = "ministry-to-children-kids-bible-trivia"
    lines = visible_text(
        (RAW / source_id / "kids-bible-trivia.html").read_text(
            encoding="utf-8", errors="replace"
        )
    )

    # The page opens with three sample questions in a different shape; the numbered set
    # starts at this heading, so parsing starts there to avoid double counting.
    start = next(
        (i for i, line in enumerate(lines) if "300 Bible Trivia Questions for Kids" in line),
        None,
    )
    if start is None:
        raise RuntimeError("could not find the '300 Bible Trivia Questions for Kids' heading")

    questions = []
    section = None
    pending = None  # question text awaiting its answer line
    for line in lines[start + 1 :]:
        if re.match(r"(?i)^(Q|Question):\s*", line):
            pending = re.sub(r"(?i)^(Q|Question):\s*", "", line)
            continue
        if re.match(r"(?i)^True or False:\s*", line):
            pending = line
            continue
        answer_match = re.match(r"(?i)^(A|Answer|True|False):\s*(.*)$", line)
        if answer_match and pending:
            label, body = answer_match.group(1), answer_match.group(2)
            # "False: the Psalms are a collection..." carries the verdict in the label.
            answer = body if label.lower() in ("a", "answer") else f"{label}: {body}".strip(": ")
            questions.append(
                {
                    "number": len(questions) + 1,
                    "question": collapse(pending),
                    "answer": collapse(answer),
                    "options": None,
                    "reference": None,
                    "section": section,
                }
            )
            pending = None
            continue
        # Anything else that is not a Q or an A, and is short, is a section heading.
        if not pending and len(line) < 90 and not line.startswith(("·", "A:", "Q:")):
            if re.search(r"(?i)question|trivia|commandment|prayer|spirit|jesus|bible|israel|david|genesis|testament", line):
                section = line

    if len(questions) != 300:
        print(f"  WARNING: expected 300 questions, parsed {len(questions)}", flush=True)

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": [
            {
                "bank_id": "kids-bible-trivia-300",
                "title": "300 Bible Trivia Questions and Answers for Kids",
                "question_count": len(questions),
                "notes": (
                    "Parsed from the page HTML saved in raw/. Questions appear as 'Q: ...' "
                    "with 'A: ...', plus a 'True or False: ...' form whose answer line "
                    "carries the verdict. The three sample questions above the main heading "
                    "are deliberately skipped so nothing is counted twice. 'section' records "
                    "the topic heading each question sits under."
                ),
                "questions": questions,
            }
        ],
    }


# ------------------------------------------------------------- straight banks


# Most answers in this set finish with their verse, e.g. "Mary (Matt 1:18)". The brief
# wants the reference in its own field, so it is lifted out and the answer left clean.
TRAILING_CITATION = re.compile(
    r"\s*\(((?:[1-3]\s?)?[A-Z][A-Za-z]{1,13}\.?\s*\d+[:.]\d+[-,;:\d\s]*)\)\s*$"
)


def extract_liaaron1():
    """1,290 Bible trivia pairs in Alpaca instruction/response form."""
    source_id = "liaaron1-bible-trivia-alpaca"
    path = RAW / source_id / "bible_trivia_alpaca.jsonl"
    questions = []
    malformed = []
    with_reference = 0
    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as error:
            malformed.append(f"line {index}: {error}")
            continue
        response = collapse(record.get("response"))
        citation = TRAILING_CITATION.search(response)
        reference = None
        if citation:
            reference = citation.group(1).strip()
            response = response[: citation.start()].strip()
            with_reference += 1
        questions.append(
            {
                "number": len(questions) + 1,
                "question": collapse(record.get("instruction")),
                "answer": response,
                "options": None,
                "reference": reference,
                "answer_as_published": collapse(record.get("response")),
                "context": record.get("context") or None,
            }
        )
    if malformed:
        print(f"  WARNING: {len(malformed)} malformed lines: {malformed[:3]}", flush=True)
    if len(questions) != 1290:
        print(f"  WARNING: card says 1,290 pairs, parsed {len(questions)}", flush=True)

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": [
            {
                "bank_id": "bible-trivia-alpaca",
                "title": "Bible trivia, Alpaca-formatted",
                "question_count": len(questions),
                "notes": (
                    "'instruction' holds the question and 'response' the answer; every "
                    f"'context' field in this set is empty. {with_reference} of "
                    f"{len(questions)} answers end with their verse, e.g. 'Mary (Matt "
                    "1:18)'; that citation is lifted into the reference field and the "
                    "answer left clean, with the published wording kept in "
                    "answer_as_published."
                ),
                "questions": questions,
            }
        ],
    }


def extract_ayanda_bible_quiz():
    """Multiple-choice Bible questions with difficulty and category."""
    source_id = "ayandangubane-bible-quiz"
    records = json.loads(
        (RAW / source_id / "data" / "questions.json").read_text(encoding="utf-8")
    )
    questions = []
    broken = []
    for record in records:
        options = record.get("options") or []
        index = record.get("correct_index")
        if not isinstance(index, int) or not 0 <= index < len(options):
            broken.append(record.get("id"))
            continue
        questions.append(
            {
                "number": len(questions) + 1,
                "question": collapse(record.get("question")),
                "answer": collapse(options[index]),
                "options": [collapse(o) for o in options],
                "reference": None,
                "difficulty": record.get("difficulty"),
                "category": record.get("category"),
                "upstream_id": record.get("id"),
            }
        )
    if broken:
        print(f"  WARNING: {len(broken)} records had an out-of-range answer index", flush=True)

    unique_questions = len({q["question"] for q in questions})
    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": [
            {
                "bank_id": "scripture-buzzer",
                "title": "Scripture Buzzer question set",
                "question_count": len(questions),
                "notes": (
                    f"{unique_questions} distinct question texts among {len(questions)} "
                    "records. The answer is options[correct_index]; the option order is as "
                    "published. These were produced by the Python generators in the repo's "
                    "gen/ directory from hand-written fact tables, not written one by one."
                ),
                "questions": questions,
            }
        ],
    }


def extract_brianchanda():
    """200 multiple-choice Bible questions with lettered options."""
    source_id = "brianchanda-bible-quiz"
    records = json.loads(
        (RAW / source_id / "bibleQuestions.json").read_text(encoding="utf-8")
    )
    questions, broken = [], []
    for record in records:
        options = record.get("options") or {}
        letter = record.get("answer")
        if letter not in options:
            broken.append(record.get("id"))
            continue
        questions.append(
            {
                "number": record.get("id"),
                "question": collapse(record.get("question")),
                "answer": collapse(options[letter]),
                "options": [collapse(options[k]) for k in sorted(options)],
                "reference": None,
                "answer_letter": letter,
            }
        )
    if broken:
        print(f"  WARNING: {len(broken)} records name an answer letter with no option", flush=True)

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": [
            {
                "bank_id": "final-bible-quiz-200",
                "title": "Bible Quiz question bank (200 multiple-choice questions)",
                "question_count": len(questions),
                "notes": (
                    "Options arrive as an A-D object and the answer as its letter; the answer "
                    "text is resolved here and the options are listed in letter order. No "
                    "difficulty, category or proof-text fields upstream."
                ),
                "questions": questions,
            }
        ],
    }


def extract_danielkorsah():
    """Bible questions held as MySQL INSERT statements, with difficulty and four answers."""
    source_id = "danielkorsah-bible-trivia-game"
    # Each question is an INSERT into questions followed by an INSERT into answers whose
    # rows carry TRUE for the correct one.
    question_pattern = re.compile(
        r"INSERT INTO questions \([^)]*\) VALUES\s*\((\d+),\s*'((?:[^'\\]|\\.)*)',\s*'([a-z_]+)'\)",
        re.IGNORECASE,
    )
    answer_block_pattern = re.compile(
        r"INSERT INTO answers \([^)]*\) VALUES\s*(.*?);", re.IGNORECASE | re.DOTALL
    )
    answer_row_pattern = re.compile(
        r"\(\s*@?\w+(?:_\w+)*\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*(TRUE|FALSE)\s*\)", re.IGNORECASE
    )

    def unescape_sql(value):
        return value.replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\")

    banks = []
    for filename, bank_id, title in [
        ("database.sql", "database-seed", "Bible Trivia Game, questions seeded in database.sql"),
        ("add_questions.sql", "added-very-hard", "Bible Trivia Game, the later very-hard additions"),
    ]:
        text = (RAW / source_id / "sql" / filename).read_text(encoding="utf-8", errors="replace")
        question_matches = list(question_pattern.finditer(text))
        questions, unmatched = [], []
        for index, match in enumerate(question_matches):
            end = (
                question_matches[index + 1].start()
                if index + 1 < len(question_matches)
                else len(text)
            )
            answer_block = answer_block_pattern.search(text, match.end(), end)
            if not answer_block:
                unmatched.append(match.group(2)[:50])
                continue
            rows = answer_row_pattern.findall(answer_block.group(1))
            options = [unescape_sql(t) for t, _ in rows]
            correct = [unescape_sql(t) for t, flag in rows if flag.upper() == "TRUE"]
            if not correct:
                unmatched.append(match.group(2)[:50])
                continue
            questions.append(
                {
                    "number": len(questions) + 1,
                    "question": collapse(unescape_sql(match.group(2))),
                    "answer": collapse(correct[0]),
                    "options": [collapse(o) for o in options] or None,
                    "reference": None,
                    "difficulty": match.group(3),
                    "category_id": int(match.group(1)),
                }
            )
        if unmatched:
            print(
                f"  WARNING: {filename}: {len(unmatched)} questions had no usable answer rows: "
                f"{unmatched[:2]}",
                flush=True,
            )
        banks.append(
            {
                "bank_id": bank_id,
                "title": title,
                "question_count": len(questions),
                "notes": (
                    f"Parsed from {filename}. Each question is a MySQL INSERT followed by four "
                    "answer rows, one flagged TRUE. Difficulty labels and the numeric "
                    "category id are kept as published; the file does not say what the "
                    "category ids mean. No proof-text references."
                ),
                "questions": questions,
            }
        )

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": banks,
    }


# ------------------------------------------------- filtered general trivia sets


def extract_opentriviaqa(exclusions):
    """Bible questions from the religion-faith category of OpenTriviaQA."""
    source_id = "uberspot-opentriviaqa"
    text = (RAW / source_id / "categories" / "religion-faith").read_text(
        encoding="utf-8", errors="replace"
    )
    parsed, candidates, kept = 0, [], []
    excluded = exclusions.get(source_id, {})
    for block in re.split(r"\n(?=#Q )", text):
        lines = [line.rstrip() for line in block.strip().split("\n") if line.strip()]
        if not lines or not lines[0].startswith("#Q "):
            continue
        question = collapse(lines[0][3:])
        answer, options = None, []
        for line in lines[1:]:
            if line.startswith("^ "):
                answer = collapse(line[2:])
            elif re.match(r"^[A-H] ", line):
                options.append(collapse(line[2:]))
        if not question or answer is None:
            continue
        parsed += 1

        tier, marker = classify(f"{question} {answer} {' '.join(options)}")
        if tier is None:
            continue
        record = {
            "number": len(kept) + 1,
            "question": question,
            "answer": answer,
            "options": options or None,
            "reference": None,
            "match_tier": tier,
            "matched_keyword": marker,
        }
        candidates.append({"question": question, "tier": tier, "keyword": marker})
        if question in excluded:
            continue
        record["number"] = len(kept) + 1
        kept.append(record)

    return (
        {
            "source_id": source_id,
            "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "banks": [
                {
                    "bank_id": "religion-faith-bible-subset",
                    "title": "OpenTriviaQA religion-faith category, Bible questions only",
                    "question_count": len(kept),
                    "notes": (
                        f"The religion-faith category holds {parsed} parsed questions across "
                        "all faiths and some questions that are not about religion at all. "
                        f"{len(candidates)} matched a Bible keyword and "
                        f"{len(candidates) - len(kept)} of those were then ruled out by hand "
                        "(see tools/bible_filter_exclusions.json). Only the Bible subset is "
                        "kept here; the full raw category file is in raw/ unchanged."
                    ),
                    "questions": kept,
                }
            ],
        },
        {"parsed_total": parsed, "candidates": candidates},
    )


def repair_unescaped_quotes(line):
    """Escape double quotes that sit inside a JSON string value.

    About 5% of el-cms records carry unescaped quotes in the question text, e.g.
    '"question":"The word "cumulus" refers to..."'. A quote only ends a string when the
    next non-space character is JSON punctuation, so any other quote is content.
    """
    out = []
    in_string = False
    index = 0
    while index < len(line):
        char = line[index]
        if not in_string:
            out.append(char)
            if char == '"':
                in_string = True
        elif char == "\\":
            out.append(line[index : index + 2])
            index += 2
            continue
        elif char == '"':
            lookahead = index + 1
            while lookahead < len(line) and line[lookahead] == " ":
                lookahead += 1
            if lookahead >= len(line) or line[lookahead] in ":,]}":
                out.append(char)
                in_string = False
            else:
                out.append('\\"')
        else:
            out.append(char)
        index += 1
    return "".join(out)


def load_el_cms_records(path):
    """Read an el-cms category file: one JSON object per line, wrapped in brackets.

    The files open with '[' and close with ']' but put no commas between objects, so
    they are not valid JSON as a whole and have to be read a line at a time.
    """
    records, repaired, malformed = [], 0, []
    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.strip().rstrip(",")
        if not stripped.startswith("{"):
            continue
        try:
            records.append(json.loads(stripped))
            continue
        except json.JSONDecodeError:
            pass
        try:
            records.append(json.loads(repair_unescaped_quotes(stripped)))
            repaired += 1
        except json.JSONDecodeError as error:
            malformed.append(f"{path.name} line {index}: {error}")
    if repaired:
        print(f"  {path.name}: repaired unescaped quotes in {repaired} records", flush=True)
    if malformed:
        print(
            f"  WARNING: {len(malformed)} still unreadable in {path.name}: {malformed[:3]}",
            flush=True,
        )
    return records


def extract_el_cms(exclusions):
    """Bible questions from el-cms/Open-trivia-database's English category files."""
    source_id = "el-cms-open-trivia-database"
    excluded = exclusions.get(source_id, {})
    banks, all_candidates = [], {}
    for filename, bank_id, min_tier in [
        ("religion_and_mythology.json", "religion-and-mythology-bible-subset", "weak"),
        ("uncategorized.json", "uncategorized-bible-subset", "medium"),
    ]:
        records = load_el_cms_records(RAW / source_id / "en" / "todo" / filename)
        kept, candidates = [], []
        for record in records:
            question = collapse(record.get("question"))
            answers = [collapse(a) for a in (record.get("answers") or [])]
            index = record.get("answer")
            answer = (
                answers[index]
                if isinstance(index, int) and 0 <= index < len(answers)
                else None
            )
            if not question or answer is None:
                continue
            tier, marker = classify(f"{question} {' '.join(answers)}", min_tier=min_tier)
            if tier is None:
                continue
            candidates.append({"question": question, "tier": tier, "keyword": marker})
            if question in excluded:
                continue
            kept.append(
                {
                    "number": len(kept) + 1,
                    "question": question,
                    "answer": answer,
                    # A single-entry answers list is not a choice set: these records give
                    # the answer only, so they are open-answer questions with no options.
                    "options": answers if len(answers) > 1 else None,
                    "reference": record.get("source") or None,
                    "match_tier": tier,
                    "matched_keyword": marker,
                    "tags": record.get("tags"),
                }
            )
        all_candidates[filename] = candidates
        banks.append(
            {
                "bank_id": bank_id,
                "title": f"el-cms Open-trivia-database, {filename}, Bible questions only",
                "question_count": len(kept),
                "notes": (
                    f"Scanned {len(records)} records in {filename}. "
                    + (
                        "This file is a 31,000-record general-knowledge pile, so a match had "
                        "to be a Bible-specific name or term: a loose net on it returned 1,800 "
                        "hits that were overwhelmingly ordinary first names (John 397, James "
                        "214, Michael 113), too many to read and too few of them real. "
                        if min_tier == "medium"
                        else "Matches of every strength were collected, then read by hand. "
                    )
                    + f"{len(candidates)} matched, {len(candidates) - len(kept)} ruled out "
                    "by hand (see tools/bible_filter_exclusions.json)."
                ),
                "questions": kept,
            }
        )

    return (
        {
            "source_id": source_id,
            "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "banks": banks,
        },
        all_candidates,
    )


def decode_opentdb(value):
    """OpenTDB base64 field to text, reporting rather than hiding a bad payload."""
    try:
        return base64.b64decode(value).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError, TypeError) as error:
        raise RuntimeError(f"undecodable OpenTDB field {value!r}: {error}") from error


def extract_opentdb(exclusions):
    """Bible questions from the Open Trivia DB API pull."""
    source_id = "opentdb-api"
    excluded = exclusions.get(source_id, {})
    scanned, candidates, kept = 0, [], []
    for path in sorted((RAW / source_id).glob("category-*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        for record in payload.get("results") or []:
            question = collapse(decode_opentdb(record["question"]))
            correct = collapse(decode_opentdb(record["correct_answer"]))
            incorrect = [
                collapse(decode_opentdb(a)) for a in record.get("incorrect_answers") or []
            ]
            scanned += 1
            tier, marker = classify(f"{question} {correct} {' '.join(incorrect)}")
            if tier is None:
                continue
            candidates.append({"question": question, "tier": tier, "keyword": marker})
            if question in excluded:
                continue
            kept.append(
                {
                    "number": len(kept) + 1,
                    "question": question,
                    "answer": correct,
                    "options": sorted([correct] + incorrect) if incorrect else None,
                    "reference": None,
                    "match_tier": tier,
                    "matched_keyword": marker,
                    "opentdb_category": collapse(decode_opentdb(record["category"])),
                    "opentdb_difficulty": collapse(decode_opentdb(record["difficulty"])),
                    "opentdb_type": collapse(decode_opentdb(record["type"])),
                }
            )

    return (
        {
            "source_id": source_id,
            "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "banks": [
                {
                    "bank_id": "opentdb-bible-subset",
                    "title": "Open Trivia DB, Bible questions from Mythology and General Knowledge",
                    "question_count": len(kept),
                    "notes": (
                        f"Scanned {scanned} questions pulled from the API. Open Trivia DB has "
                        "no religion category, so the two nearest pools were taken in full: "
                        "Mythology and General Knowledge. "
                        f"{len(candidates)} matched a Bible keyword, "
                        f"{len(candidates) - len(kept)} were then ruled out by hand. Options "
                        "are sorted alphabetically because the API returns the correct answer "
                        "separately from the wrong ones, so the published order is not an "
                        "order a player ever saw."
                    ),
                    "questions": kept,
                }
            ],
        },
        {"scanned": scanned, "candidates": candidates},
    )


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    exclusions = load_exclusions()
    grand_total = 0

    for extractor in (
        extract_ministry_to_children,
        extract_liaaron1,
        extract_ayanda_bible_quiz,
        extract_brianchanda,
        extract_danielkorsah,
    ):
        print(f"{extractor.__name__}:", flush=True)
        grand_total += write_source(extractor())

    for extractor in (extract_opentriviaqa, extract_el_cms, extract_opentdb):
        print(f"{extractor.__name__}:", flush=True)
        container, candidates = extractor(exclusions)
        grand_total += write_source(container, candidates)

    print(f"\ntrivia questions extracted: {grand_total}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
