"""Check tribes.json: every span exists in the KJV; every quotation is word for word; every census/total number is in
its verse; every list cell's verse names the tribe; every placeId and personId exists. Exit 1 on any failure."""
import json
import re
import sys

import core
from kjv import SITE, DATA, verse, verses_in, quote_ok, kjv_numbers, norm, load_places

DOC = json.loads((SITE / "design" / "tribes-directions" / "data" / "tribes.json").read_text(encoding="utf-8"))
PLACE_IDS = {p["id"] for p in load_places()}
PERSON_IDS = {f.stem for f in (DATA / "study" / "people").glob("*.json")}
errors, counts = [], {"spans": 0, "quotes": 0, "numbers": 0, "cells": 0, "places": 0, "persons": 0, "cites": 0}


def err(where, msg):
    errors.append(f"{where}: {msg}")


def check_span(span, where):
    counts["spans"] += 1
    if not (isinstance(span, list) and len(span) == 2 and all(isinstance(x, int) for x in span)):
        return err(where, f"bad span {span}")
    a, b = span
    if a > b:
        return err(where, f"span reversed {span}")
    if verse(a) is None or verse(b) is None:
        return err(where, f"span endpoint missing from KJV {span}")


def numbers_in(span):
    out = []
    for v in verses_in(span):
        out += kjv_numbers(verse(v))
    return out


def walk(node, path):
    if isinstance(node, dict):
        if "span" in node:
            check_span(node["span"], path)
            if "text" in node and isinstance(node["text"], str) and "layer" not in node:
                counts["quotes"] += 1
                if not quote_ok(node["text"], node["span"]):
                    err(path, f"quote not found word for word in its span: {node['text'][:80]!r}")
            if "text" in node and node.get("layer") in ("scripture", "text"):
                spans = [node["span"]] + list(node.get("refs") or [])
                for frag in re.findall(r"“([^”]+)”", node["text"]):
                    counts["quotes"] += 1
                    if not any(quote_ok(frag, s) for s in spans):
                        err(path, f"quoted words not found in the claim's verses: {frag[:80]!r}")
            if "n" in node and isinstance(node["n"], int) and not node.get("computed"):
                counts["numbers"] += 1
                if node["n"] not in numbers_in(node["span"]):
                    err(path, f"number {node['n']} not in its verse(s); found {numbers_in(node['span'])}")
        for key in ("refs",):
            for i, s in enumerate(node.get(key) or []):
                check_span(s, f"{path}.{key}[{i}]")
        if node.get("placeId") is not None:
            counts["places"] += 1
            if node["placeId"] not in PLACE_IDS:
                err(path, f"unknown placeId {node['placeId']}")
        if node.get("personId") is not None:
            counts["persons"] += 1
            if node["personId"] not in PERSON_IDS:
                err(path, f"unknown personId {node['personId']}")
        for k, v in node.items():
            walk(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]")


def check_cells():
    for lst in DOC["lists"]:
        for c in lst["cells"]:
            counts["cells"] += 1
            words = [w for w in re.split(r"[ ,…]+", c["asNamed"].replace("namely", "")) if w and w[0].isupper()]
            text = " ".join(verse(v) for v in verses_in(c["span"]))
            for w in words:
                if w not in text:
                    err(f"lists.{lst['id']}.{c['tribe']}", f"{w!r} not in {c['ref']}")
        # order equals cells
        if lst["order"] != [c["tribe"] for c in lst["cells"]]:
            err(f"lists.{lst['id']}", "order differs from cells")


def check_names():
    """Princes, spies, dividers: the person's name is in the verse."""
    for t in DOC["tribes"]:
        for key in ("prince", "spy", "divider"):
            x = t.get(key)
            if x and x.get("name"):
                text = " ".join(verse(v) for v in verses_in(x["span"]))
                for part in re.split(r" \(|; ", x["name"]):
                    part = part.split(" (")[0].strip(") ")
                    if part and part[0].isupper() and norm(part) not in norm(text):
                        err(f"{t['id']}.{key}", f"{part!r} not in {x['ref']}")
        od = t.get("offeringDay")
        if od:
            first = verse(od["span"][0])
            if f"{od['dayWord']} day" not in first:
                err(f"{t['id']}.offeringDay", f"'{od['dayWord']} day' not in first verse")
            prince = t["prince"]["name"].split(" the son")[0]
            if prince not in first:
                err(f"{t['id']}.offeringDay", f"prince {prince} not in {first[:60]}")


def check_census_against_core():
    for t in DOC["tribes"]:
        c = t.get("census")
        if c and c.get("first") and c.get("change"):
            if c["change"]["n"] != c["second"]["n"] - c["first"]["n"]:
                err(t["id"], "census change arithmetic")
    # Totals: the census sums match the text's totals (our own arithmetic, reported not asserted)
    s1 = sum(core.CENSUS[t][0][0] for t in core.CENSUS if t != "levi")
    s2 = sum(core.CENSUS[t][1][0] for t in core.CENSUS if t != "levi")
    print(f"sum of Numbers 1 tribes = {s1} (text 603550); sum of Numbers 26 tribes = {s2} (text 601730)")
    if s1 != 603550 or s2 != 601730:
        err("censusTotals", "tribe figures do not add up to the text's totals")
    for side in DOC["campLayout"]["sides"]:
        tot = sum(core.CENSUS[t][0][0] for t in side["tribes"])
        if tot != side["total"]["n"]:
            err(f"campLayout.{side['side']}", f"sum {tot} != {side['total']['n']}")


def check_cites():
    ids = {s["id"] for s in DOC.get("sources", [])}
    def visit(node, path):
        if isinstance(node, dict):
            for c in node.get("cites", []) or []:
                counts["cites"] += 1
                if c not in ids:
                    err(path, f"cite {c} not in sources[]")
            for k, v in node.items():
                visit(v, f"{path}.{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                visit(v, f"{path}[{i}]")
    visit(DOC, "$")
    for s in DOC.get("sources", []):
        for k in ("author", "title", "year", "url"):
            if not s.get(k):
                err(f"sources.{s.get('id')}", f"missing {k}")


def check_layers():
    allowed = {"scripture", "text", "tradition", "scholars", "ancient-record", "early-church"}
    def visit(node, path):
        if isinstance(node, dict):
            if "layer" in node:
                if node["layer"] not in allowed:
                    err(path, f"layer {node['layer']}")
                if node["layer"] == "scripture" and not (node.get("refs") or node.get("span")):
                    err(path, "scripture claim without refs/span")
                if node["layer"] in ("tradition", "scholars") and not node.get("cites"):
                    err(path, f"{node['layer']} claim without cites")
            for k, v in node.items():
                visit(v, f"{path}.{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                visit(v, f"{path}[{i}]")
    visit(DOC, "$")


walk(DOC, "$")
check_cells()
check_names()
check_census_against_core()
check_cites()
check_layers()
import check_extra
counts["tribe-links"] = check_extra.run(DOC, err)
print("checked:", counts)
if errors:
    print(f"{len(errors)} ERRORS")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("CLEAN")
