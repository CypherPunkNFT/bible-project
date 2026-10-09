import json
from pathlib import Path
out=Path('public/basis');out.mkdir(exist_ok=True)
q=json.loads(Path('../KnowledgeBase/False Religions/Islam/Quran/english-pickthall.json').read_text(encoding='utf-8'))
w=json.loads(Path('../sources/library/source-creeds-json/asset-l08-wcf-json/westminster_confession_of_faith.json').read_text(encoding='utf-8'))
texts={}
for chapter in q:
 for verse in chapter['verses']: texts[f"{chapter['id']}:{verse['id']}"]=verse['translation']
(out/'quran-pickthall.json').write_bytes(json.dumps(texts,ensure_ascii=False).encode('utf-8'))
texts={}
for chapter in w['Data']:
 for section in chapter['Sections']: texts[f"{chapter['Chapter']}.{section['Section']}"]=section['Content']
(out/'westminster.json').write_bytes(json.dumps(texts,ensure_ascii=False).encode('utf-8'))
(out/'README.md').write_text('Local reader assets: Qur’an, Marmaduke Pickthall (public-domain English translation), acquired from quran-json.risanb.com, and Westminster Confession (public domain), acquired in source-creeds-json. Text is preserved verbatim; keys index verse or section. Regenerate with scripts/export-basis-texts.py.\n',encoding='utf-8')

with (out/'README.md').open('a',encoding='utf-8') as f:
 f.write('\nQur’an dataset packaging: Quran JSON by Risan, https://quran-json.risanb.com/, CC BY-SA 4.0. The public-domain Pickthall translation is indexed by chapter and verse without rewriting. See QURAN-DATA-LICENSE.txt for the upstream licence.\n')
(out/'QURAN-DATA-LICENSE.txt').write_bytes(Path('../KnowledgeBase/False Religions/Islam/Quran/source-license.txt').read_bytes())
