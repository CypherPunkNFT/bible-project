from pathlib import Path
import re, json

root=Path(__file__).resolve().parents[2]
out=root/'design/study-hub-v3'
out.mkdir(exist_ok=True)
old=(root/'design/study-hub-v2/index.html').read_text(encoding='utf-8')
home=old.split('<template id="study-home">',1)[1].split('<nav class="hub-index"',1)[0]
home=home.replace('href="/study" aria-labelledby="scripture-title"','href="/mockups/study-hub-v3/theology/" aria-labelledby="scripture-title"')
home=home.replace('href="/review/research/cases" aria-labelledby="academic-title"','href="/mockups/study-hub-v3/academic/" aria-labelledby="academic-title"')
voices=old.split('    <section class="hub-section" id="voices"',1)[1].split('    <section class="hub-section" id="world"',1)[0]
voices='    <section class="hub-section" id="voices"'+voices
voices=voices.replace('02 / The people behind the pages','01 / The people behind the pages')
voices=re.sub(r'<section id="writer-directory".*?</section>', '', voices, flags=re.S)
voices=re.sub(r'<button class="feature-link" id="writers-open".*?</button>', '<a class="feature-link" href="/mockups/study-hub-v3/theology/?area=people#writer-preview">Explore the writers of Scripture <span data-icon="arrow"></span></a>',voices,flags=re.S)
voices=voices.replace('<span data-icon="arrow"></span></a>', '<span class="door-arrow" data-icon="arrow"></span></a>')
atlas='''
<section class="hub-section atlas-section" id="world" aria-labelledby="world-title">
  <div class="section-heading"><div><p class="eyebrow">02 / Time &amp; place</p><h2 id="world-title">Step into <em>their world.</em></h2></div><p>Put a place to the passage. Enter an ancient city.<br>Follow a life across the map.</p></div>
  <div class="atlas-window">
    <div class="atlas-scene"><div class="atlas-map-title"><span id="map-kicker">THE BIBLICAL WORLD</span></div><div id="atlas-map"></div><div class="map-legend"><span><i></i><span id="map-legend-text">Places to begin exploring</span></span><span class="atlas-invitation">A passage has a setting. A city has a story. Follow either into the other.</span></div></div>
    <div class="atlas-story"><p class="eyebrow">The Atlas</p><div class="atlas-tabs" role="group" aria-label="Choose a way into Atlas">
      <div class="atlas-option"><button data-map="map" aria-pressed="true"><span data-icon="map"></span><span>Explore the map<small>A place for every passage</small></span></button><a class="atlas-go" href="/study/atlas/map" aria-label="Open the Atlas map"><span data-icon="arrow"></span></a></div>
      <div class="atlas-option"><button data-map="cities" aria-pressed="false"><span data-icon="church"></span><span>Ancient cities<small>The world behind the words</small></span></button><a class="atlas-go" href="/study/atlas/cities" aria-label="Open ancient cities in the Atlas"><span data-icon="arrow"></span></a></div>
      <div class="atlas-option"><button data-map="paul" aria-pressed="false"><span data-icon="branch"></span><span>Follow Paul<small>The road, the churches, the letters</small></span></button><a class="atlas-go" href="/study/atlas/journeys?focus=paul&amp;lens=story" aria-label="Open Paul’s journeys in the Atlas"><span data-icon="arrow"></span></a></div>
    </div><div class="atlas-copy" id="atlas-copy" aria-live="polite"></div><a class="atlas-all" href="/study/atlas"><span data-icon="map"></span><span>Enter the full Atlas</span><span data-icon="arrow"></span></a></div>
  </div>
</section>
<section class="hub-closing"><p class="eyebrow">One collection. Many connections.</p><h2>Begin with a question.<br><em>See where it leads.</em></h2><div><a href="/mockups/study-hub-v3/theology/?area=jesus">Read the Gospels together <span data-icon="arrowUp"></span></a><a href="/mockups/study-hub-v3/academic/?area=texts">Explore the surviving texts <span data-icon="arrowUp"></span></a></div></section>
</div>'''

def shell(title,branch,content):
 content='\n'.join(line.rstrip() for line in content.splitlines())
 return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>{title} · Bible Project</title><link rel="icon" href="/mockups/letters-shared/favicon.svg" type="image/svg+xml"><script>try{{const t=localStorage.getItem('bp-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}}catch{{document.documentElement.dataset.theme='light';}}</script><link rel="stylesheet" href="/mockups/help-for-life-directions/shared/frame.css"><link rel="stylesheet" href="/mockups/study-hub-v1/study-hub.css"><link rel="stylesheet" href="/mockups/study-hub-v2/expanded.css"><link rel="stylesheet" href="/mockups/study-hub-v3/connected.css"></head>
<body data-page="{branch}"><a class="skip-link" href="#main">Skip to study</a><template id="page-content">{content}</template><script src="/mockups/help-for-life-directions/shared/frame.js"></script><script src="/mockups/study-hub-v3/collections.js"></script><script src="/mockups/study-hub-v3/artwork.js"></script><script src="/mockups/study-hub-v3/page.js"></script>{'<script src="/mockups/study-hub-v3/people.js"></script><script src="/mockups/study-hub-v3/atlas.js"></script>' if branch=='hub' else ''}</body></html>'''

(out/'index.html').write_bytes(shell('Study','hub',home+voices+atlas).encode())
for branch in ['theology','academic']:
 (out/branch).mkdir(exist_ok=True)
 (out/branch/'index.html').write_bytes(shell('Scripture & Theology' if branch=='theology' else 'Academic Studies',branch,'<div class="branch" id="branch-root"></div>').encode())

# people.js is hand-authored: preserve the four writer illustrations when regenerating.

# Copy the existing cartographic data, projection and tested first-journey schematic, not invented route geometry.
world=json.loads((root/'src/data/atlas-map.json').read_text(encoding='utf-8'))
route=(root/'src/pages/places/layer-stack-data.ts').read_text(encoding='utf-8')
coords=json.loads(re.search(r'FIRST_JOURNEY[^=]*=\s*(\[[\s\S]*?\n\]);',route).group(1).replace(',\n]', '\n]'))
places=json.loads((root/'data/places.json').read_text(encoding='utf-8'))
points=[{k:p[k] for k in ['id','name','lon','lat']} for p in places if p['id'] in ['aee7248','ae41ab4','a6f437a','a15257a','afc8e7a']]
assert len(points)==5
(out/'map-data.json').write_bytes(json.dumps({'land':world['land'],'scale':world['scale'],'translate':world['translate'],'journey':coords,'places':points},separators=(',',':')).encode())
print('Created three connected page shells and Atlas data; retained hand-authored artwork.')
