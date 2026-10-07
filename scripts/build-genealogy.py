"""Project only already-public person identity and family records for the explorer."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
rows = json.loads((root / 'data/study/people.json').read_text(encoding='utf-8'))
known = {row['id'] for row in rows}
people = []
for row in rows:
    detail = json.loads((root / f'data/study/people/{row["id"]}.json').read_text(encoding='utf-8'))
    people.append({**{key: row[key] for key in ('id', 'n', 'o', 'b', 'c')},
                   **{key: detail.get(key, '') for key in ('s', 'e', 'f')},
                   **{key: [identifier for identifier in detail.get(key, []) if identifier in known]
                      for key in ('pa', 'ch', 'sp', 'si')}})
target = root / 'public/content/study/genealogy.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(json.dumps({'people': people}, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))
print(f'Exported {len(people):,} people with recorded family links to {target.name}.')
