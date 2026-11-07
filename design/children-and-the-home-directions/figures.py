"""The drawn figures of the Children and the home page: one per part, each built from verse words that this file proves
are in their verses, in the order the figure claims. A figure that claims an order, a count or a turn fails the build if
the Berean does not show it."""
import re

from scripture_text import BuildError, fold

# 01 From the heart outward (Deuteronomy 6:4–9). The crown is the ground of everything; the rings run from the heart
# out to the town gate, and figures.py proves their verses never step backwards.
RINGS = {
    "crown": [("Deuteronomy 6:4", "The LORD our God, the LORD is One"), ("Deuteronomy 6:5", "love the LORD your God with all your heart")],
    "rings": [
        {"id": "heart", "name": "Your heart", "items": [("Deuteronomy 6:6", "upon your hearts")]},
        {"id": "children", "name": "Your children", "items": [("Deuteronomy 6:7", "teach them diligently to your children")]},
        {"id": "day", "name": "The day", "items": [("Deuteronomy 6:7", "when you sit at home"), ("Deuteronomy 6:7", "when you walk along the road"),
                                                    ("Deuteronomy 6:7", "when you lie down"), ("Deuteronomy 6:7", "when you get up")]},
        {"id": "body", "name": "Hand and forehead", "items": [("Deuteronomy 6:8", "on your hands"), ("Deuteronomy 6:8", "on your foreheads")]},
        {"id": "house", "name": "Doorpost and gate", "items": [("Deuteronomy 6:9", "on the doorposts of your houses"), ("Deuteronomy 6:9", "on your gates")]},
    ],
}

# 02 The answer's order (Deuteronomy 6:20–25): the question, then the rescue, then the commands.
ANSWER = [
    {"step": "The child asks", "ref": "Deuteronomy 6:20", "words": "What is the meaning of the decrees and statutes and ordinances"},
    {"step": "The story comes first", "ref": "Deuteronomy 6:21", "words": "We were slaves of Pharaoh in Egypt, but the LORD brought us out"},
    {"step": "Then the commands", "ref": "Deuteronomy 6:24", "words": "the LORD commanded us to observe all these statutes"},
]
# 02 Five links in one chain (Psalm 78:5–6), proved in order; the warning of 78:8; and Timothy's three (2 Timothy 1:5).
CHAIN = {"ref": "Psalm 78:5–6", "links": ["our fathers", "their children", "the coming generation", "children yet to be born", "their own children"],
         "warning": ("Psalm 78:8", "Then they will not be like their fathers")}
TIMOTHY = {"ref": "2 Timothy 1:5", "links": ["your grandmother Lois", "your mother Eunice", "in you as well"],
           "father": ("Acts 16:1", "a Greek father"), "mother": ("Acts 16:1", "a believing Jewish woman")}

# 03 "In vain", counted in Psalm 127:1–2, then the turn; and where Psalm 128's blessing begins and ends.
VAIN = {"ref": "Psalm 127:1–2", "phrase": "in vain", "count": 3, "turn": "for He gives sleep to His beloved"}
TABLE = [("Psalm 128:1", "Blessed are all who fear the LORD"), ("Psalm 128:3", "your sons like olive shoots sitting around your table"),
         ("Psalm 128:6", "Peace be upon Israel!")]

# 04 Two loves, a generation apart. "why" is the reason Genesis gives; None means the verse gives none, and the build
# proves that clause has no "because". The favoured son of the first row is the father of the second (Genesis 35:10).
LOVES = [
    {"who": "Isaac", "whom": "Esau", "ref": "Genesis 25:28", "words": "he loved Esau", "why": "Because Isaac had a taste for wild game"},
    {"who": "Rebekah", "whom": "Jacob", "ref": "Genesis 25:28", "words": "but Rebekah loved Jacob", "why": None},
    {"who": "Jacob, named Israel", "whom": "Joseph", "ref": "Genesis 37:3", "words": "Israel loved Joseph more than his other sons",
     "why": "because Joseph had been born to him in his old age"},
]
RENAMED = ("Genesis 35:10", "your name will be Israel")
ROBE = [("Genesis 37:3", "he made him a robe of many colors"), ("Genesis 37:4", "they hated him")]

