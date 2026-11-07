"""The hand-checked lists behind the Prophets in their times mock-up. build-data.py tests every reference and phrase against the Berean."""

# Rulers named by the openings. Order inside Judah and inside Israel follows Kings, and SUCCESSION proves each step; no length or
# overlap is claimed. Foreign rulers are shown in no order.
RULERS = [
    {"id": "uzziah", "name": "Uzziah", "group": "judah"}, {"id": "jotham", "name": "Jotham", "group": "judah"},
    {"id": "ahaz", "name": "Ahaz", "group": "judah"}, {"id": "hezekiah", "name": "Hezekiah", "group": "judah"},
    {"id": "josiah", "name": "Josiah", "group": "judah"}, {"id": "jehoiakim", "name": "Jehoiakim", "group": "judah"},
    {"id": "jehoiachin", "name": "Jehoiachin", "group": "judah"}, {"id": "zedekiah", "name": "Zedekiah", "group": "judah"},
    {"id": "ahab", "name": "Ahab", "group": "israel"}, {"id": "jeroboam", "name": "Jeroboam", "group": "israel"},
    {"id": "nebuchadnezzar", "name": "Nebuchadnezzar", "group": "foreign"}, {"id": "cyrus", "name": "Cyrus", "group": "foreign"},
    {"id": "darius", "name": "Darius", "group": "foreign"},
]
# (earlier, later, verse that tells it, a phrase in it). Uzziah is called Azariah in 2 Kings 15:7, Jehoiakim is Eliakim renamed.
SUCCESSION = [
    ("Azariah", "Jotham", "2 Kings 15:7", "his son Jotham reigned in his place"),
    ("Jotham", "Ahaz", "2 Kings 15:38", "his son Ahaz reigned in his place"),
    ("Ahaz", "Hezekiah", "2 Kings 16:20", "his son Hezekiah reigned in his place"),
    ("Hezekiah", "Manasseh", "2 Kings 20:21", "his son Manasseh reigned in his place"),
    ("Manasseh", "Amon", "2 Kings 21:18", "his son Amon reigned in his place"),
    ("Amon", "Josiah", "2 Kings 21:26", "his son Josiah reigned in his place"),
    ("Josiah", "Eliakim", "2 Kings 23:34", "Eliakim son of Josiah king in place of his father Josiah"),
    ("Jehoiakim", "Jehoiachin", "2 Kings 24:6", "his son Jehoiachin reigned in his place"),
    ("Jehoiachin", "Zedekiah", "2 Kings 24:17", "Mattaniah, Jehoiachin"),
]

