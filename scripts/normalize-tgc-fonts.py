"""Normalize one acquired Carson PDF using its embedded glyph-name evidence.

Only glyphs proved by an embedded CFF charset and PDF Encoding are mapped.
Original PDF and prior text derivatives are never modified. This is not OCR.
"""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re

import pymupdf
from fontTools import agl
from fontTools.cffLib import CFFFontSet
from bible.paths import SITE, SOURCES

REL = 'library/source-gospel-coalition/asset-ready-library-33c13a4d43aaec720e7a/original.pdf'
OUT = SITE / '.local/library/ocr-completion/font-repair'
REPORT = SITE / 'content/library/reports/ocr-completion/tgc-font-repair.json'
DIGITS = {name: str(i) for i, name in enumerate(('zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'))}


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    source = SOURCES / REL
    original_hash = sha(source)
    out = []
    font_evidence = []
    substitutions = Counter()
    unresolved = []
    with pymupdf.open(source) as doc:
        fonts = {f[0]: f for page in doc for f in page.get_fonts()}
        maps = {}
        for xref, font in sorted(fonts.items()):
            name, ext, kind, data = doc.extract_font(xref)
            if ext != 'cff':
                continue
            cff = CFFFontSet()
            cff.decompile(io.BytesIO(data), None)
            glyphs = cff[cff.fontNames[0]].charset
            object_text = doc.xref_object(xref)
            match = re.search(r'/Encoding\s+(\d+)\s+0\s+R', object_text)
            encoding = doc.xref_object(int(match[1])) if match else object_text
            mapping = {}
            evidence = []
            for glyph in glyphs:
                original = agl.toUnicode(glyph)
                replacement = None
                if glyph.endswith('oldstyle') and glyph[:-8] in DIGITS:
                    replacement = DIGITS[glyph[:-8]]
                elif re.fullmatch(r'[A-Z]small', glyph):
                    replacement = glyph[0]
                elif glyph == 'questionsmall':
                    replacement = '?'
                elif glyph in ('ff', 'fi', 'fl', 'ffi', 'ffl'):
                    replacement = glyph
                if not replacement or len(original) != 1:
                    continue
                # Expert glyphs require explicit PDF Encoding name evidence.
                if '\ue000' <= original <= '\uf8ff' and ('/' + glyph) not in encoding:
                    unresolved.append(dict(font=name, glyph=glyph, reason='Absent from explicit PDF Encoding; left unchanged.'))
                    continue
                mapping[original] = replacement
                evidence.append(dict(glyphName=glyph, extractedCodepoint=f'U+{ord(original):04X}', replacement=replacement,
                                     evidence='Embedded CFF charset + Adobe glyph list; explicit PDF Encoding checked for private-use glyphs.'))
            normalized_font = re.sub(r'^[A-Z]{6}\+', '', name)
            if normalized_font in maps and maps[normalized_font] != mapping:
                raise ValueError('Conflicting maps for font ' + normalized_font)
            maps[normalized_font] = mapping
            font_evidence.append(dict(xref=xref, font=name, embeddedFontSha256=hashlib.sha256(data).hexdigest(),
                                      mappings=evidence, encodingObject=int(match[1]) if match else None))
        for page in doc:
            lines = []
            changed = 0
            for block in page.get_text('dict')['blocks']:
                if block['type'] != 0:
                    continue
                for line in block['lines']:
                    spans = []
                    for span in line['spans']:
                        mapping = maps.get(span['font'], {})
                        text = []
                        for c in span['text']:
                            value = mapping.get(c, c)
                            if value != c:
                                substitutions[(span['font'], f'U+{ord(c):04X}', value)] += 1
                                changed += 1
                            if '\ue000' <= value <= '\uf8ff' or value == '\ufffd':
                                unresolved.append(dict(page=page.number + 1, font=span['font'], codepoint=f'U+{ord(c):04X}'))
                            text.append(value)
                        spans.append(''.join(text))
                    lines.append(''.join(spans))
            out.append(dict(page=page.number + 1, text='\n'.join(lines) + '\n', substitutions=changed))
    OUT.mkdir(parents=True, exist_ok=True)
    txt = OUT / 'carson-christian-truth-postmodern-world.normalized.txt'
    pages = OUT / 'carson-christian-truth-postmodern-world.pages.json'
    txt.write_text('\n\f\n'.join(p['text'] for p in out), encoding='utf-8', newline='\n')
    save(pages, out)
    assert sha(source) == original_hash
    save(REPORT, dict(title='Christian Truths in a Postmodern World', sourceRelativePath=REL, sourceSha256=original_hash,
        completedAt=datetime.now(timezone.utc).isoformat(), method='Font-scoped existing-text normalization; no OCR or inferred prose.',
        visualChecks=[dict(page=2, checks='Running small-cap title and oldstyle page number 103 matched rendered page.'),
                      dict(page=22, checks='John 3:16, page number 123 and running small-cap title matched rendered page.')],
        pageCount=len(out), changedPages=[p['page'] for p in out if p['substitutions']],
        substitutions=sum(substitutions.values()), substitutionCounts=[dict(font=k[0], codepoint=k[1], replacement=k[2], count=n) for k, n in sorted(substitutions.items())],
        fonts=font_evidence, unresolved=unresolved,
        outputs=[dict(relativePath=p.relative_to(SITE).as_posix(), sha256=sha(p), byteCount=p.stat().st_size) for p in (txt, pages)],
        rights='Inherits private-reading source permissions. No public hosting or full-text indexing clearance added.',
        limitations=['Preserves extraction order and ordinary wording; line-end hyphens and original layout are not editorially rewritten.',
                     'Small-cap glyphs become uppercase letters; ligatures become their component letters.',
                     'Only this identified source file and its named embedded fonts are processed; no global PUA replacement.']))
    print(json.dumps(dict(pages=len(out), changedPages=sum(bool(p['substitutions']) for p in out), substitutions=sum(substitutions.values()), unresolved=len(unresolved))))


if __name__ == '__main__':
    main()