# 05 Two threads in one courtyard: 1 Samuel 2:12–26 cuts between Eli's sons and Samuel. Each Samuel span names him;
# no span of the sons does. Then what Eli did, and what he did not do.
THREADS = [("sons", "1 Samuel 2:12–17"), ("samuel", "1 Samuel 2:18–21"), ("sons", "1 Samuel 2:22–25"), ("samuel", "1 Samuel 2:26")]
ELI = [
    {"step": "He knew", "done": True, "ref": "1 Samuel 2:22", "words": "he heard about everything his sons were doing"},
    {"step": "He spoke", "done": True, "ref": "1 Samuel 2:23", "words": "Why are you doing these things?"},
    {"step": "He did not restrain them", "done": False, "ref": "1 Samuel 3:13", "words": "he did not restrain them"},
]
ROBES = [("Genesis 37:3", "a robe of many colors"), ("1 Samuel 2:19", "a little robe")]

# 06 A saying works beside its opposite (Proverbs 26:4–5); both children and fathers are spoken to; the father's
# five acts on the road (Luke 15:20), proved in order.
PAIR = [("Proverbs 26:4", "Do not answer a fool according to his folly"), ("Proverbs 26:5", "Answer a fool according to his folly")]
SPOKEN = [
    {"to": "Children", "items": [("Ephesians 6:1", "Children, obey your parents in the Lord"), ("Colossians 3:20", "Children, obey your parents in everything")]},
    {"to": "Fathers", "items": [("Ephesians 6:4", "Fathers, do not provoke your children to wrath"), ("Colossians 3:21", "Fathers, do not provoke your children")]},
]
ROAD = {"ref": "Luke 15:20", "start": "while he was still in the distance",
        "acts": ["saw him", "was filled with compassion", "He ran to his son", "embraced him", "kissed him"]}


