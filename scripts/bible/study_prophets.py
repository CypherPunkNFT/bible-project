"""Prophets in the Bible: a hand-checked list of STEP Bible (TIPNR) person ids, each dated where Scripture dates
them — by the king named in the verse given ("anchor"). Facts only; descriptions come from TIPNR (CC BY 4.0).

kind: "writing" (a book bears the name), "prophet", "nt" (New Testament), "false" (called a false prophet or
condemned as one in the text).
"""

from .study_people import ERAS
from .study_refs import Verses, parse_refs

# Rulers in time order; a prophet's position = the first ruler named in its anchor verse.
KINGS = ["Moses", "the judges", "Saul", "David", "Solomon", "Rehoboam", "Jeroboam I", "Abijah", "Asa", "Baasha",
         "Ahab", "Jehoshaphat", "Ahaziah", "Jehoram", "Jehu", "Joash", "Amaziah", "Jeroboam II", "Uzziah", "Jotham",
         "Pekah", "Ahaz", "Hezekiah", "Manasseh", "Josiah", "Jehoiakim", "Jehoiachin", "Zedekiah", "the exile",
         "Darius", "Artaxerxes", "Herod the Great", "Herod", "Claudius"]

# (TIPNR id, kind, book code or "", first ruler, anchor reference)
PROPHETS: list[tuple[str, str, str, str, str]] = [
    ("moses-exo-2-10", "prophet", "", "Moses", "Deuteronomy 34:10"),
    ("aaron-exo-4-14", "prophet", "", "Moses", "Exodus 7:1"),
    ("miriam-exo-15-20", "prophet", "", "Moses", "Exodus 15:20"),
    ("eldad-num-11-26", "prophet", "", "Moses", "Numbers 11:26"),
    ("medad-num-11-26", "prophet", "", "Moses", "Numbers 11:26"),
    ("balaam-num-22-5", "prophet", "", "Moses", "Numbers 22:5"),
    ("deborah-jdg-4-4", "prophet", "", "the judges", "Judges 4:4"),
    ("samuel-1sa-1-20", "prophet", "", "Saul", "1 Samuel 3:20"),
    ("gad-1sa-22-5", "prophet", "", "David", "1 Samuel 22:5"),
    ("nathan-2sa-7-2", "prophet", "", "David", "2 Samuel 7:2"),
    ("heman-1ch-6-33", "prophet", "", "David", "1 Chronicles 25:5"),
    ("asaph-1ch-6-39", "prophet", "", "David", "2 Chronicles 29:30"),
    ("jeduthun-1ch-6-44", "prophet", "", "David", "2 Chronicles 35:15"),
    ("iddo-2ch-9-29", "prophet", "", "Solomon", "2 Chronicles 9:29"),
    ("ahijah-1ki-11-29", "prophet", "", "Solomon", "1 Kings 11:29"),
    ("shemaiah-1ki-12-22", "prophet", "", "Rehoboam", "1 Kings 12:22"),
    ("azariah-2ch-15-1", "prophet", "", "Asa", "2 Chronicles 15:1-2"),
    ("oded-2ch-15-1", "prophet", "", "Asa", "2 Chronicles 15:8"),
    ("hanani-1ki-16-1", "prophet", "", "Asa", "2 Chronicles 16:7"),
    ("jehu-1ki-16-1", "prophet", "", "Baasha", "1 Kings 16:1"),
    ("elijah-1ki-17-1", "prophet", "", "Ahab", "1 Kings 17:1"),
    ("micaiah-1ki-22-8", "prophet", "", "Ahab", "1 Kings 22:8"),
    ("zedekiah-1ki-22-11", "false", "", "Ahab", "1 Kings 22:11"),
    ("jahaziel-2ch-20-14", "prophet", "", "Jehoshaphat", "2 Chronicles 20:14"),
    ("eliezer-2ch-20-37", "prophet", "", "Jehoshaphat", "2 Chronicles 20:37"),
    ("elisha-1ki-19-16", "prophet", "", "Ahab", "1 Kings 19:16"),
    ("zechariah-2ch-24-20", "prophet", "", "Joash", "2 Chronicles 24:20"),
    ("jonah-2ki-14-25", "writing", "JON", "Jeroboam II", "2 Kings 14:25"),
    ("amos-amo-1-1", "writing", "AMO", "Uzziah", "Amos 1:1"),
    ("hosea-hos-1-1", "writing", "HOS", "Uzziah", "Hosea 1:1"),
    ("zechariah-2ch-26-5", "prophet", "", "Uzziah", "2 Chronicles 26:5"),
    ("isaiah-2ki-19-2", "writing", "ISA", "Uzziah", "Isaiah 1:1"),
    ("micah-jer-26-18", "writing", "MIC", "Jotham", "Micah 1:1"),
    ("oded-2ch-28-9", "prophet", "", "Pekah", "2 Chronicles 28:9"),
    ("zephaniah-zep-1-1", "writing", "ZEP", "Josiah", "Zephaniah 1:1"),
    ("huldah-2ki-22-14", "prophet", "", "Josiah", "2 Kings 22:14"),
    ("jeremiah-2ch-35-25", "writing", "JER", "Josiah", "Jeremiah 1:2"),
    ("uriah-jer-26-20", "prophet", "", "Jehoiakim", "Jeremiah 26:20-21"),
    ("daniel-ezk-14-14", "writing", "DAN", "Jehoiakim", "Daniel 1:1"),
    ("ezekiel-ezk-1-3", "writing", "EZK", "Jehoiachin", "Ezekiel 1:2"),
    ("hananiah-jer-28-1", "false", "", "Zedekiah", "Jeremiah 28:1"),
    ("ahab-jer-29-21", "false", "", "Zedekiah", "Jeremiah 29:21"),
    ("zedekiah-jer-29-21", "false", "", "Zedekiah", "Jeremiah 29:21"),
    ("shemaiah-jer-29-24", "false", "", "Zedekiah", "Jeremiah 29:24"),
    ("haggai-ezr-5-1", "writing", "HAG", "Darius", "Haggai 1:1"),
    ("zechariah-ezr-5-1", "writing", "ZEC", "Darius", "Zechariah 1:1"),
    ("noadiah-neh-6-14", "false", "", "Artaxerxes", "Nehemiah 6:14"),
    ("shemaiah-neh-6-10", "false", "", "Artaxerxes", "Nehemiah 6:10-12"),
    # Not dated by any king in Scripture: placed by era, then first mention.
    ("joel-jol-1-1", "writing", "JOL", "", ""),
    ("obadiah-oba-1-1", "writing", "OBA", "", ""),
    ("nahum-nam-1-1", "writing", "NAM", "", ""),
    ("habakkuk-hab-1-1", "writing", "HAB", "", ""),
    ("malachi-mal-1-1", "writing", "MAL", "", ""),
    # Luke 1-2's king is Herod the Great (Luke 1:5); Luke 3:1's "Herod" is Antipas, tetrarch of Galilee.
    ("anna-luk-2-36", "nt", "", "Herod the Great", "Luke 2:36"),
    ("john-mat-3-1", "nt", "", "Herod", "Luke 3:1-2"),
    ("agabus-act-11-28", "nt", "", "Claudius", "Acts 11:28"),
    ("barnabas-act-4-36", "nt", "", "Claudius", "Acts 13:1"),
    ("simeon-act-13-1", "nt", "", "Claudius", "Acts 13:1"),
    ("lucius-act-13-1", "nt", "", "Claudius", "Acts 13:1"),
    ("manaen-act-13-1", "nt", "", "Claudius", "Acts 13:1"),
    ("paul-act-7-58", "nt", "", "Claudius", "Acts 13:1"),
    ("bar-jesus-act-13-6", "false", "", "Claudius", "Acts 13:6"),
    ("judas-act-15-22", "nt", "", "Claudius", "Acts 15:32"),
    ("silas-act-15-22", "nt", "", "Claudius", "Acts 15:32"),
]


