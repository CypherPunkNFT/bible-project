"""Story, fate, New Testament, Ezekiel, Revelation 7, tradition, the kingdom, views and sources.
Claims are our own words; anything inside “…” is checked word for word against the claim's verses by check.py."""
from kjv import ref, label


def C(text, refs, layer="scripture", cites=None):
    """A claim. refs: one or more references; the first is the span."""
    rs = [ref(r) for r in ([refs] if isinstance(refs, str) else refs)]
    out = {"text": text, "layer": layer, "span": rs[0], "ref": label(rs[0])}
    if len(rs) > 1:
        out["refs"] = rs[1:]
    if cites:
        out["cites"] = cites
    return out


SOURCES = [
    {"id": "irenaeus-ah", "author": "Irenaeus of Lyons", "title": "Against Heresies 5.30.2 (tr. A. Roberts and W. Rambaut, Ante-Nicene Fathers vol. 1)", "year": "about AD 180 (translation 1885)", "url": "https://www.newadvent.org/fathers/0103530.htm"},
    {"id": "barnes-rev", "author": "Albert Barnes", "title": "Notes on the Bible: Revelation 7:5", "year": "1851", "url": "https://biblehub.com/commentaries/revelation/7-5.htm"},
    {"id": "pulpit-rev", "author": "Pulpit Commentary (ed. H. D. M. Spence and J. S. Exell)", "title": "Revelation 7:5", "year": "about 1890", "url": "https://biblehub.com/commentaries/revelation/7-5.htm"},
    {"id": "kd-gen49", "author": "C. F. Keil and F. Delitzsch", "title": "Biblical Commentary on the Old Testament: the Pentateuch, on Genesis 49:5–7 and 49:10", "year": "1861 (English 1864)", "url": "https://biblehub.com/commentaries/genesis/49-7.htm"},
    {"id": "ellicott-gen49", "author": "Ellicott's Commentary for English Readers (Genesis by R. Payne Smith)", "title": "Genesis 49:7 and 49:10", "year": "about 1882", "url": "https://biblehub.com/commentaries/genesis/49-10.htm"},
    {"id": "cambridge-gen49", "author": "H. E. Ryle (Cambridge Bible for Schools and Colleges)", "title": "The Book of Genesis, on 49:10", "year": "1914", "url": "https://biblehub.com/commentaries/genesis/49-10.htm"},
    {"id": "isbe-simeon", "author": "International Standard Bible Encyclopedia (ed. James Orr)", "title": "Simeon (1)", "year": "1915", "url": "https://www.internationalstandardbible.com/S/simeon-(1).html"},
    {"id": "pulpit-josh19", "author": "Pulpit Commentary (ed. H. D. M. Spence and J. S. Exell)", "title": "Joshua 19:9", "year": "about 1881", "url": "https://biblehub.com/commentaries/joshua/19-9.htm"},
    {"id": "je-flag", "author": "Cyrus Adler and Judah David Eisenstein", "title": "Flag, in The Jewish Encyclopedia vol. 5 (citing Midrash Numbers Rabbah ii.)", "year": "1903", "url": "https://www.jewishencyclopedia.com/articles/6166-flag"},
    {"id": "je-lost", "author": "Executive Committee of the Editorial Board and Joseph Jacobs", "title": "Tribes, Lost Ten, in The Jewish Encyclopedia vol. 12", "year": "1906", "url": "https://www.jewishencyclopedia.com/articles/14506-tribes-lost-ten"},
    {"id": "josephus-ant3", "author": "Flavius Josephus (tr. William Whiston)", "title": "Antiquities of the Jews 3.7.5", "year": "about AD 93 (translation 1737)", "url": "https://penelope.uchicago.edu/josephus/ant-3.html"},
    {"id": "josephus-ant11", "author": "Flavius Josephus (tr. William Whiston)", "title": "Antiquities of the Jews 11.5.2", "year": "about AD 93 (translation 1737)", "url": "https://penelope.uchicago.edu/josephus/ant-11.html"},
    {"id": "benson-jas", "author": "Joseph Benson", "title": "Commentary on the Old and New Testaments: James 1:1", "year": "1811–1818", "url": "https://biblehub.com/commentaries/james/1-1.htm"},
    {"id": "cambridge-jas", "author": "E. H. Plumptre (Cambridge Bible for Schools and Colleges)", "title": "The General Epistle of St James, on 1:1", "year": "1878", "url": "https://biblehub.com/commentaries/james/1-1.htm"},
    {"id": "pulpit-jas", "author": "Pulpit Commentary (ed. H. D. M. Spence and J. S. Exell)", "title": "James 1:1", "year": "about 1890", "url": "https://biblehub.com/commentaries/james/1-1.htm"},
    {"id": "kd-1sam", "author": "C. F. Keil and F. Delitzsch", "title": "Biblical Commentary on the Books of Samuel, on 1 Samuel 1:1", "year": "1864 (English 1866)", "url": "https://biblehub.com/commentaries/1_samuel/1-1.htm"},
    {"id": "ellicott-1sam", "author": "Ellicott's Commentary for English Readers", "title": "1 Samuel 1:1", "year": "about 1884", "url": "https://biblehub.com/commentaries/1_samuel/1-1.htm"},
    {"id": "kd-1chr7", "author": "C. F. Keil", "title": "Biblical Commentary on the Books of Chronicles, on 1 Chronicles 7:12", "year": "1870 (English 1872)", "url": "https://biblehub.com/commentaries/1_chronicles/7-12.htm"},
    {"id": "cambridge-1chr7", "author": "W. E. Barnes (Cambridge Bible for Schools and Colleges)", "title": "The Books of Chronicles, on 1 Chronicles 7:12", "year": "1899", "url": "https://biblehub.com/commentaries/1_chronicles/7-12.htm"},
    {"id": "ellicott-1chr7", "author": "Ellicott's Commentary for English Readers", "title": "1 Chronicles 7:12", "year": "about 1884", "url": "https://biblehub.com/commentaries/1_chronicles/7-12.htm"},
]

