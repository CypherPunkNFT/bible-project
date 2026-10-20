import fs from 'node:fs';
import {listenArt,libraryArt} from '../design/bible-listen/art.mjs';
fs.mkdirSync('src/components/bible',{recursive:true});
const jsx=markup=>markup.replace(/\bclass=/g,'className=').replace(/\b(stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|fill-opacity)=/g,(_,name)=>name.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())+'=').replace(/style="([^"]+)"/g,(_,style)=>'style={'+JSON.stringify(Object.fromEntries(style.split(';').filter(Boolean).map(rule=>{const i=rule.indexOf(':');return[rule.slice(0,i),rule.slice(i+1)];})))+' as CSSProperties}');
fs.writeFileSync('src/components/bible/BibleCardArt.tsx',`// Approved local artwork, copied from design/bible-listen.
import type {CSSProperties} from 'react';
const LISTEN = (${jsx(listenArt)});
const LIBRARY = (${jsx(libraryArt(1))});
export function BibleCardArt({kind}:{kind:'listen'|'library'}) {
 return <div className="bible-card-art">{kind==='listen'?LISTEN:LIBRARY}</div>;
}
`);
const nt=JSON.parse(fs.readFileSync('.local/listen-source-0.json','utf8'));
const ot=JSON.parse(fs.readFileSync('.local/listen-source-1.json','utf8'));
const chosen=[...ot.filter(v=>/^(Psalms|Proverbs) Audio/.test(v.title)),...nt.slice(5)];
const sources=['PLzdekiijsY-KecBWfn4sA-GKPptBptCV2','PLzdekiijsY-Io4l4txjh1zNARaNoRQoxK'];
const books=chosen.map(v=>{const name=v.title.split(' Audio')[0];return {id:v.id,name,group:['Psalms','Proverbs'].includes(name)?'wisdom':name==='Revelation'?'revelation':'epistles',duration:v.duration?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text??'',playlist:sources[['Psalms','Proverbs'].includes(name)?0:1],sourceTitle:v.title};});
if(books.length!==24||new Set(books.map(b=>b.id)).size!==24)throw Error('Expected the two selected OT books, 21 Epistles and Revelation');
fs.mkdirSync('src/data/listen',{recursive:true});
fs.writeFileSync('src/data/listen/recordings.json',JSON.stringify({source:'STREETLIGHTS',verifiedOn:'2026-10-17',selection:'Only Psalms, Proverbs, Epistles and Revelation are selected. Gospels, Acts and the remaining Old Testament await a recording choice.',books},null,2)+'\n');
console.log('Prepared approved artwork and 24 verified book links.');
