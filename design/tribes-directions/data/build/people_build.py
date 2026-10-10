"""People of each tribe.
- tagged: how many person records our data (STEP Bible's tribe tag, field `t`) places in the tribe, "(?)" kept apart.
- named: people a VERSE ties to the tribe (how "verse"), people placed only by their home town in the tribe's land
  (how "home"), and the most-mentioned people our data tags (how "data")."""
import difflib
import json

from kjv import ref, label, load_people, load_people_index, SITE, verse

TAG = {"reuben": "Reuben", "simeon": "Simeon", "levi": "Levi", "judah": "Judah", "dan": "Dan", "naphtali": "Naphtali",
       "gad": "Gad", "asher": "Asher", "issachar": "Issachar", "zebulun": "Zebulun", "ephraim": "Ephraim",
       "manasseh": "Manasseh", "benjamin": "Benjamin"}

# (tribe, name, reference that ties them, role, how, note, personId override)
NAMED = [
    # Judah
    ("judah", "Nahshon", "NUM 1:7", "Prince of Judah at the census; first to offer (Numbers 7:12)", "verse", None, None),
    ("judah", "Bezaleel", "EXO 31:2", "Craftsman of the tabernacle", "verse", None, None),
    ("judah", "Caleb", "NUM 13:6", "Spy; later divided the land for Judah (Numbers 34:19)", "verse", "Joshua 14:6 calls him “the Kenezite”.", None),
    ("judah", "Achan", "JOS 7:1", "Took of the accursed thing at Jericho", "verse", None, None),
    ("judah", "David", "1CH 28:2-4", "King", "verse", "David says “of the house of Judah, the house of my father”.", "david-rut-4-17"),
    ("judah", "Elihu", "1CH 27:18", "Ruler of Judah under David, “one of the brethren of David”", "verse", None, None),
    ("judah", "Jesus", "HEB 7:14", "“our Lord sprang out of Juda”", "verse", "Also “the Lion of the tribe of Juda” (Revelation 5:5).", "jesus-isa-7-14"),
    # Benjamin
    ("benjamin", "Abidan", "NUM 1:11", "Prince of Benjamin", "verse", None, None),
    ("benjamin", "Palti", "NUM 13:9", "Spy", "verse", None, None),
    ("benjamin", "Elidad", "NUM 34:21", "Divided the land", "verse", None, None),
    ("benjamin", "Ehud", "JDG 3:15", "Judge, “a Benjamite, a man lefthanded”", "verse", None, None),
    ("benjamin", "Kish", "1SA 9:1", "Saul's father, “a Benjamite”", "verse", None, None),
    ("benjamin", "Saul", "ACT 13:21", "First king of Israel, “a man of the tribe of Benjamin”", "verse", "Also 1 Samuel 9:21; 10:21.", "saul-1sa-9-2"),
    ("benjamin", "Shimei", "2SA 19:16", "Cursed David at Bahurim", "verse", None, None),
    ("benjamin", "Sheba", "2SA 20:1", "Led a revolt against David", "verse", None, None),
    ("benjamin", "Ittai", "2SA 23:29", "One of David's mighty men", "verse", None, None),
    ("benjamin", "Mordecai", "EST 2:5", "Esther's cousin, “a Benjamite”", "verse", None, None),
    ("benjamin", "Jaasiel", "1CH 27:21", "Ruler of Benjamin under David", "verse", None, None),
    ("benjamin", "Paul", "ROM 11:1", "Apostle, “of the tribe of Benjamin”", "verse", "Also Philippians 3:5.", "paul-act-7-58"),
    # Levi
    ("levi", "Aaron", "EXO 4:14", "First high priest, “Aaron the Levite”", "verse", None, "aaron-exo-4-14"),
    ("levi", "Moses", "EXO 2:1-10", "Born to “a man of the house of Levi” and “a daughter of Levi”", "verse", None, "moses-exo-2-10"),
    ("levi", "Miriam", "NUM 26:59", "Prophetess, sister of Aaron and Moses", "verse", None, None),
    ("levi", "Jochebed", "NUM 26:59", "Mother of Aaron, Moses and Miriam, “the daughter of Levi”", "verse", None, None),
    ("levi", "Korah", "NUM 16:1", "Led the rebellion against Moses and Aaron", "verse", None, None),
    ("levi", "Jahaziel", "2CH 20:14", "Prophesied before Jehoshaphat, “a Levite of the sons of Asaph”", "verse", None, None),
    ("levi", "Hashabiah", "1CH 27:17", "Ruler of the Levites under David", "verse", None, None),
    ("levi", "Zadok", "1CH 27:17", "Ruler of the Aaronites under David", "verse", None, None),
    ("levi", "Samuel", "1CH 6:27-28", "Prophet and judge; Chronicles places his family among the Levites", "verse", "1 Samuel 1:1 calls his father Elkanah “an Ephrathite” of mount Ephraim; see the view on Samuel's tribe.", "samuel-1sa-1-20"),
    ("levi", "Jeremiah", "JER 1:1", "Prophet, “of the priests that were in Anathoth in the land of Benjamin”", "verse", "A priest, so of Levi; he lived in Benjamin's land.", None),
    ("levi", "Ezekiel", "EZK 1:3", "Prophet, “Ezekiel the priest”", "verse", "A priest, so of Levi.", None),
    ("levi", "Zacharias", "LUK 1:5", "Priest, father of John the Baptist", "verse", None, None),
    ("levi", "Elisabeth", "LUK 1:5", "Mother of John the Baptist, “of the daughters of Aaron”", "verse", None, None),
    ("levi", "John the Baptist", "LUK 1:5-13", "Prophet; son of Zacharias the priest and Elisabeth, “of the daughters of Aaron”", "verse", "The verses name his parents' priestly line; Luke 1:13 names him.", "john-mat-3-1"),
    ("levi", "Barnabas", "ACT 4:36", "Apostle, “a Levite, and of the country of Cyprus”", "verse", None, None),
    # Simeon
    ("simeon", "Shelumiel", "NUM 1:6", "Prince of Simeon", "verse", None, None),
    ("simeon", "Shaphat", "NUM 13:5", "Spy", "verse", None, None),
    ("simeon", "Zimri", "NUM 25:14", "“a prince of a chief house among the Simeonites”, killed at Peor", "verse", None, None),
    ("simeon", "Shemuel", "NUM 34:20", "Divided the land", "verse", None, None),
    ("simeon", "Shephatiah", "1CH 27:16", "Ruler of the Simeonites under David", "verse", None, None),
    # Reuben
    ("reuben", "Elizur", "NUM 1:5", "Prince of Reuben", "verse", None, None),
    ("reuben", "Shammua", "NUM 13:4", "Spy", "verse", None, None),
    ("reuben", "Dathan", "NUM 16:1", "Rebelled with Korah", "verse", None, None),
    ("reuben", "Abiram", "NUM 16:1", "Rebelled with Korah", "verse", None, None),
    ("reuben", "On", "NUM 16:1", "Joined Korah's rebellion", "verse", None, None),
    ("reuben", "Adina", "1CH 11:42", "One of David's mighty men, “a captain of the Reubenites”", "verse", None, None),
    ("reuben", "Eliezer", "1CH 27:16", "Ruler of the Reubenites under David", "verse", None, None),
    # Gad
    ("gad", "Eliasaph", "NUM 1:14", "Prince of Gad", "verse", None, None),
    ("gad", "Geuel", "NUM 13:15", "Spy", "verse", None, None),
    ("gad", "Bani", "2SA 23:36", "One of David's mighty men, “the Gadite”", "verse", None, None),
    # Asher
    ("asher", "Serah", "GEN 46:17", "Daughter of Asher", "verse", "Called Sarah in Numbers 26:46.", None),
    ("asher", "Pagiel", "NUM 1:13", "Prince of Asher", "verse", None, None),
    ("asher", "Sethur", "NUM 13:13", "Spy", "verse", None, None),
    ("asher", "Ahihud", "NUM 34:27", "Divided the land", "verse", None, None),
    ("asher", "Anna", "LUK 2:36", "Prophetess in the temple, “of the tribe of Aser”", "verse", None, None),
    # Naphtali
    ("naphtali", "Ahira", "NUM 1:15", "Prince of Naphtali", "verse", None, None),
    ("naphtali", "Nahbi", "NUM 13:14", "Spy", "verse", None, None),
    ("naphtali", "Pedahel", "NUM 34:28", "Divided the land", "verse", None, None),
    ("naphtali", "Hiram", "1KI 7:13-14", "Worker in brass for Solomon's temple, “a widow's son of the tribe of Naphtali”", "verse", "2 Chronicles 2:14 calls his mother “a woman of the daughters of Dan”. Both are shown.", "hiram-1ki-7-13"),
    ("naphtali", "Jerimoth", "1CH 27:19", "Ruler of Naphtali under David", "verse", None, None),
    ("naphtali", "Barak", "JDG 4:6", "Led the battle with Deborah; from Kedesh-naphtali", "home", "The text names his town, not his tribe.", None),
    # Dan
    ("dan", "Aholiab", "EXO 31:6", "Craftsman of the tabernacle, “of the tribe of Dan”", "verse", None, None),
    ("dan", "Shelomith", "LEV 24:11", "Mother of the blasphemer, “of the tribe of Dan”", "verse", None, None),
    ("dan", "Ahiezer", "NUM 1:12", "Prince of Dan", "verse", None, None),
    ("dan", "Ammiel", "NUM 13:12", "Spy", "verse", None, None),
    ("dan", "Bukki", "NUM 34:22", "Divided the land", "verse", None, None),
    ("dan", "Manoah", "JDG 13:2", "Samson's father, “of the family of the Danites”", "verse", None, None),
    ("dan", "Samson", "JDG 13:2", "Judge; son of Manoah the Danite", "verse", "The verse names his father's family; Samson's birth follows in 13:24.", "samson-jdg-13-24"),
    ("dan", "Hiram", "2CH 2:13-14", "Craftsman for Solomon, “the son of a woman of the daughters of Dan”", "verse", "Chronicles calls him Huram. 1 Kings 7:14 says his mother was “of the tribe of Naphtali”. Both are shown.", "hiram-1ki-7-13"),
    ("dan", "Azareel", "1CH 27:22", "Ruler of Dan under David", "verse", None, None),
    # Issachar
    ("issachar", "Nethaneel", "NUM 1:8", "Prince of Issachar; offered on the second day", "verse", None, None),
    ("issachar", "Igal", "NUM 13:7", "Spy", "verse", None, None),
    ("issachar", "Paltiel", "NUM 34:26", "Divided the land", "verse", None, None),
    ("issachar", "Tola", "JDG 10:1", "Judge, “a man of Issachar”", "verse", None, "tola-jdg-10-1"),
    ("issachar", "Baasha", "1KI 15:27", "King of Israel, “of the house of Issachar”", "verse", None, "baasha-1ki-15-16"),
    ("issachar", "Omri", "1CH 27:18", "Ruler of Issachar under David", "verse", None, None),
    # Zebulun
    ("zebulun", "Eliab", "NUM 1:9", "Prince of Zebulun", "verse", None, None),
    ("zebulun", "Gaddiel", "NUM 13:10", "Spy", "verse", None, None),
    ("zebulun", "Elizaphan", "NUM 34:25", "Divided the land", "verse", None, None),
    ("zebulun", "Elon", "JDG 12:11", "Judge, “a Zebulonite”", "verse", None, "elon-jdg-12-11"),
    ("zebulun", "Ishmaiah", "1CH 27:19", "Ruler of Zebulun under David", "verse", None, None),
    ("zebulun", "Jonah", "2KI 14:25", "Prophet, “of Gath-hepher”", "home", "Joshua 19:13 lists Gittah-hepher on Zebulun's border; the text does not name his tribe.", None),
    # Ephraim
    ("ephraim", "Elishama", "NUM 1:10", "Prince of Ephraim", "verse", None, None),
    ("ephraim", "Joshua", "NUM 13:8", "Spy (“Oshea the son of Nun”), Moses' successor", "verse", None, "joshua-exo-17-9"),
    ("ephraim", "Kemuel", "NUM 34:24", "Divided the land", "verse", None, None),
    ("ephraim", "Jeroboam", "1KI 11:26", "First king of the northern kingdom, “an Ephrathite of Zereda”", "verse", "The KJV's “Ephrathite” here renders the same Hebrew word as “Ephraimite” in Judges 12:5.", None),
    ("ephraim", "Hoshea", "1CH 27:20", "Ruler of Ephraim under David", "verse", None, None),
    ("ephraim", "Abdon", "JDG 12:15", "Judge, buried “in Pirathon in the land of Ephraim”", "home", "The text names his town, not his tribe.", "abdon-jdg-12-13"),
    # Manasseh
    ("manasseh", "Gamaliel", "NUM 1:10", "Prince of Manasseh", "verse", None, None),
    ("manasseh", "Gaddi", "NUM 13:11", "Spy, “of the tribe of Joseph, namely, of the tribe of Manasseh”", "verse", None, None),
    ("manasseh", "Hanniel", "NUM 34:23", "Divided the land", "verse", None, None),
    ("manasseh", "Machir", "NUM 26:29", "Manasseh's son, father of Gilead", "verse", None, None),
    ("manasseh", "Zelophehad", "NUM 27:1", "Died without sons; his daughters won an inheritance", "verse", None, None),
    ("manasseh", "Mahlah", "NUM 27:1", "Daughter of Zelophehad", "verse", None, None),
    ("manasseh", "Gideon", "JDG 6:13-15", "Judge: “my family is poor in Manasseh”", "verse", None, "gideon-jdg-6-11"),
    ("manasseh", "Joel", "1CH 27:20", "Ruler of the half tribe of Manasseh under David", "verse", None, None),
    ("manasseh", "Iddo", "1CH 27:21", "Ruler of the half tribe of Manasseh in Gilead under David", "verse", None, None),
]