VIEWS = [
    {"id": "dan-rev7", "tribes": ["dan"], "question": "Why is Dan missing from the sealed tribes of Revelation 7?",
     "order": "in the order the views arose",
     "facts": C("Revelation 7:5–8 names twelve tribes with twelve thousand sealed from each; Dan is not among them, and neither is Ephraim, while Levi and Joseph are.", "REV 7:5-8", "text"),
     "views": [
         {"label": "The Antichrist would come from Dan", "holders": "Irenaeus (about AD 180); later Bede and Andreas, as the Pulpit Commentary reports",
          "argument": C("Irenaeus links Jeremiah's words about Dan with the coming of the Antichrist, and says this is “the reason that this tribe is not reckoned in the Apocalypse along with those which are saved”.", "JER 8:16", "early-church", ["irenaeus-ah", "pulpit-rev"])},
         {"label": "Dan was left out for its idolatry", "holders": "Hengstenberg and Wordsworth, as the Pulpit Commentary reports; Barnes (1851) records it as the view of “some”",
          "argument": C("The Danites set up a graven image with their own priesthood (Judges 18:30), and Jeroboam put one of his golden calves at Dan (1 Kings 12:29).", ["JDG 18:30", "1KI 12:29"], "scholars", ["pulpit-rev", "barnes-rev"])},
         {"label": "A copyist's slip", "holders": "Heinrich Ewald, as the Pulpit Commentary reports",
          "argument": C("Ewald proposed that John wrote “Dan” (ΔΑΝ) and that a copyist read it as “Man.”, short for Manasses, so that Manasseh displaced Dan.", "REV 7:6", "scholars", ["pulpit-rev"])},
     ]},
    {"id": "simeon-fate", "tribes": ["simeon"], "question": "What became of Simeon?", "order": "most widely held first",
     "facts": C("Simeon's cities lay “within the inheritance of the children of Judah” (Joshua 19:1, 9); the tribe has no blessing in Deuteronomy 33 and its census falls from 59,300 to 22,200 (Numbers 1:23; 26:14).", ["JOS 19:1-9", "NUM 1:23", "NUM 26:14"], "text"),
     "views": [
         {"label": "Absorbed into Judah", "holders": "International Standard Bible Encyclopedia, “Simeon (1)” (1915); Keil and Delitzsch on Genesis 49:7 (1861)",
          "argument": C("Simeon received no territory of its own, only cities inside Judah, and those cities are also listed as Judah's (Joshua 15:26–32). 1 Chronicles 4:31 says “These were their cities unto the reign of David”. ISBE writes of Simeon's dependence on Judah and its final absorption into it.", ["JOS 19:1-9", "JOS 15:26-32", "1CH 4:31"], "scholars", ["isbe-simeon", "kd-gen49"])},
         {"label": "Partly scattered, and counted with the north", "holders": "International Standard Bible Encyclopedia (1915), noting the later references; the Pulpit Commentary on Joshua 19:9, on the Simeonites at mount Seir",
          "argument": C("Some Simeonites moved to new pasture and to mount Seir in Hezekiah's days (1 Chronicles 4:41–43), and Chronicles names Simeon beside Ephraim and Manasseh, among those who came over from the northern kingdom (2 Chronicles 15:9; 34:6).", ["1CH 4:41-43", "2CH 15:9", "2CH 34:6"], "scholars", ["isbe-simeon", "pulpit-josh19"])},
     ]},
    {"id": "lost-tribes", "tribes": ["reuben", "simeon", "dan", "naphtali", "gad", "asher", "issachar", "zebulun", "ephraim", "manasseh", "joseph"],
     "question": "Were the ten northern tribes lost?", "order": "in the order the views arose",
     "facts": C("Assyria carried the northern tribes away (2 Kings 15:29; 17:6; 1 Chronicles 5:26) and “there was none left but the tribe of Judah only” (2 Kings 17:18); yet Chronicles later names people of Ephraim, Manasseh, Asher, Issachar and Zebulun at Hezekiah's passover (2 Chronicles 30:11, 18), and the New Testament speaks of “our twelve tribes” (Acts 26:7).", ["2KI 17:18", "2KI 15:29", "2KI 17:6", "1CH 5:26", "2CH 30:11", "2CH 30:18", "ACT 26:7"], "text"),
     "views": [
         {"label": "They live on, apart, beyond the Euphrates", "holders": "Josephus (about AD 93); the apocalypse 2 Esdras 13 (late first century AD), as the Jewish Encyclopedia (1906) sets out",
          "argument": C("Josephus writes that “the ten tribes are beyond Euphrates till now; and are an immense multitude”. 2 Esdras 13:40–45 tells of the ten tribes travelling a year and a half to a land called Arsareth.", "2ES 13:40-45", "tradition", ["josephus-ant11", "je-lost"])},
         {"label": "They will never return", "holders": "Rabbi Akiba (early second century AD), Mishnah Sanhedrin 10:3, as the Jewish Encyclopedia (1906) reports",
          "argument": C("Akiba held that the ten tribes would not come back.", "2KI 17:23", "tradition", ["je-lost"])},
         {"label": "Never lost: Israel still counted twelve tribes", "holders": "Joseph Benson (1811–1818), E. H. Plumptre in the Cambridge Bible (1878), the Pulpit Commentary, all on James 1:1",
          "argument": C("James writes “to the twelve tribes which are scattered abroad”, Paul speaks of “our twelve tribes”, and Anna is “of the tribe of Aser”: these commentators read the northern tribes as still present among the Jews of the first century.", ["JAS 1:1", "ACT 26:7", "LUK 2:36"], "scholars", ["benson-jas", "cambridge-jas", "pulpit-jas"])},
     ]},
    {"id": "shiloh", "tribes": ["judah"], "question": "What does “until Shiloh come” mean (Genesis 49:10)?", "order": "most widely held first among the commentaries cited",
     "facts": C("Jacob says “The sceptre shall not depart from Judah, nor a lawgiver from between his feet, until Shiloh come”.", "GEN 49:10", "scripture"),
     "views": [
         {"label": "A name of the Messiah, “the peaceful one”", "holders": "Keil and Delitzsch (1861); Ellicott's Commentary (about 1882)",
          "argument": C("Shiloh is read as a title from a Hebrew root meaning rest or peace, pointing to a coming ruler of peace from Judah.", "GEN 49:10", "scholars", ["kd-gen49", "ellicott-gen49"])},
         {"label": "“He whose it is”", "holders": "the ancient versions (the Greek Septuagint; the Aramaic Targum Onkelos, “until Messiah come, whose is the kingdom”, as Ellicott quotes it); H. E. Ryle in the Cambridge Bible (1914), who calls it the most probable reading",
          "argument": C("Read as “shelloh”, the words mean “until he come whose it is”, that is, the one to whom the sceptre belongs.", "GEN 49:10", "scholars", ["ellicott-gen49", "cambridge-gen49"])},
     ]},
    {"id": "dan-chronicles", "tribes": ["dan", "zebulun"], "question": "Why do Dan and Zebulun have no genealogy in 1 Chronicles 2–8?", "order": "in the order of the sources",
     "facts": C("The genealogies of 1 Chronicles 2–8 give every tribe except Dan and Zebulun; 1 Chronicles 7:12 ends Benjamin's list with “Hushim, the sons of Aher”, and Genesis 46:23 names Dan's only son Hushim.", ["1CH 7:12", "GEN 46:23"], "text"),
     "views": [
         {"label": "Dan is hidden in 1 Chronicles 7:12", "holders": "W. E. Barnes in the Cambridge Bible (1899)",
          "argument": C("“Aher” (“another”) may stand where Dan's name once stood, so that “Hushim” is Dan's family.", "1CH 7:12", "scholars", ["cambridge-1chr7"])},
         {"label": "No special reason for Dan", "holders": "C. F. Keil (1870); Ellicott's Commentary (about 1884)",
          "argument": C("Zebulun is left out as well, so the omissions are taken as accidents of the record, not as a judgment on Dan.", "1CH 7:12", "scholars", ["kd-1chr7", "ellicott-1chr7"])},
     ]},
]

