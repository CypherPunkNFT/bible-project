import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(directory,'../..');
process.chdir(root);
const {libraryArt}=await import('../bible-listen/art.mjs');
const catalogue=JSON.parse(await fs.readFile('data/catalog.json','utf8'));
const artwork=JSON.parse(await fs.readFile('src/components/bible/collection-stacks.json','utf8'));
const selections=artwork.groups.map(group=>({...group,codes:group.books.map(book=>book.code)})).map(group=>({...group,books:group.codes.map(code=>{
 const book=catalogue.books.find(book=>book.code===code);
 if(!book||book.section!==group.section)throw Error(`Check representative book ${code}`);
 return book;
})}));
const options=[
 {id:1,title:'Collected stacks',description:'Varied spines and gently staggered edges, gathered around the original collection.'},
];
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>';
const libraryIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 3v18M9 3v18M14 5l5-1 4 16-5 1-4-16Z"/></svg>';
const approvedArt=libraryArt(1);
const volumes=approvedArt.slice(approvedArt.indexOf('<div class="library-volumes">'),approvedArt.indexOf('<div class="library-shelf-line">'));
if(!volumes.endsWith('</div></div>'))throw Error('Review the approved category artwork before rebuilding');
// Decorative proportions shared with the applied Bible card, not book lengths.
const bookSizes=Object.fromEntries(artwork.groups.flatMap(group=>group.books.map(book=>[book.code,[book.width,book.height,book.offset]])));
for(const book of selections.flatMap(group=>group.books)){
 const [width,height,offset]=bookSizes[book.code]??[];
 if(!(width>0&&height>=27&&offset>=0&&width+offset<=100))throw Error(`Review side-book proportions for ${book.code}`);
}
const stack=group=>`<div class="collection-stack" data-section="${group.section}" style="--book-color:var(--${group.section})">${group.books.map(book=>{const [width,height,offset]=bookSizes[book.code];return `<div class="sample-book" data-book="${book.code}" style="--spine-width:${width}%;--spine-height:${height}px;--spine-offset:${offset}%"><span>${escape(book.name)}</span></div>`;}).join('')}</div>`;
const stackOrder={historicalTopToBottom:artwork.wings.find(wing=>wing.side==='history').sections,leftTopToBottom:artwork.wings.find(wing=>wing.side==='left').sections,rightTopToBottom:artwork.wings.find(wing=>wing.side==='right').sections};
const wing=order=>order.map(section=>stack(selections.find(group=>group.section===section))).join('');
const sparkles='<svg class="collection-stars" viewBox="0 0 1320 390" fill="none" stroke="currentColor" aria-hidden="true"><path d="M303 46h10m-5-5v10M965 298h10m-5-5v10M1005 48h8m-4-4v8M326 334h6m-3-3v6"/><path d="M296 105Q650-12 1032 109M309 288Q661 408 1010 279" stroke-dasharray="1 8" opacity=".5"/></svg>';
const card=option=>`<section class="direction option-${option.id}" id="option-${option.id}" data-option="${option.id}" aria-labelledby="direction-${option.id}">
 <header class="direction-heading"><p class="direction-number">0${option.id}</p><div><h2 id="direction-${option.id}">${option.title}</h2><p>${option.description}</p></div></header>
 <a href="/library" class="collection-card" aria-labelledby="library-${option.id}"><div class="collection-top">${libraryIcon}<span>Explore the collection</span>${arrow}</div>
 <div class="collection-scene" aria-hidden="true">${sparkles}<div class="wing wing-history">${wing(stackOrder.historicalTopToBottom)}</div><div class="wing wing-left">${wing(stackOrder.leftTopToBottom)}</div>${volumes}<div class="wing wing-right">${wing(stackOrder.rightTopToBottom)}</div></div>
 <div class="collection-copy"><h3 id="library-${option.id}">Library</h3><p>See the Bible at a glance. Choose a version, explore its books, and open any chapter.</p><div class="collection-foot"><span>${catalogue.translations.length} versions · ${new Set(catalogue.translations.map(version=>version.lang)).size} languages</span><strong>Explore the library ${arrow}</strong></div></div></a>
 </section>`;
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Library book stacks · Revised 01 · Bible Project</title>
<link rel="icon" href="../journeys-directions/favicon.svg"><link rel="stylesheet" href="./mock.css"><script>try{const t=localStorage.getItem('bp-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{document.documentElement.dataset.theme='light'}</script><script src="./mock.js" defer></script></head><body>
<header class="mock-header"><div class="color-strip" aria-hidden="true">${['history','poetry','prophets','gospels','epistles','revelation'].map(color=>`<i style="background:var(--${color})"></i>`).join('')}</div><div class="header-inner"><a class="brand" href="/bible"><img src="../journeys-directions/favicon.svg" alt="">Bible Project</a><nav aria-label="Preview navigation"><a href="/bible">Bible</a><a href="/mockups/">Design gallery</a></nav><button type="button" class="theme-toggle" role="switch" aria-label="Dark mode" aria-checked="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.3 15.5A9 9 0 0 1 8.5 3.7 9 9 0 1 0 20.3 15.5Z"/></svg><span>Theme</span></button></div></header>
<main><header class="preview-intro"><p class="eyebrow">Library artwork / Revised 01</p><h1>The collection, <em>gathered together.</em></h1><p>Side books with varied proportions and naturally staggered edges.</p></header><div class="directions">${options.map(card).join('')}</div><footer class="preview-footer">Design preview · <a href="/bible">Back to the Bible page ${arrow}</a></footer></main></body></html>`;
await fs.writeFile(path.join(directory,'index.html'),html);
await fs.writeFile(path.join(directory,'selection.json'),JSON.stringify({source:'data/catalog.json',representativeBooks:selections.reduce((count,group)=>count+group.books.length,0),stackOrder,alignment:'Historical pile on the left; Poetical/Prophetical lowered to the common invisible baseline; close joins with varied edges',artworkSizes:{meaning:'Decorative dimensions for SIDE books only; not book-length estimates; original center artwork preserved',dimensions:['widthPercent','heightPx','leftOffsetPercent'],sideBookHeightRange:[27,34],originalCenterPreserved:true,books:bookSizes},gospels:'All four Gospels; Acts is not a Gospel',groups:selections,options},null,2)+'\n');
await fs.mkdir(path.join(directory,'fonts'),{recursive:true});
for(const [family,file] of [['archivo','archivo-latin-wght-normal.woff2'],['literata','literata-latin-opsz-normal.woff2'],['literata','literata-latin-opsz-italic.woff2']])await fs.copyFile(`node_modules/@fontsource-variable/${family}/files/${file}`,path.join(directory,'fonts',file));
for(const family of ['archivo','literata'])await fs.copyFile(`node_modules/@fontsource-variable/${family}/LICENSE`,path.join(directory,'fonts',`${family}-LICENSE.txt`));
const catalogueFile='design/catalog.json';const gallery=JSON.parse(await fs.readFile(catalogueFile,'utf8'));
let section=gallery.sections.find(section=>section.id==='bible-listen');
if(!section){section={id:'bible-listen',title:'Bible',line:'Read, listen, and explore the library.',page:'/bible',cards:[]};gallery.sections.unshift(section);}
for(const group of gallery.sections)group.cards=group.cards.filter(card=>!/^library-book-stacks-[234]$/.test(card.id));
for(const option of options){const card={id:`library-book-stacks-${option.id}`,title:`Library stacks ${option.id} · ${option.title}`,url:`/mockups/library-book-stacks/?option=${option.id}`,date:'2026-10-17',status:'approved',line:option.description};const current=section.cards.findIndex(current=>current.id===card.id);if(current<0)section.cards.push(card);else section.cards[current]={...section.cards[current],...card};}
await fs.writeFile(catalogueFile,JSON.stringify(gallery,null,2)+'\n');
console.log('Approved option 01: mock regenerated from the shared 22-book artwork selections. Application source unchanged by this generator.');
