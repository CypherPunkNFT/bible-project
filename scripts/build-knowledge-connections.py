"""Validate and export the authored Scholars connection research, without changing the site.

Run from Website: python scripts/build-knowledge-connections.py [--check]
Only content/teachers/knowledge-connections/ outputs are written. No corpus writes.
"""
from __future__ import annotations
import argparse
import copy
import csv
import hashlib
import io
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'content/teachers/knowledge-connections'
FIELDS = {'history', 'texts', 'places', 'reference', 'theology'}
STATUSES = {'supported', 'bibliographic-only', 'carried-forward', 'needs-review'}
MINIMUM_NODES = 5

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def normalize(value):
    return ' '.join(re.findall(r'\w+', unicodedata.normalize('NFKD', value).casefold()))

def indexed(rows):
    result = {r['id']: r for r in rows}
    if len(result) != len(rows):
        raise ValueError('Duplicate IDs')
    return result

def validate(data):
    authors, works, edges, sources = (indexed(data[k]) for k in ('authors', 'works', 'connections', 'sources'))
    indexed(data['chains'])
    assert set(data['fields']) == FIELDS
    assert len(data['chains']) == 50, 'Research target is fifty total, not fifty per field'
    assert Counter(c['field'] for c in data['chains']) == {f: 10 for f in FIELDS}
    assert Counter(c['origin'] for c in data['chains']) == {'new-research': 45, 'existing-five': 5}
    assert data['minimumNodesPerChain'] == MINIMUM_NODES
    used_edges, used_works = set(), set()
    signatures = set()
    for c in data['chains']:
        assert c['field'] in FIELDS and c['title']
        assert len(set(c['workIds'])) >= MINIMUM_NODES, f'Chain needs at least {MINIMUM_NODES} distinct nodes: {c["id"]}'
        assert len(c['workIds']) == len(set(c['workIds']))
        assert c['edgeIds'] and len(c['edgeIds']) == len(set(c['edgeIds']))
        signature = tuple(sorted(c['edgeIds']))
        assert signature not in signatures, 'Duplicate chain counted twice'
        signatures.add(signature)
        graph = {w: set() for w in c['workIds']}
        for eid in c['edgeIds']:
            e = edges[eid]
            a, b = e['fromWorkId'], e['toWorkId']
            assert a in graph and b in graph and a != b
            graph[a].add(b)
            graph[b].add(a)
            used_edges.add(eid)
        reached, pending = set(), [c['workIds'][0]]
        while pending:
            w = pending.pop()
            if w not in reached:
                reached.add(w)
                pending.extend(graph[w] - reached)
        assert reached == set(graph), f'Disconnected chain: {c["id"]}'
        used_works.update(graph)
    assert used_edges == set(edges), 'Unreferenced connection'
    assert used_works == set(works), 'Unreferenced work'
    assert {a for w in works.values() for a in w['authorIds']} == set(authors)
    for w in works.values():
        assert w['title'] and w['authorIds'] and all(a in authors for a in w['authorIds'])
    for e in edges.values():
        assert e['fromWorkId'] in works and e['toWorkId'] in works
        assert e['reviewStatus'] in STATUSES and e['claim'] and e['evidence']
        for ref in e['evidence']:
            assert ref['sourceId'] in sources and ref['locator']
            source = sources[ref['sourceId']]
            assert urlparse(source['url']).scheme == 'https' and source['consultedOn']
    return authors, works, edges, sources

