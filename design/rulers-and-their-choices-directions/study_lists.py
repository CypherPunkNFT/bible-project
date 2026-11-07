"""The lists behind the Rulers and their choices mock-up. build-data.py checks every phrase here against its verse, as whole words."""

# Baptist Faith and Message 2000, as amended 14 June 2023. Each phrase was compared by script on 2026-10-30 against the printable PDF linked from
# https://bfm.sbc.net/bfm2000/ (sha256 below). The PDF is not kept in this folder, because the confession's rights are the SBC's, so this compare cannot be rerun here.
BFM_PDF_SHA256 = "92eb2d8868db03271a40d1575eb50b0313c81d56c882daad5fbced5ba0cc3ab0"
QUOTED_CONFESSION = {
    "truth, without any mixture of error",
    "including the future decisions of His free creatures",
    "a genuine turning from sin toward God",
    "to render loyal obedience thereto in all things not contrary to the revealed will of God",
    "the needy, the abused",
    "There is no salvation apart from personal faith in Jesus Christ as Lord.",
}

READING_ORDER = ["accession", "counsel", "worship", "justice", "correction", "verdict"]


def ruler(identity, name, short, person, starts, reign, length, verdict=None, words=None, **more):
    return {"id": identity, "name": name, "short": short, "person": person, "starts": starts, "reign": reign, "length": length, "verdict": verdict, "words": words, **more}


