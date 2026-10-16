"""Audit the fresh splits and spell out independence/coverage limits."""
from collections import Counter
from .inputs import ROOT,read,write_json,sha
def main():
    files=[ROOT/'evaluation/frozen.json',ROOT/'evaluation/frozen-extra.json'];cases=sum((read(p)['cases'] for p in files),[])
    sets={s:{c['document_id'] for c in cases if c['split']==s} for s in ['development','reserved']}
    works={s:{c['descriptor'].get('work_id') for c in cases if c['split']==s and c['descriptor'].get('work_verified') and c['descriptor'].get('work_id')} for s in sets}
    originals={s:{c['descriptor'].get('original_sha256') for c in cases if c['split']==s and c['descriptor'].get('original_sha256')} for s in sets}
    if sets['development']&sets['reserved']:raise ValueError('Source document leakage')
    result={'frozen_files':[{'path':str(p),'sha256':sha(p)} for p in files],'cases':len(cases),'splits':dict(Counter(c['split'] for c in cases)),'categories':dict(Counter(c['split']+':'+c['category'] for c in cases)),
       'documents':{s:len(v) for s,v in sets.items()},'overlapping_documents':sorted(sets['development']&sets['reserved']),'verified_works':{s:len(v) for s,v in works.items()},'overlapping_verified_works':sorted(works['development']&works['reserved']),'overlapping_original_hashes':sorted(originals['development']&originals['reserved']),
       'sampling_limits':['Purposive difficult cases, not population-random review.','String author groups are sampling buckets, not resolved contributors; Gill bucket includes Gillette minutes.','No primary Aquinas document yielded cases in initial selected descriptors; no Aquinas quality claim.','Source documents are disjoint; unknown work identities and same-work editions do not establish independent-work splits.','OCR, mistranscribed words, front matter and an English-labelled Welsh source retained as failure cases.','Inherited KR-110/LK question splits untouched; this is a separate KR-130 source-case split.']}
    write_json(ROOT/'evaluation/split-audit.json',result);print(result)
if __name__=='__main__':main()
