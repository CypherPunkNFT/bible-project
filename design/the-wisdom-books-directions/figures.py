"""The figures The wisdom books page draws beside the text, each checked against the Berean and the study before it is
drawn. build_figures refuses the build if a figure's words are not in its verse, its order is not the text's order, a
count is not what the verses hold, or a verse lies outside every passage the study itself cites."""
import re

from scripture_text import BuildError, fold, has_words, plain_text

TIME_PAIR = re.compile(r"a time (?:to|for) ([^,.;]+?) and a time (?:to|for) ([^,.;]+)")


def clean(text: str) -> str:
    return fold(text).replace('"', "").replace("'", "")


class Figures:
    def __init__(self, builder, lists, raw: str) -> None:
        self.builder, self.L, self.raw = builder, lists, raw
        # Every verse the study's own text cites, before any figure adds a reference of its own.
        self.cited = {cv_key for key, p in builder.passages.items() for cv_key in self.verse_keys(key)}

    def verse_keys(self, key: str) -> set:
        book = key.split(".")[0]
        return {f"{book} {cv}" for cv, _ in self.builder.passages[key]["verses"]}

    def verse(self, words: str, ref: str, what: str) -> dict:
        """A Berean phrase at its reference, inside the study's own passages. Returns {words, r, label}."""
        key = self.builder.passage(ref)
        if not self.verse_keys(key) <= self.cited:
            raise BuildError(f"{what}: {ref} is not inside any passage the study cites")
        if not has_words(clean(words), plain_text(self.builder.bible, ref).replace("'", "")):
            raise BuildError(f"{what}: {words!r} is not in {ref}")
        return {"words": words, "r": key, "label": ref}

    def in_study(self, words: str, what: str) -> str:
        if fold(words).replace("'", "’") not in fold(self.raw).replace("'", "’") and fold(words) not in fold(self.raw):
            raise BuildError(f"{what}: {words!r} is not in the study's own text")
        return words

    def in_order(self, items: list, what: str) -> None:
        def position(label):
            chapter, verse = label.rsplit(" ", 1)[1].split("–")[0].split(":")
            return int(chapter), int(verse)
        places = [position(i["label"]) for i in items]
        if places != sorted(places):
            raise BuildError(f"{what}: the items are not in the text's own order")

    def books(self) -> list:
        out = []
        for book in self.L.BOOKS:
            voices = [{**self.verse(v["words"], v["ref"], f"voice {v['name']}"), "name": v["name"], "verdict": bool(v.get("verdict"))} for v in book["voices"]]
            if book.get("floor"):
                floor = [self.verse(f["words"], f["ref"], f"{book['book']} meets the shared line") for f in book["floor"]]
                for point in floor:
                    if "fear" not in point["words"].lower():
                        raise BuildError(f"{book['book']}: a point on the shared line must hold the word 'fear', found {point['words']!r}")
                end = None
            elif book.get("end"):
                floor, end = [], self.verse(book["end"]["words"], book["end"]["ref"], f"{book['book']} end")
            else:
                raise BuildError(f"{book['book']}: has neither a floor nor an end")
            out.append({"book": book["book"], "kind": book["kind"], "shape": book["shape"], "voices": voices, "floor": floor, "end": end})
        friends = [v for b in out for v in b["voices"] if v["verdict"]]
        if [v["name"] for v in friends] != ["Eliphaz and his two friends"] or "Eliphaz" not in plain_text(self.builder.bible, friends[0]["label"]):
            raise BuildError("only Eliphaz and his two friends carry God's verdict, and that verse must name Eliphaz")
        if sum(1 for b in out if b["floor"]) != 3:
            raise BuildError("three books meet the shared line; the Song does not")
        return out

    def shaft(self) -> dict:
        down = [{**self.verse(s["words"], s["ref"], f"shaft {s['label']}"), "label_page": s["label"]} for s in self.L.SHAFT]
        up = [{**self.verse(s["words"], s["ref"], f"shaft {s['label']}"), "label_page": s["label"]} for s in self.L.SHAFT_UP]
        self.in_order(down + up, "the shaft")
        return {"down": down, "up": up, "bottom": self.in_study(self.L.SHAFT_BOTTOM, "the shaft's bottom"),
                "range": self.builder.passage(self.L.SHAFT_RANGE)}

    def questions(self) -> dict:
        items = [self.verse(word, ref, "God's questions") for word, ref in self.L.QUESTIONS]
        self.in_order(items, "God's questions")
        knows = self.L.KNOWS
        return {"items": items, "reader": self.verse(knows["reader"]["words"], knows["reader"]["ref"], "what the reader knows"),
                "reader_line": knows["reader_line"], "job_line": self.in_study(knows["job_line"], "what Job knows"),
                "verdicts": [{"who": v["who"], "lines": [self.verse(x["words"], x["ref"], f"verdict on {v['who']}") for x in v["lines"]]} for v in self.L.VERDICTS]}

    def doors_and_tables(self) -> dict:
        doors = [{**self.verse(d["words"], d["ref"], d["label"]), "label_page": d["label"]} for d in self.L.DOORS]
        first, second = (clean(d["words"]) for d in doors)
        shared = first[:next((i for i, (a, b) in enumerate(zip(first, second)) if a != b), min(len(first), len(second)))].rsplit(" ", 1)[0]
        if len(shared.split()) < 6:
            raise BuildError(f"the two doors share only {shared!r}; the study says the same line stands at both")
        tables = []
        for table in self.L.TABLES:
            call = self.builder.passage(table["call"])
            tables.append({"host": table["host"], "call": call, "callLabel": table["call"], "callWords": plain_text(self.builder.bible, table["call"]),
                           "callText": self.builder.passages[call]["verses"][0][1],
                           "offers": [self.verse(o["words"], o["ref"], f"{table['host']}'s offer") for o in table["offers"]],
                           "unsaid": self.verse(table["unsaid"]["words"], table["unsaid"]["ref"], "what Folly does not say") if table.get("unsaid") else None})
        if len(tables) != 2 or tables[0]["callWords"] != tables[1]["callWords"]:
            raise BuildError("Wisdom's call and Folly's call must be word for word the same, as the study says")
        return {"doors": doors, "shared": shared, "tables": tables}

    def pair(self) -> dict:
        sides = []
        for side in self.L.PAIR:
            text = plain_text(self.builder.bible, side["ref"])
            if not text.startswith(side["head"] + " "):
                raise BuildError(f"the pair: {side['ref']} does not begin {side['head']!r}")
            sides.append({"head": side["head"], "rest": text[len(side["head"]):].strip(), "r": self.builder.passage(side["ref"]), "label": side["ref"]})
        beside = []
        for row in self.L.BESIDE:
            other = row["beside"]
            beside.append({"saying": self.verse(row["saying"]["words"], row["saying"]["ref"], "a saying"),
                           "beside": {"study": self.in_study(other["study"], "beside a saying")} if "study" in other
                           else self.verse(other["words"], other["ref"], "beside a saying")})
        return {"sides": sides, "beside": beside}

    def times(self) -> dict:
        text = plain_text(self.builder.bible, self.L.TIMES_RANGE)
        pairs = TIME_PAIR.findall(text)
        if len(pairs) != self.L.TIMES_COUNT:
            raise BuildError(f"{self.L.TIMES_RANGE} holds {len(pairs)} pairs of times, the page says {self.L.TIMES_COUNT}")
        self.in_study(self.L.TIMES_STUDY, "the count of pairs")
        return {"pairs": [list(p) for p in pairs], "r": self.builder.passage(self.L.TIMES_RANGE), "label": self.L.TIMES_RANGE}

    def refrains(self) -> dict:
        refrain = self.L.REFRAIN
        found = [self.verse(refrain["words"], ref, "the refrain") for ref in refrain["refs"]]
        whole = plain_text(self.builder.bible, refrain["range"])
        if whole.count(refrain["words"]) != len(refrain["refs"]):
            raise BuildError(f"the refrain comes {whole.count(refrain['words'])} times in the Song, the page lists {len(refrain['refs'])}")
        self.in_study("Three times the woman warns", "the refrain count")
        belonging = []
        for first, second, ref in self.L.BELONGING:
            self.verse(f"{first} and {second}", ref, "belonging")
            belonging.append({"first": first, "second": second, "r": self.builder.passage(ref), "label": ref})
        if len({b["second"] for b in belonging}) != len(belonging):
            raise BuildError("the lines of belonging must each change their second half")
        return {"words": refrain["words"], "verses": found, "belonging": belonging}


def build_figures(builder, lists, raw: str, study: dict) -> dict:
    figures = Figures(builder, lists, raw)
    quoted = [b["label"] for s in [{"blocks": study["opening"]}] + study["parts"] for b in s["blocks"] if b["k"] == "quote"]
    quoted.append(builder.passages[study["close"]["passage"]]["label"])
    missing = [q for q in quoted if q not in lists.SPEAKERS]
    unused = [k for k in lists.SPEAKERS if k not in quoted]
    if missing or unused:
        raise BuildError(f"every printed passage needs one speaker line: missing {missing}, unused {unused}")
    speakers = {}
    for label, entry in lists.SPEAKERS.items():
        verdict = entry.get("verdict")
        speakers[label] = {"who": entry["who"], "kind": entry["kind"],
                           "verdict": figures.verse(verdict["words"], verdict["ref"], f"verdict on {label}") if verdict else None}
    return {"speakers": speakers, "books": figures.books(), "floorName": lists.FLOOR_NAME, "songNote": lists.SONG_NOTE,
            "shaft": figures.shaft(), "questions": figures.questions(), "proverbs": figures.doors_and_tables(),
            "pair": figures.pair(), "times": figures.times(), "refrains": figures.refrains()}
