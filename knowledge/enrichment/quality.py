"""Frozen review samples; a real reviewer supplies decisions, never self-grading."""
import json
import time
from pathlib import Path
from .core import identity, now, readonly, text_hash
from .rules import fts_phrase, load_pack
from .query import Tables
from ..settings import write_json


def accept_reviews(config, decision_path):
    """Derive gates from item-level model/human reviews, not supplied totals."""
    from .lifecycle import read
    from .core import Graph, dumps
    from .foundation import Inputs
    root=config['state_dir']/'graph-development'; latest=read(root/'latest-pilot.json')
    run=latest['runId']; key=run.split(':')[-1]
    sample=read(root/('positive-samples-'+key+'.json')); windows=read(root/('windows-'+key+'.json'))
    decisions=read(decision_path)
    if decisions.get('runId')!=run or decisions.get('reviewerType') not in ('model','human'):
        raise ValueError('Review must identify this pilot and actual reviewer type')
    expected={s['sampleId']:s for s in sample['samples']}; reviewed={r['sampleId']:r for r in decisions['positiveReviews']}
    ground={w['id']:w for w in decisions['windowReviews']}
    if set(expected)!=set(reviewed) or set(ground)!={w['id'] for w in windows['windows']}:
        raise ValueError('Every frozen positive sample and independent window requires a review')
    if len(reviewed)!=len(decisions['positiveReviews']) or len(ground)!=len(decisions['windowReviews']):
        raise ValueError('Duplicate review IDs')
    stats={r:{'correct':0,'total':0,'errors':[]} for r in ('cites_reference','mentions_entity','topic_match')}; rule_stats={}
    for id,value in reviewed.items():
        if type(value.get('correct')) is not bool or not value.get('reason'): raise ValueError('A reason and boolean correctness are required')
        source=expected[id]; stat=stats[source['relation']]; stat['total']+=1; stat['correct']+=int(value['correct'])
        if not value['correct']: stat['errors'].append(id)
        if source['relation']=='topic_match':
            rule=json.loads(source['qualifiers'])['rule']; rs=rule_stats.setdefault(rule,dict(total=0,correct=0)); rs['total']+=1; rs['correct']+=int(value['correct'])
    inputs=Inputs(latest['manifest']); truth_total=hits=0; misses=[]
    fields=('book','chapter','verse','endChapter','endVerse')
    try:
        for window in windows['windows']:
            review=ground[window['id']]
            if not review.get('reason') or not isinstance(review.get('explicitCitations'),list): raise ValueError('Window review requires independent truth and notes, including zero-citation windows')
            found,_=inputs.parser.extract(window['text']); actual={tuple(h[f] for f in fields) for h in found}
            for truth in review['explicitCitations']:
                keyref=tuple(truth[f] for f in fields); truth_total+=1
                if keyref in actual: hits+=1
                else: misses.append(dict(windowId=window['id'],reference=truth))
    finally: inputs.close()
    def ratio(relation):
        s=stats[relation]; return s['correct']/s['total'] if s['total'] else 0
    recall=hits/truth_total if truth_total else None
    citations=ratio('cites_reference')>=.99 and recall is not None and recall>=.9 and not decisions.get('systematicCitationErrors')
    entities=ratio('mentions_entity')>=.98 and not decisions.get('systematicEntityErrors')
    topic_gate=ratio('topic_match')>=.95
    all_rules=[r['id'] for r in load_pack()['rules']]
    failed=set(decisions.get('deferredTopicRules',[]))
    # Isolate failed rules instead of withholding independently passing rules.
    # Unsampled rules are deferred; small denominators stay visible in the policy.
    passing=[id for id in all_rules if id not in failed and rule_stats.get(id,{}).get('total',0)>0 and rule_stats[id]['correct']==rule_stats[id]['total']]
    policy=dict(runId=run,reviewComplete=True,reviewerType=decisions['reviewerType'],humanTheologicalReview=False,
        positiveReviews=stats,independentWindows=len(windows['windows']),explicitCitationTruth=truth_total,foundExplicitCitations=hits,
        citationRecall=recall,missedCitations=misses,citationsPassed=citations,entitiesPassed=entities,passingTopicRules=passing,
        deferredTopicRules=[id for id in all_rules if id not in passing],topicRuleReviews=rule_stats,
        unfilteredTopicGatePassed=topic_gate,passingTopicReviewCount=sum(rule_stats[id]['total'] for id in passing),
        systematicCitationErrors=decisions.get('systematicCitationErrors',[]),systematicEntityErrors=decisions.get('systematicEntityErrors',[]),
        scope='model/human review of literal evidence and intended term sense only; interpretation and other languages deferred',
        decisionFile=str(Path(decision_path).resolve()),decisionSha256=__import__('hashlib').sha256(Path(decision_path).read_bytes()).hexdigest(),checkedAt=now())
    graph=Graph(latest['graphPath'])
    try:
        for value in [*decisions['positiveReviews'],*decisions['windowReviews']]:
            id=identity('review',run,decisions['reviewerType'],value)
            graph.db.execute('INSERT OR IGNORE INTO reviews VALUES(?,?,?,?,?)',(id,run,decisions['reviewerType'],'accept' if value.get('correct',True) else 'reject',dumps(value)))
        graph.db.commit()
    finally: graph.close()
    write_json(root/'quality-policy.json',policy)
    return policy


