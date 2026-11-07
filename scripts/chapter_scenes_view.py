"""The Scenes pipeline in the Chapter Summary Studio. A primary panel on the far left lists the pipelines (Summaries,
Scenes); beside it, a secondary panel holds the chosen pipeline's workspace and settings. Each pipeline has its own heading, counts and preview card, and both share the book and chapter
explorer and the Scripture panel. Scenes is read-only: each writer's key scenes for the chapter (picture frame, moment,
composition, what is from the text, the image prompt), from chapter_scenes.py's store.
Docs: initiatives/chapter-scenes/README.md.
"""
from __future__ import annotations

import urllib.parse

import chapter_scenes

CSS = r"""
[hidden]{display:none!important}
.app{max-width:none;margin:0;grid-template-columns:212px 292px minmax(0,1fr)}
.primary,.app>aside{position:sticky;top:0;align-self:start;height:100vh;overflow-y:auto}
.primary{background:var(--green);color:#fff;padding:30px 16px;display:flex;flex-direction:column;gap:4px}
.primary .eyebrow{color:#a9c0b2;margin:0 12px 12px}
.primary button{border:0;background:transparent;color:#dfe8e1;text-align:left;font:inherit;font-size:13.5px;padding:12px 14px;border-radius:8px;display:flex;gap:12px;align-items:center;transition:background .15s}
.primary button:hover{background:#33604f}.primary button.on{background:#fff;color:var(--green);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.18)}
.app>aside{padding:30px 26px}
aside .nav{background:transparent;color:var(--gold);padding:0;margin:8px 0 30px;font:21px/1.2 Georgia;white-space:nowrap;gap:10px;align-items:center;border-radius:0}
aside .nav span{color:var(--ink)}
main{width:100%;max-width:1760px;margin:0}
@media(max-width:1000px){.app{grid-template-columns:168px 220px minmax(0,1fr)}}
@media(max-width:650px){.primary,.app>aside{position:static;height:auto}.primary{flex-direction:row;flex-wrap:wrap;align-items:center;padding:10px 16px}.primary .eyebrow{margin:0 6px 0 0}.primary button{padding:8px 12px}}
.tile.has-scenes{position:relative;border-bottom:3px solid var(--gold)}
#scenes-panel{padding:22px 24px}
.writer-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 20px}
.writer-tabs button{border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:20px;padding:6px 13px;font-size:11px}
.writer-tabs button.on{border-color:var(--green);background:var(--soft);color:var(--green);font-weight:700}
.scene{border-top:1px solid var(--line);padding:22px 0 8px}.scene:first-of-type{border-top:0;padding-top:4px}
.scene-frame{aspect-ratio:16/9;max-width:100%;border:1px dashed #cdd5c6;border-radius:8px;background:linear-gradient(160deg,#f1f4ed,#e7ebe1);display:flex;flex-direction:column;justify-content:flex-end;padding:14px 16px;color:var(--muted);font-size:11px;line-height:1.5;margin-bottom:16px}
.scene-frame b{color:var(--ink);font-size:10px;letter-spacing:1.4px;text-transform:uppercase}
.scene-eyebrow{font-size:10px;letter-spacing:1.6px;font-weight:700;color:var(--gold);text-transform:uppercase}
.scene-eyebrow .by{color:var(--muted);margin-left:8px}
.scene h3{font:23px/1.25 Georgia;margin:8px 0 10px}
.scene .kind{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px}
.scene .moment{font:16px/1.7 Georgia;color:#48564b;margin:10px 0 6px}
.scene .why{font-size:12px;color:var(--muted);line-height:1.6;margin:0 0 14px}
.comp{display:grid;grid-template-columns:110px 1fr;gap:6px 14px;font-size:12px;line-height:1.55;margin:0 0 14px}
.comp dt{color:var(--muted);font-weight:600}.comp dd{margin:0}
.scene h4{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);margin:16px 0 6px}
.scene ul{margin:0;padding-left:18px;font-size:12px;line-height:1.6}
.scene ul.facts{list-style:none;padding-left:0}.scene ul.facts li{margin-bottom:3px}
.prompt-box{background:#f6f4ee;border:1px solid var(--line);border-radius:7px;padding:13px 15px;font-size:12.5px;line-height:1.65;white-space:pre-wrap}
.prompt-head{display:flex;justify-content:space-between;align-items:center}
.prompt-head button{border:1px solid var(--line);background:var(--paper);border-radius:5px;padding:4px 10px;font-size:11px;color:var(--green)}
.scene-notes{background:#f6eedc;border:1px solid #e8d7b2;border-radius:6px;padding:9px 13px;color:#81662e;font-size:12px;margin-bottom:14px}
.scenes-empty{color:var(--muted);font-size:13px;line-height:1.7;padding:30px 0}
@media(max-width:650px){#scenes-panel{padding:18px 16px}.comp{grid-template-columns:1fr}.comp dt{margin-top:6px}}
"""

