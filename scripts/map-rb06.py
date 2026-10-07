"""Map RB06 concerns to unchanged source units; no network, OCR or DB writes."""
import hashlib
import importlib.util
import json
import re
import sys
import zipfile
from pathlib import Path
from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB06'
CACHE = SITE / '.local/library/run-rb06-2026-10-07'
spec = importlib.util.spec_from_file_location('rb04map', SITE / 'scripts/map-rb04.py')
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)


def read(p):
    return json.loads(p.read_text(encoding='utf-8'))


def write(name, value):
    (R / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    new = read(R / 'acquisition-manifest.json')['files']
    held = read(R / 'holdings-audit.json')['files']
    chosen = {
        'asset-expanded-83ddfa911e67a4a9513b',  # Flavel: actual readable bereavement work
        'asset-expanded-355fc207a25bb22422f9',  # Spurgeon: attributed mourning collection
        'asset-expanded-f190d4048e00ae160bdd',  # Bunyan: persecution/suffering
        'asset-expanded-4ff17eb26ad29e64fa88',  # Flavel: preparation for sufferings
        'asset-expanded-9c163e2a6edb0d752ffc',  # Boston: three parts
        'asset-expanded-62708a1e243900f9118f',  # Pink: comfort
        'asset-expanded-8d4168fda1f1fa6bd5db',  # Buchanan: full held comfort work, FGB excerpt overlaps
        'asset-expanded-c43e16c2fd5805a53acf',  # Bunyan: prayer
        'asset-expanded-c95bd085ec490fad1afb',  # Pink: Pauline prayers
        'asset-expanded-5f852d84c9e03da65b92',  # Sibbes: soul's conflict
        'asset-expanded-0d49e5451e6bc1ec0371',  # Goodwin: child of light
        'asset-expanded-117db3cbe83b54410e21',  # Winslow: temptation
        'asset-expanded-c17152ddf72a788ab047',  # James W., not Archibald Alexander
        'asset-expanded-e317c10a38c4cc9817b4',  # Slater: family religion
        'asset-expanded-5a292f1b4784594679df',  # Gouge: eight treatises
        'asset-modern-piper-0cfbb291a67c007735f5-epub',
        'asset-expanded-4060d054a2a5dbc08d39',  # Ryle: seventeen directions
        'asset-expanded-a678daec0c2e95589c4e',  # Burroughs: appended second work separate
        'asset-expanded-6a41e8103fbcb7515140',  # Watson: contentment
        'asset-expanded-eb7ad9ce89c3bc19e6d5',  # Steele: 1823 revised work
        'asset-expanded-be0769a721109e5fd07e',  # Watson: repentance, no study-guide duplicate
        'asset-l11-owen-temptation-xml',
        'asset-l11-gill-practical-xml',
    }
    assert chosen <= {a['assetId'] for a in held}, chosen - {a['assetId'] for a in held}
    works, components = [], []
    by_new = {a['assetId']: a for a in new}
    for a in held + new:
        if a['assetId'] not in chosen and a['assetId'] not in by_new:
            continue
        p = SOURCES / a['relativePath']
        item = {k: a.get(k) for k in ('assetId', 'workId', 'title', 'author', 'url', 'relativePath', 'edition', 'completeness')}
        item.update(status='new-witness' if a['assetId'] in by_new else 'already-held-reused',
                    originalSha256=a.get('sha256', a.get('actualSha256')),
                    derivative=a.get('derivedText', a.get('auditDerivative')),
                    parentIntakeHeld=bool(a.get('evidenceOnly')),
                    locations=shared.epub_locations(a) if p.suffix == '.epub' else [])
        if p.suffix == '.xml':
            item['locations'] = [dict(title=c['title'], sourceLabel=c['title'], locator='xml-id:' + c['id'],
                xmlId=c['id'], kind='source-xml-division-not-necessarily-chapter') for c in a['xmlContents']]
        works.append(item)
    by = {a['assetId']: a for a in works}

    # Each selected EPUB member is an exact existing body, not generated prose.
    # Keep every parent held until modern notes, quotations and work deduplication
    # can be enforced. Preparing a slice does not declare it ready for core teaching.
    def epub_component(a, c, author, role):
        with zipfile.ZipFile(SOURCES / a['relativePath']) as z:
            raw = z.read(c['member'])
            soup = BeautifulSoup(raw, 'html.parser')
            text = (soup.body or soup).get_text('\n', strip=True) + '\n'
        key = digest((a['assetId'] + ':' + c['member']).encode())[:20]
        cid = 'component-rb06-' + key
        p = CACHE / 'components' / (cid + '.txt')
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding='utf-8', newline='\n')
        components.append(dict(componentId=cid, parentWitnessAssetId=a['assetId'], title=c['title'], author=author,
            role=role, originalSha256=a['sha256'], sourceLocator='epub-member:' + c['member'],
            member=c['member'], memberSha256=digest(raw),
            componentText=dict(path=p.relative_to(SITE).as_posix(), sha256=digest(p.read_bytes()),
                wordCount=len(re.findall(r'\b[\w\x27-]+\b', text))),
            integrated=False, publicHostingAllowed=False, eligibleForScopedIntake=False,
            reviewRequired='Contributor, modern note/quotation roles, rights, source-work overlap and theological scope before intake.'))
        c['componentId'] = cid
        c['author'] = author
        c['role'] = role

    for a in new:
        locations = by[a['assetId']]['locations']
        if 'cripplegate' in a['workId']:
            for c in locations:
                n = int(re.search(r'SERM\.\s*(\d+)', c['title'])[1])
                c['sermonNumber'] = n
                c['author'] = c['title'].split('REV. ')[-1].rstrip('.').title()
                c['role'] = 'historic-sermon-with-editor-notes-and-quoted-voices'
                if n in {14, 15, 16, 17, 19, 24, 25, 26, 27, 28, 29, 30, 31}:
                    epub_component(a, c, c['author'], c['role'])
                else:
                    c['selectedForPastoralIntake'] = False
                    c['reviewRequired'] = 'Not selected; Manton infant-baptism argument and Baxter doctrinal differences must not become Baptist defaults.'
        elif 'fgb-188' in a['workId']:
            authors = ['London Baptist Confession preface, 1677/1689', 'Oliver Heywood', 'James W. Alexander',
                'Thomas Doolittle', "J. H. Merle d'Aubigne", 'Thomas Doolittle', 'Thomas Doolittle',
                'James W. Alexander', 'John Howe', 'John G. Paton', 'Joel R. Beeke', 'John G. Paton']
            actual = [c for c in locations if re.search(r'index_split_00[2-9]|index_split_01[0-3]', c['member'])]
            assert len(actual) == len(authors)
            for c, author in zip(actual, authors):
                c.update(author=author, role='edited-excerpt-or-article-not-whole-source-book')
                if 'Confession' not in author:
                    epub_component(a, c, author, c['role'])
                else:
                    c['reviewRequired'] = 'Duplicate held confession preface; link rather than embed again.'
        elif 'fgb-217' in a['workId']:
            authors = ['A. W. Pink', 'C. H. Spurgeon', 'James Buchanan', 'Thomas Brooks', 'Jerome Zanchius',
                'C. H. Spurgeon', 'A. W. Pink', 'Octavius Winslow', 'Miscellaneous attributed authors']
            actual = [c for c in locations if re.search(r'/Section000[1-9]\.xhtml$', c['member'])]
            assert len(actual) == len(authors)
            for c, author in zip(actual, authors):
                c.update(author=author, role='edited-excerpt-or-article-not-whole-source-book')
                if not author.startswith('Miscellaneous'):
                    epub_component(a, c, author, c['role'])
                else:
                    c['reviewRequired'] = 'Quotation collection; no single-author teaching record.'
        elif 'steele-marital' in a['workId'] or 'adams-parent' in a['workId']:
            for c in locations:
                if c['title'] not in ('Contents', 'Chapel Library Resources') and '#' not in c['locator']:
                    epub_component(a, c, a['author'], 'modern-abridgment-paraphrase-with-editor-additions')
        elif a['format'] == 'pdf':
            text = (SITE / a['derivedText']['path']).read_text(encoding='utf-8')
            lines = text.splitlines()
            ranges = [(6, 9, 'Five Advantages of Church-Based Counseling', 'Deepak Reju'),
                (10, 12, 'Counseling and Discipleship', 'Deepak Reju'),
                (13, 15, "Why Every Pastor-in-Training Should Read Ed's Book", 'Michael Lawrence; 9Marks interviewer'),
                (16, 17, 'Twenty Ways to Cultivate a Culture of Counseling in Your Church', 'Jonathan Leeman; Deepak Reju'),
                (18, 21, 'Looking at the Past and Present of Counseling', 'David Powlison; 9Marks interviewer'),
                (22, 26, 'Cultivating a Culture of Counseling and Discipleship', 'Tim Lane; 9Marks interviewer'),
                (27, 30, 'Sorting Out the Spiritual and the Physical in Counseling', 'Michael Emlet; 9Marks interviewer'),
                (31, 34, 'Premarital Counseling, Pornography, and Marriage', 'Winston Smith; 9Marks interviewer'),
                (35, 38, 'What Should Pastors Do with Fear, Medication, Addiction', 'Ed Welch; 9Marks interviewer')]
            for first, last, title, author in ranges:
                start = lines.index('SOURCE PDF PAGE: ' + str(first)) + 1
                end = lines.index('SOURCE PDF PAGE: ' + str(last + 1))
                content = '\n'.join(lines[start-1:end]) + '\n'
                cid = 'component-rb06-counseling-' + str(first)
                p = CACHE / 'components' / (cid + '.txt')
                p.write_text(content, encoding='utf-8', newline='\n')
                c = dict(title=title, author=author, kind='complete-offered-article-or-interview',
                    locator=f'derivative-lines:{start}-{end}', sourceLabel=lines[start-1], lineStart=start,
                    lineEnd=end, pdfPageStart=first, pdfPageEnd=last, componentId=cid,
                    readableWords=len(re.findall(r'\b[\w\x27-]+\b', content)))
                locations.append(c)
                components.append(dict(componentId=cid, parentWitnessAssetId=a['assetId'], title=title,
                    author=author, role='modern-pastoral-article-or-interview-with-quoted-voices',
                    originalSha256=a['sha256'], fullDerivativeSha256=a['derivedText']['sha256'],
                    sourceLocator=c['locator'], lineStart=start, lineEnd=end,
                    componentText=dict(path=p.relative_to(SITE).as_posix(), sha256=digest(p.read_bytes()), wordCount=c['readableWords']),
                    integrated=False, eligibleForScopedIntake=False, publicHostingAllowed=False,
                    reviewRequired='Named interviewee/confessional evidence and quoted-book boundaries; historic 2008 counsel is not automatic clinical guidance.'))
    write('chapter-map.json', dict(mission='RB06', works=works,
        unitCount=sum(len(w['locations']) for w in works),
        countRule='Source navigation units include chapters, parts, sermons, subheadings and front matter; not a chapter count or Scripture coverage percentage.'))
    write('selected-components.json', dict(mission='RB06', components=components,
        parentHoldsRequired=True, integrated=False, countRule='Edition-specific private bodies; edited/full witnesses overlap, not unique new books.'))
    print('MAPPED', len(works), 'witnesses;', sum(len(w['locations']) for w in works), 'source units;', len(components), 'exact private slices')


if __name__ == '__main__':
    main()