EZEK_ORDER = ["dan", "asher", "naphtali", "manasseh", "ephraim", "reuben", "judah", "benjamin", "simeon", "issachar", "zebulun", "gad"]
EZEK_BAND_REF = {"dan": "EZK 48:1", "asher": "EZK 48:2", "naphtali": "EZK 48:3", "manasseh": "EZK 48:4", "ephraim": "EZK 48:5",
                 "reuben": "EZK 48:6", "judah": "EZK 48:7", "benjamin": "EZK 48:23", "simeon": "EZK 48:24",
                 "issachar": "EZK 48:25", "zebulun": "EZK 48:26", "gad": "EZK 48:27"}
GATES = {"reuben": ("north", 1, "EZK 48:31"), "judah": ("north", 2, "EZK 48:31"), "levi": ("north", 3, "EZK 48:31"),
         "joseph": ("east", 1, "EZK 48:32"), "benjamin": ("east", 2, "EZK 48:32"), "dan": ("east", 3, "EZK 48:32"),
         "simeon": ("south", 1, "EZK 48:33"), "issachar": ("south", 2, "EZK 48:33"), "zebulun": ("south", 3, "EZK 48:33"),
         "gad": ("west", 1, "EZK 48:34"), "asher": ("west", 2, "EZK 48:34"), "naphtali": ("west", 3, "EZK 48:34")}