APP_OLD = '<div class="app"><aside>'
APP_NEW = ('<div class="app"><nav class="primary" aria-label="Pipelines"><div class="eyebrow">Pipelines</div>'
           '<button class="on" data-pipeline="summaries" aria-current="page">▦ <span>Summaries</span></button>'
           '<button data-pipeline="scenes">◩ <span>Scenes</span></button></nav><aside><div id="summaries-side">')

SCENES_SIDE = (
    '</div><div id="scenes-side" hidden><div class="eyebrow">Your workspace</div><div class="nav">◩ <span>Scenes</span></div>'
    '<div class="eyebrow">Scene settings</div>'
    '<div class="side-title">One moment, one frame.</div>'
    '<p class="help">The key scenes of each chapter, each composed as a picture before any image is made.</p>'
    '<div class="side-foot"><b>Scenes · pilot</b><p class="help">Up to 3 per chapter, fewer when short<br>'
    'The moment and why it matters<br>Viewpoint, layers, light, mood<br>From the text, added, kept out<br>'
    'A ready image prompt · wide 16:9</p></div>'
    '<div class="side-foot"><b>Writers</b><p class="help">Claude Haiku and the local Qwen model wrote the same 12 '
    'pilot chapters. Compare them, then pick one for all 1,189.</p></div></div></aside>')

SCENES_TOP = (
    '<div id="scenes-top" hidden><div class="top"><div><div class="eyebrow">Scripture → Moment → Picture</div>'
    '<h1>Key scenes for every chapter.</h1><p class="intro">Choose the moments worth a picture and compose each one '
    'before any image is made.</p></div><span class="badge">WIDE FRAMES · 16:9</span></div>'
    '<div class="stats"><div class="stat"><strong>1,189</strong><span>Chapters to illustrate</span></div>'
    '<div class="stat"><strong id="scenes-chapters">0</strong><span>Chapters with scenes</span></div>'
    '<div class="stat"><strong id="scenes-haiku">0</strong><span>Written by Claude Haiku</span></div>'
    '<div class="stat"><strong id="scenes-qwen">0</strong><span>Written by local Qwen</span></div></div></div>')

LEGEND_END = '<span class="saving">Select a chapter to preview below</span></div>'
SCENES_LEGEND = ('<div class="legend" id="scenes-legend" hidden><span><i></i>No scenes yet</span>'
                 '<span><i class="gold"></i>Has scenes</span><span class="saving">Select a chapter to see its scenes</span></div>')

WORKSPACE_OLD = '<div class="workspace"><section class="card">'
WORKSPACE_NEW = (
    '<div class="workspace"><section class="card" id="scenes-card" hidden><div class="card-head">'
    '<strong>Key scenes · composed for pictures</strong><span class="tiny" id="scenes-status">—</span></div>'
    '<div id="scenes-panel"></div><div class="card-foot"><span>Click a verse range to check its source</span>'
    '<span id="scenes-foot">—</span></div></section><section class="card" id="summary-card">')

