"""Bible twenty questions: seed the character pool (design §3.1, stage 0 in §5.1).

Writes pool.source.json once from the design's rule plus the hand changes below. After that the file is hand-kept,
so a later change to the people data never silently changes the game; rerun only with --force.
Usage: py -3.12 scripts/twenty-questions/tq_pool.py [--force]
"""
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # importing odd-one-out must not leave a cache folder in its directory
HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
sys.path.insert(0, str(SITE / "scripts" / "odd-one-out"))
from ooo_data import load_people, load_people_pages, load_person, read_json  # noqa: E402

OUT = HERE / "pool.source.json"
DROP_UNDER = 8  # mentions; below this a person outside "Who's older?" is dropped unless kept below
KEEP = {  # under the mention cut, but players think of them
    "herodias-mat-14-3": "asked for John the Baptist's head", "judas-mat-10-3": "one of the Twelve",
    "simon-mat-10-4": "one of the Twelve", "bartholomew-mat-10-3": "one of the Twelve", "jude-mat-13-55": "wrote Jude",
    "simeon-luk-2-25": "held the baby Jesus", "matthias-act-1-23": "chosen to replace Judas", "agabus-act-11-28": "NT prophet",
}
DROP = {  # caught by the rule, but a name players do not think of
    "heth-gen-10-15": "ancestor of the Hittites", "javan-gen-10-2": "a name in the table of nations",
    "nun-exo-33-11": "known only as Joshua's father", "nebat-1ki-11-26": "known only as Jeroboam's father",
    "jehoiada-2sa-8-18": "known only as Benaiah's father", "kohath-gen-46-11": "a genealogy name",
    "merari-gen-46-11": "a genealogy name", "gershon-gen-46-11": "a genealogy name", "zeruiah-1sa-26-6": "known only as Joab's mother",
    "ahikam-2ki-22-12": "a court name", "shaphan-2ki-22-3": "a court name",
}
ADD = {  # well known (5+ questions in the question bank, or a famous scene) but caught by no rule
    "eliphaz-job-2-11": "Job's friend", "bildad-job-2-11": "Job's friend", "zophar-job-2-11": "Job's friend",
    "naaman-2ki-5-1": "healed of leprosy", "ananias-act-5-1": "lied to the Holy Spirit", "sapphira-act-5-1": "lied to the Holy Spirit",
    "ananias-act-9-10": "baptised Saul", "sisera-jdg-4-2": "Deborah's story", "barak-jdg-4-6": "Deborah's story",
    "jael-jdg-4-17": "Deborah's story", "abigail-1sa-25-3": "David's wife", "nabal-1sa-25-3": "Abigail's husband",
    "michal-1sa-14-49": "David's wife", "tamar-gen-38-6": "Judah's story", "tamar-2sa-13-1": "David's daughter",
    "jairus-mrk-5-22": "his daughter raised", "naboth-1ki-21-1": "his vineyard", "mephibosheth-2sa-4-4": "David's kindness",
    "potiphar-gen-37-36": "Joseph's master", "dinah-gen-30-21": "Jacob's daughter", "elimelech-rut-1-2": "Naomi's husband",
    "orpah-rut-1-4": "Ruth's sister-in-law", "achan-jos-7-1": "Jericho's stolen goods", "bezalel-exo-31-2": "built the tabernacle",
    "sanballat-neh-2-10": "opposed Nehemiah", "delilah-jdg-16-4": "Samson's story", "hophni-1sa-1-3": "Eli's son",
    "aeneas-act-9-33": "healed by Peter", "eglon-jdg-3-12": "Ehud's story", "ahithophel-2sa-15-12": "Absalom's adviser",
    "jochebed-exo-6-20": "Moses' mother", "melchizedek-gen-14-18": "king and priest", "nathanael-jhn-1-45": "under the fig tree",
    "gehazi-2ki-4-12": "Elisha's servant", "bartimaeus-mrk-10-46": "blind man healed", "peninnah-1sa-1-2": "Hannah's rival",
    "uzzah-2sa-6-3": "touched the ark", "zebedee-mat-4-21": "father of James and John", "elkanah-1sa-1-1": "Samuel's father",
    "eutychus-act-20-9": "fell from a window", "rhoda-act-12-13": "answered the door to Peter", "phoebe-rom-16-1": "carried Romans",
    "simon-mat-27-32": "carried the cross", "joseph-mat-27-57": "buried Jesus", "barabbas-mat-27-16": "released instead of Jesus",
    "malchus-jhn-18-10": "lost an ear", "ham-gen-5-32": "Noah's son", "japheth-gen-5-32": "Noah's son",
    "nimrod-gen-10-8": "mighty hunter", "zipporah-exo-2-21": "Moses' wife", "hur-exo-17-10": "held up Moses' arms",
    "obed-rut-4-17": "Ruth's son", "mary-luk-10-39": "Martha's sister", "salome-mat-20-20": "at the cross and the tomb",
    "joanna-luk-8-3": "at the empty tomb", "ebed-melech-jer-38-7": "rescued Jeremiah", "simon-act-8-9": "tried to buy the Spirit",
}
TIER1_EXTRA = {"judas-mat-10-4", "delilah-jdg-16-4", "naaman-2ki-5-1", "jairus-mrk-5-22", "barak-jdg-4-6", "jael-jdg-4-17",
               "michal-1sa-14-49", "abigail-1sa-25-3", "ananias-act-5-1", "sapphira-act-5-1", "nathanael-jhn-1-45",
               "bartimaeus-mrk-10-46", "potiphar-gen-37-36", "melchizedek-gen-14-18", "barabbas-mat-27-16", "ham-gen-5-32",
               "japheth-gen-5-32", "zipporah-exo-2-21", "eutychus-act-20-9", "joseph-mat-27-57", "simon-mat-27-32",
               "andrew-mat-4-18", "philip-mat-10-3", "jesus-isa-7-14", "aaron-exo-4-14"}
