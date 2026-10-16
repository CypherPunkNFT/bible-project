"""Compare calibration facts across the matcher optimization, ignoring row IDs/timings."""
import hashlib
from .build import readonly,dump
from .concept_index import root,read
from .inputs import packed

def facts(db,run):
    result={}
    for name,sql in {
        'windows':'SELECT document_id,version_id,segment_ordinal,start,end,text_sha256,kind,state FROM windows WHERE run_id=? ORDER BY version_id,segment_ordinal,start,end',
        'concepts':'SELECT w.version_id,w.segment_ordinal,o.concept_id,o.rule_id,o.start,o.end,o.literal,o.basis,o.ambiguity FROM concept_occurrences o JOIN windows w ON w.id=o.window_id WHERE w.run_id=? ORDER BY w.version_id,w.segment_ordinal,o.start,o.end,o.rule_id',
        'references':'SELECT w.version_id,w.segment_ordinal,o.book,o.first,o.last,o.start,o.end,o.literal,o.reference_kind FROM reference_occurrences o JOIN windows w ON w.id=o.window_id WHERE w.run_id=? ORDER BY w.version_id,w.segment_ordinal,o.start,o.end,o.book,o.first,o.last'}.items():
        h=hashlib.sha256();n=0
        for row in db.execute(sql,(run,)):h.update((packed(list(row))+'\n').encode());n+=1
        result[name]={'rows':n,'sha256':h.hexdigest()}
    return result

def main():
    db=readonly(root()/'concepts.sqlite3');new=read(root()/'calibration.json')['run_id']
    old='kr110-9d2718fcb3da95110160d47a-calibration'
    try:
        a=facts(db,old);b=facts(db,new)
        result={'old':old,'new':new,'old_facts':a,'new_facts':b,'equal':a==b,
            'scope':'291 source-stratified calibration documents; fresh full recomputation, not cross-generation reuse'}
        dump(root()/'matcher-equivalence.json',result);print(packed(result))
        if a!=b:raise ValueError('Calibration matcher outputs differ')
    finally:db.close()
if __name__=='__main__':main()
