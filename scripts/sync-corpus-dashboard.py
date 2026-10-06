"""Copy the reviewed metadata-only wiki exports into the website build inputs.

Refresh JarvisWiki/wiki/_build/bible_bibliography.py and bible_collection.py --refresh
first. This command never copies corpus bodies or changes indexing/embedding workers.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
WIKI = ROOT.parents[1] / 'JarvisWiki/wiki/projects'
bibliography = json.loads((WIKI/'bible-bibliography.json').read_text(encoding='utf-8'))
snapshot = json.loads((WIKI/'bible-corpus-snapshot.json').read_text(encoding='utf-8'))
target = ROOT / 'content/library/corpus-dashboard.json'
target.write_text(json.dumps({'snapshot': snapshot, 'bibliography': bibliography}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'Synced {len(bibliography["entries"]):,} bibliography records and dated corpus measurements.')
