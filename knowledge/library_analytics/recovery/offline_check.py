"""Read-only proof executed with the captured code as the import root."""
import argparse
import json
from pathlib import Path
import sqlite3
from .archive import packed,read,within
from .. import section_contract

def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--plan',type=Path,required=True);a=p.parse_args()
    root=a.root.resolve();tree=root/'tree';plan=read(a.plan)
    loaded=Path(section_contract.__file__).resolve()
    if not loaded.is_relative_to(tree/'Website'):raise RuntimeError('Module imported outside restored source')
    mapping={str(Path(x['source']).resolve()).casefold():within(tree,tree/x['relative']) for x in plan['assets']}
    def resolve(path):
        key=str(Path(path).resolve()).casefold()
        if key not in mapping:raise FileNotFoundError('Not in archive: '+path)
        return mapping[key]
    dbpath=tree/'KnowledgeBase/library-knowledge/connected-research/sections.sqlite3'
    db=sqlite3.connect(dbpath.as_uri()+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
    try:
        from .verify import heading_queries
        queries=heading_queries(db,plan['query_baseline'])
        if queries!=plan['query_baseline']:raise AssertionError('Restored-code query drift')
        witnesses=read(root/'located-witnesses.json');count=0;prepared={}
        # Already verified whole population strata in parent. Re-execute one
        # witness per coordinate with the restored imports and strict map.
        seen=set()
        for witness in witnesses:
            if witness['coordinate'] in seen:continue
            seen.add(witness['coordinate'])
            row=dict(db.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(witness['version_id'],witness['ordinal'])).fetchone())
            row['path']=str(resolve(row['path']));text=section_contract.resolve_segment(row,prepared)
            if len(text)!=witness['characters']:raise AssertionError('Witness length drift')
            count+=1
        print(packed({'state':'passed','module':str(loaded),'query_terms':len(queries),'witness_coordinates':count,'production_reads':0}))
    finally:db.close()

if __name__=='__main__':main()
