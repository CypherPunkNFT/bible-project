"""Reference tables for build-data.py: the 66 books, the holders' cities, and the editorial date ranges.

Everything here is either a standard reference fact (book order and chapter counts, the city a library is in) or an
editorial range that the page labels as such. No manuscript fact is invented here.
"""

# The 66 books, Protestant order: (code, name, chapters, site section colour).
BOOKS = [
    ("GEN", "Genesis", 50, "history"), ("EXO", "Exodus", 40, "history"), ("LEV", "Leviticus", 27, "history"),
    ("NUM", "Numbers", 36, "history"), ("DEU", "Deuteronomy", 34, "history"), ("JOS", "Joshua", 24, "history"),
    ("JDG", "Judges", 21, "history"), ("RUT", "Ruth", 4, "history"), ("1SA", "1 Samuel", 31, "history"),
    ("2SA", "2 Samuel", 24, "history"), ("1KI", "1 Kings", 22, "history"), ("2KI", "2 Kings", 25, "history"),
    ("1CH", "1 Chronicles", 29, "history"), ("2CH", "2 Chronicles", 36, "history"), ("EZR", "Ezra", 10, "history"),
    ("NEH", "Nehemiah", 13, "history"), ("EST", "Esther", 10, "history"), ("JOB", "Job", 42, "poetry"),
    ("PSA", "Psalms", 150, "poetry"), ("PRO", "Proverbs", 31, "poetry"), ("ECC", "Ecclesiastes", 12, "poetry"),
    ("SNG", "Song of Songs", 8, "poetry"), ("ISA", "Isaiah", 66, "prophets"), ("JER", "Jeremiah", 52, "prophets"),
    ("LAM", "Lamentations", 5, "prophets"), ("EZK", "Ezekiel", 48, "prophets"), ("DAN", "Daniel", 12, "prophets"),
    ("HOS", "Hosea", 14, "prophets"), ("JOL", "Joel", 3, "prophets"), ("AMO", "Amos", 9, "prophets"),
    ("OBA", "Obadiah", 1, "prophets"), ("JON", "Jonah", 4, "prophets"), ("MIC", "Micah", 7, "prophets"),
    ("NAM", "Nahum", 3, "prophets"), ("HAB", "Habakkuk", 3, "prophets"), ("ZEP", "Zephaniah", 3, "prophets"),
    ("HAG", "Haggai", 2, "prophets"), ("ZEC", "Zechariah", 14, "prophets"), ("MAL", "Malachi", 4, "prophets"),
    ("MAT", "Matthew", 28, "gospels"), ("MRK", "Mark", 16, "gospels"), ("LUK", "Luke", 24, "gospels"),
    ("JHN", "John", 21, "gospels"), ("ACT", "Acts", 28, "gospels"), ("ROM", "Romans", 16, "epistles"),
    ("1CO", "1 Corinthians", 16, "epistles"), ("2CO", "2 Corinthians", 13, "epistles"), ("GAL", "Galatians", 6, "epistles"),
    ("EPH", "Ephesians", 6, "epistles"), ("PHP", "Philippians", 4, "epistles"), ("COL", "Colossians", 4, "epistles"),
    ("1TH", "1 Thessalonians", 5, "epistles"), ("2TH", "2 Thessalonians", 3, "epistles"), ("1TI", "1 Timothy", 6, "epistles"),
    ("2TI", "2 Timothy", 4, "epistles"), ("TIT", "Titus", 3, "epistles"), ("PHM", "Philemon", 1, "epistles"),
    ("HEB", "Hebrews", 13, "epistles"), ("JAS", "James", 5, "epistles"), ("1PE", "1 Peter", 5, "epistles"),
    ("2PE", "2 Peter", 3, "epistles"), ("1JN", "1 John", 5, "epistles"), ("2JN", "2 John", 1, "epistles"),
    ("3JN", "3 John", 1, "epistles"), ("JUD", "Jude", 1, "epistles"), ("REV", "Revelation", 22, "revelation"),
]
CODE_INDEX = {code: i for i, (code, *_rest) in enumerate(BOOKS)}

