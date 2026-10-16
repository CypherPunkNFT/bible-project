"""Generation-bound located lexical/reference retrieval with explicit constraints."""
import argparse
from collections import Counter,defaultdict
import json
import re
import time
from pathlib import Path
from .build import PROJECT,readonly
from .inputs import packed,digest
from .concept_index import root,read,fts_name,filehash
from .section_contract import resolve_segment,text_hash
from .jobs import StaleInput
from ..enrichment.foundation import author_labels
from ..enrichment.citations import CitationParser
from .references import ReferenceScanner

VERSION='kr110-query-v2'
STOP=set('a an and are as at be by for from how i in into is it of on or that the their them these this to was we what when where which who with without within find held sections explaining distinguish exposition incidental citation locate compare preserving objections qualifications edition identities attributed sermon addressing surrounding pastoral context source evidence separating event composition acquisition dates language sense translator numbering uncertainty'.split())

def terms(query):return list(dict.fromkeys(t.casefold() for t in re.findall(r'[^\W_]+',query) if t.casefold() not in STOP))[:32]
def expression(query):return ' OR '.join('"'+t+'"' for t in terms(query))
def focused_expression(query):
    words=[t for t in terms(query) if not t.isdecimal() and len(t)>1][:10]
    return ' AND '.join('"'+t+'"' for t in words) if len(words)>1 else ''
def normalized_author_labels(value):
    return author_labels(re.sub(r'\([^)]*\)','',value or ''))

def attribution_conflicts(descriptor):
    label=descriptor.get('author_label') or '';words=set(re.findall(r'[^\W\d_]+',label.casefold()))
    conflicts=[]
    for ident,role in descriptor.get('memberships',[]):
        if role in ('author','preacher','speaker') and ident.startswith('author-'):
            surname=ident.split('-')[-1]
            if words and surname not in words:conflicts.append({'author_label':label,'contributor_id':ident,'role':role})
    return conflicts

def front_matter(heading,text):
    if re.search(r'\b(contents|index|copyright|subscribe|related resources|related articles|bibliography)\b',heading,re.I):return 'heading suggests front matter/navigation'
    if any(s in text for s in ('Adding to My Library','Sign In\n','Register!','Topics\n')):return 'web navigation/topic listing mixed with source preview'
    if re.match(r'^\s*(?:table\s+of\s+contents|contents|index\s+of|scripture\s+index)\b',text,re.I):return 'body begins with contents/index apparatus'
    if heading.strip().casefold() in ('footnotes','endnotes','references','scripture references'):return 'reference apparatus'
    return None

def question_evidence_issue(heading,text):
    apparatus=front_matter(heading,text)
    if apparatus:return apparatus
    nonspace=sum(not c.isspace() for c in text)
    if nonspace and sum(c.isalpha() for c in text)/nonspace<.35:return 'predominantly numerical reference/index material'
    if len(re.findall(r'[^\W\d_]+',text))<35:return 'too little prose for substantive question evidence'
    return None

