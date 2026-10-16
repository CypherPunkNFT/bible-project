"""Read-only parent and ownership inspection for KR-120."""
import json
from pathlib import Path
from .build import PROJECT,readonly,dump
from .concept_index import read,filehash
from .jobs import process_identity
from .inputs import packed

def main():
    base=Path(PROJECT)/'KnowledgeBase';folder=base/'library-knowledge/connected-research'
    selected=read(folder/'concepts/latest-concepts.json');summary=read(selected['summary'])
    manifest=read(Path(selected['release'])/'release_manifest.json')
    entry=next(x for x in manifest['files'] if x['path']=='summary.json')
    assert filehash(selected['summary'])==entry['sha256'] and summary['run_id']==selected['run_id']
    db=readonly(Path(selected['database']))
    counts=[dict(r) for r in db.execute('SELECT disposition,count(*) n FROM documents WHERE run_id=? GROUP BY disposition',(selected['run_id'],))]
    db.close()
    owners={}
    for name,path in [('analytics',base/'library-analytics/pipeline/pipeline.sqlite3'),('concepts',Path(selected['database']))]:
        db=readonly(path);owners[name]=[dict(r) for r in db.execute('SELECT * FROM coordinator')];db.close()
        for row in owners[name]:row['observed_process_token']=process_identity(row['pid'])
    intake=read(base/'intake-completion.json');intake['observed_owner_token']=process_identity(intake['pid'])
    if intake.get('child_pid'):intake['observed_child_token']=process_identity(intake['child_pid'])
    result={'selected_parent':selected,'scope':counts,'owners':owners,'intake_observed':intake,'vector_access':'none'}
    out=folder/'relationships';out.mkdir(exist_ok=True);dump(out/'preflight.json',result);print(packed(result))

if __name__=='__main__':main()