# In the order Kings tells them. starts is where the ruler's own account opens. The next ruler's starts closes it.
# thread: a thread drawn to the named man ("as", or "not" for a dashed one), with the verse and words it rests on.
# names: any other person or group the verdict names. note: a qualifying line. hight: the high-places line under a "did right".
ISRAEL = [
    ruler("jeroboam", "Jeroboam son of Nebat", "Jeroboam son of Nebat", "jeroboam-1ki-11-26", "1 Kings 12:20", "1 Kings 14:20", "twenty-two years", "1 Kings 13:33", "did not repent of his evil ways",
          said="The first king of the northern kingdom. Every thread in this beam runs back to him."),
    ruler("nadab", "Nadab son of Jeroboam", "Nadab", "nadab-1ki-14-20", "1 Kings 15:25", "1 Kings 15:25", "two years", "1 Kings 15:26", "did evil in the sight of the LORD",
          thread=("as", "1 Kings 15:26", "walked in the way of his father and in his sin"), said="His father is Jeroboam, named in the verse before, so this study counts this line as naming him."),
    ruler("baasha", "Baasha son of Ahijah", "Baasha", "baasha-1ki-15-16", "1 Kings 15:33", "1 Kings 15:33", "twenty-four years", "1 Kings 15:34", "did evil in the sight of the LORD",
          thread=("as", "1 Kings 15:34", "walked in the way of Jeroboam and in his sin")),
    ruler("elah", "Elah son of Baasha", "Elah", "elah-1ki-16-6", "1 Kings 16:8", "1 Kings 16:8", "two years", "1 Kings 16:13", "all the sins Baasha and his son Elah had committed",
          names=("1 Kings 16:13", "Baasha and his son Elah"), said="This line comes at his death and is not the usual sentence. It names his father, and Jeroboam is not named."),
    ruler("zimri", "Zimri", "Zimri", "zimri-1ki-16-9", "1 Kings 16:15", "1 Kings 16:15", "seven days", "1 Kings 16:19", "doing evil in the sight of the LORD",
          thread=("as", "1 Kings 16:19", "following the example of Jeroboam")),
    ruler("omri", "Omri", "Omri", "omri-1ki-16-16", "1 Kings 16:23", "1 Kings 16:23", "twelve years", "1 Kings 16:25", "did evil in the sight of the LORD",
          thread=("as", "1 Kings 16:26", "walked in all the ways of Jeroboam son of Nebat")),
    ruler("ahab", "Ahab son of Omri", "Ahab", "ahab-1ki-16-28", "1 Kings 16:29", "1 Kings 16:29", "twenty-two years", "1 Kings 16:30", "did evil in the sight of the LORD, more than all who were before him",
          thread=("as", "1 Kings 16:31", "the sins of Jeroboam son of Nebat")),
    ruler("ahaziah-i", "Ahaziah of Israel", "Ahaziah", "ahaziah-1ki-22-40", "1 Kings 22:51", "1 Kings 22:51", "two years", "1 Kings 22:52", "did evil in the sight of the LORD",
          thread=("as", "1 Kings 22:52", "walked in the ways of his father and mother and of Jeroboam son of Nebat")),
    ruler("jehoram-i", "Jehoram of Israel", "Jehoram", "joram-2ki-1-17", "2 Kings 3:1", "2 Kings 3:1", "twelve years", "2 Kings 3:2", "did evil in the sight of the LORD",
          note=("2 Kings 3:2", "but not as his father and mother had done"), thread=("as", "2 Kings 3:3", "the sins that Jeroboam son of Nebat had caused Israel to commit"), said="Also called Joram on this site's person page."),
    ruler("jehu", "Jehu", "Jehu", "jehu-1ki-19-16", "2 Kings 9:1", "2 Kings 10:36", "twenty-eight years", "2 Kings 10:30", "done well in carrying out what is right in My sight",
          against=("2 Kings 10:31", "was not careful to follow the instruction of the LORD"), thread=("as", "2 Kings 10:31", "the sins that Jeroboam had caused Israel to commit"), said="The LORD says the first line, and the writer the second. They stand a verse apart."),
    ruler("jehoahaz-i", "Jehoahaz of Israel", "Jehoahaz", "jehoahaz-2ki-10-35", "2 Kings 13:1", "2 Kings 13:1", "seventeen years", "2 Kings 13:2", "did evil in the sight of the LORD",
          thread=("as", "2 Kings 13:2", "followed the sins that Jeroboam son of Nebat")),
    ruler("jehoash-i", "Jehoash of Israel", "Jehoash", "joash-2ki-13-9", "2 Kings 13:10", "2 Kings 13:10", "sixteen years", "2 Kings 13:11", "did evil in the sight of the LORD",
          thread=("as", "2 Kings 13:11", "all the sins that Jeroboam son of Nebat")),
    ruler("jeroboam-ii", "Jeroboam son of Jehoash", "Jeroboam son of Jehoash", "jeroboam-2ki-13-13", "2 Kings 14:23", "2 Kings 14:23", "forty-one years", "2 Kings 14:24", "did evil in the sight of the LORD",
          thread=("as", "2 Kings 14:24", "all the sins that Jeroboam son of Nebat")),
    ruler("zechariah", "Zechariah son of Jeroboam", "Zechariah", "zechariah-2ki-14-29", "2 Kings 15:8", "2 Kings 15:8", "six months", "2 Kings 15:9", "did evil in the sight of the LORD",
          thread=("as", "2 Kings 15:9", "the sins that Jeroboam son of Nebat")),
    ruler("shallum", "Shallum son of Jabesh", "Shallum", "shallum-2ki-15-10", "2 Kings 15:13", "2 Kings 15:13", "one full month", said="He takes the throne by striking down Zechariah and loses it the same way to Menahem. The writer gives him no line of verdict."),
    ruler("menahem", "Menahem son of Gadi", "Menahem", "menahem-2ki-15-14", "2 Kings 15:17", "2 Kings 15:17", "ten years", "2 Kings 15:18", "did evil in the sight of the LORD",
          thread=("as", "2 Kings 15:18", "the sins that Jeroboam son of Nebat")),
    ruler("pekahiah", "Pekahiah son of Menahem", "Pekahiah", "pekahiah-2ki-15-22", "2 Kings 15:23", "2 Kings 15:23", "two years", "2 Kings 15:24", "did evil in the sight of the LORD",
          thread=("as", "2 Kings 15:24", "the sins that Jeroboam son of Nebat")),
    ruler("pekah", "Pekah son of Remaliah", "Pekah", "pekah-2ki-15-25", "2 Kings 15:27", "2 Kings 15:27", "twenty years", "2 Kings 15:28", "did evil in the sight of the LORD",
          thread=("as", "2 Kings 15:28", "the sins that Jeroboam son of Nebat")),
    ruler("hoshea", "Hoshea son of Elah", "Hoshea", "hoshea-2ki-15-30", "2 Kings 17:1", "2 Kings 17:1", "nine years", "2 Kings 17:2", "did evil in the sight of the LORD",
          note=("2 Kings 17:2", "but not like the kings of Israel who preceded him"), said="The last king of the northern kingdom. His line does not name Jeroboam, but 2 Kings 17:22 goes back to him for the whole people."),
]
ISRAEL_END = "2 Kings 17:41"

