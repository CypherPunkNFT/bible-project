import html, json, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[3]/'.local/chapter-summary-studio/evidence-first-trials'
esc=lambda value:html.escape(str(value))
parts=['''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Evidence-first summary trials</title><style>
body{font:17px/1.6 system-ui;margin:auto;padding:40px 24px;max-width:1050px;color:#25342c;background:#faf9f4}h1,h2,h3{line-height:1.2}h1{font-size:38px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #cbd4cc;padding:9px;text-align:left;vertical-align:top}details{background:white;border:1px solid #d5dcd4;padding:16px;margin:12px 0;border-radius:8px}summary{cursor:pointer;font-weight:600}.note{border-left:4px solid #886a27;padding:12px 20px;background:#f5efd9}.small{font-size:14px;color:#526052}pre{white-space:pre-wrap;font-size:13px}a{color:#246149}section{margin:40px 0}li{margin:9px 0}</style><h1>Evidence-first summary trials</h1><p>Three rounds using the same eight BSB chapters. Local Qwen model: qwen3.6:27b-q4_K_M.</p><p class="note">Experimental drafts. Source-reference validation is separate from factual and editorial review. No trial result is human-approved, published, or imported into the studio database.</p>''']
report={'rounds':[], 'publication_status':'trial only'}
parts.append('<p><a href="#round-3">Latest round</a> · <a href="#round-2">Round 2</a> · <a href="#round-1">Round 1</a></p>')
for n in (1,2,3):
    folder=root/f'round-{n}'
    if not (folder/'results.json').exists():continue
    results=json.loads((folder/'results.json').read_text())
    notes=json.loads((folder/'editorial-review.json').read_text(encoding='utf-8')) if (folder/'editorial-review.json').exists() else {}
    report['rounds'].append({'round':n,'results':results,'editorial_review':notes})
    parts.append(f'<section id="round-{n}"><h2>Round {n}</h2><p>{esc(notes.get("approach",""))}</p><p>{esc(notes.get("finding","Review pending."))}</p><div style="overflow-x:auto"><table style="min-width:650px"><thead><tr><th>Chapter</th><th>Checks</th><th>Seconds</th><th>Editorial review</th></tr></thead><tbody>')
    for item in results:
        key=item['key']; note=notes.get('chapters',{}).get(key,{})
        parts.append(f'<tr><td>{esc(key)}</td><td>{esc(item["status"])}</td><td>{item["seconds"]}</td><td>{esc(note.get("verdict","pending"))}: {esc(note.get("notes",""))}</td></tr>')
    parts.append('</tbody></table></div>')
    for item in results:
        key=item['key']; trial=folder/key.replace(':','-'); draftpath=trial/'draft.json'
        parts.append(f'<details><summary>{esc(key)} — round {n}</summary>')
        if draftpath.exists():
            draft=json.loads(draftpath.read_text(encoding='utf-8'))
            parts.append(f'<h3>{esc(draft["title"])}</h3>')
            if draft['context']:parts.append(f'<p class="small">{esc(draft["context"])}</p>')
            parts.append(f'<p>{esc(draft["summary"])}</p><ol>')
            for point in draft['outline']:
                parts.append(f'<li><strong>{point["verse_start"]}–{point["verse_end"]}: {esc(point["heading"])}</strong> — {esc(point["text"])}</li>')
            parts.append(f'</ol><p><em>{esc(draft["invitation"])}</em></p>')
        else:parts.append(f'<p>{esc(item.get("error","No draft saved."))}</p>')
        parts.append('<p class="small">Qwen reviewer: '+esc(item.get('model_review_issues',item.get('model_review_error','not run')))+' (informational only)</p>')
        links=[f'<a href="round-{n}/{trial.name}/{file}">{label}</a>' for file,label in [('sources.json','Source text'),('evidence.json','Evidence packet'),('sentence-support.json','Sentence support')] if (trial/file).exists()]
        parts.append('<p>'+' · '.join(links)+'</p></details>')
    parts.append('</section>')
with urllib.request.urlopen('http://127.0.0.1:8947/api/state',timeout=5) as response:state=json.load(response)
report['studio_state']={'running':state['job']['running'],'saved_records':len(state['records'])}
(root/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
parts.append('<p class="small">Studio state at report creation: '+esc(report['studio_state'])+'</p></html>')
(root/'report.html').write_text('\n'.join(parts),encoding='utf-8')
print(json.dumps({'report':str(root/'report.html'),'studio':report['studio_state']}))