JS = r"""
(()=>{const WRITERS={haiku:'Claude Haiku',qwen:'Local Qwen'};let mode='summaries',sceneKeys={},cache={},pick='both';
try{mode=localStorage.getItem('studio-pipeline')||'summaries';pick=localStorage.getItem('studio-writer')||'both'}catch(e){}
if(location.hash==='#scenes'||location.hash==='#summaries')mode=location.hash.slice(1);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
function showVerses(a,b){let first=null;document.querySelectorAll('#scripture p').forEach(p=>{const nums=p.dataset.verse.split(/[-–]/).map(Number);const hit=nums[0]<=b&&nums.at(-1)>=a;p.classList.toggle('evidence',hit);if(hit&&!first)first=p});first?.scrollIntoView({block:'nearest'})}
function chip(a,b){const c=el('button','verse-link',a===b?'v. '+a:'vv. '+a+'–'+b);c.title='Show these verses in the chapter';c.onclick=()=>showVerses(a,b);return c}
function list(items,cls,fill){const ul=el('ul',cls);items.forEach(x=>{const li=el('li');fill(li,x);ul.append(li)});return ul}
function sceneCard(s,i,writer){const card=el('article','scene');
 const frame=el('div','scene-frame');frame.append(el('b',null,s.shot+' shot · 16:9'),el('span',null,'Picture not made yet · focal point: '+s.focal_point));card.append(frame);
 const eye=el('div','scene-eyebrow',i===0?'Main scene':'Scene '+(i+1));if(writer)eye.append(el('span','by',WRITERS[writer]||writer));card.append(eye);
 card.append(el('h3',null,s.title));const meta=el('div');meta.append(chip(s.verse_start,s.verse_end),el('span','kind',s.kind));card.append(meta);
 card.append(el('p','moment',s.moment),el('p','why',s.why));
 const dl=el('dl','comp');[['Viewpoint',s.viewpoint],['Focal point',s.focal_point],['Foreground',s.foreground],['Middle',s.midground],['Background',s.background],['Light',s.light],['Mood',s.mood]].forEach(([k,v])=>dl.append(el('dt',null,k),el('dd',null,v)));card.append(dl);
 if(s.people.length){card.append(el('h4',null,'People'),list(s.people,'',(li,p)=>li.textContent=(p.count?p.count+' × ':'')+p.who+' — '+p.action))}
 if(s.from_text.length){card.append(el('h4',null,'From the text'),list(s.from_text,'facts',(li,f)=>{li.append(chip(f.verse,f.verse),document.createTextNode(f.detail))}))}
 if(s.added.length){card.append(el('h4',null,'Added for the picture'),list(s.added,'',(li,x)=>li.textContent=x))}
 if(s.avoid.length){card.append(el('h4',null,'Keep out of the picture'),list(s.avoid,'',(li,x)=>li.textContent=x))}
 const head=el('div','prompt-head');const copy=el('button',null,'Copy prompt');copy.onclick=async()=>{try{await navigator.clipboard.writeText(s.prompt);copy.textContent='Copied'}catch(e){copy.textContent='Select and copy'}setTimeout(()=>copy.textContent='Copy prompt',1600)};
 head.append(el('h4',null,'Image prompt · '+s.prompt.trim().split(/\s+/).length+' words'),copy);card.append(head,el('div','prompt-box',s.prompt));return card}
function renderScenes(){const panel=$('scenes-panel');panel.replaceChildren();const data=cache[key()];$('scenes-status').textContent='—';$('scenes-foot').textContent='—';
 if(!data){panel.append(el('p','scenes-empty','Loading scenes…'));return}
 const writers=Object.keys(data).sort();if(!writers.length){$('scenes-status').textContent='No scenes yet';panel.append(el('p','scenes-empty','No scenes yet for this chapter. The pilot covers Genesis 22, Exodus 14, Leviticus 16, 1 Chronicles 1, 1 Samuel 17, Psalms 23 and 117, Ezekiel 1, Mark 4, John 11, Romans 8 and Revelation 21; their chapter squares are marked in gold.'));return}
 $('scenes-status').textContent=writers.map(w=>WRITERS[w]||w).join(' · ');
 const tabs=el('div','writer-tabs');const choices=writers.length>1?['both',...writers]:writers;if(!choices.includes(pick))pick=choices[0];
 choices.forEach(w=>{const b=el('button',w===pick?'on':'',w==='both'?'Both, scene by scene':WRITERS[w]+' · '+data[w].scenes.length);b.onclick=()=>{pick=w;try{localStorage.setItem('studio-writer',w)}catch(e){}renderScenes()};tabs.append(b)});panel.append(tabs);
 const shown=pick==='both'?writers:[pick];shown.forEach(w=>{if(data[w].notes?.length)panel.append(el('div','scene-notes',WRITERS[w]+': '+data[w].notes.join('; ')))});
 const most=Math.max(...shown.map(w=>data[w].scenes.length));for(let i=0;i<most;i++)for(const w of shown){const s=data[w].scenes[i];if(s)panel.append(sceneCard(s,i,shown.length>1?w:null))}
 $('scenes-foot').textContent=shown.map(w=>data[w].scenes.length+' from '+(WRITERS[w]||w)).join(' · ')}
async function loadScenes(){const k=key();if(!cache[k]){try{cache[k]=(await api('/api/scenes?key='+encodeURIComponent(k))).writers}catch(e){cache[k]={}}}if(k===key()&&mode==='scenes')renderScenes()}
function counts(){const v=Object.values(sceneKeys);$('scenes-chapters').textContent=v.length;$('scenes-haiku').textContent=v.filter(w=>w.includes('haiku')).length;$('scenes-qwen').textContent=v.filter(w=>w.includes('qwen')).length}
function applyMode(){const scenes=mode==='scenes';
 document.querySelectorAll('.primary [data-pipeline]').forEach(b=>{const on=b.dataset.pipeline===mode;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 $('summaries-side').hidden=scenes;$('scenes-side').hidden=!scenes;$('scenes-top').hidden=!scenes;
 for(const n of [document.querySelector('main > .top'),document.querySelector('main > .stats'),$('summary-card'),document.querySelector('.toolbar'),$('edit-panel'),document.querySelector('.statusbox'),document.querySelector('.legend:not(#scenes-legend)')])n.hidden=scenes;
 $('scenes-card').hidden=!scenes;$('scenes-legend').hidden=!scenes;$('source-title').textContent=scenes?'The chapter behind the scenes':'The chapter behind the summary';
 document.title=(scenes?'Scenes':'Chapter Summary Studio')+' · Bible Project';if(scenes)loadScenes()}
function setMode(m){mode=m;try{localStorage.setItem('studio-pipeline',m)}catch(e){}history.replaceState(null,'','#'+m);applyMode();renderTiles()}
const baseRender=render,baseTiles=renderTiles;
render=function(){baseRender();if(mode==='scenes')loadScenes()};
renderTiles=function(){baseTiles();if(mode!=='scenes')return;document.querySelectorAll('#chapters .tile').forEach(t=>{t.classList.remove('draft','approved');t.classList.toggle('has-scenes',!!sceneKeys[code+':'+t.textContent.trim()])})};
document.querySelectorAll('.primary [data-pipeline]').forEach(b=>b.onclick=()=>setMode(b.dataset.pipeline));
api('/api/scenes').then(d=>{sceneKeys=d.keys;counts();renderTiles()}).catch(()=>{});applyMode();renderTiles()})();
"""

