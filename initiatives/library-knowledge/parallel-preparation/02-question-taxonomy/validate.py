"""Validate P2 outputs and selected inputs without printing reserved wording.

No corpus/service access. Reads the private reserved file for structural validation,
not retrieval tuning; avoid running under a tool that echoes input records.
"""
from collections import Counter
from pathlib import Path
import hashlib
import json
import sys

PROJECT = Path(__file__).resolve().parents[5]
OUT = PROJECT / 'KnowledgeBase/library-knowledge/parallel-preparation/02-question-taxonomy'
DOC = Path(__file__).resolve().parent

def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def need(ok, message):
    if not ok: raise ValueError(message)

def validate():
    package=read(OUT/'topics.json'); topics=package['topics']
    dev=read(OUT/'questions-development.json')['questions']
    reserved=read(OUT/'evaluation/questions-reserved.json')['questions']
    split=read(OUT/'split-manifest.json')
    versions=read(OUT/'input-versions.json')
    evidence=read(OUT/'mapping-evidence.json')['entries']
    index=read(PROJECT/'Website/data/topics/index.json')
    need(len(topics)==25,'Expected 25 topics')
    by_key={t['key']:t for t in topics}
    need(len(by_key)==25,'Duplicate topic keys')
    groups={g['key'] for g in package['groups']}
    need(len(groups)==5,'Expected five presentation groups')
    need(not package['planningKeysAreCanonical'],'Planning IDs must not be canonical')
    required={'key','title','groupKey','parentKey','relatedKeys','canonicalId','canonicalNamespace','aliases','scope','exclusions','audience','readerTask','ambiguityNotes','mappingStatus','mappingIssue','mappingEvidence','coverage'}
    for t in topics:
        need(required<=t.keys(),'Missing topic fields: '+t['key'])
        need(t['groupKey'] in groups,'Invalid group: '+t['key'])
        need(t['aliases'] and len(t['aliases'])==len(set(t['aliases'])),'Invalid aliases: '+t['key'])
        need(t['scope'] and t['exclusions'] and t['readerTask'] and t['audience'],'Missing topic scope: '+t['key'])
        need(all(k in by_key and k!=t['key'] for k in t['relatedKeys']),'Invalid related key: '+t['key'])
        current=t; seen=set()
        while current['parentKey'] is not None:
            need(current['key'] not in seen,'Cyclic parentage')
            seen.add(current['key'])
            need(current['parentKey'] in by_key,'Unknown parent')
            current=by_key[current['parentKey']]
        cid=t['canonicalId']
        if cid:
            need(cid in index['topics'] and cid in evidence,'Missing canonical evidence: '+t['key'])
            need(t['canonicalNamespace']=='website-topic' and t['mappingStatus']=='scoped-match' and t['mappingIssue'] is None,'Invalid resolved state')
        else:
            need(t['mappingStatus']=='unresolved' and t['mappingIssue'] and t['canonicalNamespace'] is None,'Invalid unresolved state')
        need(t['coverage']=='not-assessed','Unsupported coverage claim')
        for candidate in t['mappingEvidence']['candidateIds']:
            e=evidence[candidate]
            need(e['metadata']==index['topics'][candidate],'Mapping metadata drift: '+candidate)
            row=read(PROJECT/e['bundlePath'])[candidate]
            need(e['entryId']==row['id']==candidate,'Wrong bundle binding')
            need(e['inspectedPointHeadings']==[v.get('text','') for v in row.get('points',[])[:4]],'Header evidence changed')
            need(e['inspectedNaveHeadings']==[v.get('text','') for v in row.get('nave',[])[:4]],'Header evidence changed')
    need(sum(t['canonicalId'] is None for t in topics)==4,'Unresolved total changed')
    allq=dev+reserved
    need((len(dev),len(reserved))==(80,20),'Wrong split totals')
    ids=[q['id'] for q in allq]
    need(len(set(ids))==100,'Duplicate question IDs or overlap')
    normalized=[' '.join(q['question'].casefold().split()) for q in allq]
    need(len(set(normalized))==100,'Duplicate question wording')
    qfields={'id','topicKey','question','type','difficulty','intent','evidenceRequirements','challengeTags','language','sourceLanguages','answer','relevanceJudgment','coverage','split'}
    types={'concept','textual-reading','attributed-comparison','source-criticism'}
    for q in allq:
        need(qfields<=q.keys(),'Missing question fields')
        need(q['topicKey'] in by_key and q['question'].endswith('?'),'Invalid question or topic')
        need(q['type'] in types and q['difficulty'] in {'introductory','advanced'},'Invalid question class')
        need(q['intent'] and len(q['evidenceRequirements'])>=2 and all(q['evidenceRequirements']),'Missing intent/evidence requirements')
        need(q['answer'] is None and q['relevanceJudgment'] is None and q['coverage']=='not-assessed','Answer/evaluation content is forbidden')
        ordinal,slot=map(int,q['id'].split('-')[-2:])
        eligible=[n for n in range(1,26) if n%5!=0]
        critical=[2,8,11,13,14]
        other=[n for n in eligible if n not in critical]
        expected='reserved' if ordinal in eligible and slot==(4 if ordinal in critical else other.index(ordinal)%3+1) else 'development'
        need(q['split']==expected,'Deterministic split mismatch')
    need(Counter(q['topicKey'] for q in allq)==Counter({k:4 for k in by_key}),'Expected four questions per topic')
    for name,rows,n in [('development',dev,80),('reserved',reserved,20)]:
        need(all(q['split']==name for q in rows),'Wrong split membership')
        need(Counter(q['type'] for q in rows)==Counter({k:n//4 for k in types}),'Type imbalance')
        need(Counter(q['difficulty'] for q in rows)==Counter({'introductory':n//2,'advanced':n//2}),'Difficulty imbalance')
    need(len({q['topicKey'] for q in dev})==25 and len({q['topicKey'] for q in reserved})==20,'Topic stratification mismatch')
    tags={tag for q in allq for tag in q['challengeTags']}
    required_tags={'reported-versus-endorsed','ambiguous-terms','independent-work-diversity','source-gaps','thin-multilingual-coverage'}
    need(required_tags<=tags,'Missing challenge categories')
    need(required_tags<={tag for q in reserved for tag in q['challengeTags']},'Reserved set misses hard cases')
    for name,item in split['files'].items(): need(sha(OUT/name)==item['sha256'],'Frozen split file changed: '+name)
    need(sha(OUT/'topics.json')==split['topicsSha256'],'Frozen taxonomy changed')
    need(sha(OUT/'evaluation/build_package.py')==split['authoringSha256'],'Authoring code changed')
    changed=[item['path'] for item in versions['files'] if not (PROJECT/item['path']).is_file() or sha(PROJECT/item['path'])!=item['sha256']]
    need(not changed,'Selected inputs changed; reconcile before use: '+repr(changed))
    counts=read(OUT/'counts.json')
    for name,rows in [('development',dev),('reserved',reserved)]:
        actual={'total':len(rows),'byType':dict(Counter(q['type'] for q in rows)),'byDifficulty':dict(Counter(q['difficulty'] for q in rows)),
                'byTopic':{k:sum(q['topicKey']==k for q in rows) for k in by_key},'byChallenge':dict(Counter(tag for q in rows for tag in q['challengeTags']))}
        need(actual==counts[name],'Reported counts do not match questions')
    # No reserved wording may enter the prose overview or visual fixtures.
    for path in DOC.glob('*'):
        if path.suffix in {'.md','.html','.json'}:
            text=path.read_text(encoding='utf-8-sig')
            need(all(q['question'] not in text for q in reserved),'Reserved wording leaked into '+path.name)
    return {'status':'passed','topics':25,'mapped':21,'unresolvedMappings':4,'development':80,'reserved':20,
            'selectedInputsUnchanged':len(versions['files']),'reservedWordingInOverview':0,
            'checks':['required fields','unique identities and wording','valid links and acyclic parents','scoped registry bindings and selected entry headings',
                      'deterministic disjoint balanced split','question/evidence fields','challenge coverage','no answers or judgments',
                      'file fingerprints','actual/report count parity','selected input recheck','reserved wording containment']}

if __name__=='__main__':
    try: result=validate()
    except (ValueError,KeyError,FileNotFoundError) as exc:
        print('P2 validation failed: '+str(exc)); sys.exit(1)
    print(json.dumps(result,indent=2))
    if '--write-report' in sys.argv:
        (OUT/'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