REV7 = {"judah": ("REV 7:5", 1, "Juda"), "reuben": ("REV 7:5", 2, "Reuben"), "gad": ("REV 7:5", 3, "Gad"),
        "asher": ("REV 7:6", 4, "Aser"), "naphtali": ("REV 7:6", 5, "Nepthalim"), "manasseh": ("REV 7:6", 6, "Manasses"),
        "simeon": ("REV 7:7", 7, "Simeon"), "levi": ("REV 7:7", 8, "Levi"), "issachar": ("REV 7:7", 9, "Issachar"),
        "zebulun": ("REV 7:8", 10, "Zabulon"), "joseph": ("REV 7:8", 11, "Joseph"), "benjamin": ("REV 7:8", 12, "Benjamin")}

# Emblems and stones: Numbers Rabbah ii., as tabulated in the Jewish Encyclopedia, "Flag" (1903).
JE_FLAG = {"reuben": ("Sardius", "red", "a mandrake"), "simeon": ("Topaz", "green", "the city of Shechem"),
           "levi": ("Carbuncle", "white, black and red", "the Urim and Thummim"), "judah": ("Emerald", "sky-blue", "a lion"),
           "issachar": ("Sapphire", "black", "the sun and moon"), "zebulun": ("Diamond", "white", "a ship"),
           "dan": ("Ligure", "blue", "a snake"), "gad": ("Agate", "grey", "a camp"), "naphtali": ("Amethyst", "wine-coloured", "a hind"),
           "asher": ("Beryl", "pearl-coloured", "a woman and an olive tree"), "ephraim": ("Onyx", "jet-black", "a bullock"),
           "manasseh": ("Onyx", "jet-black", "a unicorn (wild ox)"), "benjamin": ("Jasper", "all the colours together", "a wolf")}
# Josephus Ant. 3.7.5: the stones in his order; names "in the order according to which they were born".
JOSEPHUS_STONES = ["sardonyx", "topaz", "emerald", "carbuncle", "jasper", "sapphire", "ligure", "amethyst", "agate",
                   "chrysolite", "onyx", "beryl"]
BIRTH_ORDER = ["reuben", "simeon", "levi", "judah", "dan", "naphtali", "gad", "asher", "issachar", "zebulun", "joseph", "benjamin"]