LABELS = {  # same-named pool members get a label that tells them apart (design §3.5)
    "gad-gen-30-11": "Gad (son of Jacob)", "gad-1sa-22-5": "Gad the prophet", "simeon-gen-29-33": "Simeon (son of Jacob)",
    "simeon-luk-2-25": "Simeon who held baby Jesus", "abimelech-gen-20-2": "Abimelech king of Gerar",
    "abimelech-jdg-8-31": "Abimelech son of Gideon", "ishmael-gen-16-11": "Ishmael son of Abraham",
    "ishmael-2ki-25-23": "Ishmael who killed Gedaliah", "jehoahaz-2ki-10-35": "Jehoahaz king of Israel",
    "jehoahaz-2ki-23-30": "Jehoahaz king of Judah", "pharaoh-exo-1-11": "Pharaoh who enslaved Israel",
    "pharaoh-1ki-3-1": "Pharaoh, Solomon's father-in-law", "tamar-gen-38-6": "Tamar (Judah's daughter-in-law)",
    "tamar-2sa-13-1": "Tamar (David's daughter)", "ananias-act-5-1": "Ananias (husband of Sapphira)",
    "ananias-act-9-10": "Ananias of Damascus", "simon-mat-27-32": "Simon of Cyrene", "joseph-mat-27-57": "Joseph of Arimathea",
    "mary-luk-10-39": "Mary of Bethany", "salome-mat-20-20": "Salome (at the cross)", "simon-act-8-9": "Simon the sorcerer",
    "zebedee-mat-4-21": "Zebedee", "elkanah-1sa-1-1": "Elkanah", "obed-rut-4-17": "Obed", "hur-exo-17-10": "Hur",
}


def rule_members(people: dict, pages: set, whos_older: dict) -> list[str]:
    """Design §3.1: not a group, and in a people-page group, in "Who's older?", with a site story, or named 20+ times."""
    members = []
    for pid, person in people.items():
        if person.get("g"):
            continue
        rules = [pid in pages, pid in whos_older, bool(load_person(pid).get("story")), person["c"] >= 20]
        if any(rules) and (person["c"] > 1 or rules[1] or rules[2]):
            members.append(pid)
    return members


def label_of(pid: str, people: dict, whos_older: dict, facts_labels: dict) -> str:
    if pid in LABELS:
        return LABELS[pid]
    if pid in whos_older:
        return whos_older[pid]["label"]
    if pid in facts_labels:
        return facts_labels[pid]["label"]
    return people[pid]["n"]


def main() -> None:
    if OUT.exists() and "--force" not in sys.argv:
        raise SystemExit(f"{OUT.name} exists and is hand-kept; rerun with --force to reseed it from the rule")
    people = {p["id"]: p for p in load_people()}
    pages = {m["id"] for members in load_people_pages().values() for m in members}
    whos_older = {c["id"]: c for c in read_json(SITE / "src/data/whos-older/characters.source.json")["characters"]}
    facts_labels = read_json(SITE / "scripts/odd-one-out/facts.json")["people"]["labels"]
    entries = []
    for pid in rule_members(people, pages, whos_older) + [pid for pid in ADD if pid in people]:
        if pid in DROP or any(e["id"] == pid for e in entries):
            continue
        if pid not in whos_older and pid not in ADD and pid not in KEEP and people[pid]["c"] < DROP_UNDER and pid not in TIER1_EXTRA:
            continue
        tier = 1 if (whos_older.get(pid, {}).get("tier", 9) <= 2 or pid in TIER1_EXTRA) else 2
        why = ADD.get(pid) or KEEP.get(pid) or "design rule §3.1"
        entries.append({"id": pid, "label": label_of(pid, people, whos_older, facts_labels), "tier": tier, "why": why})
    missing = [pid for pid in ADD if pid not in people]
    if missing:
        raise SystemExit(f"hand additions not found in data/study/people.json: {missing}")
    labels = [e["label"] for e in entries]
    clashes = sorted({label for label in labels if labels.count(label) > 1})
    if clashes:
        raise SystemExit(f"pool labels must be unique (design §3.5); add LABELS for: {clashes}")
    entries.sort(key=lambda e: (e["tier"], -people[e["id"]]["c"]))
    dropped = {pid: why for pid, why in DROP.items()}
    OUT.write_text(json.dumps({"about": "Bible twenty questions pool (design §3). Seeded by tq_pool.py, then hand-kept: "
                               "edit tiers, labels and members here with a one-line reason.", "dropped": dropped,
                               "people": entries}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{OUT.name}: {len(entries)} people, {sum(e['tier'] == 1 for e in entries)} in tier 1")


if __name__ == "__main__":
    main()
