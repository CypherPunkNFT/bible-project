"""Print leaves whose opening is not a sectintro/blockquot, and intro endings without a dash-ref.
Usage: python -I peek.py LIBDIR"""
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

lib = pathlib.Path(sys.argv[1])


def norm(el):
    return re.sub(r"\s+", " ", "".join(el.itertext())).strip()


def is_div(el):
    return el.tag.startswith("div") and el.tag[3:].isdigit()


for f in sorted(lib.glob("asset-sermons-maclaren-*/original.xml")):
    body = ET.parse(f).getroot().find("ThML.body")
    print("=====", f.parent.name)
    for el in body.iter():
        if not is_div(el) or any(is_div(c) for c in el):
            continue
        kids = [c for c in el if c.tag not in ("scripCom", "h1", "h2", "h3", "h4", "h5", "pb")]
        intro = []
        for c in kids:
            if (c.tag == "p" and c.get("class") in ("sectintro", "sectinto")) or (c.tag == "div" and c.get("class") == "blockquot"):
                intro.append(c)
            else:
                break
        if not intro:
            first = norm(kids[0])[:160] if kids else ""
            print("NOINTRO", el.get("id"), el.get("title"), "|", kids[0].tag if kids else None, kids[0].get("class") if kids else None, "|", first)
        else:
            last = norm(intro[-1])
            if not re.search(r"[—–-]\s*[^—–]{2,60}\.?$", last[-70:]):
                print("NOREF ", el.get("id"), el.get("title"), "|", last[-120:])