def freeze_windows(inputs, config, sample, run):
    path=config['state_dir']/'graph-development'/('windows-'+run.split(':')[-1]+'.json')
    if path.exists(): return
    choices=[]
    for doc in sample['documentIds']:
        rows=inputs.corpus.execute('SELECT id,text,locator FROM chunks WHERE document_id=?',(doc,))
        chosen=min(rows,key=lambda r:identity('independent-window','windows-v1',r['id']),default=None)
        if not chosen: continue
        # A bounded, independently selected original window, not a citation-hit window.
        start=max(0,(len(chosen['text'])-900)//2); end=min(len(chosen['text']),start+900)
        choices.append(dict(id=identity('window',chosen['id'],start,end),documentId=doc,chunkId=chosen['id'],
            start=start,end=end,text=chosen['text'][start:end],textHash=text_hash(chosen['text']),locator=chosen['locator'],
            score=identity('window-order',chosen['id'])))
    choices.sort(key=lambda r:r['score'])
    write_json(path,dict(runId=run,seed='windows-v1',selection='one hash-selected source chunk per pilot identity, centred 900-code-point window',
                         beforeExtraction=True,windows=choices[:100],denominator=len(choices[:100]),reviewerType=None))


def review_samples(config, path, run):
    root=config['state_dir']/'graph-development'; db=readonly(path)
    manifest=json.loads(db.execute('SELECT s.manifest FROM snapshots s JOIN runs r ON r.snapshot_id=s.id WHERE r.id=?',(run,)).fetchone()[0])
    corpus=readonly(manifest['corpusPath']); result=[]; counts={}
    try:
        for relation in ('cites_reference','mentions_entity','topic_match'):
            rows=db.execute('''SELECT a.id assertionId,a.object,a.qualifiers,o.id observationId,o.chunk_id chunkId,o.start,o.end,o.literal,o.locator
                           FROM run_assertions r JOIN assertions a ON a.id=r.assertion_id JOIN assertion_evidence e ON e.assertion_id=a.id
                           JOIN observations o ON o.id=e.observation_id JOIN run_observations z ON z.observation_id=o.id AND z.run_id=r.run_id
                           WHERE r.run_id=? AND a.relation=?''',(run,relation))
            # Stable lowest hashes, bounded memory; each located observation once.
            choices={}
            for row in rows:
                value=dict(row); key=identity('positive-review-v1',relation,row['observationId'])
                if key in choices: continue
                choices[key]=value
                if len(choices)>100: choices.pop(max(choices))
            counts[relation]=len(choices)
            for key,value in sorted(choices.items()):
                body=corpus.execute('SELECT text,document_id,title FROM chunks WHERE id=?',(value['chunkId'],)).fetchone()
                value.update(relation=relation,sampleId=key,documentId=body['document_id'],title=body['title'],
                    context=body['text'][max(0,value['start']-130):min(len(body['text']),value['end']+150)])
                value['targetMetadata']=json.loads(db.execute('SELECT metadata FROM entities WHERE id=?',(value['object'],)).fetchone()[0])
                if relation=='cites_reference': value['parsedReference']=dict(db.execute('SELECT * FROM citation_refs WHERE entity_id=?',(value['object'],)).fetchone())
                result.append(value)
        output=dict(runId=run,seed='positive-review-v1',selection='deterministic frozen hash sample of located observations; selected after candidates exist',
                    requestedPerRelation=100,actualDenominators=counts,reviewerType=None,samples=result)
        write_json(root/('positive-samples-'+run.split(':')[-1]+'.json'),output)
        return dict(actualDenominators=counts,path=str(root/('positive-samples-'+run.split(':')[-1]+'.json')))
    finally: db.close(); corpus.close()


def benchmark(config,path,run):
    db=readonly(path); manifest=json.loads(db.execute('SELECT s.manifest FROM snapshots s JOIN runs r ON r.snapshot_id=s.id WHERE r.id=?',(run,)).fetchone()[0]); db.close()
    corpus=readonly(manifest['corpusPath']); tables=Tables(path,run)
    topics=[r['topic'] for r in load_pack()['rules']]; topics=list(dict.fromkeys(topics))
    refs=[('rom',4),('jhn',3),('eph',2),('psa',23),('heb',11),('gen',3),('isa',53),('1co',15),('mat',6),('gal',3),
          ('rom',8),('jhn',17),('heb',9),('psa',130),('gen',17),('2co',5),('1jn',1),('mat',28),('act',2),('php',2)]
    books={b['code'].lower():b['name'] for b in json.loads(corpus.execute("SELECT value FROM meta WHERE key='catalog'").fetchone()[0])['books']}
    questions=[dict(kind='passage',book=b,chapter=c,literal=books[b]+' '+str(c),question=f'Which source sections explicitly cite {books[b]} {c}?') for b,c in refs]
    questions += [dict(kind='topic',topic=t,literal=t.replace('-',' '),question='Which literal source evidence matches '+t+'?') for t in topics]
    for name in ('John Owen','John Calvin','Martin Luther','John Piper','Thomas Watson','Thomas Boston','John Bunyan','John Gill','Alistair Begg','Charles Spurgeon'):
        row=tables.db.execute('SELECT id FROM entities WHERE kind=\'historical_person\' AND label=?',(name,)).fetchone()
        questions.append(dict(kind='author',entity=row[0] if row else 'unresolved-author:'+name,literal=name,question='Which registered works and source sections are attributed to '+name+'?'))
    for name in ('Nebuchadnezzar','Melchizedek','Mary Magdalene','Methuselah','Mount Sinai','Mount Zion','Sea of Galilee','Synod of Dort'):
        row=tables.db.execute("SELECT id FROM entities WHERE label=? AND kind IN ('biblical_person','place','organization','historical_person')",(name,)).fetchone()
        questions.append(dict(kind='entity',entity=row[0] if row else 'unresolved-entity:'+name,literal=name,question='Where does the source explicitly mention '+name+'?'))
    selection=json.loads((config['state_dir']/'graph-development/pilot-selection.json').read_text('utf8'))
    for i in range(6):
        questions.append(dict(kind='shared',left=selection['documentIds'][i*2],right=selection['documentIds'][i*2+1],literal=topics[i].replace('-',' '),question=f'What identical explicit reference ranges are shared by frozen pilot source pair {i+1}?'))
    for i,q in enumerate(questions): q['id']=i
    root=config['state_dir']/'graph-development'
    write_json(root/'benchmark-questions.json',dict(seed='benchmark-v2',questions=questions,scope='50 distinct predefined passage/topic/author/entity/source-pair questions; frozen before lookup; no theological inference'))
    records=[]
    try:
        for question in questions:
            literal=question['literal']
            started=time.monotonic()
            rows=corpus.execute('SELECT c.id,c.kind FROM chunks_fts f JOIN chunks c ON c.rowid=f.rowid WHERE chunks_fts MATCH ? LIMIT 20',(fts_phrase(literal.replace('-',' ')),)).fetchall()
            lexical=time.monotonic()-started; started=time.monotonic()
            if question['kind']=='topic': table=tables.topic(question['topic'],20)
            elif question['kind']=='passage': table=tables.passage(question['book'],question['chapter'],limit=20)
            elif question['kind']=='shared': table=tables.shared(question['left'],question['right'],20)
            else: table=getattr(tables,question['kind'])(question['entity'],20)
            graph=time.monotonic()-started
            records.append(dict(question=question,lexicalSeconds=round(lexical,4),graphSeconds=round(graph,4),lexicalResultIds=[r['id'] for r in rows],
                                graphAssertionIds=[r.get('assertionId') for r in table['rows']],fallbackNeeded=not table['rows'],
                                assessment='bounded identity/evidence lookup; unsupported scope retains lexical fallback; failed pilot extraction rules are not production evidence',
                                lexicalScope='literal FTS phrase baseline; source-pair question uses topic lexical discovery rather than a pair intersection'))
        times=sorted(r['graphSeconds'] for r in records)
        result=dict(runId=run,questions=50,p95GraphSeconds=times[47],meetsLatencyTarget=times[47]<2,
                    vectorComparison='deferred until verified vector completion; no encoder calls',
                    relevanceReview='operational evidence lookup comparison; theological relevance/path usefulness not human graded',results=records)
        write_json(root/('benchmark-'+run.split(':')[-1]+'.json'),result)
        return {k:v for k,v in result.items() if k!='results'}
    finally: corpus.close(); tables.close()