JUDAH = [
    ruler("rehoboam", "Rehoboam son of Solomon", "Rehoboam", "rehoboam-1ki-11-43", "1 Kings 14:21", "1 Kings 14:21", "seventeen years", "1 Kings 14:22", "Judah did evil in the sight of the LORD",
          said="The line in Kings is about Judah in his reign. Chronicles says it of the king himself: \"Rehoboam did evil\" in 2 Chronicles 12:14."),
    ruler("abijam", "Abijam son of Rehoboam", "Abijam", "abijah-1ki-14-31", "1 Kings 15:1", "1 Kings 15:1–2", "three years", "1 Kings 15:3", "walked in all the sins that his father before him had committed",
          thread=("not", "1 Kings 15:3", "not as fully devoted to the LORD his God as the heart of David his forefather had been"), said="Chronicles calls him Abijah."),
    ruler("asa", "Asa son of Abijam", "Asa", "asa-1ki-15-8", "1 Kings 15:9", "1 Kings 15:9–10", "forty-one years", "1 Kings 15:11", "did what was right in the eyes of the LORD",
          thread=("as", "1 Kings 15:11", "as his father David had done"), hight=("1 Kings 15:14", "The high places were not removed")),
    ruler("jehoshaphat", "Jehoshaphat son of Asa", "Jehoshaphat", "jehoshaphat-1ki-15-24", "1 Kings 22:41", "1 Kings 22:42", "twenty-five years", "1 Kings 22:43", "did what was right in the eyes of the LORD",
          names=("1 Kings 22:43", "all the ways of his father Asa"), hight=("1 Kings 22:43", "The high places, however, were not removed")),
    ruler("jehoram-j", "Jehoram of Judah", "Jehoram", "jehoram-1ki-22-50", "2 Kings 8:16", "2 Kings 8:17", "eight years", "2 Kings 8:18", "did evil in the sight of the LORD",
          names=("2 Kings 8:18", "just as the house of Ahab had done"), said="The next verse names David too, but not as a measure: the LORD spares Judah \"for the sake of His servant David\" in 2 Kings 8:19."),
    ruler("ahaziah-j", "Ahaziah of Judah", "Ahaziah", "ahaziah-2ki-8-24", "2 Kings 8:25", "2 Kings 8:26", "one year", "2 Kings 8:27", "did evil in the sight of the LORD",
          names=("2 Kings 8:27", "like the house of Ahab")),
    ruler("athaliah", "Athaliah", "Athaliah", "athaliah-2ki-8-26", "2 Kings 11:1", "2 Kings 11:3", "six years",
          said="The one ruler here who was not a king. The writer gives her no line of verdict, and tells what she did: she \"proceeded to annihilate all the royal heirs\" in 2 Kings 11:1. Her six years are read from the years Joash stayed hidden."),
    ruler("joash", "Joash of Judah", "Joash", "joash-2ki-11-2", "2 Kings 12:1", "2 Kings 12:1", "forty years", "2 Kings 12:2", "did what was right in the eyes of the LORD",
          note=("2 Kings 12:2", "all the days he was instructed by Jehoiada the priest"), hight=("2 Kings 12:3", "the high places were not removed")),
    ruler("amaziah", "Amaziah son of Joash", "Amaziah", "amaziah-2ki-12-21", "2 Kings 14:1", "2 Kings 14:1–2", "twenty-nine years", "2 Kings 14:3", "did what was right in the eyes of the LORD",
          thread=("not", "2 Kings 14:3", "but not as his father David had done"), hight=("2 Kings 14:4", "the high places were not taken away")),
    ruler("azariah", "Azariah, also called Uzziah", "Azariah", "uzziah-2ki-14-21", "2 Kings 15:1", "2 Kings 15:1–2", "fifty-two years", "2 Kings 15:3", "did what was right in the eyes of the LORD",
          names=("2 Kings 15:3", "just as his father Amaziah had done"), hight=("2 Kings 15:4", "the high places were not taken away"), said="Kings uses both names, in 2 Kings 15:1 and 2 Kings 15:13. Chronicles says Uzziah."),
    ruler("jotham", "Jotham son of Uzziah", "Jotham", "jotham-2ki-15-5", "2 Kings 15:32", "2 Kings 15:32–33", "sixteen years", "2 Kings 15:34", "did what was right in the eyes of the LORD",
          names=("2 Kings 15:34", "just as his father Uzziah had done"), hight=("2 Kings 15:35", "the high places were not taken away")),
    ruler("ahaz", "Ahaz son of Jotham", "Ahaz", "ahaz-2ki-15-38", "2 Kings 16:1", "2 Kings 16:2", "sixteen years", "2 Kings 16:2", "did not do what was right in the eyes of the LORD his God",
          thread=("not", "2 Kings 16:2", "unlike David his father")),
    ruler("hezekiah", "Hezekiah son of Ahaz", "Hezekiah", "hezekiah-2ki-16-20", "2 Kings 18:1", "2 Kings 18:1–2", "twenty-nine years", "2 Kings 18:3", "did what was right in the eyes of the LORD",
          thread=("as", "2 Kings 18:3", "just as his father David had done"), removed=("2 Kings 18:4", "He removed the high places")),
    ruler("manasseh", "Manasseh son of Hezekiah", "Manasseh", "manasseh-2ki-20-21", "2 Kings 21:1", "2 Kings 21:1", "fifty-five years", "2 Kings 21:2", "did evil in the sight of the LORD",
          names=("2 Kings 21:2", "the abominations of the nations"), said="Chronicles adds what Kings does not tell: see the sixth reading."),
    ruler("amon", "Amon son of Manasseh", "Amon", "amon-2ki-21-18", "2 Kings 21:19", "2 Kings 21:19", "two years", "2 Kings 21:20", "did evil in the sight of the LORD",
          names=("2 Kings 21:20", "as his father Manasseh had done")),
    ruler("josiah", "Josiah son of Amon", "Josiah", "josiah-1ki-13-2", "2 Kings 22:1", "2 Kings 22:1", "thirty-one years", "2 Kings 22:2", "did what was right in the eyes of the LORD",
          thread=("as", "2 Kings 22:2", "walked in all the ways of his father David"), note=("2 Kings 22:2", "he did not turn aside to the right or to the left")),
    ruler("jehoahaz-j", "Jehoahaz of Judah", "Jehoahaz", "jehoahaz-2ki-23-30", "2 Kings 23:31", "2 Kings 23:31", "three months", "2 Kings 23:32", "did evil in the sight of the LORD",
          names=("2 Kings 23:32", "just as his fathers had done")),
    ruler("jehoiakim", "Jehoiakim son of Josiah", "Jehoiakim", "jehoiakim-2ki-23-34", "2 Kings 23:36", "2 Kings 23:36", "eleven years", "2 Kings 23:37", "did evil in the sight of the LORD",
          names=("2 Kings 23:37", "just as his fathers had done")),
    ruler("jehoiachin", "Jehoiachin son of Jehoiakim", "Jehoiachin", "jehoiachin-2ki-24-6", "2 Kings 24:8", "2 Kings 24:8", "three months", "2 Kings 24:9", "did evil in the sight of the LORD",
          names=("2 Kings 24:9", "just as his father had done")),
    ruler("zedekiah", "Zedekiah", "Zedekiah", "zedekiah-2ki-24-17", "2 Kings 24:18", "2 Kings 24:18", "eleven years", "2 Kings 24:19", "did evil in the sight of the LORD",
          names=("2 Kings 24:19", "just as Jehoiakim had done")),
]
JUDAH_END = "2 Kings 25:30"