# Everyone on the page. basis "heading" is a book's own opening; "kings" is a narrative that names them, shown in History's colour.
# ladder: (ruler id, verse, the exact words). role: extra (verse, words) when the span itself does not say he reigned.
# marks: what the opening names, with the kind of thing it is. All opening text comes from the Berean by reference.
PROPHETS = [
    {"id": "isaiah", "name": "Isaiah", "person": "isaiah-2ki-19-2", "basis": "heading", "opening": "Isaiah 1:1",
     "ladder": [("uzziah", "Isaiah 1:1", "reigns of Uzziah"), ("jotham", "Isaiah 1:1", "Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah"), ("ahaz", "Isaiah 1:1", "Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah"), ("hezekiah", "Isaiah 1:1", "Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah")],
     "marks": [("Judah and Jerusalem", "hearers"), ("son of Amoz", "family"), ("Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah", "ruler")]},
    {"id": "jeremiah", "name": "Jeremiah", "person": "jeremiah-2ch-35-25", "basis": "heading", "opening": "Jeremiah 1:1–3",
     "ladder": [("josiah", "Jeremiah 1:2", "the reign of Josiah son of Amon king of Judah"), ("jehoiakim", "Jeremiah 1:3", "the days of Jehoiakim son of Josiah king of Judah"), ("zedekiah", "Jeremiah 1:3", "the eleventh year of Zedekiah son of Josiah king of Judah")],
     "marks": [("son of Hilkiah", "family"), ("Anathoth in the territory of Benjamin", "place"), ("thirteenth year", "date"), ("Josiah son of Amon king of Judah", "ruler"), ("Jehoiakim son of Josiah king of Judah", "ruler"), ("fifth month of the eleventh year", "date"), ("Zedekiah son of Josiah king of Judah", "ruler"), ("the people of Jerusalem", "hearers")]},
    {"id": "ezekiel", "name": "Ezekiel", "person": "ezekiel-ezk-1-3", "basis": "heading", "opening": "Ezekiel 1:1–3",
     "ladder": [("jehoiachin", "Ezekiel 1:2", "the fifth year of the exile of King Jehoiachin")],
     "note": "He dates by Jehoiachin's exile, not by a reign.",
     "marks": [("thirtieth year", "date"), ("fifth day of the fourth month", "date"), ("the exiles", "hearers"), ("River Kebar", "place"), ("fifth year of the exile of King Jehoiachin", "ruler"), ("son of Buzi", "family"), ("the land of the Chaldeans", "place")]},
    {"id": "daniel", "name": "Daniel", "person": "daniel-ezk-14-14", "basis": "heading", "opening": "Daniel 1:1",
     "ladder": [("jehoiakim", "Daniel 1:1", "the reign of Jehoiakim king of Judah"), ("nebuchadnezzar", "Daniel 1:1", "Nebuchadnezzar king of Babylon"), ("cyrus", "Daniel 1:21", "the first year of King Cyrus")],
     "note": "His book opens on the siege and gives his name later (Daniel 1:6). Cyrus comes at the chapter's end (Daniel 1:21).",
     "marks": [("third year", "date"), ("Jehoiakim king of Judah", "ruler"), ("Nebuchadnezzar king of Babylon", "ruler"), ("Jerusalem", "place")]},
    {"id": "hosea", "name": "Hosea", "person": "hosea-hos-1-1", "basis": "heading", "opening": "Hosea 1:1",
     "ladder": [("uzziah", "Hosea 1:1", "the days of Uzziah"), ("jotham", "Hosea 1:1", "Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah"), ("ahaz", "Hosea 1:1", "Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah"), ("hezekiah", "Hosea 1:1", "Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah"), ("jeroboam", "Hosea 1:1", "Jeroboam son of Jehoash, king of Israel")],
     "marks": [("son of Beeri", "family"), ("Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah", "ruler"), ("Jeroboam son of Jehoash, king of Israel", "ruler")]},
    {"id": "joel", "name": "Joel", "person": "joel-jol-1-1", "basis": "heading", "opening": "Joel 1:1", "marks": [("son of Pethuel", "family")]},
    {"id": "amos", "name": "Amos", "person": "amos-amo-1-1", "basis": "heading", "opening": "Amos 1:1",
     "ladder": [("uzziah", "Amos 1:1", "when Uzziah was king of Judah"), ("jeroboam", "Amos 1:1", "Jeroboam son of Jehoash was king of Israel")],
     "marks": [("the sheepherders of Tekoa", "place"), ("Israel", "hearers"), ("two years before the earthquake", "date"), ("Uzziah was king of Judah", "ruler"), ("Jeroboam son of Jehoash was king of Israel", "ruler")]},
    {"id": "obadiah", "name": "Obadiah", "person": "obadiah-oba-1-1", "basis": "heading", "opening": "Obadiah 1:1", "marks": [("about Edom", "hearers")]},
    {"id": "jonah", "name": "Jonah", "person": "jonah-2ki-14-25", "basis": "heading", "opening": "Jonah 1:1",
     "note": "His book names no ruler. Another book says Jeroboam's reign carried out a word spoken through him (2 Kings 14:25).",
     "marks": [("son of Amittai", "family")]},
    {"id": "micah", "name": "Micah", "person": "micah-jer-26-18", "basis": "heading", "opening": "Micah 1:1",
     "ladder": [("jotham", "Micah 1:1", "the days of Jotham, Ahaz, and Hezekiah, kings of Judah"), ("ahaz", "Micah 1:1", "the days of Jotham, Ahaz, and Hezekiah, kings of Judah"), ("hezekiah", "Micah 1:1", "the days of Jotham, Ahaz, and Hezekiah, kings of Judah")],
     "marks": [("the Moreshite", "place"), ("Jotham, Ahaz, and Hezekiah, kings of Judah", "ruler"), ("Samaria and Jerusalem", "hearers")]},
    {"id": "nahum", "name": "Nahum", "person": "nahum-nam-1-1", "basis": "heading", "opening": "Nahum 1:1", "marks": [("against Nineveh", "hearers"), ("the Elkoshite", "place")]},
    {"id": "habakkuk", "name": "Habakkuk", "person": "habakkuk-hab-1-1", "basis": "heading", "opening": "Habakkuk 1:1", "marks": []},
    {"id": "zephaniah", "name": "Zephaniah", "person": "zephaniah-zep-1-1", "basis": "heading", "opening": "Zephaniah 1:1",
     "ladder": [("josiah", "Zephaniah 1:1", "the days of Josiah son of Amon king of Judah")], "ancestors": ["Hezekiah"],
     "note": "The Hezekiah in this verse is named in his family line, not as the king of his day.",
     "marks": [("son of Cushi, the son of Gedaliah, the son of Amariah, the son of Hezekiah", "family"), ("Josiah son of Amon king of Judah", "ruler")]},
    {"id": "haggai", "name": "Haggai", "person": "haggai-ezr-5-1", "basis": "heading", "opening": "Haggai 1:1",
     "ladder": [("darius", "Haggai 1:1", "the reign of Darius")],
     "marks": [("second year of the reign of Darius", "ruler"), ("first day of the sixth month", "date"), ("Zerubbabel son of Shealtiel, governor of Judah", "hearers"), ("Joshua son of Jehozadak, the high priest", "hearers")]},
    {"id": "zechariah", "name": "Zechariah", "person": "zechariah-ezr-5-1", "basis": "heading", "opening": "Zechariah 1:1",
     "ladder": [("darius", "Zechariah 1:1", "the second year of Darius")],
     "marks": [("eighth month", "date"), ("second year of Darius", "ruler"), ("son of Berechiah, the son of Iddo", "family")]},
    {"id": "malachi", "name": "Malachi", "person": "malachi-mal-1-1", "basis": "heading", "opening": "Malachi 1:1", "marks": [("Israel", "hearers")]},
    {"id": "huldah", "name": "Huldah", "person": "huldah-2ki-22-14", "basis": "kings", "opening": "2 Kings 22:14",
     "ladder": [("josiah", "2 Kings 22:3", "the eighteenth year of his reign, King Josiah")],
     "note": "She has no book, so there is no heading. Kings names her king a few verses before her (2 Kings 22:3).",
     "marks": [("the wife of Shallum son of Tikvah, the son of Harhas", "family"), ("Jerusalem, in the Second District", "place")]},
    {"id": "elijah", "name": "Elijah", "person": "elijah-1ki-17-1", "basis": "kings", "opening": "1 Kings 17:1",
     "ladder": [("ahab", "1 Kings 17:1", "said to Ahab")], "role": ("1 Kings 16:29", "Ahab son of Omri became king of Israel"),
     "note": "He has no book, so there is no heading. Kings has him speak to Ahab.",
     "marks": [("the Tishbite", "place"), ("the settlers of Gilead", "place"), ("Ahab", "ruler")]},
]
MARK_LABELS = {"ruler": "A ruler", "date": "A date", "family": "Family", "place": "A place", "hearers": "Who it concerns"}
QUESTIONS = ["calling", "setting", "message", "act", "response", "remembrance"]

