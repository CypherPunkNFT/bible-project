# Builds data.js and the image assets for the "Old maps" mock-ups from the historical-maps research corpus.
#
#   python design/old-maps-directions/build-data.py            (from Website/)
#
# Reads Research/HistoricalMaps/normalized/catalogue.json (one row per map) and the per-source records beside it
# (record_kind, licence detail, credit lines). Re-tags every map's biblical subject from its own TITLE with
# word-level rules, because the corpus tags are keyword hits over titles, descriptions and publisher lines and
# over-count badly (see README.md, "Data problems"). Every number the pages show is computed here.
from __future__ import annotations

import base64
import io
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
Image.MAX_IMAGE_PIXELS = 900_000_000  # the largest held scan is ~797 MP; JPEG draft / JP2 reduce keep decoding small

HERE = Path(__file__).resolve().parent
WEBSITE = HERE.parents[1]
CORPUS = WEBSITE.parent / "Research" / "HistoricalMaps"
ASSETS = HERE / "assets"
THUMB_SIDE, THUMB_Q = 340, 68
FULL_SIDE, FULL_Q = 1600, 64
MAX_PLAIN_MP = 160  # PNG/TIFF have no reduced decode; larger ones are skipped rather than loaded whole

SOURCES = ["wikimedia-commons", "internet-archive", "loc-gm", "nypl"]
RUMSEY = "David Rumsey Map Collection, David Rumsey Map Center, Stanford Libraries"

# Subjects: key, label, short label, colour token, title rule (case-insensitive regex), catalogue tag it corresponds to.
SUBJECTS = [
    ("holy-land", "The Holy Land", "Holy Land", "--poetry",
     r"palest|outremer|holy land|terra sancta|terrae? sanct|terre sainte|heilige[n]? land|heylige|canaan|chanaan|promised land|promission|land of israel|judaea|judea|iudaea|iudæa|ivdaea|palästina|palaestina|gelobte", "holy-land"),
    ("jerusalem", "Jerusalem", "Jerusalem", "--history",
     r"jerusalem|ierusalem|hierosolym|j[ée]rusalem|jerusal[ée]n|hierusalem|jeruzalem|mount zion|mons sion", "jerusalem-plan"),
    ("exodus", "The Exodus & the wilderness", "Exodus", "--epistles",
     r"exodus|wandering|wilderness|w[uü]e?ste|desert|deserto|stationum|passage of the red sea|zug der israel|route des israel|journey\w* of the (children|israel)|travels and marches|reise der kinder|viaggio degl|voyage des israel|voiage des israel|viaje de los israel|peregrinatio israel", "exodus-route"),
    ("tribes", "The twelve tribes", "Tribes", "--prophets",
     r"tribes|tribus|tribuum|tribubus|stämme|stamme|allotment", "tribal-allotments"),
    ("jesus", "The life of Jesus", "Jesus", "--gospels",
     r"\bchrist\b|\bchristi\b|jesus|\bjesu\b|\biesu\b|gospel|evangel|galilee|galilaea|galiläa|galil[ée]e|nazareth|our lord|saviour|savior|salvatoris|seigneur", "jesus-ministry"),
    ("paul", "Paul & the apostles", "Paul", "--acts",
     r"(paul|pauli|pavli|apost)", "pauls-journeys"),
    ("churches", "Asia Minor & the seven churches", "Asia Minor", "--revelation",
     r"asia minor|asiae minoris|\bnatolia|seven churches|sept [ée]glises|ephes|smyrna|pergam|thyatir|sardis|laodic|klein.?asien|asie mineure", "asia-minor-churches"),
    ("egypt", "Egypt & the Nile", "Egypt", "--epistles",
     r"egypt|aegypt|ägypt|[ée]gypte|egipt|\bnile\b|nilus|goshen", "egypt"),
    ("near-east", "Assyria, Babylon & Persia", "Near East", "--prophets",
     r"assyri|babylon|chalde|mesopotam|ninive|nineveh|persia|euphrat|shinar", "ancient-near-east"),
    ("eden", "Eden, the Flood & the nations", "Eden", "--poetry",
     r"\beden\b|paradis|paradeis|ararat|\bnoah|\bnoe\b|deluge|diluv|\bflood\b|babel|dispersion|sons of noah", "paradise-eden"),
    ("temple", "The Temple & the Tabernacle", "Temple", "--revelation",
     r"temple|templum|tempel|tabernac|haram", "temple"),
]
# Paul's maps must also name travel or mission; the bare word catches Minneapolis-St Paul, harbours and railways.
PAUL_TRAVEL = r"peregrin|travel|voyage|voiage|journey|reise|mission|preach|prêch|prech|typus"
OFF_TOPIC = r"railway|railroad|kamtschatka|klondike|minneapolis|minnesota|chicago|tobacco|galapagos|arrondissement|harbor of st|de leon|morlaix"
MODERN_DIAGRAM = r"biblica open bible|exodus map|korean revised|jbs1956"
NOT_A_SHEET = r"^\((?!composite)|statistical diagram|^sect\. [ivx]+\.|title page|covers to|index map|text page"