# Every other verse between the parting of the kingdoms and the end of Kings where the scan for verdict wording hits, and why it is not on a ruler's record.
SCAN_OTHERS = {
    "1 Kings 12:31": "Jeroboam's shrines, told in the first reading on him, not a verdict line",
    "1 Kings 12:32": "Jeroboam's feast and shrines",
    "1 Kings 13:2": "the man of God against the altar",
    "1 Kings 13:32": "the old prophet on the shrines",
    "1 Kings 14:23": "what the people of Judah built",
    "1 Kings 15:5": "David, who is the peg and not on a beam",
    "1 Kings 16:7": "the word against Baasha, beside his own line",
    "1 Kings 21:20": "Elijah to Ahab, in the fourth reading",
    "1 Kings 21:25": "the writer on Ahab, in the fourth reading and on the three letters",
    "2 Kings 3:18": "Elisha: a simple matter in the sight of the LORD",
    "2 Kings 16:4": "Ahaz's own sacrifices on the high places",
    "2 Kings 17:2": "",
    "2 Kings 17:9": "the Israelites, at the fall of Samaria",
    "2 Kings 17:11": "the Israelites, at the fall of Samaria",
    "2 Kings 17:17": "the Israelites, at the fall of Samaria",
    "2 Kings 17:29": "the settlers in Samaria",
    "2 Kings 17:32": "the settlers in Samaria",
    "2 Kings 18:22": "the Assyrian envoy's words",
    "2 Kings 20:3": "Hezekiah's own prayer",
    "2 Kings 21:3": "what Manasseh did, under his line",
    "2 Kings 21:6": "what Manasseh did, under his line",
    "2 Kings 21:15": "the LORD on the people",
    "2 Kings 21:16": "the writer on Manasseh's bloodshed, in the sixth reading",
    "2 Kings 23:5": "Josiah's reform",
    "2 Kings 23:8": "Josiah's reform",
    "2 Kings 23:9": "Josiah's reform",
    "2 Kings 23:13": "Josiah's reform",
    "2 Kings 23:19": "Josiah's reform",
    "2 Kings 23:20": "Josiah's reform",
}
SCAN_OTHERS.pop("2 Kings 17:2")  # Hoshea's own line, listed above

