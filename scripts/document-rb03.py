"""Finalize RB03 metadata after the sole collector has stopped; no network/DB."""
import hashlib
import importlib.util
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('audit', SITE / 'scripts/audit-rb03.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
R = audit.R


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def main():
    runtime = read('runtime-audit-final.json')
    assert runtime['activeRbCollectors'] == [], 'Stop the collector before finalizing its files'
    manifest, targets = read('acquisition-manifest.json'), read('targets.json')
    grouped_failures = {}
    for failure in manifest['failures']:
        grouped_failures.setdefault(failure['url'], []).append(failure)
    manifest['failures'] = [dict(attempts[-1], validationAttemptCount=sum(a.get('validationAttemptCount', 1) for a in attempts),
        firstObservedAt=attempts[0].get('firstObservedAt', attempts[0]['at'])) for attempts in grouped_failures.values()]
    assert not ({t['url'] for t in targets} - {a['url'] for a in manifest['files']} - {f['url'] for f in manifest['failures']})
    # Evidence is refined; immutable original bodies and retrieval times stay intact.
    for a in manifest['files']:
        if a['author'] == 'John Gill':
            raw = (audit.SOURCES / a['relativePath']).read_bytes()
            entries = json.loads(raw)['chapter']['content']
            bodies = [' '.join(str(x) for x in e.get('content', [])).strip() for e in entries if e.get('type') == 'verse']
            pointer_only = bool(bodies) and all(s.lower().startswith('see ') and len(s) < 240 for s in bodies)
            a['contentRole'] = 'cross-reference-pointers-only' if pointer_only else 'verse-labelled-commentary'
            a['sustainedExpositionClaimed'] = not pointer_only
            # The current importer already understands evidenceOnly. This one
            # pointer record stays available as source evidence without being
            # embedded as a substantive commentary chapter.
            a['evidenceOnly'] = pointer_only
        if a['author'] == 'Benjamin Keach':
            a['edition'] = 'Monergism four-book EPUB arrangement; Volume I title page: Aylott and Co., London, 1858; author preface dated 1701'
            a['policyUrl'] = 'https://www.monergism.com/monergism-copyright-permissions'
            a['rightsEvidence'] = 'Primary publisher policy explicitly permits downloads and personal/church/classroom study, and referencing/indexing. It prohibits file redistribution on websites, apps, repositories, AI datasets or similar external platforms. Private originals and local derivatives only; no public bodies or external AI upload.'
        audit.write((audit.SOURCES / a['relativePath']).with_name('provenance.json'), a)
    audit.write(R / 'acquisition-manifest.json', manifest)
    by_url = {t['url']: t for t in targets}
    sparse = []
    for failure in manifest['failures']:
        target = by_url[failure['url']]
        cache = audit.CACHE / 'http' / (hashlib.sha256(failure['url'].encode()).hexdigest() + '.body')
        record = dict(failure, bookId=target.get('bookId'), chapter=target.get('chapter'), acquired=False,
                      retryPolicy='Do not retry unchanged cached sparse/bodyless witness as a download failure')
        if cache.exists() and target.get('jsonKind'):
            raw = cache.read_bytes()
            data = json.loads(raw)
            entries = data['chapter']['content']
            strings = [str(x) for e in entries for x in e.get('content', [])]
            record.update(offeredBodySha256=hashlib.sha256(raw).hexdigest(), byteCount=len(raw),
                verseEntries=len(entries), kind='empty-offered-chapter' if not entries else 'reference-pointer-only',
                cachePath=cache.relative_to(SITE).as_posix(), bodyPreservedPrivately=True,
                explanation='Actual offered API response inspected; empty content or very short see-introduction pointer, not sustained chapter exposition.')
            assert not entries or all(s.strip().lower().startswith('see ') for s in strings), record
        else:
            record['kind'] = 'unresolved-transfer-or-validation-failure'
        sparse.append(record)
    audit.write(R / 'sparse-chapter-exceptions.json', dict(chapters=sparse, note='These responses are evidence in the private HTTP cache, not acquired readable commentaries. Do not label their passages filled by Gill. Henry provides a separate sustained witness.'))
    held = read('holdings-audit.json')['files']
    reuse_ids = ['asset-expanded-29586931124ed4a48712', 'asset-expanded-0842f7b787b9f8ad00e0',
        'asset-expanded-c5cb5fe9a926b322cd38', 'asset-expanded-fefd8e8cc890b2f8f917',
        'asset-expanded-58b3aab777acd4a6db14', 'asset-expanded-d927e402ddabccd2b416',
        'asset-expanded-04e882193bfa6532d3fa']
    reused = [{k: x.get(k) for k in ('assetId', 'title', 'author', 'actualSha256', 'relativePath', 'url', 'epubContents')}
              for x in held if x.get('assetId') in reuse_ids]
    audit.write(R / 'reused-expositions.json', dict(files=reused,
        calvinNumberedVolumes=len([x for x in held if re.search(r'calcom\d{2}', x.get('url') or '')]),
        notes=['Pink Hebrews has all 126 exposition chapter headings, extending from Hebrews 1 through 13.',
            'Pink John has 72 TOC entries; Bridges Proverbs 31 chapters and Ecclesiastes 12; Manton James includes five biblical chapter divisions.',
            'Pink Gleanings are selective treatments, not automatic whole-book coverage.',
            'Calvin calcom01-45 originals are held. Earlier L06 discovery/index counts are not current physical-holdings counts.',
            'Gill doctrinal/practical divinity and Song exposition do not satisfy missing general OT exposition.']))
    families = []
    for work_id, files in __import__('itertools').groupby(sorted(manifest['files'], key=lambda x: x['workId']), key=lambda x: x['workId']):
        assets = list(files)
        families.append(dict(workId=work_id, author=assets[0]['author'],
            title={'John Gill': 'Exposition of the Old and New Testaments: selected books',
                   'Matthew Henry': 'Commentary on the Whole Bible: completing Old Testament volumes',
                   'Benjamin Keach': 'Exposition of the Parables and Express Similitudes: completing four-book set'}[assets[0]['author']],
            state='selected-book-subcorpus-first-acquisition' if assets[0]['author'] == 'John Gill' else 'completion-of-partial-held-work',
            newOriginalCount=len(assets), formats=sorted(set(a['format'] for a in assets)),
            assetIds=[a['assetId'] for a in assets],
            claim='Offered electronic witnesses only; not a collated critical edition or blanket whole-Bible acquisition'))
    audit.write(R / 'bibliography.json', dict(mission='RB03', families=families,
        whollyNewCompleteWholeBibleWorks=0, newlyRepresentedGeneralExpositionFamilies=1,
        partialHeldWorkFamiliesCompletedWithinDeclaredScope=2,
        formalCatalogPromotion=False, sourceFirstIdentityEstablished=True))
    scopes = []
    for a in manifest['files']:
        scopes.append(dict(assetId=a['assetId'], workId=a['workId'], sourceUrl=a['url'],
            originalSha256=a['sha256'], candidateRole='source-reference-pointers' if a.get('contentRole') == 'cross-reference-pointers-only' else 'attributed-exegesis',
            publicHostingAllowed=False, externalBodyRedistributionAllowed=False,
            contributorReviewRequired=True, localIntakePending=True,
            segmentationRules=['Keep biblical quotations distinct from author exposition',
                'Retain source verse/chapter labels; use explicit exception maps for corrections',
                'Quoted rabbis, church fathers, opponents and alternative readings remain attributed quotations',
                'Separate publisher/editor front matter, indexes and book introductions',
                'Do not infer exposition edges from incidental cross-references'],
            theologicalLimits=['Henry is a scoped non-Baptist commentator; baptism/covenant/polity arguments are not Baptist defaults']
                if a['author'] == 'Matthew Henry' else ['Preserve historical author-specific covenant, communion, eschatological and interpretive claims'],
            currentImporterEnforcementClaimed=False))
    audit.write(R / 'intake-scope.json', dict(mission='RB03', automaticGate='post-RB14 only, per HANDOFF',
        ingested=False, embedded=False, files=scopes))
    explicit_errors = [
        (1, 2, 'NCX Matthew 3:20; body Matthew 3:10', 'Matthew 3:10'),
        (1, 6, 'Body citation Matthew v. 2.0,26 is malformed; quoted words correspond to 5:25-26', 'Matthew 5:25-26'),
        (2, 5, 'NCX Luke 11:12; sermon XVI body Luke 15:11-16', 'Luke 15:11-16'),
        (2, 6, 'NCX Matthew 18:12; sermon XXV body Luke 18:1-8', 'Luke 18:1-8'),
        (2, 9, 'Body prints Matthew 20:16 after quotation of verses 1-2; distinguish quotation from chapter application', 'Matthew 20:1-2'),
        (3, 2, 'NCX Matthew 24:25; sermon XVII body Matthew 24:45-51', 'Matthew 24:45-51'),
        (4, 2, 'NCX Matthew 12:20; sermon IV body Matthew 12:29, Mark 3:27, Luke 11:21-22', 'Matthew 12:29'),
        (4, 3, 'NCX Matthew 13:44; sermon V body Matthew 12:43-45', 'Matthew 12:43-45')]
    audit.write(R / 'passage-exceptions.json', dict(exceptions=[dict(volume=v, section=s, finding=f, reviewedStartingPassage=p,
        originalChanged=False, method='Actual sermon opening quotation inspected; source heading preserved') for v,s,f,p in explicit_errors],
        note='Other map ranges can intentionally be fuller/narrower than headings. Starting-passage map does not claim every verse is substantially expounded.'))
    coverage = read('chapter-coverage.json')['summary']
    summary = dict(mission='RB03', checkedOn=datetime.now(timezone.utc).isoformat(),
        originalCount=len(manifest['files']), originalBytes=sum(a['byteCount'] for a in manifest['files']),
        formats=dict(Counter(a['format'] for a in manifest['files'])),
        readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in manifest['files']),
        rejectedSparseChapters=len(sparse), unresolvedFailures=sum(x['kind'].startswith('unresolved') for x in sparse),
        acquiredReferencePointerOnlyChapters=sum(a.get('contentRole') == 'cross-reference-pointers-only' for a in manifest['files']),
        targets=len(targets), fullyAttempted=True, coverage=coverage,
        actualHeldOriginalsAudited=len(held), inputDocumentsAudited=len(read('input-audit.json')),
        privateBodiesCommitted=False, ingested=False, embedded=False)
    audit.write(R / 'summary.json', summary)
    lines = ['<!-- RB03 sources:start -->', '', '## RB03: sustained commentary gaps (7 October 2026)', '',
        f"{len(manifest['files'])} immutable readable originals: Henry\u2019s missing OT volumes II\u2013IV, Keach\u2019s missing parables books I/II/IV, and selected Gill chapter witnesses. These are three work families, including two completions of held partial works; file counts are not new-book counts.", '',
        '[Report](content/library/reports/reformed-baptist-overnight/RB03/REPORT.md) | [Book/chapter coverage](content/library/reports/reformed-baptist-overnight/RB03/COVERAGE.md) | [Keach reading map](content/library/reports/reformed-baptist-overnight/RB03/KEACH-READING-MAP.md) | [Manifest and hashes](content/library/reports/reformed-baptist-overnight/RB03/acquisition-manifest.json) | [Intake scopes](content/library/reports/reformed-baptist-overnight/RB03/intake-scope.json).', '',
        'Private study acquisitions; no public text hosting or external redistribution. [CCEL policy](https://ccel.org/about/copyright.html), [Monergism policy](https://www.monergism.com/monergism-copyright-permissions), and [HelloAO API documentation](https://bible.helloao.org/docs/) apply; Gill\u2019s inventory uses Public Domain Mark 1.0, not CC0. Henry\u2019s non-Baptist scope and the sparse Gill responses remain explicit. Not yet ingested or embedded; post-RB14 gate applies.', '',
        '<details><summary>Every acquired source URL (one row per immutable original)</summary>', '',
        '| Acquired witness | Offered source | Format / scope |', '|---|---|---|']
    lines += [f"| {a['title']} | [Source](<{a['url']}>) | {a['format']} / {a['completeness']} |" for a in manifest['files']]
    lines += ['', '</details>', '', '<!-- RB03 sources:end -->', '']
    p = SITE / 'SOURCES.md'
    text = p.read_text(encoding='utf-8')
    text = re.sub(r'\n?<!-- RB03 sources:start -->.*?<!-- RB03 sources:end -->\n?', '\n', text, flags=re.S)
    p.write_text(text.rstrip() + '\n\n' + '\n'.join(lines), encoding='utf-8', newline='\n')
    print(json.dumps(summary))


if __name__ == '__main__':
    main()