# The record: all six lines are declared for all eighteen, or the build fails. Filled: (kind, verse, words in it, this site's note).
# Silent: silent(this site's note). Kind is "given", or for remembrance "named" or "quoted". Nothing is left to default.
def given(ref, words, note=""):
    return {"kind": "given", "ref": ref, "words": words, "note": note}
def named(ref, words, note=""):
    return {"kind": "named", "ref": ref, "words": words, "note": note}
def quoted(ref, words, note=""):
    return {"kind": "quoted", "ref": ref, "words": words, "note": note}
def silent(note=""):
    return {"kind": "silent", "note": note}

RECORDS = {
    "isaiah": {"calling": given("Isaiah 6:8", "Here am I. Send me!", "Seen in the year King Uzziah died."), "setting": given("Isaiah 1:1", "during the reigns of Uzziah, Jotham, Ahaz, and Hezekiah"), "message": given("Isaiah 1:17", "seek justice"), "act": given("Isaiah 20:3", "gone naked and barefoot for three years as a sign", "Explained in the next verse."), "response": given("Isaiah 37:21", "Because you have prayed to Me", "Hezekiah prays, and the answer comes through Isaiah."), "remembrance": named("Matthew 3:3", "spoken of through the prophet Isaiah", "One of many places.")},
    "jeremiah": {"calling": given("Jeremiah 1:5", "appointed you as a prophet to the nations"), "setting": given("Jeremiah 1:2", "the thirteenth year of the reign of Josiah"), "message": given("Jeremiah 7:3", "Correct your ways and deeds"), "act": given("Jeremiah 19:10", "shatter the jar"), "response": given("Jeremiah 36:23", "throw them into the firepot", "King Jehoiakim burns the scroll."), "remembrance": named("Daniel 9:2", "according to the word of the LORD to Jeremiah the prophet")},
    "ezekiel": {"calling": given("Ezekiel 2:3", "I am sending you to the Israelites"), "setting": given("Ezekiel 1:2", "the fifth year of the exile of King Jehoiachin"), "message": given("Ezekiel 3:17", "give them a warning from Me"), "act": given("Ezekiel 4:1", "take a brick", "One of several."), "response": given("Ezekiel 33:32", "They hear your words but do not put them into practice"), "remembrance": silent("No other book gives his name. Later Scripture may use his words without naming him; this page does not list those.")},
    "daniel": {"calling": silent("No call scene. He is carried to Babylon, and God gives him understanding (Daniel 1:17)."), "setting": given("Daniel 1:1", "the third year of the reign of Jehoiakim king of Judah"), "message": given("Daniel 5:27", "weighed on the scales and found deficient", "Spoken to King Belshazzar."), "act": silent(), "response": given("Daniel 2:47", "Your God is truly the God of gods", "A foreign king."), "remembrance": named("Matthew 24:15", "the prophet Daniel")},
    "hosea": {"calling": given("Hosea 1:2", "When the LORD first spoke through Hosea", "Hardly a scene: the first word is already a command."), "setting": given("Hosea 1:1", "in the days of Uzziah, Jotham, Ahaz, and Hezekiah"), "message": given("Hosea 14:1", "Return, O Israel, to the LORD your God"), "act": given("Hosea 1:3", "So Hosea went and married Gomer", "Readers differ on how to take it; see the fourth question."), "response": silent("The book tells of no hearer's answer."), "remembrance": named("Romans 9:25", "As He says in Hosea")},
    "joel": {"calling": silent(), "setting": given("Joel 1:1", "Joel son of Pethuel", "His father, and the elders he calls (Joel 1:2). No king, and no date."), "message": given("Joel 2:13", "rend your hearts and not your garments"), "act": silent(), "response": silent(), "remembrance": named("Acts 2:16", "what was spoken by the prophet Joel")},
    "amos": {"calling": given("Amos 7:15", "the LORD took me from following the flock"), "setting": given("Amos 1:1", "two years before the earthquake"), "message": given("Amos 5:24", "let justice roll on like a river"), "act": silent("He sees signs, but is not told to act one out."), "response": given("Amos 7:12", "Go away, you seer!", "A priest of Bethel."), "remembrance": quoted("Acts 7:42", "the book of the prophets", "Stephen quotes Amos 5 without giving his name. The only other Amos named is in Luke 3:25.")},
    "obadiah": {"calling": silent(), "setting": given("Obadiah 1:1", "This is the vision of Obadiah", "No father, no king, no town."), "message": given("Obadiah 1:11", "you stood aloof while strangers carried off his wealth"), "act": silent(), "response": silent(), "remembrance": silent("Other men named Obadiah appear in Kings, Chronicles, Ezra and Nehemiah. Nothing in those verses says one of them is this prophet.")},
    "jonah": {"calling": given("Jonah 1:1", "the word of the LORD came to Jonah", "And he runs (Jonah 1:3)."), "setting": given("2 Kings 14:25", "the word that the LORD, the God of Israel, had spoken through His servant Jonah", "From Kings. His own book names no ruler."), "message": given("Jonah 3:4", "Forty more days and Nineveh will be overturned!"), "act": silent(), "response": given("Jonah 3:5", "the Ninevites believed God"), "remembrance": named("Matthew 12:40", "as Jonah was three days and three nights", "Jesus names him.")},
    "micah": {"calling": given("Micah 3:8", "I am filled with power by the Spirit of the LORD", "He tells no scene, only what he is filled with."), "setting": given("Micah 1:1", "in the days of Jotham, Ahaz, and Hezekiah"), "message": given("Micah 6:8", "to act justly, to love mercy, and to walk humbly with your God"), "act": given("Micah 1:8", "I will walk barefoot and naked", "He says it of himself. No command or onlookers are told."), "response": given("Jeremiah 26:19", "Did Hezekiah not fear the LORD", "Told generations later, not in his own book."), "remembrance": named("Jeremiah 26:18", "Micah the Moreshite prophesied", "Also quoted without his name in Matthew 2:6.")},
    "nahum": {"calling": silent(), "setting": given("Nahum 1:1", "the burden against Nineveh", "A target and a home. No king and no date."), "message": given("Nahum 1:7", "The LORD is good, a stronghold in the day of distress"), "act": silent(), "response": silent(), "remembrance": silent("The only other Nahum named is in Luke 3:25, in a family list.")},
    "habakkuk": {"calling": silent(), "setting": given("Habakkuk 1:1", "the burden that Habakkuk the prophet received in a vision", "His name and nothing else."), "message": given("Habakkuk 2:4", "the righteous will live by faith"), "act": silent(), "response": given("Habakkuk 3:18", "yet I will exult in the LORD", "The prophet's own answer. His hearers' is not told."), "remembrance": quoted("Romans 1:17", "The righteous will live by faith", "Paul writes it is written, without giving his name.")},
    "zephaniah": {"calling": silent(), "setting": given("Zephaniah 1:1", "in the days of Josiah son of Amon king of Judah"), "message": given("Zephaniah 2:3", "Seek righteousness; seek humility"), "act": silent(), "response": given("Zephaniah 3:2", "she accepted no correction", "The city, as the prophet describes it."), "remembrance": silent("Other men named Zephaniah appear in Kings, Chronicles and Jeremiah. Nothing in those verses says one of them is this prophet.")},
    "haggai": {"calling": silent("He is called the LORD's messenger (Haggai 1:13), with no call scene."), "setting": given("Haggai 1:1", "the first day of the sixth month"), "message": given("Haggai 1:4", "while this house lies in ruins"), "act": silent(), "response": given("Haggai 1:12", "obeyed the voice of the LORD their God"), "remembrance": named("Ezra 5:1", "the prophets Haggai and Zechariah son of Iddo")},
    "zechariah": {"calling": silent(), "setting": given("Zechariah 1:1", "In the eighth month of the second year of Darius"), "message": given("Zechariah 7:9", "Administer true justice"), "act": given("Zechariah 6:11", "make an ornate crown"), "response": given("Ezra 6:14", "the Jewish elders built and prospered", "Through the prophesying of Haggai and Zechariah."), "remembrance": named("Ezra 5:1", "the prophets Haggai and Zechariah son of Iddo", "Also quoted in Matthew 21:5.")},
    "malachi": {"calling": silent("He tells no scene. Some old readers took the name as a title; see Sources."), "setting": given("Malachi 1:1", "to Israel through Malachi", "The hearers and nothing else."), "message": given("Malachi 1:8", "When you offer blind animals for sacrifice, is it not wrong?"), "act": silent(), "response": given("Malachi 3:16", "those who feared the LORD spoke with one another"), "remembrance": quoted("Matthew 11:10", "Behold, I will send My messenger", "Jesus quotes Malachi 3:1. No other book gives his name.")},
    "huldah": {"calling": silent("Scripture calls her a prophetess and tells no call."), "setting": given("2 Kings 22:3", "in the eighteenth year of his reign", "From Kings. She has no book."), "message": given("2 Kings 22:16", "I am about to bring calamity on this place"), "act": silent(), "response": given("2 Kings 23:3", "And all the people entered into the covenant"), "remembrance": named("2 Chronicles 34:22", "Huldah the prophetess", "Chronicles retells the account. No other book names her.")},
    "elijah": {"calling": silent("He steps into Kings with no call scene."), "setting": given("1 Kings 17:1", "said to Ahab"), "message": given("1 Kings 18:21", "How long will you waver between two opinions?"), "act": given("1 Kings 18:31", "Elijah took twelve stones", "The text gives the reason: the tribes. It is not told as commanded."), "response": given("1 Kings 18:39", "The LORD, He is God!"), "remembrance": named("James 5:17", "Elijah was a man just like us")},
}

