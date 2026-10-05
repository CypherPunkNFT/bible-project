"""L08 source round trips, proof attachments, numbering and comparison boundaries."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import unittest

SITE=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(SITE/'scripts'))
spec=importlib.util.spec_from_file_location('l08',SITE/'scripts/catalog-confessional-standards.py')
c=importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
spec=importlib.util.spec_from_file_location('l08_reader',SITE/'scripts/read-confessional-unit.py')
reader=importlib.util.module_from_spec(spec); spec.loader.exec_module(reader)
INVENTORY=c.read(c.OUT/'inventory.json')
UNITS={u['id']:u for u in INVENTORY['units']}

def test_every_payload_round_trips_without_wording_changes():
    assets={}; raw={}
    for u in UNITS.values():
        aid=u['assetId']
        if aid not in raw:
            a=c.read(c.LIB/'catalog/assets'/(aid+'.json')); b=(c.SOURCES/a['relativePath']).read_bytes()
            assert len(b)==a['byteCount'] and hashlib.sha256(b).hexdigest()==a['sha256']
            raw[aid]=b; assets[aid]=json.loads(b) if 'pointer' in u else b.decode('utf-8-sig')
        if 'pointer' in u:
            data=c.resolve(assets[aid],u['pointer']); assert c.payload_hash(data)==u['payloadSha256']
            if u.get('answerPointer'): assert c.resolve(assets[aid],u['answerPointer'])==data['Answer']
            if 'Proofs' in data: assert data['Proofs']==u['proofs']
        else:
            s=u['characterSpan']; payload=assets[aid][s['start']:s['end']]
            assert hashlib.sha256(payload.encode()).hexdigest()==u['payloadSha256']
    assert len(UNITS)==len(INVENTORY['units'])==2438

def test_complete_supplied_inventories_and_missing_apparatus():
    counts={d['key']:d['unitCount'] for d in INVENTORY['documents']}
    assert counts==dict(wcf=172,wsc=107,wlc=196,lbc=160,baptist=114,flavel=125,**{'lbc-cc0-json':160,'lbc-cc0-md':160})
    for key,count in [('wsc',107),('wlc',196),('baptist',114)]:
        assert sorted(int(u['sourceLabel']) for u in UNITS.values() if u['documentKey']==key)==list(range(1,count+1))
    assert all(not u['proofs'] and u['markedTextPointer'] is None for u in UNITS.values() if u['documentKey']=='wsc')
    assert len([u for u in UNITS.values() if u['documentKey']=='flavel' and u['sourceLabel']=='?' and 'parentUnitId' not in u])==23
    md=[u for u in UNITS.values() if u['documentKey']=='lbc-cc0-md']
    assert len(md)==160 and all(len(u['proofBlocks'])==1 for u in md)
    assert '12.unnumbered' in {u['sourceLabel'] for u in md}

def test_proof_index_preserves_order_attachment_and_citation_role():
    index=c.read(c.OUT/'proof-index.json')['references']; expected=[]
    for u in UNITS.values():
        for group in u.get('proofs',[]):
            expected.extend((u['id'],group['Id'],i+1,r) for i,r in enumerate(group['References']))
    assert [(r['unitId'],r['proofId'],r['referencePosition'],r['raw']) for r in index]==expected
    for row in index:
        assert row['normalizations']==c.normalize(row['raw'],row['unitId']+' proof '+str(row['proofId']))
        assert all(p['passage']['role']=='citation' for p in row['normalizations'] if p['passage'])
    assert len(index)==4616
    assert c.normalize('John.3.999','test')[0]['status']=='unresolved'
    assert c.normalize('Ps.119','test')[0]['passage']['end']%1000==176

def test_comparisons_resolve_to_separate_actual_witnesses():
    comparisons=c.read(c.OUT/'comparisons.json')['comparisons']
    assert len(comparisons)==8
    for row in comparisons:
        for side in row['sides']:
            for ident in side['unitIds']:
                assert UNITS[ident]['editionId']==side['editionId']
    wcf=reader.retrieve('unit-l08-wcf-c28-p03')['Content']
    lbc=reader.retrieve('unit-l08-lbc-c29-p04')['Content']
    assert 'not necessary' in wcf and 'is necessary' in lbc
    assert 'heresies be suppressed' in reader.retrieve('unit-l08-wcf-c23-p03')['Content']
    assert 'active obedience' in reader.retrieve('unit-l08-lbc-c11-p01')['Content'].lower()
    crosswalk=c.read(c.OUT/'witness-crosswalk.json')['paragraphs']
    assert len(crosswalk)==160
    assert all(len(row['unitIds'])==3 and all(ident in UNITS for ident in row['unitIds']) for row in crosswalk)
    assert any(not row['jsonBodyExactlyEqual'] for row in crosswalk)

def test_no_restricted_text_or_publication_promotion():
    manifest=c.read(c.OUT/'record-manifest.json')['recordIds']
    assets=[c.read(c.LIB/'catalog/assets'/(i+'.json')) for i in manifest if i.startswith('asset-')]
    assert len([a for a in assets if a['acquisitionStatus']=='downloaded'])==9
    savoy=next(a for a in assets if 'savoy' in a['id'])
    assert savoy['storage']=='none' and savoy['relativePath'] is None
    flavel=next(a for a in assets if a['id']=='asset-l08-flavel-json')
    assert flavel['rights']['actions']['host']=='unknown'
    assert all(not a['fullTextIndexed'] and a['editorialState']=='catalogued' for a in assets)
    vocab={s['id'] for s in c.read(c.LIB/'vocabulary.json')['subjects']}
    assert all(set(u['subjects'])<=vocab for u in UNITS.values())

def test_flavel_scan_date_does_not_replace_delivery_date():
    work=c.read(c.LIB/'catalog/works/work-l08-flavel.json')
    edition=c.read(c.LIB/'catalog/editions/edition-l08-flavel-1767.json')
    assert ('delivery','1688') in [(d['event'],d['value']) for d in work['dates']]
    assert ('edition-publication','1767') in [(d['event'],d['value']) for d in edition['dates']]
    assert c.read(c.LIB/'catalog/editions/edition-l08-flavel.json')['modernization']=='modernized'

def load_tests(loader, tests, pattern):
    return unittest.TestSuite(unittest.FunctionTestCase(fn) for name,fn in sorted(globals().items()) if name.startswith('test_'))

if __name__=='__main__': unittest.main()