STORY = {
    "reuben": [
        C("Reuben lay with Bilhah, his father's concubine, “and Israel heard it”.", "GEN 35:22"),
        C("He talked his brothers out of killing Joseph, meaning to bring him back to his father.", "GEN 37:21-22"),
        C("Dathan, Abiram and On, “sons of Reuben”, joined Korah's rebellion against Moses and Aaron.", "NUM 16:1"),
        C("Reuben and Gad, rich in cattle, asked for the land east of the Jordan rather than a share in Canaan.", "NUM 32:1-5"),
        C("With Gad and half of Manasseh they built a great altar by the Jordan; the other tribes gathered at Shiloh to go to war over it, and it was named Ed, “a witness”.", ["JOS 22:10-12", "JOS 22:34"]),
        C("Deborah's song reproaches Reuben for staying “among the sheepfolds”.", "JDG 5:15-16"),
        C("Chronicles explains that Reuben's birthright passed to Joseph's sons because “he defiled his father's bed”.", "1CH 5:1-2"),
    ],
    "simeon": [
        C("Simeon and Levi, “Dinah's brethren”, came upon the city of Shechem with the sword “and slew all the males”.", "GEN 34:25"),
        C("Joseph took Simeon and “bound him before their eyes”, keeping him in Egypt until the brothers came back.", ["GEN 42:24", "GEN 42:19", "GEN 43:23"]),
        C("Zimri, “a prince of a chief house among the Simeonites”, was killed at Peor.", "NUM 25:14"),
        C("Simeon's lot fell inside Judah's, “for the part of the children of Judah was too much for them”.", "JOS 19:9"),
        C("Judah invited Simeon to fight alongside him, and they took Zephath together and called it Hormah.", ["JDG 1:3", "JDG 1:17"]),
        C("In Hezekiah's days Simeonites took new pasture, and five hundred went to mount Seir and settled there.", "1CH 4:41-43"),
    ],
    "levi": [
        C("Levi joined Simeon when they came upon Shechem “and slew all the males”.", "GEN 34:25"),
        C("When Moses asked “Who is on the LORD's side?” after the golden calf, “all the sons of Levi” came to him.", "EXO 32:26"),
        C("The Levites were taken in place of Israel's firstborn and set over the tabernacle.", ["NUM 3:12", "NUM 1:50"]),
        C("Levi received no land: the LORD was their inheritance, and they were given forty-eight cities among the other tribes.", ["NUM 18:20", "NUM 35:7", "JOS 13:33"]),
        C("When Jeroboam cast them out of the priesthood, the Levites of the north left their towns and came to Judah and Jerusalem.", "2CH 11:13-14"),
    ],
    "judah": [
        C("Judah proposed selling Joseph rather than killing him.", "GEN 37:26-27"),
        C("Judah pledged himself as surety for Benjamin, and offered to stay in Egypt as a slave in his place.", ["GEN 43:8-9", "GEN 44:33"]),
        C("After Joshua's death the LORD answered “Judah shall go up” first against the Canaanites.", "JDG 1:1-2"),
        C("The men of Judah anointed David king over the house of Judah at Hebron.", ["2SA 2:4", "2SA 2:1"]),
        C("At the division of the kingdom “there was none that followed the house of David, but the tribe of Judah only”.", "1KI 12:20"),
        C("Chronicles sums up: “Judah prevailed above his brethren, and of him came the chief ruler; but the birthright was Joseph's”.", "1CH 5:2"),
        C("After the exile “the chief of the fathers of Judah and Benjamin” rose up to rebuild the house of the LORD.", "EZR 1:5"),
    ],
    "dan": [
        C("The Amorites forced Dan into the hills and would not let it come down to the valley.", "JDG 1:34"),
        C("Deborah's song asks “why did Dan remain in ships?”", "JDG 5:17"),
        C("Samson, the son of Manoah of the Danites, judged Israel.", ["JDG 13:2", "JDG 13:24"]),
        C("Dan, whose inheritance “had not fallen unto them”, sent five men to spy out the land, then took Laish, renamed it Dan, and set up a graven image with its own priests.", ["JDG 18:1-2", "JDG 18:27-29", "JDG 18:30"]),
        C("Jeroboam put one of his two golden calves at Dan.", "1KI 12:29-30"),
        C("The whole of Israel gathered “from Dan even to Beer-sheba”, a phrase for the land from north to south.", "JDG 20:1"),
    ],
    "naphtali": [
        C("Naphtali did not drive out the people of Beth-shemesh and Beth-anath, but lived among them.", "JDG 1:33"),
        C("Barak, from Kedesh-naphtali, “called Zebulun and Naphtali to Kedesh” to fight Sisera.", ["JDG 4:6", "JDG 4:10"]),
        C("Deborah's song honours Zebulun and Naphtali, who risked their lives “in the high places of the field”.", "JDG 5:18"),
        C("Ben-hadad of Syria struck “all the land of Naphtali”.", "1KI 15:20"),
    ],
    "gad": [
        C("Gad and Reuben asked Moses for the cattle country east of the Jordan.", "NUM 32:1-5"),
        C("Gadites came over to David in the wilderness, “whose faces were like the faces of lions”.", "1CH 12:8"),
        C("Jeremiah asks why the king of Ammon now holds Gad: “why then doth their king inherit Gad”.", "JER 49:1"),
    ],
    "asher": [
        C("Asher did not drive out the people of Accho, Zidon and other towns, but lived among the Canaanites.", "JDG 1:31-32"),
        C("Deborah's song says “Asher continued on the sea shore”.", "JDG 5:17"),
        C("Under Hezekiah “divers of Asher” humbled themselves and came to Jerusalem for the passover.", "2CH 30:11"),
    ],
    "issachar": [
        C("Deborah's song says “the princes of Issachar were with Deborah”.", "JDG 5:15"),
        C("Tola, “a man of Issachar”, judged Israel.", "JDG 10:1"),
        C("Baasha, “of the house of Issachar”, killed King Nadab and took the throne of Israel.", "1KI 15:27"),
        C("Issachar's men came to David as men “that had understanding of the times”.", "1CH 12:32"),
    ],
    "zebulun": [
        C("Zebulun did not drive out Kitron and Nahalol, whose people became tributaries.", "JDG 1:30"),
        C("Deborah's song honours Zebulun and Naphtali, who “jeoparded their lives unto the death”.", "JDG 5:18"),
        C("Elon, “a Zebulonite”, judged Israel ten years.", "JDG 12:11"),
        C("When Hezekiah's runners went through Ephraim and Manasseh “even unto Zebulun” they were mocked, yet some of Zebulun came.", "2CH 30:10-11"),
    ],
    "ephraim": [
        C("Jacob crossed his hands and “set Ephraim before Manasseh”, the younger before the firstborn.", ["GEN 48:20", "GEN 48:14"]),
        C("Ephraim did not drive out the Canaanites of Gezer.", "JOS 16:10"),
        C("The men of Ephraim quarrelled with Gideon and later with Jephthah; at the fords of the Jordan, Ephraimites who said “Sibboleth” were killed.", ["JDG 8:1", "JDG 12:1", "JDG 12:6"]),
        C("Jeroboam, “an Ephrathite of Zereda”, became the first king of the northern kingdom.", "1KI 11:26"),
        C("In Isaiah and Hosea “Ephraim” stands for the northern kingdom: “Syria is confederate with Ephraim” when Pekah was king of Israel.", ["ISA 7:1-2", "HOS 5:3"], "text"),
        C("A psalm says the LORD “chose not the tribe of Ephraim: But chose the tribe of Judah”.", "PSA 78:67-68"),
    ],
    "manasseh": [
        C("The daughters of Zelophehad, of Manasseh, asked for their father's inheritance, and the LORD said they “speak right”.", ["NUM 27:1", "NUM 27:7"]),
        C("Machir and Jair, sons of Manasseh, took Gilead and its small towns, east of the Jordan.", "NUM 32:39-41"),
        C("Manasseh could not drive out Beth-shean, Taanach, Dor, Ibleam and Megiddo.", "JDG 1:27"),
        C("Gideon, whose family was “poor in Manasseh”, delivered Israel from Midian.", "JDG 6:15"),
    ],
    "benjamin": [
        C("Jacob would not at first send Benjamin to Egypt, “Lest peradventure mischief befall him”; Judah stood surety for him.", ["GEN 42:4", "GEN 43:8-9", "GEN 44:33"]),
        C("Ehud, “a Benjamite, a man lefthanded”, delivered Israel from Moab.", "JDG 3:15"),
        C("When Benjamin would not give up the men of Gibeah, the other tribes made war on it; six hundred men survived at the rock Rimmon, and Israel mourned that “one tribe” was “cut off”.", ["JDG 20:12-14", "JDG 20:47", "JDG 21:6"]),
        C("Saul, the first king, was a Benjamite: “of the smallest of the tribes of Israel”.", "1SA 9:21"),
        C("At the division Benjamin stood with Judah under Rehoboam.", "1KI 12:21"),
        C("After the exile Benjamin returned with Judah to rebuild the temple.", "EZR 1:5"),
    ],
    "joseph": [
        C("Jacob adopted Joseph's two sons as his own: “as Reuben and Simeon, they shall be mine”.", "GEN 48:5"),
        C("Chronicles says Reuben's birthright “was given unto the sons of Joseph”.", "1CH 5:1"),
        C("The children of Joseph complained that one lot was too small, and Joshua gave them the wooded hill country as well.", "JOS 17:14-18"),
    ],
}