def enrich(data):
    data = copy.deepcopy(data)
    population_path = ROOT / 'public/content/scholar-population/index.json'
    profiles_path = ROOT / 'content/teachers/scholars.json'
    population = read(population_path)
    profiles = read(profiles_path)['scholars']
    by_profile = {p['profileAvailability']['scholarId']: p for p in population['entries'] if p['profileAvailability']['scholarId']}
    profile_names = {normalize(p['name']): p['id'] for p in profiles}
    # Explicit existing editorial identity links; these are not fuzzy name joins.
    known = {'Julius Africanus': 'field-e2f1ff4f92f6eb9c79bc', 'Miles Coverdale': 'field-cc1b266d20d653098521'}
    profile_aliases = {'George Smith': 'george-smith-assyriologist'}
    population_ids = {p['id']: p for p in population['entries']}
    linked = {}
    for author in data['authors']:
        profile = profile_names.get(normalize(author['name'])) or profile_aliases.get(author['name'])
        p = by_profile.get(profile) if profile else population_ids.get(known.get(author['name']))
        if author['entityType'] == 'person' and p:
            author.update(profileId=profile, populationId=p['id'], identityStatus='linked-existing-editorial-identity',
                          identityBasis='Exact curated profile name / explicit editorial alias; existing population profile membership' if profile else 'Existing landing/lineage-population.ts editorial mapping')
            linked[author['id']] = p
        else:
            # Exact labels are useful review leads, but do not prove namesake identity.
            author['populationCandidates'] = [{'id':p['id'],'name':p['name']} for p in population['entries']
                if normalize(author['name']) in {normalize(p['name']), *(normalize(a) for a in p.get('verifiedAliases', []))}]
    hosting = read(ROOT / 'public/content/scholar-population/hosting.json')
    cache = {}
    def shelf(pid):
        files = hosting.get('shelves', {}).get(pid, [hashlib.sha256(pid.encode()).hexdigest()[:2] + '.json'])
        output = []
        for filename in files:
            path = ROOT / 'public/content/scholar-population/contributors' / filename
            if not path.exists():
                continue
            if filename not in cache:
                cache[filename] = read(path)
            output.extend(cache[filename].get(pid, []))
        return output
    for work in data['works']:
        candidates = {}
        terms = set(normalize(work['title']).split()) - {'the','a','of','on','in','and','book','edition','latin','english','translation'}
        for aid in work['authorIds']:
            if aid not in linked:
                continue
            for held in shelf(linked[aid]['id']):
                ht = set(normalize(held['title']).split())
                exact = normalize(held['title']) == normalize(work['title'])
                # Candidate discovery only: never establishes work or edition identity.
                if not exact and (len(terms) < 2 or len(terms & ht) / len(terms) < .6):
                    continue
                candidates[held['id']] = {'populationWorkId':held['id'],'canonicalWorkId':held.get('workId'),
                    'title':held['title'],'matchBasis':'exact-title-candidate' if exact else 'title-token-candidate',
                    'editionIds':held.get('editionIds', []),'records':[{'id':r['id'],'title':r['title'],
                    'publicReadable':r['publicReadable'],'localReadable':r['localReadable']} for r in held.get('records', [])]}
        work['libraryCandidates'] = sorted(candidates.values(), key=lambda x:(x['matchBasis'] != 'exact-title-candidate',x['title'],x['populationWorkId']))[:12]
        work['libraryMatchStatus'] = 'candidates-need-edition-review' if candidates else 'no-candidate-in-linked-shelf'
        work['dateReviewStatus'] = 'display-label-not-independently-verified-for-every-edition'
    data['inputFingerprints'] = {'research':sha(DEST/'research.json'),'population':sha(population_path),'profiles':sha(profiles_path)}
    return data