# Names the page says appear in no other book. name: (its own book's code, verses elsewhere that name another man). Fails on any new or missing hit.
NOT_NAMED_ELSEWHERE = {"Ezekiel": ("EZK", []), "Habakkuk": ("HAB", []), "Malachi": ("MAL", []), "Nahum": ("NAM", ["LUK 3:25"])}
SAME_NAME_BOOKS = {"Obadiah": ("OBA", {"1KI", "1CH", "2CH", "EZR", "NEH"}), "Zephaniah": ("ZEP", {"2KI", "1CH", "JER", "ZEC"}), "Amos": ("AMO", {"LUK"})}

# Three acts read with the same four labels. Each line is (verse, words) or None where the text does not say.
ACTS = [
    {"id": "jar", "title": "The jar", "ref": "Jeremiah 19:1–15", "lines": {"act": ("Jeremiah 19:10", "shatter the jar"), "saw": ("Jeremiah 19:1", "some of the elders of the people and leaders of the priests"), "said": ("Jeremiah 19:11", "I will shatter this nation and this city"), "means": ("Jeremiah 19:4", "they have abandoned Me")}, "unsaid": "Why a jar and not something else. It says only how it breaks."},
    {"id": "marriage", "title": "A marriage and three names", "ref": "Hosea 1:2–9", "lines": {"act": ("Hosea 1:3", "So Hosea went and married Gomer"), "saw": None, "said": ("Hosea 1:9", "you are not My people, and I am not your God"), "means": ("Hosea 1:2", "this land is flagrantly prostituting itself by departing from the LORD")}, "unsaid": "Who saw it, and what Gomer thought. Whether she had already gone astray when he married her."},
    {"id": "crown", "title": "A crown", "ref": "Zechariah 6:9–15", "lines": {"act": ("Zechariah 6:11", "make an ornate crown"), "saw": ("Zechariah 6:10", "Heldai, Tobijah, and Jedaiah"), "said": ("Zechariah 6:12", "Here is a man whose name is the Branch"), "means": ("Zechariah 6:13", "He will be a priest on His throne")}, "unsaid": "It never spells out when the Branch comes. The crown stays in the temple."},
]
ACT_LABELS = {"act": "What he is told to do", "saw": "Who saw it", "said": "The words with it", "means": "What it is said to mean"}