# Prophets whose dating king is the start of an exile they then lived through.
ERA_OVERRIDE = {"daniel-ezk-14-14": "Exile and Return", "ezekiel-ezk-1-3": "Exile and Return"}


def _king_era(king: str) -> str:
    index = KINGS.index(king)
    if index == 0:
        return "Egypt and Wilderness"
    if index == 1:
        return "Judges"
    if index <= KINGS.index("Solomon"):
        return "United Monarchy"
    if index <= KINGS.index("Zedekiah"):
        return "Divided Monarchy"
    if index <= KINGS.index("Artaxerxes"):
        return "Exile and Return"
    return "New Testament"


def build_prophets(people: list[dict], verses: Verses) -> list[dict]:
    by_id = {p["id"]: p for p in people}
    seen, out = set(), []
    for position, (pid, kind, book, king, anchor) in enumerate(PROPHETS):
        if pid in seen:
            raise ValueError(f"prophets: {pid} listed twice")
        seen.add(pid)
        person = by_id.get(pid)
        if person is None:
            raise ValueError(f"prophets: {pid} is not a person in TIPNR (ids change when STEP updates the file)")
        if king and king not in KINGS:
            raise ValueError(f"prophets: {pid}: ruler {king!r} is not in KINGS")
        # The ruler named in Scripture sets the era (TIPNR's coarse era is the fallback for undated prophets).
        era = ERA_OVERRIDE.get(pid) or (_king_era(king) if king else person["era"])
        out.append({
            "id": pid,
            "name": person["name"],
            "kind": kind,
            "book": book,
            "sex": person["sex"],
            "era": era,
            "king": king,
            "anchor": parse_refs(anchor, verses)[0] if anchor else None,
            "brief": person["brief"],
            "first": person["refs"][0] if person["refs"] else None,
            "count": len(person["refs"]),
            "position": position,
        })
    out.sort(key=lambda p: (ERAS.index(p["era"]) if p["era"] in ERAS else len(ERAS),
                            KINGS.index(p["king"]) if p["king"] else len(KINGS),
                            p["position"] if p["king"] else (p["first"] or 0)))
    return out
