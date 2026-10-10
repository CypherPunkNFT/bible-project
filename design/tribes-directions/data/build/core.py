"""The backbone typed from the KJV: birth, blessings, census, camp, princes, offering days, spies.
Every reference here is checked by check.py (quotes word for word, numbers number for number)."""
from kjv import ref, span_text

TRIBE_IDS = ["reuben", "simeon", "levi", "judah", "dan", "naphtali", "gad", "asher", "issachar", "zebulun",
             "joseph", "ephraim", "manasseh", "benjamin"]

NAMES = {t: t.capitalize() for t in TRIBE_IDS}

# son: personId, birth order (Gen 29-30, 35), mother, who named him, birth verses, the naming words.
SONS = {
    "reuben": ("reuben-gen-29-32", 1, "Leah", "leah-gen-29-16", "Leah", "GEN 29:32",
               "Surely the LORD hath looked upon my affliction; now therefore my husband will love me."),
    "simeon": ("simeon-gen-29-33", 2, "Leah", "leah-gen-29-16", "Leah", "GEN 29:33",
               "Because the LORD hath heard that I was hated, he hath therefore given me this son also"),
    "levi": ("levi-gen-29-34", 3, "Leah", "leah-gen-29-16", "Leah", "GEN 29:34",
             "Now this time will my husband be joined unto me, because I have born him three sons"),
    "judah": ("judah-gen-29-35", 4, "Leah", "leah-gen-29-16", "Leah", "GEN 29:35", "Now will I praise the LORD"),
    "dan": ("dan-gen-30-6", 5, "Bilhah", "bilhah-gen-29-29", "Rachel", "GEN 30:5-6",
            "God hath judged me, and hath also heard my voice, and hath given me a son"),
    "naphtali": ("naphtali-gen-30-8", 6, "Bilhah", "bilhah-gen-29-29", "Rachel", "GEN 30:7-8",
                 "With great wrestlings have I wrestled with my sister, and I have prevailed"),
    "gad": ("gad-gen-30-11", 7, "Zilpah", "zilpah-gen-29-24", "Leah", "GEN 30:10-11", "A troop cometh"),
    "asher": ("asher-gen-30-13", 8, "Zilpah", "zilpah-gen-29-24", "Leah", "GEN 30:12-13",
              "Happy am I, for the daughters will call me blessed"),
    "issachar": ("issachar-gen-30-18", 9, "Leah", "leah-gen-29-16", "Leah", "GEN 30:17-18",
                 "God hath given me my hire, because I have given my maiden to my husband"),
    "zebulun": ("zebulun-gen-30-20", 10, "Leah", "leah-gen-29-16", "Leah", "GEN 30:19-20",
                "God hath endued me with a good dowry; now will my husband dwell with me, because I have born him six sons"),
    "joseph": ("joseph-gen-30-24", 11, "Rachel", "rachel-gen-29-6", "Rachel", "GEN 30:22-24",
               "God hath taken away my reproach: And she called his name Joseph; and said, The LORD shall add to me another son."),
    "benjamin": ("benjamin-gen-35-18", 12, "Rachel", "rachel-gen-29-6", "Rachel, then Jacob", "GEN 35:16-18",
                 "she called his name Ben-oni: but his father called him Benjamin."),
    # Joseph's sons: grandsons of Jacob, adopted by him (Gen 48:5). Not in the birth order of the twelve.
    "manasseh": ("manasseh-gen-41-51", None, "Asenath", "asenath-gen-41-45", "Joseph", "GEN 41:50-51",
                 "For God, said he, hath made me forget all my toil, and all my father’s house."),
    "ephraim": ("ephraim-gen-41-52", None, "Asenath", "asenath-gen-41-45", "Joseph", "GEN 41:50-52",
                "For God hath caused me to be fruitful in the land of my affliction."),
}
NAME_QUOTE_SPAN = {"reuben": "GEN 29:32", "simeon": "GEN 29:33", "levi": "GEN 29:34", "judah": "GEN 29:35",
                   "dan": "GEN 30:6", "naphtali": "GEN 30:8", "gad": "GEN 30:11", "asher": "GEN 30:13",
                   "issachar": "GEN 30:18", "zebulun": "GEN 30:20", "joseph": "GEN 30:23-24", "benjamin": "GEN 35:18",
                   "manasseh": "GEN 41:51", "ephraim": "GEN 41:52"}
ADOPTION = ("GEN 48:5", "thy two sons, Ephraim and Manasseh, … are mine; as Reuben and Simeon, they shall be mine.")