# The Holy Land through time (direction C): picked by hand from the corpus for spread and legibility; each id must
# exist, be held and be publishable, or the build stops.
SEQUENCE = [
    "commons-:Tournai map of Palestine and Syria",
    "commons-:Oxford Outremer Map of Matthew Paris",
    "commons-:Ca. 1320 map of the Holy Land by Pietro Vesconte",
    "loc-:Palestine",
    "commons-:1537 Mercator map of Palestine",
    "loc-:Terra sancta sive promissionis, olim Palestina recens delineata",
    "loc-:Ivdaea sev Palaestina ob sacratissima Redemtoris vestigia",
    "ia-:(Composite). Map of Western Palestine from Surveys",
]
# Extra showpieces (full-size in the viewer), by title prefix within a source.
SHOWPIECES = [
    "commons-:Arculf De Locis Sanctis Jerusalem",
    "loc-:Geographic Description of the Travels of the Apostles",
    "loc-:Ierusalem, cum suburbiis, prout tempore Christi floruit",
    "nypl-:A new map shewing the travels of the patriarchs",
]

LEVANT = (33.9, 30.6, 36.6, 33.75)  # west, south, east, north: the frame of the modern outline in direction C
# Seas named in Scripture, labelled (not drawn) at the points OpenBible gives them.
MODERN_WATERS = [("Great Sea", "Great Sea"), ("Sea of Galilee", "Sea of Galilee"), ("Salt Sea", "Salt Sea")]
MODERN_PLACES = ["Jerusalem", "Jericho", "Hebron", "Gaza", "Joppa", "Samaria", "Nazareth",
                 "Tyre", "Sidon", "Damascus", "Beersheba", "Dan"]

