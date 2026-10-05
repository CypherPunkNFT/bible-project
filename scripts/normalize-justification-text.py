"""Restore verified CID mappings in one pinned PDF, without changing its bytes.

The CFF fonts contain CID names only, and the PDF has Identity-H encoding but
no ToUnicode maps. Mappings below were checked against rendered embedded-font
glyph atlases, not inferred from theological wording. Synthetic extraction
spaces are handled by MuPDF after in-memory ToUnicode repair, never shifted.
"""
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path

import pymupdf as fitz
from fontTools.cffLib import CFFFontSet

ROOT = Path(__file__).resolve().parents[1]
REL = "library/source-desiring-god/asset-modern-piper-3e2cdbe410efea6d860f-pdf/original.pdf"
SOURCE = ROOT.parent / "sources" / REL
PIN = "1b046fe8b70ef43681153b88ab9205521014cfaeecbdc495a1eb7f88ccd2a2ce"
OUT = ROOT / ".local/library/ocr-completion/font-repair"
REPORT = ROOT / "content/library/reports/ocr-completion/font-repair.json"
OCR = ROOT / ".local/library/ocr-completion/pages/pdf-1b046fe8b70ef4368115-p0240-r1.json"
DECISIONS = ROOT / ".local/library/ocr-completion/ocr-decisions.json"
# xref: (verified ASCII CID offset, exceptional glyph mappings)
FONTS = {
    9: (13, {187: "“", 188: "”", 190: "’"}),
    10: (19, {187: "–", 189: "“", 190: "”", 192: "’", 201: "fi"}),
    34: (13, {}),
    50: (13, {186: "–", 188: "“", 189: "”", 191: "’", 199: "fi"}),
    51: (19, {187: "–"}),
    69: (13, {185: "–", 187: "“", 188: "”", 190: "’"}),
    218: (19, {}),
    231: (13, {191: "’", 200: "fl"}),
    312: (19, {}),
    325: (13, {}),
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf8", newline="\n")


def main():
    source = SOURCE.read_bytes()
    assert sha(source) == PIN, "Refuse unreviewed PDF edition"
    OUT.mkdir(parents=True, exist_ok=True)
    original = fitz.open(stream=source, filetype="pdf")
    working = fitz.open(stream=source, filetype="pdf")
    evidence = []
    for xref, (offset, specials) in FONTS.items():
        assert working.xref_get_key(xref, "ToUnicode")[0] == "null"
        assert working.xref_get_key(xref, "Encoding")[1] == "/Identity-H"
        name, _, _, fontbytes = working.extract_font(xref)
        cff = CFFFontSet()
        cff.decompile(io.BytesIO(fontbytes), None)
        charset = cff[cff.fontNames[0]].charset
        mapping = {}
        for item in charset:
            if item == ".notdef":
                continue
            assert item.startswith("cid"), item
            cid = int(item[3:])
            if cid in specials:
                mapping[cid] = specials[cid]
            else:
                assert 32 <= cid + offset <= 126, (xref, cid)
                mapping[cid] = chr(cid + offset)
        cmap = [
            "/CIDInit /ProcSet findresource begin", "12 dict begin", "begincmap",
            "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
            f"/CMapName /VerifiedRequiem{xref} def", "/CMapType 2 def",
            "1 begincodespacerange", "<0000> <FFFF>", "endcodespacerange",
            f"{len(mapping)} beginbfchar",
        ]
        cmap += [f"<{cid:04X}> <{value.encode('utf-16-be').hex().upper()}>" for cid, value in mapping.items()]
        cmap += ["endbfchar", "endcmap", "CMapName currentdict /CMap defineresource pop", "end", "end"]
        stream = working.get_new_xref()
        working.update_object(stream, "<<>>")
        working.update_stream(stream, "\n".join(cmap).encode("ascii"))
        working.xref_set_key(xref, "ToUnicode", f"{stream} 0 R")
        evidence.append({
            "fontXref": xref, "font": name, "embeddedFontSha256": sha(fontbytes),
            "originalEncoding": "Identity-H", "originalToUnicode": None,
            "cffCharsetKind": "CID-only; no semantic glyph names", "mapping": mapping,
            "basis": "Rendered original embedded glyphs visually verified in local glyph atlases; ASCII offset applied only to this font's verified CIDs, exceptions explicit.",
        })
    # Reopen to discard any cached font extraction state. Never save modified PDF.
    repaired = fitz.open(stream=working.tobytes(), filetype="pdf")
    expected_samples = {
        7: "Contents", 8: "Thoughts on Romans 9:30–10:4",
        21: "The Imputation of God’s Own Righteousness Makes No Sense At All?",
        101: "The Great Showdown", 191: "Thoughts on Romans 9:30–10:4",
        215: "With Special Reference to Romans 8:4", 239: "Subject Index",
    }
    for page, expected in expected_samples.items():
        assert expected in repaired[page - 1].get_text(), (page, expected)
    checks = []
    for page in [1, 7, 8, 21, 101, 191, 215, 239]:
        before = original[page - 1].get_pixmap(matrix=fitz.Matrix(1, 1))
        after = repaired[page - 1].get_pixmap(matrix=fitz.Matrix(1, 1))
        assert before.samples == after.samples, f"Unexpected rendering change on {page}"
        after.save(OUT / f"verified-page-{page}.png")
        checks.append({"pdfPage": page, "renderUnchanged": True, "pixelSha256": sha(after.samples)})
    ocr_bytes = OCR.read_bytes()
    ocr = json.loads(ocr_bytes.decode("utf-8-sig"))
    assert ocr["source"]["sourceSha256"] == PIN and ocr["source"]["pdfPage"] == 240
    decisions = json.loads(DECISIONS.read_text(encoding="utf8"))
    decision = next(x for x in decisions if x["sourceRelativePath"] == REL)
    corrections = next(x for x in decision["pages"] if x["page"] == 240).get("verifiedCorrections", [])
    corrected_ocr = ocr["text"]
    for correction in corrections:
        assert correction["before"] in corrected_ocr, correction
        corrected_ocr = corrected_ocr.replace(correction["before"], correction["after"])
    page_records, combined, changed_pages = [], [], []
    for n, page in enumerate(repaired, 1):
        before = original[n - 1].get_text(sort=False)
        text = page.get_text(sort=False)
        method = "existing-PDF-text-with-verified-font-CID-maps"
        if text != before:
            changed_pages.append(n)
        if n == 240:
            text = corrected_ocr
            method = "existing-Windows-OCR-page-result-with-recorded-visual-corrections"
        target = OUT / "pages" / f"page-{n:04}.txt"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf8")
        combined.append(f"\n\n===== PDF PAGE {n} =====\n\n{text}")
        page_records.append({
            "pdfPage": n, "method": method, "text": target.relative_to(ROOT).as_posix(),
            "sha256": sha(text.encode("utf8")), "characters": len(text),
            "fontRepairChangedExtraction": text != before and n != 240,
        })
    output = OUT / "readable.txt"
    output.write_text("".join(combined).lstrip(), encoding="utf8")
    write_json(OUT / "page-map.json", page_records)
    assert sha(SOURCE.read_bytes()) == PIN
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "title": "The Future of Justification", "sourceRelativePath": REL,
        "sourceSha256": PIN, "sourceUnchanged": True, "pages": len(repaired),
        "fontsRepaired": len(evidence), "pagesWithRepairedFontText": len(changed_pages),
        "changedPages": changed_pages, "fontEvidence": evidence,
        "visualRenderingChecks": checks,
        "visuallyCheckedTextSamples": [{"pdfPage": p, "expected": t} for p, t in expected_samples.items()],
        "derivedText": output.relative_to(ROOT).as_posix(), "derivedSha256": sha(output.read_bytes()),
        "pageMap": (OUT / "page-map.json").relative_to(ROOT).as_posix(),
        "ocrPage": {"page": 240, "evidence": OCR.relative_to(ROOT).as_posix(), "sha256": sha(ocr_bytes), "verifiedCorrections": corrections},
        "tocPages7And8": "Use exact embedded-glyph font mapping instead of OCR; previous OCR retained independently.",
        "publicHostingAllowed": False, "publicFullTextIndexAllowed": False,
        "limitations": [
            "Original layout extraction order and line breaks retained; no editorial rewriting or theological paraphrase.",
            "Small-cap font lowercase glyph ranges mapped to nominal lowercase; visual typographic capitalization may differ.",
            "Rendered dash glyphs normalized to en dash; fi/fl ligatures expanded to their letters.",
            "Other fonts, Greek scholarly text, ornaments and source spelling remain unchanged; not a full scholarly proofreading pass.",
            "Page 240 is machine OCR and retains its separate proofreading qualification.",
        ],
    }
    write_json(REPORT, report)
    print(json.dumps({k: report[k] for k in ["pages", "fontsRepaired", "pagesWithRepairedFontText", "derivedText", "sourceUnchanged"]}, indent=2))


if __name__ == "__main__":
    main()
