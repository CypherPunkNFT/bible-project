(() => {
// The reference drawings, shown as they really are: each source mock-up is opened out of sight, and its drawings are
// copied here with that page's own styles inside a shadow root, so no page's classes or scripts clash with another's.
// The owner, 2026-10-25: "These are just for reference ... put the lighthouse in there, put the sun field help for life
// one, put others." Lighthouse = Help for life drawing 6 (rock); sun field = Help for life round 2, B (morning).
const SOURCES=[
 {key:'hfl',url:'/mockups/help-for-life-drawings/',sel:'li.cell'},
 {key:'hfl2',url:'/mockups/help-for-life-drawings-2/',sel:'li.cell'},
 {key:'res',url:'/mockups/resources-card-directions/',sel:'article.card'},
 {key:'par',url:'/mockups/hidden-treasure-drawings/',sel:'article.cell'}
];
// Which drawings, in what order; a source listed with no ids gives all of its drawings, in its own order.
const GROUPS=[
 {id:'ref-help-for-life',title:'Help for life',line:'The lighthouse and the sunrise field first, then every other Help for life drawing.',
  picks:[['hfl','rock'],['hfl2','morning'],['hfl2','well'],['hfl2','door-solid'],['hfl2','loaves'],['hfl','*']]},
 {id:'ref-resources',title:'Resources cards',line:'The morning lakes, the tree of life, fellowship, the umbrella, the bookcases and the rest.',picks:[['res','*']]},
 {id:'ref-parables',title:'The parables',line:'Hidden treasure four ways, then the sower, the mustard seed, the lost sheep and the pearl.',picks:[['par','*']]}
];
const OVERRIDES=`main,#main,.wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
.grid,.cards,ol,section{display:block!important;border:0!important;margin:0!important;padding:0!important;column-gap:0!important}
.cell{border:0!important;padding-top:0!important}.use{display:none!important}a{pointer-events:none}`;
function themed(css){return css.replace(/:root\[data-theme=("?)dark\1\]/g,':host-context([data-theme="dark"])')
 .replace(/:root:not\(\[data-theme=("?)dark\1\]\)/g,':host-context([data-theme="light"])').replace(/:root\b/g,':host');}
function load(src){return new Promise((resolve,reject)=>{const f=document.createElement('iframe');
 f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.style.cssText='position:absolute;left:-12000px;top:0;width:1280px;height:900px;border:0';
 f.onload=()=>setTimeout(()=>resolve(f),400);f.onerror=()=>reject(new Error(`could not open ${src.url}`));f.src=src.url;document.body.append(f);});}
async function stylesOf(doc){let css='';
 for(const node of doc.querySelectorAll('link[rel=stylesheet],style')){
  if(node.tagName==='STYLE'){css+=node.textContent;continue;}
  const r=await fetch(node.href);if(!r.ok)throw new Error(`stylesheet ${node.href}: HTTP ${r.status}`);css+=await r.text();}
 return themed(css)+OVERRIDES;}
function withAncestors(el){let html=el.outerHTML;for(let a=el.parentElement;a&&a.tagName!=='BODY';a=a.parentElement){const c=a.cloneNode(false);c.innerHTML=html;html=c.outerHTML;}return html;}
async function gather(){const out={};
 for(const src of SOURCES){const f=await load(src);const doc=f.contentDocument;
  const items=[...doc.querySelectorAll(src.sel)];if(!items.length)throw new Error(`${src.url}: no drawings matched ${src.sel}`);
  out[src.key]={css:await stylesOf(doc),items:items.map(el=>({id:el.id,html:withAncestors(el)}))};f.remove();}
 return out;}
function host(css,html){const div=document.createElement('div');div.className='ref';const root=div.attachShadow({mode:'open'});root.innerHTML=`<style>${css}</style>${html}`;return div;}
window.renderReferences=async(container)=>{
 container.innerHTML=GROUPS.map(gr=>`<section class="ref-group" id="${gr.id}"><h2 class="row-label">${gr.title}</h2><p class="ref-line">${gr.line}</p><div class="ref-grid"></div></section>`).join('');
 let data;try{data=await gather();}catch(error){console.error('reference drawings:',error);container.insertAdjacentHTML('afterbegin',`<p class="ref-error" role="alert">The reference drawings could not be loaded: ${error.message}</p>`);return;}
 GROUPS.forEach((gr,i)=>{const grid=container.querySelectorAll('.ref-grid')[i],used=new Set();
  for(const [key,id] of gr.picks){const src=data[key],named=gr.picks.filter(([k,x])=>k===key&&x!=='*').map(([,x])=>x);
   src.items.forEach((item,index)=>{const tag=`${key}#${index}`;
    if(used.has(tag)||(id==='*'?named.includes(item.id):item.id!==id))return;
    used.add(tag);grid.append(host(src.css,item.html));});}});
};
})();