# "One land, different maps" (merged view D, owner 2026-10-19): the Holy Land set above plus three more, each eight
# dated sheets spread across the centuries and the same ground today. Places are OpenBible names, shown as
# (name, label); "key" is the one drawn larger; "left" puts a label on the west side (the sea side, or to avoid a clash).
# Jerusalem has no coast at this scale, so its ground is drawn by its named features alone (the gates share the city's
# own point in OpenBible and are left out).
LANDS = [
    {"key": "holy-land", "label": "The Holy Land", "frame": LEVANT, "specs": SEQUENCE, "key_place": "Jerusalem",
     "places": [(n, n) for n in MODERN_PLACES], "waters": MODERN_WATERS,
     "left": ["Sidon", "Tyre", "Joppa", "Gaza", "Bethlehem", "Hebron", "Beersheba"]},
    {"key": "jerusalem", "label": "Jerusalem", "frame": (35.2160, 31.7655, 35.2560, 31.7835), "key_place": "Mount Moriah",
     "specs": ["commons-arculf-de-locis-sanctis-jerusalem",
               "ia-dr-jerusalem-15058224", "loc-2010587005",
               "commons-a-plan-of-jerusalem-and-the-adja:A Plan of Jerusalem and the Adjacent Country - Pococke",
               "nypl-f5091a50-c6bd-012f-854e-58d385a7bc34", "loc-2009579461", "nypl-f34942e0-c6ef-012f-e366-58d385a7bc3",
               "commons-jerusalem-mkl-bd-9-1890"],
     "places": [("Mount Moriah", "Temple Mount"), ("City of David", "City of David"), ("Mount Zion", "Mount Zion"),
                ("Mount of Olives", "Mount of Olives"), ("Siloam", "Pool of Siloam"),
                ("Valley of Hinnom", "Valley of Hinnom"), ("Golgotha", "Golgotha"), ("Gethsemane", "Gethsemane"),
                ("Bethesda", "Pool of Bethesda")],
     "waters": [], "left": ["Mount Zion", "Golgotha", "Valley of Hinnom"]},
    {"key": "egypt", "label": "Egypt & Sinai", "frame": (28.3, 25.0, 36.3, 32.6), "key_place": "Mount Sinai",
     "specs": ["commons-aegyptus-abraham-ortelius", "commons-aegyptus-antiqua-divisa-in-nomos-authore-p-duval",
               "commons-carte-de-l-egypte-ancienne-et-moderne", "loc-99446219", "ia-dr-lower-egypt-and-the-adjacent-deserts",
               "commons-alexandre-delamarche-carte-de-l-egypte", "ia-dr-sinai-and-the-desert-of-the-wanderings",
               "nypl-a181bf80-c5f3-012f-40ee-58d385a7bc34"],
     "places": [("Alexandria", "Alexandria"), ("Zoan", "Zoan"), ("Rameses", "Rameses"), ("Heliopolis", "On (Heliopolis)"),
                ("Memphis", "Memphis"), ("Thebes", "Thebes"), ("Mount Sinai", "Mount Sinai"), ("Kadesh-barnea", "Kadesh-barnea"),
                ("Gaza", "Gaza"), ("Elim", "Elim")],
     "waters": [("Red Sea", "Red Sea")], "left": ["Memphis", "Thebes", "Heliopolis"]},
    {"key": "asia-minor", "label": "Asia Minor", "frame": (24.0, 35.0, 37.9, 42.3), "key_place": "Ephesus",
     "specs": ["commons-fotothek-df-tg-0005110", "commons-natoliae-quae-olim-asia-minor-nova-descriptio-jpg", "ia-dr-natoliae-sive-asia-minor-petrus-ka",
               "ia-dr-natoliae-quae-olim-asia-minor-108521118", "ia-dr-asia-minor-12178201", "commons-robert-asia-minor",
               "ia-dr-asia-minor-c-london-published", "ia-dr-turkey-in-asia-asia-minor-and-transcaucasia-2307047"],
     "places": [("Troas", "Troas"), ("Pergamum", "Pergamum"), ("Smyrna", "Smyrna"), ("Ephesus", "Ephesus"), ("Miletus", "Miletus"),
                ("Sardis", "Sardis"), ("Laodicea", "Laodicea"), ("Iconium", "Iconium"), ("Lystra", "Lystra"), ("Derbe", "Derbe"),
                ("Tarsus", "Tarsus"), ("Antioch", "Antioch"), ("Perga", "Perga")],
     "waters": [], "left": ["Troas", "Pergamum", "Smyrna", "Ephesus", "Miletus"]},
]


def load_records():
    catalogue = json.loads((CORPUS / "normalized" / "catalogue.json").read_text(encoding="utf-8"))["maps"]
    detail = {}
    for source in SOURCES:
        for record in json.loads((CORPUS / "normalized" / "maps" / f"{source}.json").read_text(encoding="utf-8"))["records"]:
            detail[record["record_id"]] = record
    return catalogue, detail


def title_subjects(title: str) -> list[str]:
    text = title.lower()
    found = [key for key, _l, _s, _t, rule, _c in SUBJECTS if re.search(rule, text)]
    if "paul" in found and not re.search(PAUL_TRAVEL, text):
        found.remove("paul")
    return found


PERSON_STOP = re.compile(r"no idea|\bltd\b|limited|cartograph|unknown|anonym|library|museum|institut|&|\bco\b|company|collection|gallery|survey|office|department|society|verlag|heirs|erben|anstalt|establishment", re.I)