# Blessings: Jacob (Gen 49) and Moses (Deut 33). Text is taken from the verses by script.
JACOB = {"reuben": "GEN 49:3-4", "simeon": "GEN 49:5-7", "levi": "GEN 49:5-7", "judah": "GEN 49:8-12",
         "zebulun": "GEN 49:13", "issachar": "GEN 49:14-15", "dan": "GEN 49:16-17", "gad": "GEN 49:19",
         "asher": "GEN 49:20", "naphtali": "GEN 49:21", "joseph": "GEN 49:22-26", "benjamin": "GEN 49:27",
         "ephraim": "GEN 48:19-20", "manasseh": "GEN 48:19-20"}
MOSES = {"reuben": "DEU 33:6", "simeon": None, "levi": "DEU 33:8-11", "judah": "DEU 33:7", "benjamin": "DEU 33:12",
         "joseph": "DEU 33:13-17", "zebulun": "DEU 33:18-19", "issachar": "DEU 33:18-19", "gad": "DEU 33:20-21",
         "dan": "DEU 33:22", "naphtali": "DEU 33:23", "asher": "DEU 33:24-25", "ephraim": "DEU 33:17",
         "manasseh": "DEU 33:17"}
BLESSING_NOTES = {
    "simeon": "Moses gives Simeon no blessing: Deuteronomy 33 names every other son of Jacob, and not Simeon. Jacob's words in Genesis 49:5–7 are spoken to Simeon and Levi together.",
    "levi": "Jacob's words (Genesis 49:5–7) are spoken to Simeon and Levi together; Moses blesses Levi alone, and at length (Deuteronomy 33:8–11).",
    "issachar": "Moses blesses Zebulun and Issachar in one breath (Deuteronomy 33:18–19).",
    "zebulun": "Moses blesses Zebulun and Issachar in one breath (Deuteronomy 33:18–19). In Genesis 49 Jacob names Zebulun before Issachar, the elder.",
    "dan": "Genesis 49:18, “I have waited for thy salvation, O LORD”, follows Dan's words; it is not shown as part of Dan's blessing here.",
    "ephraim": "Genesis 49 blesses Joseph, not his sons (49:22–26). Jacob's blessing of Ephraim is in Genesis 48, where he crosses his hands and sets “Ephraim before Manasseh” (48:20). Moses names the two in Joseph's blessing (Deuteronomy 33:17).",
    "manasseh": "Genesis 49 blesses Joseph, not his sons (49:22–26). Jacob blesses the two boys in Genesis 48, setting the younger, Ephraim, before Manasseh the firstborn (48:14, 20). Moses names the two in Joseph's blessing (Deuteronomy 33:17).",
    "joseph": "Jacob's blessing of Joseph (Genesis 49:22–26) and Moses' (Deuteronomy 33:13–17) are among the longest; Moses ends by naming “the ten thousands of Ephraim” and “the thousands of Manasseh”.",
}
# Where a blessing is shown as only part of its verses, the exact words used.
BLESSING_TEXT = {
    ("moses", "ephraim"): "they are the ten thousands of Ephraim, and they are the thousands of Manasseh.",
    ("moses", "manasseh"): "they are the ten thousands of Ephraim, and they are the thousands of Manasseh.",
    ("jacob", "ephraim"): "God make thee as Ephraim and as Manasseh: and he set Ephraim before Manasseh.",
    ("jacob", "manasseh"): "he also shall become a people, and he also shall be great: but truly his younger brother shall be greater than he",
}

# Census: (n, reference) - Numbers 1 and Numbers 26. Levi: the Levites' own count (males from a month old).
CENSUS = {
    "reuben": ((46500, "NUM 1:21"), (43730, "NUM 26:7")),
    "simeon": ((59300, "NUM 1:23"), (22200, "NUM 26:14")),
    "gad": ((45650, "NUM 1:25"), (40500, "NUM 26:18")),
    "judah": ((74600, "NUM 1:27"), (76500, "NUM 26:22")),
    "issachar": ((54400, "NUM 1:29"), (64300, "NUM 26:25")),
    "zebulun": ((57400, "NUM 1:31"), (60500, "NUM 26:27")),
    "ephraim": ((40500, "NUM 1:33"), (32500, "NUM 26:37")),
    "manasseh": ((32200, "NUM 1:35"), (52700, "NUM 26:34")),
    "benjamin": ((35400, "NUM 1:37"), (45600, "NUM 26:41")),
    "dan": ((62700, "NUM 1:39"), (64400, "NUM 26:43")),
    "asher": ((41500, "NUM 1:41"), (53400, "NUM 26:47")),
    "naphtali": ((53400, "NUM 1:43"), (45400, "NUM 26:50")),
    "levi": ((22000, "NUM 3:39"), (23000, "NUM 26:62")),
}
CENSUS_TOTALS = {"first": (603550, "NUM 1:46"), "second": (601730, "NUM 26:51")}
CENSUS_NOTES = {
    "levi": "Levi was not numbered with the tribes (Numbers 1:47–49). It was counted apart, every male “from a month old and upward”: 22,000 (Numbers 3:39) and 23,000 (Numbers 26:62). The three clan counts in Numbers 3 (7,500, 8,600 and 6,200; verses 22, 28, 34) add up to 22,300 by our own arithmetic, 300 more than the total the text gives.",
    "joseph": "Joseph is counted as two tribes, Ephraim and Manasseh (Numbers 1:32–35; 26:28–37); the text gives no single figure for Joseph.",
    "ephraim": "In Numbers 1 Ephraim is counted before Manasseh; in Numbers 26 Manasseh comes first.",
    "manasseh": "In Numbers 1 Ephraim is counted before Manasseh; in Numbers 26 Manasseh comes first.",
}

