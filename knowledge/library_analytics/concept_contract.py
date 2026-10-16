"""KR-110 source-span concepts: definitions, evidence and frozen evaluation policy."""
import json
import re
import unicodedata
from pathlib import Path
from .build import PROJECT
from .inputs import digest
from ..enrichment.rules import load_pack
from .research_evaluation import questions, TARGETS

VERSION='kr110-concepts-v1'
WINDOW=1800
SCHEMA='''
CREATE TABLE IF NOT EXISTS concept_runs(id TEXT PRIMARY KEY,state TEXT,contract_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS documents(run_id TEXT,document_id TEXT,disposition TEXT,language TEXT,author_label TEXT,
 work_id TEXT,edition_id TEXT,independence_group TEXT,independence_basis TEXT,descriptor_json TEXT,fingerprint TEXT,
 PRIMARY KEY(run_id,document_id));
CREATE INDEX IF NOT EXISTS docs_constraints ON documents(run_id,language,author_label,work_id);
CREATE TABLE IF NOT EXISTS contributors(run_id TEXT,document_id TEXT,contributor_id TEXT,role TEXT,
 PRIMARY KEY(run_id,document_id,contributor_id,role));
CREATE INDEX IF NOT EXISTS contributor_lookup ON contributors(run_id,contributor_id,role,document_id);
CREATE TABLE IF NOT EXISTS concept_sections(run_id TEXT,version_id TEXT,document_id TEXT,kind TEXT,state TEXT,
 heading TEXT,PRIMARY KEY(run_id,version_id));
CREATE INDEX IF NOT EXISTS concept_sections_doc ON concept_sections(run_id,document_id);
CREATE TABLE IF NOT EXISTS windows(id INTEGER PRIMARY KEY,run_id TEXT,document_id TEXT,version_id TEXT,
 segment_ordinal INTEGER,start INTEGER,end INTEGER,text_sha256 TEXT,kind TEXT,state TEXT,
 UNIQUE(run_id,version_id,segment_ordinal,start,end));
CREATE INDEX IF NOT EXISTS windows_doc ON windows(run_id,document_id);
CREATE VIRTUAL TABLE IF NOT EXISTS window_fts USING fts5(heading,body,content='',tokenize='unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS concept_occurrences(id INTEGER PRIMARY KEY,window_id INTEGER,concept_id TEXT,
 rule_id TEXT,start INTEGER,end INTEGER,literal TEXT,basis TEXT,ambiguity TEXT);
CREATE INDEX IF NOT EXISTS occurrences_concept ON concept_occurrences(concept_id,window_id);
CREATE INDEX IF NOT EXISTS occurrences_window ON concept_occurrences(window_id);
CREATE TABLE IF NOT EXISTS reference_occurrences(id INTEGER PRIMARY KEY,window_id INTEGER,book TEXT,
 first INTEGER,last INTEGER,start INTEGER,end INTEGER,literal TEXT,reference_kind TEXT);
CREATE INDEX IF NOT EXISTS reference_lookup ON reference_occurrences(book,first,last,window_id);
CREATE TABLE IF NOT EXISTS document_results(run_id TEXT,document_id TEXT,windows INTEGER,concepts INTEGER,
 references_count INTEGER,rejections INTEGER,characters INTEGER,seconds REAL,disposition TEXT,
 PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS dependencies(run_id TEXT,document_id TEXT,kind TEXT,key TEXT,fingerprint TEXT,
 details_json TEXT,PRIMARY KEY(run_id,document_id,kind,key));
CREATE INDEX IF NOT EXISTS dependency_reverse ON dependencies(kind,key,run_id,document_id);
CREATE TABLE IF NOT EXISTS rules(run_id TEXT,rule_id TEXT,concept_id TEXT,definition_json TEXT,
 PRIMARY KEY(run_id,rule_id));
'''

