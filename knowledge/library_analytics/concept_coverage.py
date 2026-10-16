"""Selected-generation scope, ambiguity and work/author coverage accounting."""
from collections import Counter
import json
from .concept_index import root,read
from .concept_query import attribution_conflicts
from .build import readonly,dump
from .inputs import packed

def main():
    pop=read(root()/'population.json');run=pop['run_id'];db=readonly(root()/'concepts.sqlite3')
    try:
        windows=[dict(r) for r in db.execute('SELECT kind,state,count(*) windows,count(DISTINCT document_id) documents FROM windows WHERE run_id=? GROUP BY kind,state',(run,))]
        kinds=Counter()
        for r in windows:kinds['document-fallback' if r['kind']=='document-representation' else 'unreviewed-candidate' if r['state']=='candidate-unreviewed' else 'native-or-recorded']+=r['windows']
        eligible=db.execute("SELECT count(DISTINCT document_id) FROM windows WHERE run_id=? AND state!='candidate-unreviewed' AND kind!='document-representation'",(run,)).fetchone()[0]
        length_pool=dict(db.execute("SELECT count(*) windows,count(DISTINCT document_id) documents FROM windows WHERE run_id=? AND state!='candidate-unreviewed' AND kind!='document-representation' AND end-start>=160",(run,)).fetchone())
        languages=[dict(r) for r in db.execute("SELECT language,count(*) documents FROM documents WHERE run_id=? AND disposition='supported' GROUP BY language",(run,))]
        conflicts=[]
        for r in db.execute("SELECT document_id,descriptor_json FROM documents WHERE run_id=? AND disposition='supported'",(run,)):
            c=attribution_conflicts(json.loads(r['descriptor_json']))
            if c:conflicts.append({'document_id':r['document_id'],'conflicts':c})
        counts=dict(db.execute("SELECT count(*) documents,count(DISTINCT work_id) known_works,sum(work_id IS NULL) unresolved_work_documents,sum(edition_id IS NULL) unresolved_edition_documents,sum(author_label IS NULL OR author_label='') missing_author_labels,count(DISTINCT independence_group) deduplication_groups FROM documents WHERE run_id=? AND disposition='supported'",(run,)).fetchone())
        counts.update(structural_default_pool_documents=eligible,no_default_native_search_documents=counts['documents']-eligible,
            concept_length_eligible_documents=length_pool['documents'],concept_length_eligible_windows=length_pool['windows'],
            topic_language_deferred_documents=sum(r['documents'] for r in languages if r['language'] not in ('en','enm')),
            conflicting_author_metadata_documents=len(conflicts))
        value={'run_id':run,'counts':counts,'window_classes':dict(kinds),'window_strata':windows,'languages':languages,
            'attribution_conflicts':conflicts,'topic_rules':'English/early-English literal and contextual candidates; all other topic languages deferred',
            'semantic_coverage':0,'semantic_deferred_documents':counts['documents'],
            'query_filter_scope':'Structural counts precede query-v2 prose/apparatus checks. Length-eligible counts apply the 160-codepoint floor; the >=35 alphabetic word-form and apparatus filters are measured per returned candidate, not censused over all sources. They can omit short or unsegmented-script evidence.',
            'inherited_adapter_deferrals':113557,'inherited_archive_exclusions':3,
            'basis':'Known work counts exclude unresolved source-byte/document buckets; windows and representations overlap and are not extra books.'}
        dump(root()/'coverage.json',value);print(packed({k:v for k,v in value.items() if k not in ('window_strata','attribution_conflicts','languages')}))
    finally:db.close()

if __name__=='__main__':main()