def csv_text(rows, headers):
    out = io.StringIO(newline='')
    writer = csv.DictWriter(out, fieldnames=headers, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()

def exports(data):
    authors, works, edges, sources = validate(data)
    names = lambda wid: ' / '.join(authors[a]['name'] for a in works[wid]['authorIds'])
    connection_rows, chain_rows = [], []
    for c in data['chains']:
        statuses = Counter(edges[e]['reviewStatus'] for e in c['edgeIds'])
        chain_rows.append({'chain_id':c['id'],'field':c['field'],'title':c['title'],'origin':c['origin'],
            'work_count':len(c['workIds']),'connection_count':len(c['edgeIds']),
            'review_statuses':'; '.join(f'{k}: {v}' for k,v in sorted(statuses.items())),
            'authors':' | '.join(dict.fromkeys(names(w) for w in c['workIds'])),
            'works':' | '.join(works[w]['title'] for w in c['workIds']),'note':c.get('note') or ''})
        for eid in c['edgeIds']:
            e = edges[eid]; a = works[e['fromWorkId']]; b = works[e['toWorkId']]
            connection_rows.append({'chain_id':c['id'],'field':c['field'],'chain_title':c['title'],'connection_id':eid,
                'from_author':names(a['id']),'from_work_id':a['id'],'from_work':a['title'],'from_date':a['dateLabel'] or '',
                'to_author':names(b['id']),'to_work_id':b['id'],'to_work':b['title'],'to_date':b['dateLabel'] or '',
                'relationship':e['relationship'],'contribution':e['claim'],'review_status':e['reviewStatus'],
                'relationship_family':e['relationshipFamily'],'evidence_scope':e['evidenceScope'],
                'evidence_urls':' | '.join(sources[r['sourceId']]['url'] for r in e['evidence']),
                'evidence_locators':' | '.join(r['locator'] for r in e['evidence']),
                'source_access':' | '.join(sources[r['sourceId']]['access'] for r in e['evidence']),
                'caveat':e.get('caveat') or ''})
    sizes = Counter(len(c['workIds']) for c in data['chains'])
    summary = {'chains':len(data['chains']),'newChains':45,'existingChains':5,'authorsOrCreditedGroups':len(authors),
        'minimumNodesPerChain':MINIMUM_NODES,'smallestChain':min(sizes),
        'nodeCountDistribution':dict(sorted(sizes.items())),
        'chainsBelowMinimum':sum(n for size,n in sizes.items() if size < MINIMUM_NODES),
        'replacedShortCandidates':sum(bool(c.get('replacesShortCandidate')) for c in data['chains']),
        'worksOrEditions':len(works),'connections':len(edges),'fields':dict(sorted(Counter(c['field'] for c in data['chains']).items())),
        'connectionReviewStatuses':dict(sorted(Counter(e['reviewStatus'] for e in edges.values()).items())),
        'linkedAuthors':sum(bool(a.get('populationId')) for a in authors.values()),
        'worksWithLibraryCandidates':sum(bool(w.get('libraryCandidates')) for w in works.values()),
        'confirmedEditionLinks':sum(bool(w['libraryRecordId']) for w in works.values()),
        'limits':['Source access ranges from opened primary text to catalogue/search excerpts; per-source access is recorded.',
                  'The five original chains retain carried-forward status pending passage-level re-review.',
                  'Library candidates are discovery leads, not confirmed holdings of the exact described edition.',
                  'Work dates are display labels; not every edition date has independent verification.',
                  'No frontend, corpus, embedding, deployment or publication changes.']}
    return {'index.json':json.dumps(data,ensure_ascii=False,indent=2)+'\n',
        'summary.json':json.dumps(summary,ensure_ascii=False,indent=2)+'\n',
        'chains.csv':csv_text(chain_rows,list(chain_rows[0])),
        'connections.csv':csv_text(connection_rows,list(connection_rows[0]))}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    authored = read(DEST / 'research.json')
    validate(authored)
    data = enrich(authored)
    output = exports(data)
    stale = []
    for name, content in output.items():
        path = DEST / name
        if args.check:
            if not path.exists() or path.read_text(encoding='utf8') != content:
                stale.append(name)
        else:
            path.write_text(content, encoding='utf8', newline='')
    if stale:
        raise SystemExit('Stale connection exports: '+', '.join(stale))
    print(('Checked' if args.check else 'Built')+' fifty chains; '+str(len(data['connections']))+' connections.')

if __name__ == '__main__':
    main()