def special_pages():
    idx = json.loads((SITE / "src" / "data" / "people-pages" / "index.json").read_text(encoding="utf-8"))
    out = {}
    for kind, path in (("rulers", "rule"), ("prophets", "word"), ("apostles", "mission")):
        for p in idx[kind]:
            for pid in [p["id"]] + list(p.get("personIds") or []):
                out.setdefault(pid, []).append(path)
    return out


def resolve(name, span, people):
    cands = [(pid, p) for pid, p in people.items() if any(span[0] <= r <= span[1] for r in p.get("refs", []))]
    def score(item):
        pid = item[0]
        base = pid.split("-")[0]
        return difflib.SequenceMatcher(None, name.lower(), base).ratio()
    cands.sort(key=score, reverse=True)
    if cands and score(cands[0]) >= 0.6:
        return cands[0][0]
    return None


def build_people():
    people = load_people()
    index = load_people_index()
    pages = special_pages()
    out, report = {}, {"unresolved": [], "tag_conflicts": []}
    for t, tag in TAG.items():
        tagged = sum(1 for p in people.values() if (p.get("t") or "").strip(">").strip() == f"Tribe of {tag}")
        uncertain = sum(1 for p in people.values() if (p.get("t") or "").startswith(f"Tribe of {tag}") and "?" in p["t"])
        out[t] = {"tagged": tagged, "taggedUncertain": uncertain,
                  "taggedNote": "People our data (STEP Bible's tribe tags) places in the tribe. A tag is the data's inference unless a verse says so.",
                  "named": []}
    for t, name, r, role, how, note, override in NAMED:
        span = ref(r)
        pid = override or resolve(name, span, people)
        if pid is None:
            report["unresolved"].append((t, name, r))
        entry = {"personId": pid, "name": name, "role": role, "span": span, "ref": label(span), "how": how}
        if note:
            entry["note"] = note
        if pid and pid in pages:
            entry["pages"] = sorted(set(pages[pid]))
        if pid:
            tag = (people[pid].get("t") or "")
            entry["dataTag"] = tag or None
            if tag and tag.startswith("Tribe of") and TAG[t] not in tag:
                report["tag_conflicts"].append((t, name, pid, tag, r))
        out[t]["named"].append(entry)
    # Most-mentioned people the data tags, not already named, and not tied by a verse to another tribe.
    verse_tribe = {e["personId"]: tt for tt, d in out.items() for e in d["named"] if e["personId"] and e["how"] == "verse"}
    for t, tag in TAG.items():
        have = {e["personId"] for e in out[t]["named"]} | {n_pid for n_pid, n_t in verse_tribe.items() if n_t != t}
        tagged = [(pid, p) for pid, p in people.items() if (p.get("t") or "").strip(">").strip() == f"Tribe of {tag}" and pid not in have]
        tagged.sort(key=lambda x: -(index.get(x[0], {}).get("c") or 0))
        for pid, p in tagged[:8]:
            entry = {"personId": pid, "name": index.get(pid, {}).get("n", pid), "role": p.get("b"), "how": "data",
                     "mentions": index.get(pid, {}).get("c"), "dataTag": p.get("t")}
            first = p.get("f")
            if first:
                entry["span"] = [first, first]
                entry["ref"] = label([first, first])
            if pid in pages:
                entry["pages"] = sorted(set(pages[pid]))
            out[t]["named"].append(entry)
    # Joseph: both sons' people.
    out["joseph"] = {"tagged": out["ephraim"]["tagged"] + out["manasseh"]["tagged"],
                     "taggedUncertain": out["ephraim"]["taggedUncertain"] + out["manasseh"]["taggedUncertain"],
                     "taggedNote": "Ephraim and Manasseh together (our own sum). Our data has no separate tag for Joseph.",
                     "named": [dict(e, via="ephraim") for e in out["ephraim"]["named"] if e["how"] != "data"] +
                              [dict(e, via="manasseh") for e in out["manasseh"]["named"] if e["how"] != "data"]}
    # "(?)" and other variants, reported apart
    variants = {}
    for p in people.values():
        tg = p.get("t") or ""
        if tg.startswith("Tribe of") and (("?" in tg) or tg.startswith(">")):
            variants[tg] = variants.get(tg, 0) + 1
        elif tg.startswith(">"):
            variants[tg] = variants.get(tg, 0) + 1
    build_people.report = dict(report, variants=variants)
    return out


if __name__ == "__main__":
    out = build_people()
    r = build_people.report
    for t, d in out.items():
        print(t, d["tagged"], d["taggedUncertain"], [(e["name"], e["personId"], e["how"]) for e in d["named"]])
    print("UNRESOLVED", r["unresolved"])
    print("TAG CONFLICTS", r["tag_conflicts"])
    print("VARIANTS", r["variants"])
