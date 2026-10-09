"""Structural survey of the held ThML files. Usage: python -I survey.py LIBDIR"""
import collections
import pathlib
import sys
import xml.etree.ElementTree as ET

lib = pathlib.Path(sys.argv[1])
for f in sorted(lib.glob("asset-sermons-maclaren-*/original.xml")):
    try:
        root = ET.parse(f).getroot()
    except ET.ParseError as e:
        print(f.parent.name, "PARSE ERROR", e)
        continue
    body = root.find("ThML.body")
    depth = collections.Counter()
    leaves = 0
    with_intro = 0
    first_classes = collections.Counter()
    for el in body.iter():
        if el.tag.startswith("div") and el.tag[3:].isdigit():
            depth[el.tag] += 1
            if not any(c.tag.startswith("div") and c.tag[3:].isdigit() for c in el):
                leaves += 1
                ps = [c for c in el if c.tag == "p"]
                if ps:
                    first_classes[ps[0].get("class")] += 1
                if any(p.get("class") == "sectintro" for p in ps):
                    with_intro += 1
    print(f.parent.name, dict(depth), "leaves", leaves, "sectintro", with_intro, dict(first_classes))