FATE = {
    "north": [
        C("Tiglath-pileser took Gilead, Galilee and “all the land of Naphtali”, and carried them captive to Assyria.", "2KI 15:29"),
        C("He carried away “the Reubenites, and the Gadites, and the half tribe of Manasseh” to Halah, Habor, Hara and the river Gozan.", "1CH 5:26"),
        C("Samaria fell and Israel was carried away into Assyria; “there was none left but the tribe of Judah only”.", ["2KI 17:6", "2KI 17:18"]),
        C("Yet later, people of Ephraim, Manasseh, Asher, Issachar and Zebulun came to Hezekiah's passover in Jerusalem.", ["2CH 30:11", "2CH 30:18"]),
        C("Josiah's reform reached “the cities of Manasseh, and Ephraim, and Simeon, even unto Naphtali”.", "2CH 34:6"),
        C("After the exile, “children of Ephraim, and Manasseh” are listed as living in Jerusalem.", "1CH 9:3"),
    ],
    "south": [
        C("At the dedication of the rebuilt temple, twelve goats were offered “according to the number of the tribes of Israel”.", "EZR 6:17"),
    ],
}
FATE_BY_TRIBE = {
    "reuben": [1, 2], "gad": [1, 2], "manasseh": [1, 2, 3, 4, 5], "naphtali": [0, 2, 4], "ephraim": [2, 3, 4, 5],
    "asher": [2, 3], "issachar": [2, 3], "zebulun": [2, 3], "dan": [2], "simeon": [4], "joseph": [2, 3, 4, 5],
}
FATE_EXTRA = {
    "judah": [C("Judah was carried away to Babylon; after the exile “the chief of the fathers of Judah and Benjamin” returned.", ["2KI 25:21", "EZR 1:5"])],
    "benjamin": [C("After the exile “the chief of the fathers of Judah and Benjamin” rose up together to rebuild the temple.", ["EZR 1:5"])],
    "levi": [C("The priests and the Levites returned with Judah and Benjamin.", "EZR 1:5"),
             C("The Levites of the north had already moved to Judah in Rehoboam's time.", "2CH 11:13-14")],
    "simeon": [C("Some Simeonites, five hundred men, settled at mount Seir and “dwelt there unto this day”.", "1CH 4:42-43")],
    "dan": [C("Jonathan and his sons were priests to the tribe of Dan “until the day of the captivity of the land”.", "JDG 18:30")],
}

