import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[3]/'.local/chapter-summary-studio/evidence-first-trials'
sources={}
metrics=[]
for n in (1,2,3):
    folder=root/f'round-{n}'
    results=json.loads((folder/'results.json').read_text())
    reviews=json.loads((folder/'editorial-review.json').read_text(encoding='utf-8'))
    assert len(results)==8 and len(reviews['chapters'])==8, (n,'Incomplete trial/review')
    metric={'round':n,'attempted_chapters':len(results),'drafts':sum(r['status']=='draft' for r in results),
            'seconds':round(sum(r['seconds'] for r in results),2),'input_tokens':0,'output_tokens':0,
            'no_material_issue_found':sum(v['verdict']=='no material issue found' for v in reviews['chapters'].values()),
            'human_approved':0}
    for row in results:
        chapter=row['key']; trial=folder/chapter.replace(':','-')
        source=json.loads((trial/'sources.json').read_text(encoding='utf-8'))
        fingerprint=hashlib.sha256(json.dumps(source,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        if chapter in sources:assert sources[chapter]==fingerprint,(chapter,'Source changed between rounds')
        sources[chapter]=fingerprint
        assert row['human_approved'] is False
        assert (trial/'draft.json').exists()==(row['status']=='draft')
        for path in trial.glob('*.json'):
            response=json.loads(path.read_text(encoding='utf-8'))
            if path.name=='model-review.json':response=response['response']
            if isinstance(response,dict) and 'prompt_eval_count' in response:
                metric['input_tokens']+=response['prompt_eval_count']
                metric['output_tokens']+=response.get('eval_count',0)
    metrics.append(metric)
files={str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest()
       for n in (1,2,3) for p in (root/f'round-{n}').rglob('*.json')}
previous=root/'verification.json'
if previous.exists():
    expected=json.loads(previous.read_text(encoding='utf-8')).get('artifact_sha256',{})
    assert expected and expected==files, 'Trial artifacts differ from the existing integrity manifest; investigate before replacing it.'
data={'source_consistency':'All eight chapters and supplied context unchanged across three rounds',
      'metrics':metrics,'artifact_sha256':files,
      'limitations':['Same development chapters in all rounds; no unseen holdout.',
                    'Multiple mechanisms changed together; effects are not isolated.',
                    'Editorial inspection is by Codex, not human approval.',
                    'Syntactic validation and verse citations do not prove semantic support.']}
(root/'verification.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'source_consistency':data['source_consistency'],'metrics':metrics,'hashed_files':len(files)}))