def build_figures(builder) -> dict:
    """Prove every figure against the Berean and return the figures' data, with passage keys for the verse sheet."""
    def item(label: str, words: str) -> dict:
        key = builder.passage(label)
        if not has(builder.text_of(key), words):
            raise BuildError(f"figure words {words!r} are not in {label}")
        return {"r": key, "label": label, "words": words}

    rings = {"crown": [item(*pair) for pair in RINGS["crown"]],
             "rings": [{**ring, "items": [item(*pair) for pair in ring["items"]]} for ring in RINGS["rings"]]}
    order = [verse_number(pair[0]) for ring in RINGS["rings"] for pair in ring["items"]]
    if order != sorted(order):
        raise BuildError(f"the rings of Deuteronomy 6 step backwards in their verses: {order}")
    day = RINGS["rings"][2]["items"]
    in_order(builder, "Deuteronomy 6:7", [words for _, words in day], "the four moments of the day")

    answer = [{**step, **item(step["ref"], step["words"])} for step in ANSWER]
    if [verse_number(s["ref"]) for s in ANSWER] != sorted(verse_number(s["ref"]) for s in ANSWER):
        raise BuildError("the answer's steps are not in the order of Deuteronomy 6:20–25")
    in_order(builder, CHAIN["ref"], CHAIN["links"], "the five links of Psalm 78")
    in_order(builder, TIMOTHY["ref"], TIMOTHY["links"], "Timothy's three")
    chain = {"r": builder.passage(CHAIN["ref"]), "label": CHAIN["ref"], "links": CHAIN["links"], "warning": item(*CHAIN["warning"])}
    timothy = {"r": builder.passage(TIMOTHY["ref"]), "label": TIMOTHY["ref"], "links": TIMOTHY["links"],
               "father": item(*TIMOTHY["father"]), "mother": item(*TIMOTHY["mother"])}

    text = builder.text_of(builder.passage(VAIN["ref"]))
    count = len(re.findall(r"(?<!\w)in vain(?!\w)", text, flags=re.I))
    if count != VAIN["count"]:
        raise BuildError(f"Psalm 127:1–2 says “in vain” {count} times, not {VAIN['count']}")
    key = builder.passage(VAIN["ref"])
    raw = " ".join(text for _, text in builder.passages[key]["verses"])
    turn_at = raw.find(VAIN["turn"])
    if turn_at < 0:
        raise BuildError(f"the turn {VAIN['turn']!r} is not in {VAIN['ref']}")
    lines = [line.strip() for line in re.split(r"(?<=in vain)[;.]\s*", raw[:turn_at].rstrip(" -—")) if line.strip()]
    if len(lines) != count:
        raise BuildError(f"Psalm 127:1–2 did not split into {count} “in vain” lines before the turn: {lines}")
    vain = {"r": key, "label": VAIN["ref"], "count": count, "lines": lines,
            "turn": item(VAIN["ref"], VAIN["turn"]), "table": [item(*pair) for pair in TABLE]}

    loves = []
    for row in LOVES:
        entry = {**row, **item(row["ref"], row["words"])}
        clause = clause_of(builder.text_of(entry["r"]), row["words"])
        if row["why"] is None:
            if re.search(r"\bbecause\b", clause, flags=re.I):
                raise BuildError(f"LOVES says Genesis gives no reason for {row['words']!r}, but its clause has one")
        else:
            entry["whyItem"] = item(row["ref"], row["why"])
        loves.append(entry)

    threads = []
    for who, label in THREADS:
        key = builder.passage(label)
        names = "Samuel" in builder.text_of(key)
        if names != (who == "samuel"):
            raise BuildError(f"thread {label} is marked {who}, but it {'names' if names else 'does not name'} Samuel")
        threads.append({"who": who, "r": key, "label": label, "verses": len(builder.passages[key]["verses"])})
    eli = [{**step, **item(step["ref"], step["words"])} for step in ELI]

    in_order(builder, ROAD["ref"], [ROAD["start"]] + ROAD["acts"], "the father's acts on the road")
    road = {"r": builder.passage(ROAD["ref"]), "label": ROAD["ref"], "start": ROAD["start"], "acts": ROAD["acts"]}
    return {
        "rings": rings, "answer": answer, "chain": chain, "timothy": timothy, "vain": vain,
        "loves": loves, "renamed": item(*RENAMED), "robe": [item(*pair) for pair in ROBE],
        "threads": threads, "eli": eli, "robes": [item(*pair) for pair in ROBES],
        "pair": [item(*pair) for pair in PAIR], "spoken": [{"to": s["to"], "items": [item(*p) for p in s["items"]]} for s in SPOKEN],
        "road": road,
    }


def has(text: str, words: str) -> bool:
    words = fold(words).replace('"', "").replace("'", "").replace("…", "")
    text = text.replace("'", "")
    return any(re.search(r"(?<!\w)" + re.escape(v) + r"(?!\w)", text) for v in (words, words[:1].lower() + words[1:], words[:1].upper() + words[1:]))


def in_order(builder, label: str, pieces: list, what: str) -> None:
    text, at = builder.text_of(builder.passage(label)).replace("'", ""), 0
    for piece in pieces:
        match = re.compile(r"(?<!\w)" + re.escape(fold(piece)) + r"(?!\w)", flags=re.I).search(text, at)
        if not match:
            raise BuildError(f"{what}: {piece!r} is not in {label} after the piece before it")
        at = match.end()


def verse_number(label: str) -> tuple:
    chapter, verse = re.search(r"(\d+):(\d+)", label).groups()
    return int(chapter), int(verse)


def clause_of(text: str, words: str) -> str:
    """The clause that holds the words: from the last ; or . before them to the next one after."""
    at = fold(text).lower().find(fold(words).lower())
    start = max(text.rfind(";", 0, at), text.rfind(".", 0, at)) + 1
    ends = [i for i in (text.find(";", at), text.find(".", at)) if i >= 0]
    return text[start:min(ends) if ends else len(text)]