NT = {
    "judah": [C("“our Lord sprang out of Juda”.", "HEB 7:14"), C("Jesus is called “the Lion of the tribe of Juda”.", "REV 5:5")],
    "benjamin": [C("Paul was “of the tribe of Benjamin”.", ["ROM 11:1", "PHP 3:5"]), C("Paul recalls Saul, “a man of the tribe of Benjamin”.", "ACT 13:21")],
    "asher": [C("Anna the prophetess was “of the tribe of Aser”.", "LUK 2:36")],
    "levi": [C("Barnabas was “a Levite, and of the country of Cyprus”.", "ACT 4:36"),
             C("Zacharias was a priest and Elisabeth “of the daughters of Aaron”.", "LUK 1:5"),
             C("Hebrews contrasts Levi's priesthood with one from Judah, “of which tribe Moses spake nothing concerning priesthood”.", "HEB 7:14", "scripture")],
    "zebulun": [C("Jesus lived at Capernaum “in the borders of Zabulon and Nephthalim”, fulfilling Isaiah.", ["MAT 4:13-15", "ISA 9:1"])],
    "naphtali": [C("Jesus lived at Capernaum “in the borders of Zabulon and Nephthalim”, fulfilling Isaiah.", ["MAT 4:13-15", "ISA 9:1"])],
}
NT_ALL = [C("Paul speaks of “our twelve tribes, instantly serving God day and night”.", "ACT 26:7"),
          C("James writes “to the twelve tribes which are scattered abroad”.", "JAS 1:1"),
          C("The new Jerusalem has twelve gates with “the names of the twelve tribes of the children of Israel”.", "REV 21:12")]


def ezekiel(t):
    out = {"band": None, "gate": None, "span": ref("EZK 48:1-35"), "ref": label(ref("EZK 48:1-35"))}
    if t in EZEK_BAND_REF:
        i = EZEK_ORDER.index(t)
        out["band"] = {"position": i + 1, "of": 12, "fromNorth": True,
                       "side": "north of the holy portion" if i < 7 else "south of the holy portion",
                       "span": ref(EZEK_BAND_REF[t]), "ref": label(ref(EZEK_BAND_REF[t]))}
        out["span"] = ref(EZEK_BAND_REF[t])
        out["ref"] = label(out["span"])
    if t in GATES:
        side, pos, r = GATES[t]
        out["gate"] = {"side": side, "position": pos, "span": ref(r), "ref": label(ref(r))}
    notes = {"levi": "Levi has no band: the Levites' land lies within the holy portion (48:13). Levi has a gate on the north (48:31).",
             "joseph": "Joseph has two bands, Manasseh's and Ephraim's (48:4–5; “Joseph shall have two portions”, 47:13), and one gate, on the east (48:32).",
             "ephraim": "Ephraim has a band (48:5) but no gate: the gate is Joseph's (48:32).",
             "manasseh": "Manasseh has a band (48:4) but no gate: the gate is Joseph's (48:32).",
             "dan": "Dan's band is the first, at the far north (48:1), and Dan has a gate on the east (48:32), though Dan is missing from Revelation 7.",
             "judah": "Judah's band lies directly north of the holy portion, Benjamin's directly south (48:7–8, 22–23)."}
    if t in notes:
        out["note"] = notes[t]
    if t == "levi":
        out["levites"] = {"span": ref("EZK 48:13"), "ref": label(ref("EZK 48:13"))}
    if t == "joseph":
        out["twoPortions"] = {"text": "Joseph shall have two portions.", "span": ref("EZK 47:13"), "ref": label(ref("EZK 47:13"))}
    return out


def revelation7(t):
    if t in REV7:
        r, pos, as_named = REV7[t]
        return {"n": 12000, "span": ref(r), "ref": label(ref(r)), "position": pos, "asNamed": as_named}
    note = {"dan": "Dan is not named among the sealed tribes (Revelation 7:5–8). See the view “Why is Dan missing”.",
            "ephraim": "Ephraim is not named; Joseph is (7:8), and Manasseh (7:6)."}[t]
    return {"n": None, "span": ref("REV 7:5-8"), "ref": label(ref("REV 7:5-8")), "note": note}


