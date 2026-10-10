import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(dir,'preview.tsx');let source=fs.readFileSync(file,'utf8');
source=source.replace("import './variants.css';","import './variants.css';\nimport {WorldviewNavigation} from './worldview-menus';");
const start=source.indexOf('const designs = ['),end=source.indexOf('const DesignContext=',start);
source=source.slice(0,start)+`const designs = [
 {id:'a',name:'Replace in place',description:'The cleaned-up B: switch between worldview choices and the current collection subpages.'},
 {id:'b',name:'Side by side',description:'Worldviews alongside collapsible subpages.'},
 {id:'c',name:'Worldview tabs',description:'All worldviews stay visible above collapsible subpages.'},
 {id:'d',name:'Expandable cards',description:'Each worldview expands its own subpages.'},
];
`+source.slice(end);
const oldStart=source.indexOf('function CloseOnEscape('),oldEnd=source.indexOf('export function NavigationHeader()',oldStart);
source=source.slice(0,oldStart)+source.slice(oldEnd);
const navStart=source.indexOf("    {design==='a'?<div"),navEnd=source.indexOf('    <dialog className="am-dialog"',navStart);
source=source.slice(0,navStart)+'    <WorldviewNavigation key={design}/>\n'+source.slice(navEnd);
const sideStart=source.indexOf('export function IslamSideNav()'),sideEnd=source.indexOf('export function IslamGuide()',sideStart);
source=source.slice(0,sideStart)+'export function IslamSideNav(){return null;}\n\n'+source.slice(sideEnd);
source=source.replace("{design==='f'?<Search size={15}/>:<Grid2X2 size={15}/>}",'<Search size={15}/>').replace("{design==='f'?'Search Apologetics':'Browse library'}",'Search Apologetics');
source=source.replace('Explore all worldviews <ArrowRight size={15}/>','Worldviews <ArrowRight size={15}/>');
source+='\nexport {main, worlds, islamPages, groupFor, secondary, currentIslam, useDesign};\n';
fs.writeFileSync(file,source);
const catalogFile=path.resolve(dir,'../catalog.json'),catalog=JSON.parse(fs.readFileSync(catalogFile,'utf8'));
const section=catalog.sections.find(s=>s.id==='apologetics');
section.cards=section.cards.filter(c=>!c.id.startsWith('apologetics-navigation'));
const cards=[['a','Replace in place','Cleaned-up contained menu; Islam subpages exchange places with the four-worldview chooser.'],['b','Side by side','Four worldviews alongside the current collection and collapsible subpage links.'],['c','Worldview tabs','Persistent worldview choices above collapsible subpages.'],['d','Expandable cards','Each worldview opens subpages directly inside its own card.']].map(([id,title,line])=>({id:'apologetics-navigation'+(id==='a'?'':'-'+id),title:id.toUpperCase()+' · '+title,url:'/mockups/apologetics-navigation/?d='+id+'#/apologetics/worldviews/islam',date:'2026-10-09',status:'option',line}));
section.cards.unshift(...cards);fs.writeFileSync(catalogFile,JSON.stringify(catalog,null,2)+'\n');
console.log('Round two registered: A-D worldview submenu directions.');