# Each reading's opening form: its own shape, then the three questions. Each item is (voice or label, verse, words).
FORMS = {
    "accession": {
        "name": "Solomon", "kind": "fork", "ask": "Two ways a request could go",
        "taken": ("He asked", "1 Kings 3:9", "an understanding heart to judge Your people"),
        "left": ("He did not ask", "1 Kings 3:11", "long life or wealth for yourself or death for your enemies"),
        "under": ("And God's answer carries a condition", "1 Kings 3:14", "So if you walk in My ways"),
        "says": [("The ruler", "1 Kings 3:7", "I am only a little child"), ("The writer", "1 Kings 3:10", "it pleased the Lord"), ("The writer, later", "1 Kings 11:6", "Solomon did evil in the sight of the LORD")],
        "paid": [("The people's word, after him", "1 Kings 12:4", "Your father put a heavy yoke on us"), ("Israel's workers", "1 Kings 5:13", "conscripted a labor force of 30,000 men")],
        "after": [("In his reign", "1 Kings 11:11", "I will tear the kingdom away from you"), ("Nehemiah remembers", "Nehemiah 13:26", "yet foreign women drew him into sin"), ("Jesus remembers", "Matthew 6:29", "not even Solomon in all his glory")],
    },
    "counsel": {
        "name": "Rehoboam", "kind": "fork", "ask": "Two answers, three days",
        "taken": ("He took the young men's", "1 Kings 12:14", "I will add to your yoke"),
        "left": ("He left the elders'", "1 Kings 12:7", "If you will be a servant to these people"),
        "under": ("And the writer adds", "1 Kings 12:15", "this turn of events was from the LORD"),
        "says": [("The people", "1 Kings 12:4", "Your father put a heavy yoke on us"), ("The ruler", "1 Kings 12:14", "I will scourge you with scorpions"), ("The writer", "1 Kings 12:15", "the king did not listen to the people")],
        "paid": [("The people", "1 Kings 12:16", "To your tents, O Israel"), ("Adoram, over the forced labor", "1 Kings 12:18", "all Israel stoned him to death")],
        "after": [("In his reign", "1 Kings 12:19", "to this day"), ("Abijah remembers", "2 Chronicles 13:7", "when he was young, inexperienced, and unable to resist them")],
    },
    "worship": {
        "name": "Jeroboam", "kind": "voices", "ask": "Three voices on one decision",
        "voices": [("In his heart", "1 Kings 12:26", "Now the kingdom might revert to the house of David"), ("To the people", "1 Kings 12:28", "Going up to Jerusalem is too much for you"), ("The writer", "1 Kings 12:30", "this thing became a sin")],
        "says": [("The ruler, to himself", "1 Kings 12:27", "they will kill me"), ("The ruler, to them", "1 Kings 12:28", "Here, O Israel, are your gods"), ("The writer", "1 Kings 13:33", "did not repent of his evil ways")],
        "paid": [("The people", "1 Kings 12:30", "the people walked as far as Dan"), ("His own house", "1 Kings 13:34", "led to its extermination and destruction")],
        "after": [("At the fall of Samaria", "2 Kings 17:22", "The Israelites persisted in all the sins that Jeroboam had committed"), ("Under Josiah", "2 Kings 23:15", "the high place set up by Jeroboam son of Nebat"), ("Hosea", "Hosea 8:5", "He has rejected your calf, O Samaria")],
    },
    "justice": {
        "name": "Ahab", "kind": "land", "ask": "Four claims on one plot",
        "claims": [("The king offers", "1 Kings 21:2", "Give me your vineyard"), ("The owner refuses", "1 Kings 21:3", "the inheritance of my fathers"), ("The queen promises", "1 Kings 21:7", "I will get you the vineyard of Naboth the Jezreelite"), ("The LORD asks", "1 Kings 21:19", "Have you not murdered a man and seized his land?")],
        "says": [("The ruler", "1 Kings 21:20", "So you have found me out, my enemy"), ("Another voice", "1 Kings 21:29", "he has humbled himself before Me"), ("The writer", "1 Kings 21:25", "sold himself to do evil in the sight of the LORD")],
        "paid": [("Naboth", "1 Kings 21:13", "stoned him to death"), ("His sons", "2 Kings 9:26", "the blood of Naboth and the blood of his sons")],
        "after": [("Ahab's end", "1 Kings 22:38", "the dogs licked up Ahab's blood"), ("Jezebel's", "1 Kings 21:23", "The dogs will devour Jezebel")],
    },
    "correction": {
        "name": "David", "kind": "story", "ask": "A story, then whose story it was",
        "pairs": [(("The story", "2 Samuel 12:4", "he took the poor man's lamb"), ("The king", "2 Samuel 12:9", "took his wife as your own")), (("The king's answer", "2 Samuel 12:5", "the man who did this deserves to die"), ("The prophet's", "2 Samuel 12:7", "You are that man!"))],
        "under": ("Then the king", "2 Samuel 12:13", "I have sinned against the LORD"),
        "says": [("The ruler", "2 Samuel 12:13", "I have sinned against the LORD"), ("Another voice", "2 Samuel 12:13", "The LORD has taken away your sin"), ("The writer", "2 Samuel 11:27", "the thing that David had done was evil in the sight of the LORD")],
        "paid": [("Uriah and others", "2 Samuel 11:17", "Uriah the Hittite also died"), ("Bathsheba", "2 Samuel 11:26", "she mourned for him"), ("Their child", "2 Samuel 12:18", "On the seventh day the child died")],
        "after": [("In his house", "2 Samuel 12:10", "the sword will never depart from your house"), ("The writer of Kings", "1 Kings 15:5", "except in the matter of Uriah the Hittite"), ("Matthew's list", "Matthew 1:6", "by Uriah's wife")],
    },
    "verdict": {
        "name": "Manasseh", "kind": "accounts", "ask": "Two accounts, each in its own order",
        "kings": [("2 Kings 21:9", "Manasseh led them astray"), ("2 Kings 21:11", "acting more wickedly than the Amorites"), ("2 Kings 21:16", "shed so much innocent blood")],
        "chronicles": [("2 Chronicles 33:9", "Manasseh led the people of Judah and Jerusalem astray"), ("2 Chronicles 33:11", "a hook in his nose"), ("2 Chronicles 33:13", "the LORD received his plea")],
        "says": [("The writer of Kings", "2 Kings 21:2", "did evil in the sight of the LORD"), ("The writer of Chronicles", "2 Chronicles 33:13", "Then Manasseh knew that the LORD is God")],
        "paid": [("Those in Jerusalem", "2 Kings 21:16", "he filled Jerusalem from end to end"), ("His son", "2 Kings 21:6", "He sacrificed his own son in the fire")],
        "after": [("His son's reign", "2 Kings 21:20", "as his father Manasseh had done"), ("At Judah's end", "2 Kings 24:3", "because of the sins of Manasseh"), ("Jeremiah", "Jeremiah 15:4", "because of what Manasseh son of Hezekiah king of Judah did in Jerusalem")],
    },
}

