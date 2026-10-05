"""Apply the reviewed L04 source decisions; no network access."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'content/library'
path = ROOT/'sources.json'
registry = json.loads(path.read_text(encoding='utf-8'))
inventory = json.loads((ROOT/'reports/modern-preaching/ministry-inventory.json').read_text(encoding='utf-8'))
for ministry in inventory['ministries']:
    source = next((s for s in registry['sources'] if s['id']==ministry['sourceId']), None)
    if source is None:
        source = dict(id=ministry['sourceId'], name=ministry['name'], url=ministry['officialDestination'], role='content-host')
        registry['sources'].append(source)
    source.update(automation=ministry['automation'], acquisitionNote=ministry['permittedMethod']+' '+ministry['automationBasis'],
                  evidence=ministry['policyEvidence'], reviewedOn=inventory['checkedOn'])
path.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
