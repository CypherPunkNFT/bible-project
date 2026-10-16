"""KR-130 surface argument candidates. No automatic theological endorsement."""
VERSION='kr130-surface-v1'
CONFIG={
 'supported':'All pinned KR-101 supported descriptors labelled exactly en; native/recorded segments plus explicitly coarse document-representation fallback. Unreviewed heading boundaries excluded. Explicit English surface cues only.',
 'units':'Unicode codepoint sentence/clause windows, capped at 3000 codepoints; line wrapping retained, long/unfinished clauses deferred; overlapping locations deduplicated to smallest supported containing section.',
 'attribution':'Exact report-name label when locally explicit, otherwise unresolved quoted/reported speaker. Unquoted source-author is candidate only; composite labels/reader membership never resolve speaker identities.',
 'endorsement':'objections not-endorsed; reports/quotes/general narrator unresolved; explicit first-person assertion/reply is author-assertion candidate only, never reviewed endorsement',
 'negation':'Lexical cue presence only, no logical polarity inference; not-only excluded. Scope qualifiers retained as literal source witnesses.',
 'links':'Structural within selected section and source block, bounded 12000 codepoints; nearest objection/reply candidate only, no missing premise inference.',
 'language_detection':'Source label en is assertion, not detected English; mismislabeled/archaic/mixed/OCR cases remain candidates and evaluation failures.',
 'vectors':None,'generation_model':None,'public_output':False,'cross_generation_reuse':'unproved; complete rebuild in a new generation',
 'limits':{'max_clause_characters':3000,'link_distance':12000,'query_limit':20},
}
SCHEMA='''
CREATE TABLE IF NOT EXISTS argument_runs(id TEXT PRIMARY KEY,state TEXT,contract_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS scope(run_id TEXT,document_id TEXT,disposition TEXT,reason TEXT,descriptor_json TEXT,fingerprint TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS dependencies(run_id TEXT,document_id TEXT,kind TEXT,key TEXT,fingerprint TEXT,details_json TEXT,PRIMARY KEY(run_id,document_id,kind,key));
CREATE TABLE IF NOT EXISTS statements(id TEXT PRIMARY KEY,run_id TEXT,document_id TEXT,version_id TEXT,segment_ordinal INTEGER,start INTEGER,end INTEGER,text TEXT,text_sha256 TEXT,kind TEXT,speaker_label TEXT,speaker_role TEXT,attribution_basis TEXT,endorsement TEXT,negation TEXT,state TEXT,uncertainty_json TEXT,work_id TEXT,edition_id TEXT);
CREATE INDEX IF NOT EXISTS statements_run_document ON statements(run_id,document_id);
CREATE INDEX IF NOT EXISTS statements_kind ON statements(run_id,kind,id);
CREATE INDEX IF NOT EXISTS statements_speaker ON statements(run_id,speaker_label,id);
CREATE TABLE IF NOT EXISTS source_spans(statement_id TEXT PRIMARY KEY,coordinate TEXT,path TEXT,asset_sha256 TEXT,block_ordinal INTEGER,locator TEXT,section_start INTEGER,section_end INTEGER,block_text_sha256 TEXT,section_span_sha256 TEXT);
CREATE TABLE IF NOT EXISTS qualifications(id TEXT PRIMARY KEY,statement_id TEXT,kind TEXT,start INTEGER,end INTEGER,literal TEXT,text_sha256 TEXT,state TEXT);
CREATE INDEX IF NOT EXISTS qualifications_statement ON qualifications(statement_id);
CREATE TABLE IF NOT EXISTS argument_links(id TEXT PRIMARY KEY,run_id TEXT,source_id TEXT,target_id TEXT,kind TEXT,basis TEXT,state TEXT);
CREATE INDEX IF NOT EXISTS links_statement ON argument_links(source_id);
CREATE TABLE IF NOT EXISTS contributors(run_id TEXT,document_id TEXT,ordinal INTEGER,label TEXT,role TEXT,basis TEXT,PRIMARY KEY(run_id,document_id,ordinal));
CREATE TABLE IF NOT EXISTS document_results(run_id TEXT,document_id TEXT,sections INTEGER,segments INTEGER,characters INTEGER,clauses INTEGER,statements INTEGER,qualifications INTEGER,links INTEGER,deferrals_json TEXT,seconds REAL,PRIMARY KEY(run_id,document_id));
CREATE VIRTUAL TABLE IF NOT EXISTS statement_search USING fts5(id UNINDEXED,run_id UNINDEXED,text,tokenize='unicode61');
'''
