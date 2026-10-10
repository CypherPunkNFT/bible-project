"""Bounded sparse associations; these are never doctrinal agreement claims."""
import json
import math
from collections import defaultdict
from itertools import combinations
from .core import dumps, identity
from .foundation import progress


def derive_shared_references(graph, run, config, max_posting=80, max_pairs=100000):
    if graph.cursor(run, 'shared-references') == 'complete':
        return
    graph.db.execute('CREATE TABLE IF NOT EXISTS derivation_links(child TEXT NOT NULL REFERENCES derivations(id),parent TEXT NOT NULL REFERENCES derivations(id),PRIMARY KEY(child,parent))')
    # One representative per catalogue work, otherwise per identical source hash.
    docs = {}
    for row in graph.db.execute('SELECT * FROM document_map WHERE run_id=? AND eligible=1', (run,)):
        meta = json.loads(row['metadata'])
        docs[row['document_id']] = row['work_id'] or meta.get('sourceHash') or row['document_id']
    postings = defaultdict(dict)
    sql = '''SELECT a.id,a.object,c.document_id FROM run_assertions r JOIN assertions a ON a.id=r.assertion_id
             JOIN chunk_map c ON c.run_id=r.run_id AND c.chunk_id=substr(a.subject,7)
             WHERE r.run_id=? AND a.relation='cites_reference' ORDER BY a.object,c.document_id,a.id'''
    for row in graph.db.execute(sql, (run,)):
        key = docs.get(row['document_id'])
        if key:
            posting=postings[row['object']]
            if posting is not None and key not in posting:
                posting[key]=(row['document_id'],row['id'])
                if len(posting)>max_posting: postings[row['object']]=None
    pairs, skipped = {}, {'ubiquitousReferences': 0, 'pairBudgetReferences': 0}
    n = len(set(docs.values()))
    for number, (ref, posting) in enumerate(sorted(postings.items()), 1):
        if posting is None:
            skipped['ubiquitousReferences'] += 1
            continue
        if len(pairs) >= max_pairs:
            skipped['pairBudgetReferences'] += 1
            continue
        weight = math.log((1+n)/(1+len(posting))) + 1
        for left, right in combinations(sorted(posting.values()), 2):
            key = tuple(sorted((left[0], right[0])))
            if key not in pairs and len(pairs) >= max_pairs:
                continue
            value = pairs.setdefault(key, {'score': 0, 'refs': [], 'inputs': [],'features':[],'omittedReferenceCount':0})
            # Evidence is bounded explicitly. Do not silently imply complete features.
            if len(value['refs']) < 20:
                value['score'] += weight
                value['refs'].append(ref); value['inputs'] += [left[1], right[1]]
                value['features'].append(dict(referenceId=ref,documentFrequency=len(posting),weight=weight))
            else: value['omittedReferenceCount']+=1
        if number % 1000 == 0:
            from .runner import check_cancel
            check_cancel(config)
            progress(config, run, 'sparse_shared_references', references=number, pairs=len(pairs))
    params = dict(maxPosting=max_posting, maxPairs=max_pairs, maxEvidenceReferencesPerPair=20,
                  identity='catalogue work, otherwise source sha256; no title merge', skipped=skipped,
                  weighting='log((1+eligible identities)/(1+reference document frequency))+1',
                  scope='identical parsed ranges; overlapping unequal ranges are not expanded')
    # Shared global weighting/deduplication dependencies are named once, rather
    # than copying millions of upstream IDs into every pair.
    projection=identity('derivation',run,'sparse-citation-projection-v1',params)
    graph.db.execute('INSERT OR IGNORE INTO derivations VALUES(?,?,?,?)',(projection,run,'sparse-citation-projection-v1',dumps(params|{'eligibleIdentities':n,'snapshotId':graph.db.execute('SELECT snapshot_id FROM runs WHERE id=?',(run,)).fetchone()[0]})))
    graph.db.execute('''INSERT OR IGNORE INTO derivation_inputs SELECT ?,a.id FROM assertions a JOIN run_assertions r ON r.assertion_id=a.id
                        WHERE r.run_id=? AND a.relation IN ('cites_reference','part_of','edition_of')''',(projection,run))
    for number, ((left, right), value) in enumerate(sorted(pairs.items()), 1):
        # A single shared proof text is weak; keep only multi-reference associations.
        if len(value['refs']) < 2:
            continue
        derivation = identity('derivation', run, left, right, value)
        metric = dict(score=round(value['score'], 6), references=value['refs'], features=value['features'],parameters=params,
                      eligibleIdentities=n,omittedReferenceCount=value['omittedReferenceCount'],projectionId=projection,
                      meaning='bounded sum of recorded IDF features, no doctrinal agreement/influence claim')
        graph.db.execute('INSERT OR IGNORE INTO derivations VALUES(?,?,?,?)',
                         (derivation, run, 'sparse-shared-reference-v1', dumps(metric)))
        graph.db.execute('INSERT OR IGNORE INTO derivation_links VALUES(?,?)',(derivation,projection))
        evidence = []
        for assertion in sorted(set(value['inputs'])):
            graph.db.execute('INSERT OR IGNORE INTO derivation_inputs VALUES(?,?)', (derivation, assertion))
            evidence += [r[0] for r in graph.db.execute('''SELECT e.observation_id FROM assertion_evidence e
                         JOIN run_observations o ON o.observation_id=e.observation_id AND o.run_id=?
                         WHERE e.assertion_id=?''', (run, assertion))]
        graph.assertion(run, 'document:'+left, 'shares_references', 'document:'+right, evidence,
                        basis='derived_association', qualifiers=metric | {'derivationId': derivation},
                        attribution='computed citation overlap; no endorsement or influence inference', review='statistical_association')
        if number % 500 == 0:
            graph.db.commit()
    graph.db.execute('INSERT OR REPLACE INTO meta VALUES(?,?)', ('association_bounds:'+run, dumps(params)))
    graph.checkpoint(run, 'shared-references', 'complete')