def tradition(t):
    out = []
    if t in JE_FLAG:
        stone, colour, emblem = JE_FLAG[t]
        out.append({"kind": "emblem", "text": f"A {colour} banner bearing {emblem}, matched to the {stone.lower()} of the high priest's breastplate.",
                    "emblem": emblem, "colour": colour, "stone": stone,
                    "who": "Midrash Numbers Rabbah ii., as tabulated in the Jewish Encyclopedia, “Flag” (Cyrus Adler and J. D. Eisenstein)",
                    "when": "a rabbinic midrash compiled in the Middle Ages; reported 1903",
                    "layer": "tradition", "cites": ["je-flag"]})
    if t == "joseph":
        out.append({"kind": "emblem", "text": "The midrash gives Joseph's two tribes separate emblems: a bullock for Ephraim and a unicorn (wild ox) for Manasseh, both on jet-black, with the onyx.",
                    "who": "Midrash Numbers Rabbah ii., as tabulated in the Jewish Encyclopedia, “Flag”", "when": "medieval midrash; reported 1903",
                    "layer": "tradition", "cites": ["je-flag"]})
    if t == "judah":
        out.append({"kind": "emblem", "text": "Judah's flag bore a roaring lion with the words of Numbers 10:35, “Rise up, LORD, and let thine enemies be scattered”.",
                    "who": "the Targum Yerushalmi, as reported in the Jewish Encyclopedia, “Flag”", "when": "an Aramaic paraphrase of late antiquity or later; reported 1903",
                    "layer": "tradition", "cites": ["je-flag"]})
    if t in BIRTH_ORDER:
        stone = JOSEPHUS_STONES[BIRTH_ORDER.index(t)]
        out.append({"kind": "breastplate", "text": f"Josephus says the twelve names were cut on the breastplate stones “in the order according to which they were born”. Applying that rule to the birth order of Genesis 29–35 (our own step) gives {stone} for {t.capitalize()}.",
                    "stone": stone, "who": "Josephus, Antiquities 3.7.5 (rule); the stone is our own application of it", "when": "about AD 93",
                    "layer": "tradition", "cites": ["josephus-ant3"]})
    return out


def for_tribe(t):
    fate = [FATE["north"][i] for i in FATE_BY_TRIBE.get(t, [])] + FATE_EXTRA.get(t, [])
    if t in ("judah", "benjamin", "levi"):
        fate += FATE["south"]
    return {"story": STORY.get(t, []), "fate": fate, "nt": NT.get(t, []), "ezekiel": ezekiel(t),
            "revelation7": revelation7(t), "tradition": tradition(t),
            "views": [v["id"] for v in VIEWS if t in v["tribes"]]}


def kingdom():
    return {
        "span": ref("1KI 11:29-12:24"), "ref": label(ref("1KI 11:29-12:24")),
        "north": ["reuben", "gad", "manasseh", "ephraim", "issachar", "zebulun", "asher", "naphtali", "dan"],
        "south": ["judah", "benjamin"],
        "unclear": ["simeon", "levi"],
        "northNote": "Our inference: the text gives the north “ten tribes” but never lists them by name. Simeon lived inside Judah (Joshua 19:1) yet is later named with Ephraim and Manasseh (2 Chronicles 15:9); the Levites of the north moved south (2 Chronicles 11:13–14).",
        "claims": [
            C("Ahijah tore his new garment into twelve pieces and told Jeroboam to take ten: “I will … give ten tribes to thee”.", ["1KI 11:30-31"]),
            C("Solomon's son was to keep “one tribe for my servant David's sake, and for Jerusalem's sake”.", ["1KI 11:32", "1KI 11:36"]),
            C("When Israel made Jeroboam king, “there was none that followed the house of David, but the tribe of Judah only”.", "1KI 12:20"),
            C("Yet the next verse has Rehoboam gather “all the house of Judah, with the tribe of Benjamin”, and Chronicles says he had “Judah and Benjamin on his side”.", ["1KI 12:21", "2CH 11:12"]),
            C("So the text counts ten and one, then names two in the south. Ten and one make eleven of twelve: how Benjamin, Simeon and Levi fit the count is not stated (our own observation).", ["1KI 11:31-32", "1KI 12:21"], "text"),
            C("The priests and Levites throughout Israel came over to Rehoboam, and after them people “out of all the tribes of Israel” who sought the LORD.", "2CH 11:13-16"),
            C("Ezekiel is told to join “the stick of Joseph, which is in the hand of Ephraim” with “the stick of Judah” into one.", "EZK 37:19"),
        ],
    }


def top_level():
    return {"kingdom": kingdom(), "views": VIEWS, "sources": SOURCES, "ntAll": NT_ALL,
            "traditionNotes": [
                C("Exodus says the breastplate stones bore the names of the children of Israel, “according to the twelve tribes”, but does not say which name went on which stone.", ["EXO 28:21", "EXO 28:17-20"], "text"),
                {"text": "Josephus lists the stones in four rows of three: sardonyx, topaz, emerald; carbuncle, jasper, sapphire; ligure, amethyst, agate; chrysolite, onyx, beryl. His order and his names for the stones differ from the KJV of Exodus 28:17–20.",
                 "layer": "tradition", "cites": ["josephus-ant3"], "who": "Josephus, Antiquities 3.7.5", "when": "about AD 93"},
                {"text": "The midrash on Numbers 2:2 (“every man … by his own standard, with the ensign of their father's house”) gives each tribe a colour and an emblem matched to a breastplate stone. Its stone order follows Exodus 28:17–20 with the tribes in the order Reuben, Simeon, Levi, Judah, Issachar, Zebulun, Dan, Gad, Naphtali, Asher, Joseph, Benjamin.",
                 "layer": "tradition", "cites": ["je-flag"], "who": "Midrash Numbers Rabbah ii., as given in the Jewish Encyclopedia, “Flag”", "when": "medieval midrash; reported 1903"},
            ]}
