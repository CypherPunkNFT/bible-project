"""Download each Maclaren 'Expositions of Holy Scripture' volume ONCE as whole-book ThML
from CCEL, straight into the library, with provenance.json. Never overwrites.
Checkpoint: checkpoint.json in this folder. Throttle: >=10.5 s between ccel.org requests.
"""
import datetime
import hashlib
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
LIB = pathlib.Path(r"D:\FortressOfSolitude\Jarvis\Projects\BibleProject\sources\library")
SRC = "source-ccel"
UA = "BibleProject-library/1.0 (private noncommercial study)"
CHECKPOINT = HERE / "checkpoint.json"
STAMP = HERE / ".last_ccel.org"

BOOKS = [
    ("gen_num", "Expositions of Holy Scripture: Genesis, Exodus, Leviticus and Numbers"),
    ("deut", "Expositions of Holy Scripture: Deuteronomy, Joshua, Judges, Ruth and First Book of Samuel, Second Samuel, First Kings, and Second Kings Chapters"),
    ("2kings_eccl", "Expositions of the Holy Scriptures: Second Kings from Chap. VIII, and Chronicles, Ezra, and Nehemiah, Esther, Job, Proverbs and Ecclesiastes"),
    ("psalms", "Expositions of Holy Scripture: Psalms"),
    ("isa_jer", "Expositions of Holy Scripture: Isaiah and Jeremiah"),
    ("ezek_matt1", "Expositions of Holy Scripture: Ezekiel, Daniel and the Minor Prophets; and Matthew Chaps. I to VIII"),
    ("matt2", "Expositions of Holy Scripture: Matthew IX to XVIII"),
    ("mark", "Expositions of Holy Scripture: Mark"),
    ("luke", "Expositions of Holy Scripture: Luke"),
    ("john1", "Expositions of Holy Scripture: St John Ch. I to XIV"),
    ("john2", "Expositions of Holy Scripture: St John Chs. XV to XXI"),
    ("acts", "Expositions of Holy Scripture: The Acts"),
    ("rom_cor", "Expositions of Holy Scripture: Romans and Corinthians"),
    ("iicor_tim", "Expositions of Holy Scripture: Second Corinthians, Galatians, and Philippians Chapters I to End. Colossians, Thessalonians, and First Timothy"),
]


def asset_id(slug):
    return "asset-sermons-maclaren-expositions-" + slug.replace("_", "-")


def throttle():
    if STAMP.exists():
        wait = 10.5 - (time.time() - float(STAMP.read_text()))
        if wait > 0:
            time.sleep(wait)
    STAMP.write_text(str(time.time()))


def get(url):
    throttle()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.read(), dict(r.headers), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers), url


def main():
    done = json.loads(CHECKPOINT.read_text(encoding="utf-8")) if CHECKPOINT.exists() else {}
    for slug, title in BOOKS:
        aid = asset_id(slug)
        if aid in done:
            continue
        folder = LIB / SRC / aid
        out = folder / "original.xml"
        if out.exists():
            raise SystemExit(f"refusing to overwrite {out}")
        url = f"https://ccel.org/ccel/m/maclaren/{slug}.xml"
        status, body, headers, final = get(url)
        print(slug, status, len(body), final, flush=True)
        if status != 200:
            done[aid] = {"error": status, "url": url}
            CHECKPOINT.write_text(json.dumps(done, indent=1), encoding="utf-8")
            if status in (403, 429) or status >= 500:
                sys.exit(2)
            continue
        if not body.lstrip()[:200].lower().startswith((b"<?xml", b"<!doctype thml", b"<thml")):
            raise SystemExit(f"{slug}: body does not look like ThML/XML: {body[:120]!r}")
        retrieved = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        folder.mkdir(parents=True, exist_ok=False)
        out.write_bytes(body)
        prov = {
            "url": url, "finalUrl": final,
            "mimeType": headers.get("Content-Type", "").split(";")[0].strip() or "application/xml",
            "byteCount": len(body), "sha256": hashlib.sha256(body).hexdigest(),
            "retrievedAt": retrieved, "headers": headers, "assetId": aid,
            "author": "Alexander Maclaren", "title": title, "format": "ThML (XML)",
            "relativePath": f"library/{SRC}/{aid}/original.xml",
            "sourcePage": f"https://ccel.org/ccel/maclaren/{slug}/{slug}",
            "textKind": "historic-sermon-transcription", "rightsCategory": "public-domain",
            "useScope": "private-noncommercial-reading", "publicHostingAllowed": False,
            "publicFullTextIndexAllowed": False, "policyUrl": "https://ccel.org/about/copyright.html",
        }
        (folder / "provenance.json").write_text(json.dumps(prov, indent=1, ensure_ascii=False), encoding="utf-8")
        done[aid] = {"slug": slug, "title": title, "sha256": prov["sha256"], "bytes": len(body)}
        CHECKPOINT.write_text(json.dumps(done, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