# Six kings through two accounts. kind: both, or told only by one. Each side is (verse, words).
THREADS = [
    {"id": "david", "name": "David", "books": "2 Samuel · 1 Chronicles", "stops": [
        {"kind": "both", "what": "The ark comes to the tent", "first": ("2 Samuel 6:17", "the tent that David had pitched for it"), "second": ("1 Chronicles 16:1", "the tent that David had pitched for it")},
        {"kind": "both", "what": "He stays in Jerusalem in the spring", "first": ("2 Samuel 11:1", "David remained in Jerusalem"), "second": ("1 Chronicles 20:1", "David remained in Jerusalem")},
        {"kind": "first", "what": "The letter about Uriah", "first": ("2 Samuel 11:15", "Put Uriah at the front of the fiercest battle")},
        {"kind": "both", "what": "He counts the people, and each account says who moved him", "first": ("2 Samuel 24:1", "He stirred up David against them"), "second": ("1 Chronicles 21:1", "Satan rose up against Israel and incited David")},
        {"kind": "second", "what": "He gathers for a temple he will not build", "second": ("1 Chronicles 22:3", "David provided a large quantity of iron")},
    ]},
    {"id": "solomon", "name": "Solomon", "books": "1 Kings · 2 Chronicles", "stops": [
        {"kind": "both", "what": "His request", "first": ("1 Kings 3:9", "an understanding heart"), "second": ("2 Chronicles 1:10", "wisdom and knowledge")},
        {"kind": "second", "what": "The word at the temple's dedication about a people who turn back", "second": ("2 Chronicles 7:14", "if My people who are called by My name humble themselves")},
        {"kind": "first", "what": "His turn in old age", "first": ("1 Kings 11:4", "his wives turned his heart after other gods")},
    ]},
    {"id": "abijam", "name": "Abijam, or Abijah", "books": "1 Kings · 2 Chronicles", "stops": [
        {"kind": "first", "what": "The verdict", "first": ("1 Kings 15:3", "walked in all the sins that his father before him had committed")},
        {"kind": "both", "what": "War with Jeroboam", "first": ("1 Kings 15:7", "there was war between Abijam and Jeroboam"), "second": ("2 Chronicles 13:2", "there was war between Abijah and Jeroboam")},
        {"kind": "second", "what": "His speech on the battlefield", "second": ("2 Chronicles 13:10", "We have not forsaken Him")},
    ]},
    {"id": "asa", "name": "Asa", "books": "1 Kings · 2 Chronicles", "stops": [
        {"kind": "both", "what": "He does right", "first": ("1 Kings 15:11", "did what was right in the eyes of the LORD"), "second": ("2 Chronicles 14:2", "did what was good and right in the eyes of the LORD his God")},
        {"kind": "both", "what": "He pays Aram with the temple's silver", "first": ("1 Kings 15:18", "withdrew all the silver and gold"), "second": ("2 Chronicles 16:2", "withdrew the silver and gold")},
        {"kind": "second", "what": "The seer who rebuked it", "second": ("2 Chronicles 16:10", "he put the man in prison")},
        {"kind": "both", "what": "His feet", "first": ("1 Kings 15:23", "he became diseased in his feet"), "second": ("2 Chronicles 16:12", "became diseased in his feet")},
        {"kind": "second", "what": "Where he turned in his illness", "second": ("2 Chronicles 16:12", "he did not seek the LORD, but only the physicians")},
    ]},
    {"id": "joash", "name": "Joash", "books": "2 Kings · 2 Chronicles", "stops": [
        {"kind": "both", "what": "Right, with a limit", "first": ("2 Kings 12:2", "all the days he was instructed by Jehoiada the priest"), "second": ("2 Chronicles 24:2", "all the days of Jehoiada the priest")},
        {"kind": "second", "what": "The priest's son", "second": ("2 Chronicles 24:21", "by order of the king, they stoned him")},
        {"kind": "both", "what": "His own servants", "first": ("2 Kings 12:20", "formed a conspiracy and killed him"), "second": ("2 Chronicles 24:25", "His own servants conspired against him")},
    ]},
    {"id": "uzziah", "name": "Uzziah, or Azariah", "books": "2 Kings · 2 Chronicles", "stops": [
        {"kind": "both", "what": "He does right", "first": ("2 Kings 15:3", "just as his father Amaziah had done"), "second": ("2 Chronicles 26:4", "just as his father Amaziah had done")},
        {"kind": "second", "what": "Why it happened", "second": ("2 Chronicles 26:16", "he entered the temple of the LORD to burn incense")},
        {"kind": "both", "what": "His leprosy", "first": ("2 Kings 15:5", "afflicted the king with leprosy"), "second": ("2 Chronicles 26:19", "leprosy broke out on his forehead")},
    ]},
]
THREAD_BOOKS = {"first": ("1 Samuel", "2 Samuel", "1 Kings", "2 Kings"), "second": ("1 Chronicles", "2 Chronicles")}
THREAD_ORDER = ["david", "solomon", "abijam", "asa", "joash", "uzziah"]

