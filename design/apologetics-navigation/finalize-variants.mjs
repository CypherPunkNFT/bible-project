import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
function edit(file,from,to){let source=fs.readFileSync(path.join(dir,file),'utf8');if(!source.includes(from))throw Error('Missing '+from.slice(0,80));fs.writeFileSync(path.join(dir,file),source.replace(from,to));}
edit('preview.tsx',"const ref=useRef<HTMLDivElement>(null);\n  const previous=useRef", "const ref=useRef<HTMLDivElement>(null),toggle=useRef<HTMLButtonElement|null>(null);\n  const previous=useRef");
edit('preview.tsx',"onClick={()=>setOpened(opened===d.label?null:d.label)}", "onClick={e=>{toggle.current=e.currentTarget;setOpened(opened===d.label?null:d.label);}}");
edit('preview.tsx','<CloseOnEscape close={()=>setOpened(null)}/>','<CloseOnEscape close={()=>{setOpened(null);toggle.current?.focus();}}/>');
edit('preview.tsx',"const [selected,setSelected]=useState(group)","const toggle=useRef<HTMLButtonElement>(null);\n  const [selected,setSelected]=useState(group)");
edit('preview.tsx','<button aria-expanded={opened} aria-controls="av-column-browser"','<button ref={toggle} aria-expanded={opened} aria-controls="av-column-browser"');
edit('preview.tsx','<CloseOnEscape close={()=>setOpened(false)}/>','<CloseOnEscape close={()=>{setOpened(false);toggle.current?.focus();}}/>');
edit('preview.tsx',"to:world+'#reading-sources'","to:world+'#wv-context-heading'");
edit('preview.tsx','{level.links.map(d=><Link key={d.to} to={d.to} aria-current=', '{level.links.map(d=><Link key={d.to} to={d.to} onClick={()=>setOpen(null)} aria-current=');
edit('variants.css','.av-column-choices>button[aria-pressed=true]>svg:first-child{','.av-column-choices>button[aria-pressed=true]>svg:first-child:not(.wv-art){');
const catalogPath=path.resolve(dir,'../catalog.json'),catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const section=catalog.sections.find(s=>s.id==='apologetics');
const a=section.cards.find(c=>c.id==='apologetics-navigation');
Object.assign(a,{title:'A · Two rows',url:'/mockups/apologetics-navigation/?d=a',line:'The original direction: Apologetics tabs above four peer worldviews, with an Islam study sidebar.'});
const variants=[['b','Mega-menu','Section dropdowns open illustrated worldview collections; Islam study tabs keep the page full width.'],['c','Library tree','A persistent expandable tree holds the complete Apologetics hierarchy beside the page.'],['d','Context bar','Three compact selectors reveal the section, worldview and local study destinations.'],['e','Column browser','Choose a section, worldview and study from three adjacent columns, then open the destination.']];
for(const [id,title,line] of variants){const card={id:'apologetics-navigation-'+id,title:id.toUpperCase()+' · '+title,url:'/mockups/apologetics-navigation/?d='+id,date:'2026-10-09',status:'option',line};const existing=section.cards.findIndex(c=>c.id===card.id);if(existing>=0)section.cards[existing]=card;else section.cards.splice(section.cards.indexOf(a)+1+variants.findIndex(v=>v[0]===id),0,card);}
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
console.log('Navigation refinements and A-E gallery entries saved.');
