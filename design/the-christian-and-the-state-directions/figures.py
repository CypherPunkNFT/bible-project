"""The figures of The Christian and the state page, checked before they are drawn. Every Berean phrase in
study_lists.py must be in its verse; every phrase taken from the study must be in content.md; every count the page
states is counted here from the verses themselves."""
import re

from scripture_text import BuildError, fold, has_words, plain_text

NUMBER_NAMES = {"three": 3, "six": 6}


def clean(text: str) -> str:
    return fold(text).replace('"', "").replace("'", "")


def part_text(raw: str, number: str) -> str:
    """The raw text of one part of content.md, from its heading to the next."""
    match = re.search(r"^## " + re.escape(number) + r" .*?(?=^## |\Z)", raw, flags=re.M | re.S)
    if not match:
        raise BuildError(f"content.md has no part {number}")
    return clean(match.group(0))


class Figures:
    def __init__(self, builder, lists, raw: str, study: dict) -> None:
        self.b, self.L, self.raw, self.study = builder, lists, raw, study
        self.added: dict = {}

    def verse(self, entry: dict, where: str) -> dict:
        """A phrase in its verse. Returns what the page needs to print it and open it."""
        key = self.b.passage(entry["ref"])
        if not has_words(clean(entry["words"]), self.b.text_of(key).replace("'", "")):
            raise BuildError(f"{where}: {entry['words']!r} is not in {entry['ref']}")
        if entry.get("added"):
            self.added[key] = entry["ref"]
        return {"words": entry["words"], "r": key, "ref": self.b.passages[key]["label"], "added": bool(entry.get("added"))}

    def in_study(self, phrase: str, text: str, where: str) -> None:
        if clean(phrase).lower() not in text.lower():
            raise BuildError(f"{where}: {phrase!r} is not in the study's own text")

    def items(self) -> dict:
        parts = {p["n"] for p in self.study["parts"]}
        rows = []
        for item in self.L.ITEMS:
            if item["col"] not in self.L.COLUMNS or item["part"] not in parts:
                raise BuildError(f"item {item['id']}: unknown column {item['col']!r} or part {item['part']!r}")
            if item["col"] == "cross" and item.get("from") not in ("god", "ruler"):
                raise BuildError(f"item {item['id']}: a crossing must say which side it comes from")
            rows.append({**{k: item[k] for k in ("id", "col", "label", "part")}, "from": item.get("from"), **self.verse(item, f"item {item['id']}")})
        if any(i["col"] == "ruler" and i["ref"].startswith("Jeremiah") for i in rows):
            raise BuildError("the coin holds what the ruler is owed; Jeremiah 29:7 is owed to the city and belongs in part 03 only")
        return {"rows": rows, "columns": self.L.COLUMNS, "read": self.L.ITEMS_READ}

    def takes(self) -> dict:
        warning = plain_text(self.b.bible, self.L.TAKE_RANGE)
        count = len(re.findall(r"\btake\b", warning, flags=re.I))
        if count != len(self.L.TAKES):
            raise BuildError(f"{self.L.TAKE_RANGE} says 'take' {count} times, but TAKES has {len(self.L.TAKES)} rows")
        said = re.search(r"comes (\w+) times", self.L.TAKE_STUDY)
        if not said or NUMBER_NAMES.get(said.group(1)) != count:
            raise BuildError(f"the study's count {self.L.TAKE_STUDY!r} does not match {count}")
        self.in_study(self.L.TAKE_STUDY, part_text(self.raw, "01"), "TAKE_STUDY")
        rows = []
        for row in self.L.TAKES:
            if not re.search(r"\btake\b", row["words"], flags=re.I):
                raise BuildError(f"take row {row['label']!r}: its words must hold the verb 'take'")
            rows.append({"label": row["label"], **self.verse(row, f"take row {row['label']!r}")})
        return {"range": self.b.passage(self.L.TAKE_RANGE), "count": count, "rows": rows,
                "end": self.verse(self.L.TAKE_END, "take end"),
                "battles": {k: self.verse(v, f"battles {k}") for k, v in self.L.BATTLES.items()}}

    def shown_value(self, display: str, phrase: str) -> None:
        digits = re.match(r"([\d,]+) ", phrase)
        if digits:
            value = int(digits.group(1).replace(",", ""))
        else:
            name = next((n for n in self.L.NUMBER_WORDS if phrase.startswith(n + " ")), None)
            if name is None:
                raise BuildError(f"Solomon figure: {phrase!r} starts with no number this build can read")
            value = self.L.NUMBER_WORDS[name]
        if int(display.replace(",", "")) != value:
            raise BuildError(f"Solomon figure: shows {display}, but {phrase!r} says {value}")

    def limits(self) -> dict:
        text = plain_text(self.b.bible, self.L.LIMIT_RANGE)
        count = len(re.findall(r"\bmust not\b", text))
        if count != len(self.L.LIMITS):
            raise BuildError(f"{self.L.LIMIT_RANGE} says 'must not' {count} times, but LIMITS has {len(self.L.LIMITS)} rows")
        rows = []
        for row in self.L.LIMITS:
            where = f"limit {row['label']!r}"
            limit, record = self.verse(row["limit"], where), self.verse(row["record"], where)
            if not row["limit"]["words"].startswith("must not"):
                raise BuildError(f"{where}: the limit must be one of the 'must not' lines")
            self.in_study(row["means"], part_text(self.raw, "02"), where)
            for display, phrase in row["shown"]:
                if phrase not in row["record"]["words"]:
                    raise BuildError(f"{where}: {phrase!r} is not in the record's words")
                self.shown_value(display, phrase)
            rows.append({"label": row["label"], "means": row["means"], "limit": limit, "record": record, "shown": row["shown"]})
        return {"rows": rows, "heart": {k: self.verse(v, f"heart {k}") for k, v in self.L.HEART.items()}}

    def owed(self) -> dict:
        rows = []
        for row in self.L.OWED:
            where = f"owed {row['verb']!r}"
            if not has_words(row["verb"].lower(), row["words"].lower()):
                raise BuildError(f"{where}: the verb is not a word of its own phrase")
            shown = self.verse(row, where)
            whom = self.verse({"words": row["to"], "ref": row.get("to_ref", row["ref"])}, where)
            rows.append({"verb": row["verb"], **shown, "to": row["to"], "toRef": whom["r"]})
        return {"rows": rows, "read": self.L.OWED_READ}

    def collisions(self) -> list:
        text = part_text(self.raw, "04")
        rows = []
        for row in self.L.COLLISIONS:
            where = f"collision {row['ruler']!r}"
            shown = {k: self.verse(row[k], where) for k in ("command", "answer", "manner", "after") if k in row}
            name = row["ruler"].split()[-1]
            verse_text = self.b.text_of(self.b.passage(row.get("ruler_ref", row["command"]["ref"])))
            if name.lower() not in text.lower() and not has_words(name, verse_text):
                raise BuildError(f"{where}: {name!r} is neither in part 04 nor in the verse that names the ruler")
            if row.get("ruler_ref"):
                self.added[self.b.passage(row["ruler_ref"])] = row["ruler_ref"]
            rows.append({"ruler": row["ruler"], "where": row["where"], **shown})
        return rows

    def dates(self) -> dict:
        text = part_text(self.raw, "05")
        # The notes as the study writes them (part_text folds apostrophes away for matching; the page shows these).
        own = re.search(r"^## 05 .*?(?=^## |\Z)", self.raw, flags=re.M | re.S).group(0)
        notes = re.findall(r"\[check: ([^\]]+)\]", own)
        rows, last = [], 0
        for row in self.L.DATES:
            where = f"date {row['year']}"
            if row["kind"] not in self.L.KINDS:
                raise BuildError(f"{where}: unknown kind {row['kind']!r}")
            if int(row["year"]) <= last:
                raise BuildError(f"{where}: dates must run in order")
            last = int(row["year"])
            self.in_study(row["year"], text, where)
            self.in_study(row["who"], text, where)
            note = next((n for n in notes if clean(n).startswith(clean(row["check"]))), None)
            if note is None:
                raise BuildError(f"{where}: {row['check']!r} does not begin any [check: …] note in part 05")
            rows.append({**row, "check": note})
        return {"rows": rows, "kinds": self.L.KINDS}

    def isaiah(self) -> dict:
        whole = plain_text(self.b.bible, self.L.ISAIAH_RANGE).replace("'", "")
        steps, last = [], -1
        for row in self.L.ISAIAH:
            shown = self.verse(row, f"Isaiah step {row['label']!r}")
            at = whole.find(clean(row["words"]))
            if at <= last:
                raise BuildError(f"Isaiah step {row['label']!r} is out of the passage's own order")
            last = at
            steps.append({"label": row["label"], **shown})
        text = part_text(self.raw, "06")
        views = self.L.VIEWS
        for phrase in views["just"]["lines"] + views["just"]["tests"] + views["peace"]["lines"] + views["peace"]["tests"] + views["both"]:
            self.in_study(phrase, text, "views")
        return {"range": self.b.passage(self.L.ISAIAH_RANGE), "steps": steps, "views": views}


def build_figures(builder, lists, raw: str, study: dict) -> dict:
    figures = Figures(builder, lists, raw, study)
    out = {"items": figures.items(), "takes": figures.takes(), "limits": figures.limits(), "owed": figures.owed(),
           "collisions": figures.collisions(), "dates": figures.dates(), "isaiah": figures.isaiah()}
    out["added"] = sorted(figures.added.values())
    return out
