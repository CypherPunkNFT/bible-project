"""The Scenes view of the Chapter Summary Studio: a Summary | Scenes switch on the preview card, each writer's key scenes
for the chapter (picture frame, moment, composition, what is from the text, the image prompt), and a mark on chapters
that have scenes. Read-only; the scenes come from chapter_scenes.py's store. Docs: initiatives/chapter-scenes/README.md.
"""
from __future__ import annotations

import urllib.parse

import chapter_scenes

CSS = r"""
.view-switch{display:inline-flex;border:1px solid var(--line);border-radius:7px;overflow:hidden}
.view-switch button{border:0;background:transparent;color:var(--muted);padding:7px 14px;font-size:12px;font-weight:600}
.view-switch button.on{background:var(--green);color:#fff}
.tile.has-scenes{position:relative}.tile.has-scenes::after{content:"";position:absolute;top:3px;right:3px;width:5px;height:5px;border-radius:50%;background:var(--gold)}
#scenes-panel{padding:22px 24px}
.writer-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 20px}
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

PANEL = '<div id="scenes-panel" hidden></div>'

SWITCH = ('<div class="view-switch" role="group" aria-label="What to show"><button id="view-summary" class="on" '
          'aria-pressed="true">Summary</button><button id="view-scenes" aria-pressed="false">Scenes</button></div>')

JS = r"""
(()=>{const WRITERS={haiku:'Claude Haiku',qwen:'Local Qwen'};let mode='summary',sceneKeys={},cache={},pick='both';
try{mode=localStorage.getItem('studio-view')||'summary';pick=localStorage.getItem('studio-writer')||'both'}catch(e){}
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
function renderScenes(){const panel=$('scenes-panel');panel.replaceChildren();const data=cache[key()];
 if(!data){panel.append(el('p','scenes-empty','Loading scenes…'));return}
 const writers=Object.keys(data).sort();if(!writers.length){panel.append(el('p','scenes-empty','No scenes yet for this chapter. The pilot covers Genesis 22, Exodus 14, Leviticus 16, 1 Chronicles 1, 1 Samuel 17, Psalms 23 and 117, Ezekiel 1, Mark 4, John 11, Romans 8 and Revelation 21; chapters with scenes carry a gold dot.'));return}
 const tabs=el('div','writer-tabs');const choices=writers.length>1?['both',...writers]:writers;if(!choices.includes(pick))pick=choices[0];
 choices.forEach(w=>{const b=el('button',w===pick?'on':'',w==='both'?'Both, scene by scene':WRITERS[w]+' · '+data[w].scenes.length);b.onclick=()=>{pick=w;try{localStorage.setItem('studio-writer',w)}catch(e){}renderScenes()};tabs.append(b)});panel.append(tabs);
 const shown=pick==='both'?writers:[pick];shown.forEach(w=>{if(data[w].notes?.length)panel.append(el('div','scene-notes',WRITERS[w]+': '+data[w].notes.join('; ')))});
 const most=Math.max(...shown.map(w=>data[w].scenes.length));for(let i=0;i<most;i++)for(const w of shown){const s=data[w].scenes[i];if(s)panel.append(sceneCard(s,i,shown.length>1||pick==='both'?w:null))}}
async function loadScenes(){const k=key();if(!cache[k]){try{cache[k]=(await api('/api/scenes?key='+encodeURIComponent(k))).writers}catch(e){cache[k]={}}}if(k===key()&&mode==='scenes')renderScenes()}
function applyMode(){const scenes=mode==='scenes';document.querySelector('.preview-content').hidden=scenes;$('scenes-panel').hidden=!scenes;
 $('view-summary').classList.toggle('on',!scenes);$('view-scenes').classList.toggle('on',scenes);$('view-summary').setAttribute('aria-pressed',String(!scenes));$('view-scenes').setAttribute('aria-pressed',String(scenes));
 $('edit-panel').hidden=scenes;document.querySelector('.toolbar').hidden=scenes;if(scenes)loadScenes()}
function setMode(m){mode=m;try{localStorage.setItem('studio-view',m)}catch(e){}applyMode();renderTiles()}
const baseRender=render,baseTiles=renderTiles;
render=function(){baseRender();if(mode==='scenes')loadScenes()};
renderTiles=function(){baseTiles();document.querySelectorAll('#chapters .tile').forEach(t=>t.classList.toggle('has-scenes',mode==='scenes'&&!!sceneKeys[code+':'+t.textContent.trim()]))};
$('view-summary').onclick=()=>setMode('summary');$('view-scenes').onclick=()=>setMode('scenes');
api('/api/scenes').then(d=>{sceneKeys=d.keys;renderTiles()}).catch(()=>{});applyMode()})();
"""

SUMMARY_HEAD = "<strong>Reader preview · structured summary</strong>"
FOOT = '<div class="card-foot"><span>Click a verse range to check its source</span>'


def install(html: str) -> str:
    """Adds the view to the studio page. Each anchor must appear exactly once, or the page would be built wrong."""
    for anchor in ("</style>", SUMMARY_HEAD, FOOT, "</script>"):
        if html.count(anchor) != 1:
            raise ValueError(f"Studio page changed: expected {anchor!r} once, found {html.count(anchor)} times")
    return (html.replace("</style>", CSS + "</style>").replace(SUMMARY_HEAD, SWITCH)
            .replace(FOOT, PANEL + FOOT).replace("</script>", JS + "</script>"))


def answer(query: str) -> dict:
    """GET /api/scenes: every chapter key with scenes, or with ?key=CODE:N that chapter's scenes by writer."""
    key = urllib.parse.parse_qs(query).get("key", [""])[0]
    store = chapter_scenes.Store()
    if not key:
        return {"keys": store.keys()}
    if key not in set(chapter_scenes.all_keys()):
        raise ValueError(f"Unknown chapter {key!r}; expected a key such as GEN:1")
    return {"key": key, "writers": store.chapter(key)}