# Camp (Numbers 2): side, place in the side (1 = the standard), prince, the verse, the camp's order of march.
CAMP = {
    "judah": ("east", 1, "NUM 2:3-4"), "issachar": ("east", 2, "NUM 2:5-6"), "zebulun": ("east", 3, "NUM 2:7-8"),
    "reuben": ("south", 1, "NUM 2:10-11"), "simeon": ("south", 2, "NUM 2:12-13"), "gad": ("south", 3, "NUM 2:14-15"),
    "ephraim": ("west", 1, "NUM 2:18-19"), "manasseh": ("west", 2, "NUM 2:20-21"), "benjamin": ("west", 3, "NUM 2:22-23"),
    "dan": ("north", 1, "NUM 2:25-26"), "asher": ("north", 2, "NUM 2:27-28"), "naphtali": ("north", 3, "NUM 2:29-30"),
}
CAMP_SIDES = [  # side, standard, total, total ref, march rank, rank ref, rank words
    ("east", "judah", 186400, "NUM 2:9", 1, "These shall first set forth."),
    ("south", "reuben", 151450, "NUM 2:16", 2, "And they shall set forth in the second rank."),
    ("west", "ephraim", 108100, "NUM 2:24", 3, "And they shall go forward in the third rank."),
    ("north", "dan", 157600, "NUM 2:31", 4, "They shall go hindmost with their standards."),
]
LEVITE_CAMP = [  # Numbers 3: the Levites around the tabernacle
    ("west", "Gershonites", "NUM 3:23", "The families of the Gershonites shall pitch behind the tabernacle westward."),
    ("south", "Kohathites", "NUM 3:29", "The families of the sons of Kohath shall pitch on the side of the tabernacle southward."),
    ("north", "Merarites", "NUM 3:35", "these shall pitch on the side of the tabernacle northward."),
    ("east", "Moses, and Aaron and his sons", "NUM 3:38", "But those that encamp before the tabernacle toward the east, even before the tabernacle of the congregation eastward, shall be Moses, and Aaron and his sons"),
]

# Princes of Numbers 1:5-15 (the census helpers, "princes of the tribes", 1:16).
PRINCES = {
    "reuben": ("Elizur the son of Shedeur", "NUM 1:5"), "simeon": ("Shelumiel the son of Zurishaddai", "NUM 1:6"),
    "judah": ("Nahshon the son of Amminadab", "NUM 1:7"), "issachar": ("Nethaneel the son of Zuar", "NUM 1:8"),
    "zebulun": ("Eliab the son of Helon", "NUM 1:9"), "ephraim": ("Elishama the son of Ammihud", "NUM 1:10"),
    "manasseh": ("Gamaliel the son of Pedahzur", "NUM 1:10"), "benjamin": ("Abidan the son of Gideoni", "NUM 1:11"),
    "dan": ("Ahiezer the son of Ammishaddai", "NUM 1:12"), "asher": ("Pagiel the son of Ocran", "NUM 1:13"),
    "gad": ("Eliasaph the son of Deuel", "NUM 1:14"), "naphtali": ("Ahira the son of Enan", "NUM 1:15"),
}
PRINCE_NOTES = {
    "gad": "Numbers 1:14, 7:42 and 10:20 call Eliasaph's father Deuel; Numbers 2:14 calls him Reuel.",
    "levi": "Levi has no prince in Numbers 1. Numbers 3 names a chief for each Levite clan: Eliasaph the son of Lael (Gershonites, 3:24), Elizaphan the son of Uzziel (Kohathites, 3:30), Zuriel the son of Abihail (Merarites, 3:35), with Eleazar the son of Aaron “chief over the chief of the Levites” (3:32).",
    "joseph": "Joseph has two princes, one for Ephraim and one for Manasseh (Numbers 1:10).",
}