def clean_maker(names: list[str]) -> str | None:
    """The first named mapmaker as 'First Last' (joined with 'and' where the record names 'A / B'), without dates or
    roles; None for institutions and placeholders."""
    for raw in names or []:
        raw = raw.split("Others:")[0].replace("Ptolomy", "Ptolemy")
        if " / " in raw:
            parts = [clean_maker([part]) for part in raw.split(" / ")]
            joined = " and ".join(dict.fromkeys(part for part in parts if part))
            if joined:
                return joined
            continue
        name = re.sub(r"\(.*?\)", "", raw)
        name = re.sub(r",?\s*\d{3,4}\??\s*[-–]\s*\d{0,4}\??", "", name)
        name = re.sub(r",?\s*(fl\.|ca\.|b\.|d\.)?\s*\d{3,4}.*$", "", name).strip(" ,.;/")
        name = name.split(";")[0].strip()
        if not name or PERSON_STOP.search(name) or len(name) > 48:
            continue
        if "," in name:
            last, first = [part.strip() for part in name.split(",", 1)]
            first = first.split(",")[0].strip()
            name = f"{first} {last}".strip()
        if name.islower():
            name = " ".join(word.capitalize() for word in name.split())
        return name
    return None


def institution(row, record) -> str:
    holder = (row.get("holding_institution") or record.get("holding_institution") or "").strip()
    if row["source"] == "loc-gm" or holder.startswith("Library of Congress"):
        return "Library of Congress, Geography and Map Division"
    if row["source"] == "nypl":
        return "New York Public Library"
    if row["licence"].startswith("CC BY-NC-SA") or RUMSEY in holder:
        return RUMSEY
    if row["source"] == "wikimedia-commons":
        return holder if holder and holder not in ("Internet Archive",) else "Wikimedia Commons"
    return holder or "Internet Archive"


def credit(row, record, maker) -> tuple[str, str]:
    """(credit line, licence label) as the corpus licence rules require for showing the image."""
    licence = row["licence"]
    if licence.startswith("CC BY-NC-SA"):
        return RUMSEY, "CC BY-NC-SA 3.0"
    if row["source"] == "loc-gm":
        return "Library of Congress, Geography and Map Division", "Public domain"
    if row["source"] == "nypl":
        return "New York Public Library", "Public domain"
    if row["source"] == "wikimedia-commons":
        if licence.startswith("CC") and licence != "CC0":
            author = maker or (row["cartographer"] or [None])[0] or record.get("uploader") or "the named author"
            return f"{author}, via Wikimedia Commons", licence
        holder = institution(row, record)
        return (f"{holder}, via Wikimedia Commons" if holder != "Wikimedia Commons" else "Wikimedia Commons"), {"No restrictions": "No known restrictions"}.get(licence, licence)
    return "Internet Archive", licence