REPLACEMENTS = [("</style>", CSS + "</style>"), (APP_OLD, APP_NEW), ("</aside>", SCENES_SIDE),
                ('<section class="atlas book-explorer"', SCENES_TOP + '<section class="atlas book-explorer"'),
                (LEGEND_END, LEGEND_END + SCENES_LEGEND), (WORKSPACE_OLD, WORKSPACE_NEW), ("</script>", JS + "</script>")]


def install(html: str) -> str:
    """Adds the Scenes pipeline to the studio page. Each anchor must appear exactly once, or the page would be built
    wrong; a second install fails the same way."""
    for anchor, _ in REPLACEMENTS:
        if html.count(anchor) != 1:
            raise ValueError(f"Studio page changed: expected {anchor[:60]!r} once, found {html.count(anchor)} times")
    for anchor, replacement in REPLACEMENTS:
        html = html.replace(anchor, replacement)
    return html


def answer(query: str) -> dict:
    """GET /api/scenes: every chapter key with scenes, or with ?key=CODE:N that chapter's scenes by writer."""
    key = urllib.parse.parse_qs(query).get("key", [""])[0]
    store = chapter_scenes.Store()
    if not key:
        return {"keys": store.keys()}
    if key not in set(chapter_scenes.all_keys()):
        raise ValueError(f"Unknown chapter {key!r}; expected a key such as GEN:1")
    return {"key": key, "writers": store.chapter(key)}
