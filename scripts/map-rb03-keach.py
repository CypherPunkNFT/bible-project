"""Resolve Keach's actual EPUB anchors; preserve erroneous NCX references."""
import importlib.util
import json
import posixpath
import re
import zipfile
from pathlib import Path
from urllib.parse import unquote
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup, NavigableString

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('audit', SITE / 'scripts/audit-rb03.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
R = audit.R
# Source-body opening texts checked during RB03. These are starting passages,
# not claims to exhaustive verse ranges or endorsements of every interpretation.
REFERENCES = {
    1: ['Luke 3:5-6', 'Matthew 3:10', 'Matthew 3:12', 'Matthew 5:13', 'Matthew 5:14',
        'Matthew 5:25-26', 'Matthew 7:24-25', 'Luke 6:39', 'Luke 14:28-30', 'Luke 14:31-33',
        'Matthew 9:16-17', 'Matthew 13:3-23', 'Matthew 13:45-46', 'Matthew 13:44',
        'Matthew 13:24-25', 'Matthew 13:31-32', 'Matthew 13:33', 'Matthew 13:47-50',
        'Matthew 13:52', 'Luke 12:16-18', 'Luke 7:31-34'],
    2: ['Mark 9:49-50', 'Luke 10:30', 'Luke 15:3-10', 'Luke 15:8-10', 'Luke 15:11-16',
        'Luke 18:1-8', 'Matthew 18:23', 'Matthew 21:33-44', 'Matthew 20:1-2'],
    3: ['Matthew 22:1-5', 'Matthew 24:45-51', 'Matthew 25:1-12', 'Matthew 25:14-15'],
    4: ['Luke 7:41-43', 'Matthew 12:29', 'Matthew 12:43-45', 'Luke 13:6-9',
        'Matthew 21:28-31', 'Mark 4:26-29', 'Matthew 15:13', 'Luke 16:1-3', 'Luke 16:19',
        'Luke 18:10-14', 'Luke 17:7-10', 'John 10:1-2', 'John 15:1-2'],
}


def main():
    volumes = json.loads((R / 'volume-coverage.json').read_text(encoding='utf-8'))['volumes']
    sections, exceptions = [], []
    for volume in volumes:
        if volume['author'] != 'Benjamin Keach':
            continue
        with zipfile.ZipFile(audit.SOURCES / volume['original']) as archive:
            container = ET.fromstring(archive.read('META-INF/container.xml'))
            opf = next(e.attrib['full-path'] for e in container.iter() if e.tag.endswith('rootfile'))
            package = ET.fromstring(archive.read(opf))
            items = {e.attrib['id']: e.attrib['href'] for e in package.iter() if e.tag.endswith('item')}
            spine = [posixpath.normpath(posixpath.join(posixpath.dirname(opf), unquote(items[e.attrib['idref']])))
                     for e in package.iter() if e.tag.endswith('itemref')]
            docs = {member: BeautifulSoup(archive.read(member), 'html.parser') for member in spine}
            ids = {}
            for member, doc in docs.items():
                for node in doc.select('[id]'):
                    ids.setdefault(node['id'], []).append(member)
            index = 0
            for toc in volume['contents']:
                member = toc['member']
                fragment = toc['locator'].partition('#')[2]
                present = not fragment or docs[member].find(id=fragment) is not None
                resolved_member = member
                if not present:
                    alternatives = ids.get(fragment, [])
                    if len(alternatives) == 1:
                        resolved_member = alternatives[0]
                    exceptions.append(dict(volume=volume['volume'], assetId=volume['assetId'],
                        kind='broken-NCX-fragment', offeredLocator=toc['locator'], offeredTitle=toc['title'],
                        resolvedLocator=resolved_member + '#' + fragment if len(alternatives) == 1 else None,
                        note='Original retained; only the reading map corrects a uniquely found target.'))
                if not re.match(r'[IVX]+\. (?:Parable|Similitude)', toc['title'] or ''):
                    continue
                passage = REFERENCES[volume['volume']][index]
                index += 1
                node = docs[resolved_member].find(id=fragment) if fragment else docs[resolved_member].body
                bits = [str(e) for e in node.next_elements if isinstance(e, NavigableString)] if node else []
                if not fragment:
                    bits = [(node or docs[resolved_member]).get_text(' ', strip=True)]
                # A heading can be at the very end of a split member.
                if len(' '.join(bits)) < 2200:
                    following = spine[spine.index(resolved_member) + 1:spine.index(resolved_member) + 3]
                    bits.extend(docs[m].get_text(' ', strip=True) for m in following)
                opening = ' '.join(' '.join(bits).split())[:2200]
                private = audit.CACHE / 'keach-opening-audit' / f"volume-{volume['volume']}-section-{index}.txt"
                private.parent.mkdir(parents=True, exist_ok=True)
                private.write_text(opening, encoding='utf-8', newline='\n')
                sections.append(dict(volume=volume['volume'], section=index, assetId=volume['assetId'],
                    original=volume['original'], originalSha256=volume['originalSha256'],
                    sourceUrl=volume['sourceUrl'], offeredTitle=toc['title'], offeredLocator=toc['locator'],
                    resolvedLocator=resolved_member + ('#' + fragment if fragment else ''),
                    fragmentPresent=present, startingPassage=passage,
                    mappingKind='AI-assisted source-body starting-passage review; not exhaustive passage coverage',
                    privateOpeningAudit=private.relative_to(SITE).as_posix()))
            assert index == len(REFERENCES[volume['volume']])
    audit.write(R / 'keach-reading-map.json', dict(sections=sections, note='47 parable/similitude divisions. Introduction separately treats Matthew 13:34-35. Source heading errors are preserved; references are reviewed starting passages.'))
    audit.write(R / 'keach-anchor-exceptions.json', dict(exceptions=exceptions))
    lines = ['# Keach: sustained parable reading locations', '',
        'Volumes I, II and IV are new; III is reused. This is the publisher\u2019s four-book electronic arrangement; Volume I includes an 1858 Aylott title page and a 1701 author preface. Each row opens a sustained sermon sequence, not a complete Gospel commentary. Original heading errors remain in the originals.', '',
        '| Volume | Division | Reviewed starting passage | Source heading and EPUB locator |', '|---|---:|---|---|']
    for s in sorted(sections, key=lambda x: (x['volume'], x['section'])):
        lines.append(f"| {s['volume']} | {s['section']} | {s['startingPassage']} | {s['offeredTitle']} \u00b7 `{s['resolvedLocator']}` |")
    lines += ['', 'All source paths/hashes and original versus resolved anchors: [keach-reading-map.json](keach-reading-map.json). Broken EPUB navigation targets: [keach-anchor-exceptions.json](keach-anchor-exceptions.json). Body incipits are retained privately for rechecking, with chapter/range presentation normalized only in this map.', '']
    (R / 'KEACH-READING-MAP.md').write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print('MAPPED', len(sections), 'Keach divisions;', len(exceptions), 'NCX fragment exceptions')


if __name__ == '__main__':
    main()