class Retriever:
    def __init__(self,project=PROJECT,calibration=False):
        setup_started=time.monotonic()
        self.project=Path(project);self.summary=read(root(project)/('calibration.json' if calibration else 'population.json'))
        if self.summary['state']!='population-complete':raise ValueError('Complete population required')
        self.run=self.summary['run_id'];self.contract=self.summary['contract'];self.db=readonly(Path(self.summary['database']))
        self.db.execute('PRAGMA cache_size=-65536');self.fts=fts_name(self.run)
        self.sections=readonly(Path(self.contract['parents'][0]['database']))
        self.alignment=readonly(Path(self.contract['parents'][1]['database']))
        self.srun=self.contract['parents'][0]['run_id'];self.arun=self.contract['parents'][1]['run_id']
        changed=[]
        for dep in self.sections.execute('SELECT path,size,mtime_ns FROM research_inputs WHERE run_id=?',(self.srun,)):
            p=Path(dep['path'])
            if not p.is_file() or (p.stat().st_size,p.stat().st_mtime_ns)!=(dep['size'],dep['mtime_ns']):changed.append(str(p))
        if changed:raise StaleInput('Population-dependent retrieval stale after source change: '+packed(changed[:20]))
        for p,h in zip(self.contract['parents'],self.contract['parent_summary_hashes']):
            if filehash(p['summary'])!=h:raise StaleInput('Selected parent changed')
        self.rules=[json.loads(r[0]) for r in self.db.execute('SELECT definition_json FROM rules WHERE run_id=?',(self.run,))]
        section_summary=read(self.contract['parents'][0]['summary']);bundle=section_summary['contract']['text_bundle']
        upstream=readonly(Path(bundle['database']))
        try:config=json.loads(upstream.execute('SELECT parser_json FROM text_runs WHERE id=?',(bundle['run_ids'][0],)).fetchone()[0])
        finally:upstream.close()
        self.scanner=ReferenceScanner(CitationParser(config['books'],{(b,c):v for b,c,v in config['bounds']}))
        self.setup_seconds=time.monotonic()-setup_started
    def close(self):self.db.close();self.sections.close();self.alignment.close()

    def constraints(self,author=None,work=None,language=None,include_candidates=False,include_documents=False):
        sql='w.run_id=?';args=[self.run]
        if not include_candidates:sql+=" AND w.state!='candidate-unreviewed'"
        if not include_documents:sql+=" AND w.kind!='document-representation'"
        if language:sql+=' AND d.language=?';args.append(language)
        if work:sql+=' AND d.work_id=?';args.append(work)
        if author:
            # Canonical author membership is role-filtered. A label must match a complete
            # source author label, never a person mentioned in the text or reader membership.
            labels=normalized_author_labels(author)
            docs=[]
            for r in self.db.execute('SELECT document_id,author_label,descriptor_json FROM documents WHERE run_id=? AND disposition=\'supported\'',(self.run,)):
                d=json.loads(r['descriptor_json'])
                exact_id=any(ident==author and role=='author' for ident,role in d.get('memberships',[]))
                if (exact_id or labels & normalized_author_labels(r['author_label'])) and not attribution_conflicts(d):docs.append(r['document_id'])
            if docs:sql+=' AND w.document_id IN ('+','.join('?' for _ in docs)+')';args+=docs
            else:sql+=' AND 0'
        return sql,args

    def search(self,query,mode='concept',author=None,work=None,language=None,include_candidates=False,include_documents=False,limit=5,context=500):
        if mode not in ('baseline','concept') or not 0<len(query)<=1000:raise ValueError('Invalid query')
        started=time.monotonic();where,args=self.constraints(author,work,language,include_candidates,include_documents)
        if mode=='concept':where+=' AND w.end-w.start>=160'
        channels={};match=expression(query)
        def lexical(expr):
            if not expr:return []
            return [dict(r) for r in self.db.execute('SELECT w.id,'+self.fts+'.rank score FROM '+self.fts+
                ' JOIN windows w ON w.id='+self.fts+'.rowid JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE '+
                self.fts+" MATCH ? AND "+self.fts+".rank MATCH 'bm25(3,1)' AND "+where+' ORDER BY '+self.fts+'.rank LIMIT 80',[expr,*args])]
        channels['lexical']=lexical(match)
        if mode=='concept':
            focused=focused_expression(query)
            if focused:channels['focused-lexical']=lexical(focused)
            selected=[];qs=set(terms(query));expanded=[]
            for r in self.rules:
                if r['topic'].replace('-',' ') in query.casefold() or any(set(terms(p))<=qs and terms(p) for p in [r['phrase'],*r.get('aliases',[])]):
                    selected.append(r['topic']);expanded.extend([r['phrase'],*r.get('aliases',[])])
            if expanded:
                ex=' OR '.join('"'+p.replace('"','""')+'"' for p in sorted(set(expanded)))
                channels['expanded-lexical']=lexical(ex)
                topics=sorted(set(selected));marks=','.join('?' for _ in topics)
                channels['located-concept']=[dict(r) for r in self.db.execute('SELECT w.id,count(DISTINCT o.rule_id) score FROM concept_occurrences o JOIN windows w ON w.id=o.window_id JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE o.concept_id IN ('+marks+') AND '+where+
                    ' GROUP BY w.id ORDER BY score DESC,w.id LIMIT 80',[*topics,*args])]
            refs,_=self.scanner.extract(query)
            if refs:
                headings=[]
                for h in refs:
                    prefix=re.match(r'^(.*?[^\W\d_]\.?\s+\d+)',query[h['start']:h['end']],re.UNICODE)
                    if prefix:headings.append('heading : "'+prefix[1].replace('"','""')+'"')
                if headings:channels['passage-heading']=lexical(' OR '.join(headings))
                predicates=[];reference_args=[]
                for h in refs:
                    predicates.append('(r.book=? AND r.first<=? AND r.last>=?)')
                    reference_args.extend([h['book'],h['endChapter']*1000+h['endVerse'],h['chapter']*1000+h['verse']])
                channels['literal-reference']=[dict(r) for r in self.db.execute('SELECT w.id,count(*) score FROM reference_occurrences r JOIN windows w ON w.id=r.window_id JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE ('+
                    ' OR '.join(predicates)+') AND '+where+' GROUP BY w.id ORDER BY score DESC,w.id LIMIT 80',[*reference_args,*args])]
        scores=defaultdict(float);components=defaultdict(dict)
        weights={'lexical':1.,'focused-lexical':2.5,'passage-heading':2.,'literal-reference':1.25,'expanded-lexical':.5,'located-concept':.35}
        for channel,rows in channels.items():
            for rank,row in enumerate(rows,1):
                weight=weights[channel]
                scores[row['id']]+=weight/(60+rank);components[row['id']][channel]={'rank':rank,'score':row['score'],'weight':weight}
        ordered=sorted(scores,key=lambda wid:(-scores[wid],wid));selected=[];groups=Counter();texts=set();sections=set();excluded=[]
        for wid in ordered:
            row=dict(self.db.execute('SELECT w.*,d.language,d.author_label,d.work_id,d.edition_id,d.independence_group,d.independence_basis,d.descriptor_json FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.id=?',(wid,)).fetchone())
            if mode=='concept' and (groups[row['independence_group']]>=2 or row['text_sha256'] in texts or row['version_id'] in sections):continue
            witness=self.witness(row,context)
            exclusion=question_evidence_issue(witness['section_heading'],witness['text']) if mode=='concept' else None
            if exclusion:
                excluded.append({'window_id':wid,'reason':exclusion});continue
            row.pop('descriptor_json');row.update(witness);row['components']=components[wid];row['rrf_score']=scores[wid]
            row['evidence_role']='located source candidate; quoted speaker and author endorsement unresolved'
            row['reason']='; '.join(components[wid]);row['review_state']='unreviewed-retrieval-candidate'
            selected.append(row);groups[row['independence_group']]+=1;texts.add(row['text_sha256']);sections.add(row['version_id'])
            if len(selected)>=limit:break
        return {'run_id':self.run,'query_version':VERSION,'query':query,'mode':mode,
            'candidate_policy':'Substantive prose candidates: >=160 codepoints and >=35 alphabetic word forms; apparatus filters; weighted lexical/reference fusion' if mode=='concept' else 'Frozen raw-content-word lexical BM25 baseline',
            'constraints':{'author':author,'work':work,'language':language,
            'include_candidates':include_candidates,'include_documents':include_documents},'results':selected,
            'seconds':round(time.monotonic()-started,4),'channels':{k:len(v) for k,v in channels.items()},
            'semantic':self.contract['semantic'],'excluded':excluded,'setup_seconds':round(self.setup_seconds,4),'query_implementation_sha256':filehash(__file__)}

    def witness(self,row,context):
        span=dict(self.sections.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(row['version_id'],row['segment_ordinal'])).fetchone())
        body=resolve_segment(span,{})
        start,end=row['start']-span['start'],row['end']-span['start']
        literal=body[start:end]
        if not 0<=start<end<=len(body) or text_hash(literal)!=row['text_sha256']:raise StaleInput('Window location changed')
        a=max(0,start-context);b=min(len(body),end+context)
        section=dict(self.sections.execute('SELECT * FROM sections WHERE version_id=?',(row['version_id'],)).fetchone())
        descriptor=json.loads(row['descriptor_json'])
        return {'text':literal,'context':body[a:b],'context_start':span['start']+a,'context_end':span['start']+b,
            'source_span':span,'section_heading':section['heading'],
            'section_metadata':json.loads(section['metadata_json']),'attribution_conflicts':attribution_conflicts(descriptor),
            'provenance':{k:descriptor.get(k) for k in ('source_path','original_sha256','source_family','readers','memberships','genre','dates','title')},
            'concepts':[dict(r) for r in self.db.execute('SELECT concept_id,rule_id,start,end,literal,basis,ambiguity FROM concept_occurrences WHERE window_id=?',(row['id'],))],
            'destinations':[dict(r) for r in self.alignment.execute('SELECT * FROM section_destinations WHERE run_id=? AND version_id=?',(self.arun,row['version_id']))],
            'chunk_links':[dict(r) for r in self.alignment.execute('SELECT * FROM section_chunks WHERE run_id=? AND version_id=? AND segment_ordinal=? AND source_start<? AND source_end>? LIMIT 20',(self.arun,row['version_id'],row['segment_ordinal'],row['end'],row['start']))],
            'chunk_link_limit':20,'context_policy':'clipped within verified section segment; no inferred neighboring speaker attribution'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('query');p.add_argument('--baseline',action='store_true')
    p.add_argument('--author');p.add_argument('--work');p.add_argument('--language');p.add_argument('--calibration',action='store_true')
    p.add_argument('--include-candidates',action='store_true');p.add_argument('--include-documents',action='store_true')
    a=p.parse_args();r=Retriever(calibration=a.calibration)
    try:print(packed(r.search(a.query,'baseline' if a.baseline else 'concept',a.author,a.work,a.language,a.include_candidates,a.include_documents)))
    finally:r.close()

if __name__=='__main__':main()
