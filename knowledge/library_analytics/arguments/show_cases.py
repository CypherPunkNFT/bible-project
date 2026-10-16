import argparse,json
from .inputs import ROOT,read
def main():
    p=argparse.ArgumentParser();p.add_argument('--split',choices=['development','reserved'],required=True);p.add_argument('--brief',action='store_true');p.add_argument('--ids',nargs='*');a=p.parse_args()
    for c in read(ROOT/'evaluation/frozen.json')['cases']+read(ROOT/'evaluation/frozen-extra.json')['cases']:
        if c['split']==a.split and (not a.ids or any(c['id'].endswith(x) for x in a.ids)):print(json.dumps({**{k:c[k] for k in (['id','group','category','sentence'] if a.brief else ['id','group','category','sentence','context'])},'source_title':c['descriptor'].get('title'),'source_author':c['descriptor'].get('author_label')},ensure_ascii=False))
if __name__=='__main__':main()