# Three letters, one row for each hand. A None in a row is stated on the page as not given.
LETTER_ROWS = ["Who wrote", "Under what authority", "How it went out", "Who acted", "Who was to die", "What the writer says"]
LETTERS = [
    {"id": "joab", "title": "David to Joab", "read": "2 Samuel 11:14–27", "cells": [
        ("2 Samuel 11:14", "David wrote a letter to Joab"), None, ("2 Samuel 11:14", "sent it with Uriah"), ("2 Samuel 11:16", "he assigned Uriah to a place"), ("2 Samuel 11:17", "Uriah the Hittite also died"), ("2 Samuel 11:27", "the thing that David had done was evil in the sight of the LORD")],
     "missing": {1: "No seal is named. It was the king's own hand.", 5: None}},
    {"id": "elders", "title": "Jezebel to the elders", "read": "1 Kings 21:8–16", "cells": [
        ("1 Kings 21:8", "Jezebel wrote letters in Ahab's name"), ("1 Kings 21:8", "sealed them with his seal"), ("1 Kings 21:8", "sent them to the elders and nobles"), ("1 Kings 21:11", "did as Jezebel had instructed"), ("1 Kings 21:13", "stoned him to death"), ("1 Kings 21:25", "who sold himself to do evil in the sight of the LORD")],
     "missing": {}},
    {"id": "ring", "title": "Haman under Xerxes", "read": "Esther 3:8–15", "cells": [
        ("Esther 3:12", "the order was written exactly as Haman commanded"), ("Esther 3:10", "the king removed the signet ring from his finger"), ("Esther 3:13", "the letters were sent by couriers"), ("Esther 3:11", "These people are given to you to do with them as you please"), ("Esther 3:13", "young and old, women and children"), None],
     "missing": {5: "None. The book gives Xerxes no line of verdict, and it never names God."}},
]
ESTHER_TURN = [("Esther 8:8", "cannot be revoked"), ("Esther 8:10", "Mordecai wrote in the name of King Xerxes"), ("Esther 8:11", "including women and children")]