# Offering days for the altar (Numbers 7): day, reference of that day's offering.
OFFERING = {
    "judah": (1, "NUM 7:12-17"), "issachar": (2, "NUM 7:18-23"), "zebulun": (3, "NUM 7:24-29"),
    "reuben": (4, "NUM 7:30-35"), "simeon": (5, "NUM 7:36-41"), "gad": (6, "NUM 7:42-47"),
    "ephraim": (7, "NUM 7:48-53"), "manasseh": (8, "NUM 7:54-59"), "benjamin": (9, "NUM 7:60-65"),
    "dan": (10, "NUM 7:66-71"), "asher": (11, "NUM 7:72-77"), "naphtali": (12, "NUM 7:78-83"),
}
DAY_WORDS = {1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 7: "seventh", 8: "eighth",
             9: "ninth", 10: "tenth", 11: "eleventh", 12: "twelfth"}

# Spies (Numbers 13:4-15).
SPIES = {
    "reuben": ("Shammua the son of Zaccur", "NUM 13:4"), "simeon": ("Shaphat the son of Hori", "NUM 13:5"),
    "judah": ("Caleb the son of Jephunneh", "NUM 13:6"), "issachar": ("Igal the son of Joseph", "NUM 13:7"),
    "ephraim": ("Oshea the son of Nun", "NUM 13:8"), "benjamin": ("Palti the son of Raphu", "NUM 13:9"),
    "zebulun": ("Gaddiel the son of Sodi", "NUM 13:10"), "manasseh": ("Gaddi the son of Susi", "NUM 13:11"),
    "dan": ("Ammiel the son of Gemalli", "NUM 13:12"), "asher": ("Sethur the son of Michael", "NUM 13:13"),
    "naphtali": ("Nahbi the son of Vophsi", "NUM 13:14"), "gad": ("Geuel the son of Machi", "NUM 13:15"),
}
SPY_NOTES = {
    "ephraim": "Moses renamed him: “Moses called Oshea the son of Nun Jehoshua” (Numbers 13:16), that is Joshua.",
    "manasseh": "The text says “Of the tribe of Joseph, namely, of the tribe of Manasseh” (Numbers 13:11).",
    "joseph": "Joseph's spy is listed under Manasseh: “Of the tribe of Joseph, namely, of the tribe of Manasseh, Gaddi the son of Susi” (Numbers 13:11). Ephraim's spy was Oshea (Joshua), 13:8.",
    "levi": "Levi sent no spy: the twelve in Numbers 13:4–15 are the other tribes, with Joseph counted as Ephraim and Manasseh.",
}
# The men who divided the land (Numbers 34:19-28).
DIVIDERS = {
    "judah": ("Caleb the son of Jephunneh", "NUM 34:19"), "simeon": ("Shemuel the son of Ammihud", "NUM 34:20"),
    "benjamin": ("Elidad the son of Chislon", "NUM 34:21"), "dan": ("Bukki the son of Jogli", "NUM 34:22"),
    "manasseh": ("Hanniel the son of Ephod", "NUM 34:23"), "ephraim": ("Kemuel the son of Shiphtan", "NUM 34:24"),
    "zebulun": ("Elizaphan the son of Parnach", "NUM 34:25"), "issachar": ("Paltiel the son of Azzan", "NUM 34:26"),
    "asher": ("Ahihud the son of Shelomi", "NUM 34:27"), "naphtali": ("Pedahel the son of Ammihud", "NUM 34:28"),
}

MARCH = [  # Numbers 10:14-28, in the order the text gives it
    {"what": "judah", "kind": "tribe", "span": "NUM 10:14"}, {"what": "issachar", "kind": "tribe", "span": "NUM 10:15"},
    {"what": "zebulun", "kind": "tribe", "span": "NUM 10:16"},
    {"what": "The tabernacle taken down; the sons of Gershon and of Merari bearing it", "kind": "levites", "span": "NUM 10:17"},
    {"what": "reuben", "kind": "tribe", "span": "NUM 10:18"}, {"what": "simeon", "kind": "tribe", "span": "NUM 10:19"},
    {"what": "gad", "kind": "tribe", "span": "NUM 10:20"},
    {"what": "The Kohathites, bearing the sanctuary", "kind": "levites", "span": "NUM 10:21"},
    {"what": "ephraim", "kind": "tribe", "span": "NUM 10:22"}, {"what": "manasseh", "kind": "tribe", "span": "NUM 10:23"},
    {"what": "benjamin", "kind": "tribe", "span": "NUM 10:24"},
    {"what": "dan", "kind": "tribe", "span": "NUM 10:25", "note": "“the rereward of all the camps”"},
    {"what": "asher", "kind": "tribe", "span": "NUM 10:26"}, {"what": "naphtali", "kind": "tribe", "span": "NUM 10:27"},
]