def short_title(title: str, limit: int = 96) -> str:
    text = re.sub(r"\s*\((to accompany|with|insets?)\).*$", "", title, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip(" .:;,")
    return text if len(text) <= limit else text[: limit - 1].rsplit(" ", 1)[0] + "…"


def about(row) -> str | None:
    """The holding library's own description, first sentences only (Library of Congress / World Digital Library and NYPL
    notes are catalogue-grade); the Rumsey boilerplate about zoomable images is dropped."""
    text = row["record"].get("description") or ""
    text = re.sub(r"^Zoomable full resolution image.*?image group [\d.]+ \.\s*", "", text)
    text = re.sub(r'^"|"\s*World Digital Library\.?$', "", text.strip())
    if row["source"] not in ("loc-gm", "nypl", "internet-archive") or len(text) < 40 or text.lower().startswith(row["title"].lower()[:30]):
        return None
    out = ""
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if len(out) + len(sentence) > 420:
            break
        out += (" " if out else "") + sentence
    return out or None


def find_by_spec(spec: str, rows):
    prefix, _, needle = spec.partition(":")
    for row in rows:
        if needle and row["record_id"].startswith(prefix) and row["title"].startswith(needle):
            return row
        if not needle and row["record_id"].startswith(prefix):
            return row
    raise SystemExit(f"build-data: showpiece '{spec}' not found among held, publishable maps (expected a record_id prefix or 'prefix:title start')")


def open_reduced(path: Path, side: int) -> Image.Image:
    image = Image.open(path)
    longest = max(image.size)
    suffix = path.suffix.lower()
    if suffix in (".jpg", ".jpeg"):
        image.draft("RGB", (max(side, image.size[0] * side // longest), max(side, image.size[1] * side // longest)))
    elif suffix == ".jp2":
        factor = 0
        while longest / (2 ** (factor + 1)) >= side and factor < 5:
            factor += 1
        # Pillow's JPEG 2000 reader decodes at 1/2**factor, but only down to the levels the codestream was encoded with
        # (the Internet Archive files often allow just one), so step down until a decode succeeds.
        while True:
            image.reduce = factor
            try:
                image.load()
                break
            except OSError:
                if factor == 0:
                    raise
                factor -= 1
                image = Image.open(path)
    elif image.size[0] * image.size[1] > MAX_PLAIN_MP * 1_000_000:
        raise ValueError(f"{image.size[0]}x{image.size[1]} {suffix} is over {MAX_PLAIN_MP} MP with no reduced decode")
    image.load()
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    image.thumbnail((side, side), Image.LANCZOS)
    return image.convert("RGB")


def save_image(row, side, quality, folder) -> tuple[str, int, int] | None:
    """A JPEG of the scan, wrapped in an SVG file: the local preview's mock-up server sends only html, css, js, svg,
    png, woff2 and json, so a plain .jpg would 404 there. The SVG holds the JPEG as a data URI at its own size."""
    source = CORPUS / row["file"]
    target = ASSETS / folder / f"{row['short_id']}.svg"
    try:
        if target.exists():
            found = re.search(r'width="(\d+)" height="(\d+)"', target.read_text(encoding="utf-8")[:300])
            if found:
                return f"assets/{folder}/{target.name}", int(found[1]), int(found[2])
        image = open_reduced(source, side)
        buffer = io.BytesIO()
        image.save(buffer, "JPEG", quality=quality, optimize=True, progressive=True)
        width, height = image.size
        data = base64.b64encode(buffer.getvalue()).decode("ascii")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
                          f'<image width="{width}" height="{height}" href="data:image/jpeg;base64,{data}"/></svg>', encoding="utf-8")
        return f"assets/{folder}/{target.name}", width, height
    except Exception as error:  # one bad scan must not stop the build; it is logged and left out
        print(f"  skipped {row['record_id']} ({source.name}): {type(error).__name__}: {error}")
        return None


def select(rows):
    """~200 maps: every Paul / Jesus / Exodus map, then a spread across subject x century, best-attributed first."""
    def rank(row):
        source_rank = {"loc-gm": 0, "nypl": 1, "internet-archive": 2, "wikimedia-commons": 3}[row["source"]]
        return (row["year"] is None, row["maker"] is None, source_rank, len(row["title"]))
    picked, seen_titles = [], Counter()

    def take(row, cap=1):
        key = re.sub(r"[^a-z]", "", row["title"].lower())[:40]
        if row in picked or seen_titles[key] >= cap:
            return False
        seen_titles[key] += 1
        picked.append(row)
        return True
    for key in ("paul", "jesus", "exodus"):
        for row in sorted([r for r in rows if key in r["subjects"]], key=rank):
            take(row)
    by_cell = defaultdict(list)
    for row in rows:
        if row["year"] is None:
            continue
        for key in row["subjects"]:
            by_cell[(key, row["year"] // 100)].append(row)
    for per_cell in (2, 4):
        for (key, _century), cell in sorted(by_cell.items()):
            have = sum(1 for r in picked if key in r["subjects"] and r["year"] and r["year"] // 100 == _century)
            for row in sorted(cell, key=rank):
                if have >= per_cell or len(picked) >= 230:
                    break
                if take(row):
                    have += 1
    return picked


def land_outline(land):
    """Today's ground for one "One land" set: Natural Earth coast (land-50m) inside the frame, OpenBible places and waters.
    Where several places share a name (two Antiochs), the one named in the most verses is used."""
    topo = json.loads((WEBSITE / "design" / "apostle-directions" / "data" / "land-50m.json").read_text(encoding="utf-8"))
    (kx, ky), (dx, dy) = topo["transform"]["scale"], topo["transform"]["translate"]
    west, south, east, north = land["frame"]
    pad = 0.15 * (east - west)
    lines = []
    for arc in topo["arcs"]:
        x = y = 0
        current = []
        for qx, qy in arc:
            x += qx
            y += qy
            lon, lat = x * kx + dx, y * ky + dy
            if west - pad <= lon <= east + pad and south - pad <= lat <= north + pad:
                current.append((round(lon, 4), round(lat, 4)))
            elif current:
                lines.append(current)
                current = []
        if current:
            lines.append(current)
    places = json.loads((WEBSITE / "data" / "places.json").read_text(encoding="utf-8"))

    def find(name):
        matches = [p for p in places if p["name"] == name and west - pad <= p["lon"] <= east + pad and south - pad <= p["lat"] <= north + pad]
        if not matches:
            raise SystemExit(f"build-data: '{name}' for the {land['label']} set is not in data/places.json inside its frame {land['frame']}")
        return max(matches, key=lambda p: len(p["verses"]))

    chosen = []
    for name, label in land["places"]:
        match = find(name)
        chosen.append({"n": label, "lon": match["lon"], "lat": match["lat"], "v": len(match["verses"]), "c": match.get("confidence"),
                       "refs": match["verses"][:16] if name == land["key_place"] else None})
    waters = [{"n": label, "lon": find(name)["lon"], "lat": find(name)["lat"]} for name, label in land["waters"]]
    key_label = dict(land["places"])[land["key_place"]]
    return {"frame": land["frame"], "lines": [line for line in lines if len(line) > 1], "places": chosen, "waters": waters,
            "key": key_label, "left": [dict(land["places"]).get(n, n) for n in land["left"]]}


def main():
    catalogue, detail = load_records()
    total = len(catalogue)
    rows = []
    for row in catalogue:
        record = detail.get(row["record_id"], {})
        row = dict(row)
        row["kind"] = record.get("record_kind")
        # On Commons a CC-licensed file's "author" is usually the photographer of the sheet, not its mapmaker: it is
        # kept for the credit line but not counted as a mapmaker.
        photographed = row["source"] == "wikimedia-commons" and row["licence"].startswith("CC") and row["licence"] != "CC0"
        row["author"] = clean_maker(row["cartographer"]) or record.get("uploader")
        row["maker"] = None if photographed else clean_maker(row["cartographer"])
        row["subjects"] = title_subjects(row["title"])
        row["caution"] = bool(record.get("provenance_caution"))
        row["record"] = record
        rows.append(row)
    held = [r for r in rows if r["file"] and not r["withheld_reason"] and r["kind"] == "map"]
    usable = [r for r in held if not re.search(OFF_TOPIC, r["title"], re.I) and not re.search(NOT_A_SHEET, r["title"], re.I)]
    # Undated CC-licensed Commons files are mostly modern teaching diagrams or photographs of exhibits, not old maps.
    on_subject = [r for r in usable if r["subjects"] and not r["caution"] and not re.search(MODERN_DIAGRAM, r["title"], re.I)
                  and not (r["source"] == "wikimedia-commons" and r["year"] is None and r["licence"].startswith("CC") and r["licence"] != "CC0")]
    print(f"catalogue {total} rows · held maps {len(held)} · usable sheets {len(usable)} · with a title subject {len(on_subject)}")

    # Counts: the corpus's own tags versus the title-verified ones (both over held maps).
    corpus_counts = Counter(tag for r in held for tag in r["biblical_subjects"])
    title_counts = Counter(key for r in on_subject for key in r["subjects"])
    for key, label, *_rest, tag in SUBJECTS:
        print(f"  {label:34} corpus tag {corpus_counts[tag]:5}   title says {title_counts[key]:5}")

    for index, row in enumerate(on_subject):
        row["short_id"] = f"m{index:04d}"
    picked = select(on_subject)
    lands = [(land, [find_by_spec(spec, on_subject) for spec in land["specs"]]) for land in LANDS]
    sequence = lands[0][1]
    showpieces = [row for _land, rows in lands for row in rows] + [find_by_spec(spec, on_subject) for spec in SHOWPIECES]
    for row in showpieces:
        if row not in picked:
            picked.append(row)
    print(f"selected {len(picked)} maps, {len(showpieces)} showpieces; making images…")

    maps = []
    for row in sorted(picked, key=lambda r: (r["year"] is None, r["year"] or 0)):
        thumb = save_image(row, THUMB_SIDE, THUMB_Q, "t")
        if not thumb:
            continue
        full = save_image(row, FULL_SIDE, FULL_Q, "f") if row in showpieces else None
        line, licence = credit(row, row["record"], row["author"])
        maps.append({
            "id": row["short_id"], "t": short_title(row["title"]), "tf": row["title"][:400], "y": row["year"],
            "yc": row["year_confidence"], "m": row["maker"], "s": row["subjects"], "lib": institution(row, row["record"]),
            "src": row["source"], "url": row["source_url"], "lic": licence, "credit": line, "nc": bool(row["non_commercial"]),
            "sa": "SA" in licence, "th": thumb[0], "tw": thumb[1], "thh": thumb[2],
            "full": full[0] if full else None, "fw": full[1] if full else None, "fh": full[2] if full else None,
            "res": row["resolution"], "d": about(row) if (row in showpieces or row["source"] == "loc-gm") else None,
        })
    kept = {m["id"] for m in maps}
    index_of = {m["id"]: i for i, m in enumerate(maps)}

    # Every dated, on-subject held map, as a dot for the lanes: [year, subject bitmask, short title, maker, map index or -1].
    keys = [s[0] for s in SUBJECTS]
    dots = []
    for row in sorted([r for r in on_subject if r["year"]], key=lambda r: r["year"]):
        mask = sum(1 << keys.index(k) for k in row["subjects"])
        dots.append([row["year"], mask, short_title(row["title"], 80), row["maker"] or "", index_of.get(row["short_id"], -1)])

    centuries = Counter(r["year"] // 100 + 1 for r in on_subject if r["year"])
    makers = Counter(r["maker"] for r in on_subject if r["maker"])
    libraries = Counter(institution(r, r["record"]) for r in on_subject)
    licences = Counter(credit(r, r["record"], r["author"])[1] for r in on_subject)
    dated = [r["year"] for r in on_subject if r["year"]]
    data = {
        "built": "2026-10-17",
        "counts": {
            "catalogue": total, "heldMaps": len(held), "usable": len(usable), "onSubject": len(on_subject),
            "dated": len(dated), "earliest": min(dated), "latest": max(dated), "makers": len(makers),
            "libraries": len(libraries), "shown": len(maps), "showpieces": sum(1 for m in maps if m["full"]),
            "nonCommercial": sum(1 for r in on_subject if r["non_commercial"]),
        },
        "subjects": [{"key": k, "label": label, "short": s, "tone": t, "count": title_counts[k], "corpus": corpus_counts[c],
                      "dated": sum(1 for r in on_subject if r["year"] and k in r["subjects"])} for k, label, s, t, _r, c in SUBJECTS],
        "centuries": {str(c): n for c, n in sorted(centuries.items())},
        "makers": makers.most_common(14),
        "libraries": libraries.most_common(),
        "licences": licences.most_common(),
        "sequence": [r["short_id"] for r in sequence if r["short_id"] in kept],
        "maps": maps,
        "dots": dots,
        "levant": land_outline(LANDS[0]),
        "lands": [{"key": land["key"], "label": land["label"], "ids": [r["short_id"] for r in rows if r["short_id"] in kept],
                   "outline": land_outline(land)} for land, rows in lands],
    }
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    (HERE / "data.js").write_text(
        "// Generated by build-data.py from Research/HistoricalMaps (2026-10-17). Do not edit by hand.\n"
        f"window.OLDMAPS = {body};\n", encoding="utf-8")
    # Images left over from an earlier selection are this script's own output; remove them so the folder holds only
    # what data.js references.
    referenced = {m["th"] for m in maps} | {m["full"] for m in maps if m["full"]}
    for leftover in [*ASSETS.rglob("*.jpg"), *ASSETS.rglob("*.svg")]:
        if leftover.relative_to(HERE).as_posix() not in referenced:
            print(f"  removing unreferenced {leftover.relative_to(HERE).as_posix()}")
            leftover.unlink()
    size = sum(p.stat().st_size for p in ASSETS.rglob("*.svg"))
    print(f"wrote data.js ({len(body) // 1024} KB), {len(maps)} maps, {len(dots)} dots; assets {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
