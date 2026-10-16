"""KR-120 lexical relationship contracts; no implied speaker or influence."""
import hashlib
import re
import zlib
from collections import deque

VERSION='kr120-lexical-v1'
CONFIG={'tokens_per_shingle':16,'winnow_span':64,'max_postings_per_feature':32,
        'max_windows_per_group':2,'reference_range':'exact canonical book/first/last',
        'scope':'All supported parent documents; native/recorded section windows only; candidate headings and document fallback explicitly deferred',
        'normalization':'Unicode word tokens casefolded; long s mapped to s; punctuation/spacing ignored; accents preserved',
        'semantic':{'enabled':False,'model':None,'build':None,'vector_version':None,'coverage':0},
        'interpretation':'Shared wording or references are candidates only; no quotation direction, attribution, influence, agreement or endorsement inference',
        'population_dependency':'Feature frequency and candidate neighbors recomputed for each input generation; no cross-generation selective reuse claimed'}
WORD=re.compile(r'[^\W_]+',re.UNICODE)

def tokens(text):
    return [(m.group().casefold().replace('ſ','s'),m.start(),m.end()) for m in WORD.finditer(text)]

def fingerprints(text,k=16,width=64):
    """Winnowed rolling token hashes; emitted keys use SHA256 of actual token sequence."""
    ts=tokens(text)
    if len(ts)<k:return []
    vals=[zlib.crc32(t[0].encode('utf-8')) for t in ts];mask=(1<<64)-1;base=1000003
    power=pow(base,k-1,1<<64);h=0
    for v in vals[:k]:h=(h*base+v)&mask
    rolling=[h]
    for i in range(k,len(vals)):
        h=(((h-vals[i-k]*power)&mask)*base+vals[i])&mask;rolling.append(h)
    width=min(width,len(rolling));queue=deque();selected=[];last=-1
    for i,h in enumerate(rolling):
        while queue and queue[0]<=i-width:queue.popleft()
        while queue and rolling[queue[-1]]>=h:queue.pop()
        queue.append(i)
        if i>=width-1 and queue[0]!=last:
            last=queue[0];selected.append(last)
    out=[];seen=set()
    for i in selected:
        norm=' '.join(t[0] for t in ts[i:i+k]);key=hashlib.sha256(norm.encode()).hexdigest()
        if key in seen:continue
        seen.add(key);a,b=ts[i][1],ts[i+k-1][2]
        out.append((key,a,b,hashlib.sha256(text[a:b].encode()).hexdigest()))
    return out

SCHEMA='''
CREATE TABLE IF NOT EXISTS relationship_runs(id TEXT PRIMARY KEY,state TEXT,contract_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS scope(run_id TEXT,document_id TEXT,disposition TEXT,language TEXT,work_id TEXT,edition_id TEXT,independence_group TEXT,descriptor_json TEXT,fingerprint TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS dependencies(run_id TEXT,document_id TEXT,kind TEXT,key TEXT,fingerprint TEXT,details_json TEXT,PRIMARY KEY(run_id,document_id,kind,key));
CREATE TABLE IF NOT EXISTS document_results(run_id TEXT,document_id TEXT,native_windows INTEGER,deferred_windows INTEGER,short_windows INTEGER,fingerprints INTEGER,references_count INTEGER,seconds REAL,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS postings(run_id TEXT,channel TEXT,bucket INTEGER,feature TEXT,window_id INTEGER,document_id TEXT,independence_group TEXT,start INTEGER,end INTEGER,witness_hash TEXT,parent_reference_id INTEGER,PRIMARY KEY(run_id,channel,feature,window_id));
CREATE INDEX IF NOT EXISTS postings_bucket ON postings(run_id,bucket,channel,feature);
CREATE INDEX IF NOT EXISTS postings_window ON postings(run_id,window_id);
CREATE TABLE IF NOT EXISTS feature_stats(run_id TEXT,channel TEXT,feature TEXT,postings INTEGER,groups_count INTEGER,disposition TEXT,PRIMARY KEY(run_id,channel,feature));
CREATE TABLE IF NOT EXISTS pair_evidence(run_id TEXT,left_window INTEGER,right_window INTEGER,channel TEXT,feature TEXT,left_start INTEGER,left_end INTEGER,right_start INTEGER,right_end INTEGER,left_hash TEXT,right_hash TEXT,PRIMARY KEY(run_id,left_window,right_window,channel,feature));
CREATE INDEX IF NOT EXISTS pairs_right ON pair_evidence(run_id,right_window);
CREATE TABLE IF NOT EXISTS bucket_results(run_id TEXT,bucket INTEGER,features INTEGER,evidence INTEGER,frequent_deferred INTEGER,seconds REAL,PRIMARY KEY(run_id,bucket));
'''
