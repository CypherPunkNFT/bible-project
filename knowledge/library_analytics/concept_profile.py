"""Read-only component timing on one already calibrated English source block."""
import cProfile
import pstats
import io
import time
from .concept_index import Inputs,root,read
from .build import readonly
from .section_contract import resolve_segment
from .inputs import packed
from .concept_matcher_fast import FastMatcher
def main():
    inputs=Inputs();summary=read(root()/'calibration.json');db=readonly(root()/'concepts.sqlite3')
    r=db.execute("SELECT w.version_id,w.segment_ordinal FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.run_id=? AND d.language='en' AND w.end-w.start>=1800 LIMIT 1",(summary['run_id'],)).fetchone()
    span=inputs.sections.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',tuple(r)).fetchone()
    body=resolve_segment(span,{})[:1000000]
    profiler=cProfile.Profile();profiler.enable()
    a=inputs.matcher.extract(body,'en');b=inputs.scanner.extract(body)
    profiler.disable();out=io.StringIO();pstats.Stats(profiler,stream=out).sort_stats('cumulative').print_stats(15)
    fast=FastMatcher(inputs.rules['rules']);start=time.monotonic();actual=fast.extract(body,'en');elapsed=time.monotonic()-start
    assert actual==a,'Fast matcher differs'
    for text in ['İustification through faith in Chriſt','The full aſſurance of faith in Christ','prayer supplications imputed righteousness of Christ',
        *[r['positive'] for r in inputs.rules['pack']['rules']],*[r['negative'] for r in inputs.rules['pack']['rules']]]:
        assert fast.extract(text,'en')==inputs.matcher.extract(text,'en'),text
    print(packed({'characters':len(body),'concepts':len(a),'references':len(b[0]),'fast_seconds':elapsed,'same_outputs':True}));print(out.getvalue());db.close();inputs.close()
if __name__=='__main__':main()
