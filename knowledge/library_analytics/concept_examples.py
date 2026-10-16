"""Reproducible, real located query examples and explicit constraint checks."""
from .concept_query import Retriever,normalized_author_labels
from .concept_index import root
from .build import dump
from .inputs import packed

def main():
    r=Retriever();examples=[]
    try:
        for query,author,language in [('assurance under doubt',None,'en'),('justification faith','John Owen','en'),
            ('justification faith','John Gill','en'),('gratia',None,'la'),('Romans 4 Abraham faith',None,'en')]:
            result=r.search(query,author=author,language=language)
            if author:
                assert all(normalized_author_labels(author)&normalized_author_labels(x['author_label']) for x in result['results'])
            assert all(x['language']==language for x in result['results'])
            examples.append(result)
        work=next((x['work_id'] for e in examples for x in e['results'] if x['work_id']),None)
        if work:
            constrained=r.search('faith',work=work)
            assert all(x['work_id']==work for x in constrained['results']);examples.append(constrained)
        absent=r.search('faith',author='NO-SUCH-AUTHOR-KR110')
        assert not absent['results'];examples.append(absent)
        dump(root()/'query-examples.json',{'run_id':r.run,'examples':examples,'constraint_checks_passed':True})
        print(packed({'run_id':r.run,'queries':len(examples),'constraint_checks_passed':True,
            'examples':[{'query':e['query'],'constraints':e['constraints'],'seconds':e['seconds'],
                'results':[{'id':x['id'],'author':x['author_label'],'title':x['provenance']['title'],'heading':x['section_heading'],
                    'version_id':x['version_id'],'start':x['start'],'end':x['end'],'text':x['text'][:500]} for x in e['results'][:2]]} for e in examples]}))
    finally:r.close()

if __name__=='__main__':main()