# ETCBC Dead Sea Scrolls book abbreviations -> book code.
ETCBC_BOOK = {
    "Gen": "GEN", "Exod": "EXO", "Lev": "LEV", "Num": "NUM", "Deut": "DEU", "Josh": "JOS", "Judg": "JDG", "Ruth": "RUT",
    "1Sam": "1SA", "2Sam": "2SA", "1Kgs": "1KI", "2Kgs": "2KI", "1Chr": "1CH", "2Chr": "2CH", "Ezra": "EZR", "Neh": "NEH",
    "Esth": "EST", "Job": "JOB", "Ps": "PSA", "Prov": "PRO", "Eccl": "ECC", "Song": "SNG", "Isa": "ISA", "Jer": "JER",
    "Lam": "LAM", "Ezek": "EZK", "Dan": "DAN", "Hos": "HOS", "Joel": "JOL", "Amos": "AMO", "Obad": "OBA", "Jonah": "JON",
    "Mic": "MIC", "Nah": "NAM", "Hab": "HAB", "Zeph": "ZEP", "Hag": "HAG", "Zech": "ZEC", "Mal": "MAL",
}

GOSPELS = ["MAT", "MRK", "LUK", "JHN"]
PAUL = ["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB"]
CATHOLIC = ["JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD"]
NT = GOSPELS + ["ACT"] + PAUL + CATHOLIC + ["REV"]
OT = [code for code, *_rest in BOOKS[:39]]

# When each New Testament book was written: approximate ranges, wide enough to hold the main scholarly positions.
# The page labels these as approximate and editorial; they are not manuscript data.
WRITTEN = {
    "MAT": (70, 90), "MRK": (60, 75), "LUK": (70, 90), "JHN": (90, 110), "ACT": (70, 90), "ROM": (55, 58),
    "1CO": (53, 55), "2CO": (55, 57), "GAL": (48, 55), "EPH": (60, 90), "PHP": (54, 62), "COL": (57, 80),
    "1TH": (49, 51), "2TH": (50, 90), "1TI": (62, 110), "2TI": (62, 110), "TIT": (62, 110), "PHM": (54, 62),
    "HEB": (60, 95), "JAS": (45, 100), "1PE": (60, 95), "2PE": (65, 150), "1JN": (90, 110), "2JN": (90, 110),
    "3JN": (90, 110), "JUD": (50, 110), "REV": (68, 96),
}