def ruleset(project=PROJECT):
    path=Path(project)/'Website/content/library/vocabulary.json'
    vocabulary=json.loads(path.read_text('utf-8-sig'))
    subjects={s['id']:s for s in vocabulary['subjects']}
    pack=load_pack(); rules=[]
    for r in pack['rules']:
        if r['topic'] not in subjects: raise ValueError('Unregistered topic: '+r['topic'])
        rules.append({**r,'language':'en','basis':'contextual-rule-candidate'})
    # Vocabulary labels are literal candidates, never automatically disambiguated senses.
    for s in subjects.values():
        rules.append({'id':'vocabulary:'+s['id'],'topic':s['id'],'phrase':s['label'],
            'aliases':s.get('aliases',[]),'language':'en','basis':'ambiguous-vocabulary-mention',
            'definition':s['definition']})
    return {'version':VERSION,'vocabulary_sha256':digest(vocabulary),'pack':pack,'rules':rules}

class Matcher:
    def __init__(self,rules):
        self.rules=rules; phrases={}
        for r in rules:
            for p in [r['phrase'],*r.get('aliases',[])]: phrases.setdefault(p.casefold(),[]).append(r)
        self.by_group={}; parts=[]
        for i,(phrase,rs) in enumerate(sorted(phrases.items(),key=lambda p:(-len(p[0]),p[0]))):
            key='p'+str(i);self.by_group[key]=rs
            parts.append('(?P<'+key+'>'+r'\s+'.join(re.escape(w) for w in phrase.split())+')')
        self.pattern=re.compile(r'(?<!\w)(?:'+'|'.join(parts)+r')(?!\w)',re.I)
    def extract(self,text,language):
        if language not in ('en','enm'): return []
        hits=[]
        for m in self.pattern.finditer(text):
            for r in self.by_group[m.lastgroup]:
                context=unicodedata.normalize('NFKC',text[max(0,m.start()-180):m.end()+180]).casefold()
                if any(x.casefold() in context for x in r.get('exclude',[])): continue
                if r.get('contextAny') and not any(x.casefold() in context for x in r['contextAny']): continue
                hits.append((r['topic'],r['id'],m.start(),m.end(),m.group(),r['basis'],
                    'speaker/endorsement unresolved; vocabulary sense not adjudicated'))
        return hits

def evaluation_contract():
    rubrics={
      'passage-exposition':'Useful requires substantive explanation of the named passage and issue; an incidental citation or matching heading is insufficient.',
      'author-comparison':'Useful requires relevant substantive passages by BOTH requested authors, with source author metadata and edition retained. Do not attribute quoted opponents to the author. One-sided results are partial failures.',
      'practical-sermons':'Useful requires pastoral counsel addressing the actual concern within an attributable sermon or clearly labelled devotional context. Mere word occurrence is insufficient.',
      'quotations-parallels':'Useful requires located text at both ends and evidence distinguishing a quotation from common wording; isolated name mentions fail. Relationship inference deferred to KR-120.',
      'history':'Useful requires located historical evidence with the requested date/person role, not a lexical match. Unsupported date/identity inference fails; KR-140 owns historical linkage.',
      'multilingual':'Useful requires both requested language passages and supported correspondence/numbering/translator distinction. English mentions of Latin terms fail; KR-140 owns translation alignment.'}
    return {'version':'kr110-evaluation-freeze-v1','questions':[
        {**q,'expected_evidence':rubrics[q['family']]} for q in questions()],
        'baseline':'Same population and constraints; raw question content words, FTS5 BM25 heading weight 3/body 1, top five, no topic expansion/reference fusion/work diversification.',
        'assessment':'Blind pooled candidate review where possible; model-assisted by Codex, never human. Deterministic offsets/constraints reported separately. Unjudged is not relevant.',
        'metrics':['useful question success@5','reciprocal rank of useful evidence','precision@5','author constraint violations','known independent works','context adequacy'],
        'failure_classes':['no-results','incidental-mention','wrong-sense','wrong-author','one-sided-comparison','front-matter','insufficient-context','unresolved-attribution','unsupported-relationship','unsupported-history','unsupported-language-alignment'],
        'targets':TARGETS['later_retrieval_release'],'reserved_policy':'48 reserved questions evaluated only after development method is frozen; no tuning on their results',
        'gold_policy':'Expected evidence criteria frozen before retrieval tuning; no fabricated gold spans or exhaustive recall claim.'}