# Fulfilments the New Testament itself draws: tested so each later verse holds the words of the earlier one, or its source formula.
QUOTED_CONFESSION = {"the office of pastor/elder/overseer is limited to men as qualified by Scripture", "All Scripture is a testimony to Christ"}
PAGE_REFERENCES = ["Matthew 2:6", "Micah 5:2", "Matthew 2:15", "Hosea 11:1", "Matthew 21:5", "Zechariah 9:9", "Matthew 11:10", "Malachi 3:1", "Acts 2:16", "Joel 2:28", "Acts 10:43", "Luke 24:27"]

SOURCES = [
    {"id": "bsb", "short": "Berean", "name": "Berean Standard Bible", "href": "https://berean.bible/", "note": "Every verse quoted and opened, from the site's own copy. Public domain."},
    {"id": "bfm", "short": "Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, Articles 1 and 6", "href": "https://bfm.sbc.net/bfm2000/", "note": "Two short phrases, with a link. Compared on 2026-10-30 through a web tool that returns extracts. Neither phrase is in a file the build can read, so the build could not test them, and a person should compare both by eye before release."},
    {"id": "calvin-hos", "short": "Calvin on Hosea", "name": "John Calvin, Commentary on Hosea, trans. John Owen", "href": "https://www.ccel.org/ccel/calvin/calcom26.html", "note": "Read: his comments on Hosea 1:2 and 1:3 only. Public domain."},
    {"id": "calvin-joel", "short": "Calvin on Joel", "name": "John Calvin, Commentary on Joel, trans. John Owen", "href": "https://www.ccel.org/ccel/calvin/calcom27.html", "note": "Read: his preface to Joel only. Public domain."},
    {"id": "calvin-zec", "short": "Calvin on Zechariah", "name": "John Calvin, Commentary on Zechariah, trans. John Owen", "href": "https://www.ccel.org/ccel/calvin/calcom30.html", "note": "Read: his comment on Zechariah 6:12 only. Public domain."},
    {"id": "fausset-hos", "short": "Fausset on Hosea", "name": "A. R. Fausset, on Hosea, in Jamieson, Fausset and Brown, Commentary Critical and Explanatory", "href": "https://www.ccel.org/ccel/jamieson/jfb.html", "note": "Read: his note on Hosea 1:2 only. Hengstenberg and Henderson are given as he reports them; neither was read. Public domain."},
    {"id": "fausset-joel", "short": "Fausset on Joel", "name": "A. R. Fausset, on Joel, in Jamieson, Fausset and Brown", "href": "https://www.ccel.org/ccel/jamieson/jfb.html", "note": "Read: the opening of his introduction to Joel only. His note on Malachi's name was also read. Public domain."},
    {"id": "timeline", "short": "The prophets timeline", "name": "This site's prophets timeline", "href": "/study/prophets", "note": "The count of 64 prophet records. The reigns it gives prophets were not used: this page goes by what the text names. Not audited here."},
]