# Holders: (id, display name, city, country, lat, lon, [lower-case substrings that identify it]).
# A record whose holder text names several of these (a manuscript split between libraries) counts at each.
HOLDERS = [
    ("bnf", "Bibliothèque nationale de France", "Paris", "France", 48.857, 2.352, ["bibliothèque nationale de france", "national library of france", "french national library", "bnf"]),
    ("vat", "Vatican Library", "Vatican City", "Vatican City", 41.904, 12.453, ["vatican"]),
    ("bl", "British Library", "London", "United Kingdom", 51.53, -0.127, ["british library", "harley manuscripts"]),
    ("lambeth", "Lambeth Palace Library", "London", "United Kingdom", 51.53, -0.127, ["lambeth palace"]),
    ("bod", "Bodleian Libraries", "Oxford", "United Kingdom", 51.754, -1.254, ["bodleian", "sackler", "papyrology rooms"]),
    ("oxcol", "Oxford colleges", "Oxford", "United Kingdom", 51.754, -1.254, ["christ church", "lincoln college", "new college", "magdalen college"]),
    ("cul", "Cambridge University Library", "Cambridge", "United Kingdom", 52.205, 0.119, ["cambridge university library"]),
    ("cacol", "Cambridge colleges", "Cambridge", "United Kingdom", 52.205, 0.119, ["trinity college, cambridge", "christ's college", "corpus christi college, cambridge", "gonville and caius", "emmanuel college", "westminster college, cambridge"]),
    ("glasgow", "Glasgow University Library", "Glasgow", "United Kingdom", 55.872, -4.289, ["glasgow university"]),
    ("bham", "University of Birmingham", "Birmingham", "United Kingdom", 52.45, -1.93, ["university of birmingham"]),
    ("rylands", "John Rylands Library", "Manchester", "United Kingdom", 53.48, -2.248, ["rylands"]),
    ("edin", "Edinburgh University Library", "Edinburgh", "United Kingdom", 55.947, -3.187, ["edinburgh university"]),
    ("cbl", "Chester Beatty Library", "Dublin", "Ireland", 53.344, -6.267, ["chester beatty"]),
    ("tcd", "Trinity College Dublin", "Dublin", "Ireland", 53.344, -6.254, ["trinity college dublin", "trinity college, dublin"]),
    ("onb", "Austrian National Library", "Vienna", "Austria", 48.206, 16.367, ["austrian national library"]),
    ("nlg", "National Library of Greece", "Athens", "Greece", 37.98, 23.73, ["national library of greece"]),
    ("parl", "Library of the Hellenic Parliament", "Athens", "Greece", 37.98, 23.73, ["hellenic parliament"]),
    ("athos", "Monasteries of Mount Athos", "Mount Athos", "Greece", 40.157, 24.326, ["dionysiou", "great lavra", "vatopedi", "iviron", "pantokratoros", "panteleimon", "esphigmenou", "osiou gregoriou", "mount athos"]),
    ("patmos", "Monastery of St John the Theologian", "Patmos", "Greece", 37.31, 26.548, ["john the theologian"]),
    ("marc", "Biblioteca Marciana", "Venice", "Italy", 45.434, 12.339, ["marciana", "marcian library"]),
    ("ambr", "Biblioteca Ambrosiana", "Milan", "Italy", 45.464, 9.186, ["ambrosiana"]),
    ("laur", "Biblioteca Medicea Laurenziana", "Florence", "Italy", 43.775, 11.255, ["laurentian", "laurenziana", "laurentiana", "medici library"]),
    ("vitelli", "Istituto Papirologico G. Vitelli", "Florence", "Italy", 43.775, 11.255, ["vitelli", "papyrological institute, florence"]),
    ("naples", "Biblioteca Nazionale di Napoli", "Naples", "Italy", 40.852, 14.268, ["vittorio emanuele iii"]),
    ("rome", "Libraries of Rome", "Rome", "Italy", 41.9, 12.48, ["vallicelliana", "biblioteca angelica", "casanatense", "lincei e corsiniana"]),
    ("grotta", "Grottaferrata Abbey Library", "Grottaferrata", "Italy", 41.79, 12.67, ["biblioteca della badia", "grottaferrata"]),
    ("turin", "National University Library of Turin", "Turin", "Italy", 45.07, 7.686, ["turin"]),
    ("modena", "Biblioteca Estense", "Modena", "Italy", 44.647, 10.925, ["estense"]),
    ("parma", "Biblioteca Palatina", "Parma", "Italy", 44.80, 10.33, ["palatina, parma", "palatina di parma", "biblioteca palatina"]),
    ("escorial", "Library of El Escorial", "San Lorenzo de El Escorial", "Spain", 40.589, -4.147, ["escurial", "escorial"]),
    ("madrid", "Biblioteca Nacional de España", "Madrid", "Spain", 40.424, -3.69, ["biblioteca nacional de españa"]),
    ("rnl", "National Library of Russia", "St Petersburg", "Russia", 59.934, 30.335, ["russian national library", "national library of russia"]),
    ("shm", "State Historical Museum", "Moscow", "Russia", 55.755, 37.618, ["state historical museum"]),
    ("bsb", "Bavarian State Library", "Munich", "Germany", 48.147, 11.58, ["bavarian state library"]),
    ("lmu", "University Library of LMU Munich", "Munich", "Germany", 48.15, 11.58, ["lmu munich"]),
    ("berlin", "Berlin State Museums and Library", "Berlin", "Germany", 52.52, 13.40, ["berlin state", "staatliche museen zu berlin", "berlin papyrus", "staatsbibliothek zu berlin"]),
    ("muenster", "Bible Museum Münster", "Münster", "Germany", 51.962, 7.626, ["bible museum münster"]),
    ("dresden", "Saxon State Library", "Dresden", "Germany", 51.05, 13.74, ["saxon state library"]),
    ("cologne", "University of Cologne", "Cologne", "Germany", 50.938, 6.96, ["university of cologne"]),
    ("wolf", "Herzog August Library", "Wolfenbüttel", "Germany", 52.16, 10.53, ["herzog august"]),
    ("leiden", "Leiden University Library", "Leiden", "Netherlands", 52.157, 4.485, ["leiden university"]),
    ("copen", "Royal Danish Library", "Copenhagen", "Denmark", 55.673, 12.583, ["det kongelige bibliotek"]),
    ("uppsala", "Uppsala University Library", "Uppsala", "Sweden", 59.858, 17.639, ["uppsala"]),
    ("krakow", "Jagiellonian Library", "Kraków", "Poland", 50.06, 19.94, ["jagiellon"]),
    ("geneva", "Bodmer Foundation", "Cologny, Geneva", "Switzerland", 46.217, 6.18, ["bodmer"]),
    ("strasb", "National and University Library", "Strasbourg", "France", 48.58, 7.75, ["bibliothèque nationale et universitaire"]),
    ("sinai", "Saint Catherine's Monastery", "Sinai", "Egypt", 28.556, 33.976, ["saint catherine", "st catherine", "sinai"]),
    ("cairo", "Museums of Cairo", "Cairo", "Egypt", 30.05, 31.23, ["coptic museum", "egyptian museum"]),
    ("damascus", "Qubbat al-Khazna, Damascus", "Damascus", "Syria", 33.511, 36.306, ["qubbat al-khazna", "national museum of damascus"]),
    ("jerus", "Jerusalem libraries", "Jerusalem", "Israel", 31.77, 35.21, ["yad yitzhak ben-zvi", "patriarchate of jerusalem", "jerusalem"]),
    ("tbilisi", "National Centre of Manuscripts", "Tbilisi", "Georgia", 41.715, 44.79, ["georgian national cent"]),
    ("yerevan", "Matenadaran", "Yerevan", "Armenia", 40.192, 44.521, ["matenadaran"]),
    ("michigan", "University of Michigan", "Ann Arbor", "United States", 42.28, -83.74, ["university of michigan", "ann arbor"]),
    ("duke", "Duke University", "Durham, North Carolina", "United States", 36.0, -78.94, ["duke university", "kenneth willis clark"]),
    ("princeton", "Princeton", "Princeton", "United States", 40.35, -74.66, ["princeton"]),
    ("harvard", "Harvard University", "Cambridge, Massachusetts", "United States", 42.374, -71.117, ["houghton", "harvard"]),
    ("yale", "Yale University", "New Haven", "United States", 41.31, -72.92, ["yale", "beinecke"]),
    ("nyc", "Libraries and museums of New York", "New York", "United States", 40.749, -73.981, ["morgan library", "pierpont morgan", "new york public library", "metropolitan museum"]),
    ("dc", "Museums of Washington", "Washington, D.C.", "United States", 38.885, -77.017, ["freer", "museum of the bible", "smithsonian", "dumbarton oaks"]),
    ("chicago", "University of Chicago", "Chicago", "United States", 41.79, -87.6, ["university of chicago"]),
]

# Records that are not manuscripts of the Bible, or whose identity is in doubt, are left out, each with its reason.
EXCLUDED = {
    "Q1070692": "a collection of papyri (the Chester Beatty Papyri), not one manuscript; its papyri appear on their own",
    "Q664820": "a collection of papyri (the Bodmer Papyri), not one manuscript; its papyri appear on their own",
    "Q222999": "the Nag Hammadi library: a collection, and not a Bible manuscript",
    "Q1106321": "Codex Tchacos holds the Gospel of Judas and other non-biblical texts, not a book of the Bible",
    "Q16934110": "the Severus Scroll is lost; it is known only from later reports of its readings",
    "Q390477": "the corpus could not confirm which Codex Ambrosianus this item is (its type check failed)",
}
