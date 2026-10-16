"""Execute actual reviewed-example pairs and constrained neighbor queries."""
from .relationship_miner import root
from .relationship_query import Relationships
from .concept_index import read
from .build import dump
from .inputs import packed

def main():
    folder=root();pool=read(folder/'evaluation-pool.json');quality=read(folder/'quality.json');judgments={r['sample_id']:r for r in quality['judgments']};engine=Relationships();examples=[]
    try:
        for channel in ('wording','cocitation'):
            available=[p for p in pool['samples'] if p['sample_channel']==channel]
            useful=[p for p in available if judgments[p['sample_id']]['useful']]
            selected=(useful or available)[:2]
            for p in selected:
                pair=engine.pair(p['left']['id'],p['right']['id'])
                neighbors=engine.neighbors(p['left']['id'],channel,3,language=p['right']['language'])
                for candidate in neighbors['results']:
                    other=candidate['right'] if candidate['left']['id']==p['left']['id'] else candidate['left']
                    assert other['language']==p['right']['language']
                constrained={}
                for field,option in [('author_label','author'),('work_id','work')]:
                    requested=p['right'][field]
                    if requested:
                        response=engine.neighbors(p['left']['id'],channel,3,**{option:requested})
                        if option=='work':
                            for candidate in response['results']:
                                other=candidate['right'] if candidate['left']['id']==p['left']['id'] else candidate['left']
                                assert other['work_id']==requested
                        constrained[option]=response
                examples.append({'channel':channel,'selection':'reviewed-useful' if useful else 'reviewed-failure-no-useful-sample-in-channel','review':judgments[p['sample_id']],'pair':pair,'language_constrained_neighbors':neighbors,'additional_constrained_neighbors':constrained})
        if not examples:raise ValueError('No sampled queryable pair exists')
        anchor=examples[0]['pair']['left']['id'];channel=examples[0]['channel'];control=engine.neighbors(anchor,channel,1)
        assert control['results']
        negative=engine.neighbors(anchor,channel,author='NO-SUCH-AUTHOR-KR120')
        assert not negative['results']
        value={'run_id':engine.run,'examples':examples,'negative_control_unconstrained_count':len(control['results']),'impossible_author':negative,'constraint_checks_passed':True}
        dump(folder/'query-examples.json',value)
        print(packed({'run_id':engine.run,'examples':[{'left':e['pair']['left']['id'],'right':e['pair']['right']['id'],'types':e['pair']['relation_types'],'left_title':e['pair']['left']['provenance'].get('title'),'right_title':e['pair']['right']['provenance'].get('title'),'review':e['review']} for e in examples],'constraint_checks_passed':True}))
    finally:engine.close()

if __name__=='__main__':main()