# Commentary quotation -> words that open the same note, found by reading the held file. Each quotation occurs once in its whole file; the build checks both.
SOURCE_ANCHORS = {
    "That was the overruling cause": "the cause was from the Lord",
    "He permitted Satan to tempt David": "David Numbers the People",
    "is frequently described in Scripture as doing what He merely permits to be done": "David Numbers the People",
    "for a while, to sincere repentance": "rent his clothes, and put sackcloth upon his flesh",
    "He humbled himself, repented, and prayed": "when he was in affliction, he besought",
    "God serves his own wise and righteous purposes by the imprudences and sins of men": "Chapter 12 Chapter Outline Rehoboam",
    "For the people's sin David was left to act wrong": "Chapter 24 Chapter Outline David numbers the people",
    "his heart was unhumbled and unchanged": "Naboth, perhaps",
    "Ahab's repentance was only what might be seen of men": "Naboth, perhaps",
}

SOURCES = [
    {"id": "bfm", "short": "The Baptist Faith and Message", "name": "The Baptist Faith and Message 2000, as amended 2023, Articles 1, 2, 4, 15 and 17", "href": "https://bfm.sbc.net/bfm2000/",
     "note": "Short phrases, with this link. Read: those articles, in the printable PDF linked from that page. Its text is the Southern Baptist Convention's, so it is not hosted here."},
    {"id": "jfb", "short": "Jamieson, Fausset and Brown", "name": "Jamieson, Fausset and Brown, Commentary (1871)", "href": "https://www.ccel.org/ccel/jamieson/jfb.html",
     "note": "Short quotations. Read: their notes on 1 Kings 12:15, 1 Kings 21:27–29, 2 Samuel 24:1–4 and 2 Chronicles 33:12–13 only. Not a Baptist work. Public domain text, held from the Christian Classics Ethereal Library."},
    {"id": "mhcc", "short": "Matthew Henry's Concise Commentary", "name": "Matthew Henry's Concise Commentary", "href": "https://www.ccel.org/ccel/henry/mhcc.html",
     "note": "Short quotations. Read: the notes on 1 Kings 12, 1 Kings 21 and 2 Samuel 24 only. Not a Baptist work. Public domain text, held from the Christian Classics Ethereal Library."},
    {"id": "bsb", "short": "Berean Standard Bible", "name": "Berean Standard Bible", "href": "https://berean.bible/",
     "note": "Every verse on this page. Public domain, courtesy credit berean.bible. No Hebrew or Greek was compared, so the counts are of this English text."},
]

RELATED = [("/study/people?view=rulers", "The rulers timeline"), ("/mockups/prophets-in-their-times-directions/", "Prophets in their times")]
