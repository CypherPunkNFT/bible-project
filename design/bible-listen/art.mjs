import fs from 'node:fs';

// Reuse the selected Preachers landing book's actual paths and curved text lines.
const landingSource=fs.readFileSync('src/pages/teachers/preachers/landing/RadiatingBible.tsx','utf8');
const bookSource=landingSource.slice(landingSource.indexOf('<Stroke d="M100 163'),landingSource.indexOf('\n  </>;'));
const bookPaths=[...bookSource.matchAll(/<Stroke d="([^"]+)" kind="([^"]+)"/g)].filter(([,d])=>d!=='M191 216L202 228L208 226L214 230L203 211').map(([,d,kind])=>`<path d="${d}"${kind==='rb-paper'?' fill="var(--surface)"':kind==='rb-faint'?' opacity=".35"':''}/>`).join('');
const bookText=Array.from({length:6},(_,i)=>{
 const t=.13+i*.13,left=+(104-30*t+8).toFixed(2),y=+(160+43*t).toFixed(2);
 const c1x=+(131-15*t).toFixed(2),c1y=+(148+44*t+3).toFixed(2),c2y=+(154+44*t+3).toFixed(2),endY=+(166+47*t-1).toFixed(2);
 return `<path opacity=".55" d="M${left} ${y}C${c1x} ${c1y} 153 ${c2y} ${i===5?161:172} ${i===5?endY-5:endY}M188 ${endY}C207 ${c2y} ${360-c1x} ${c1y} ${i===5?360-left-13:360-left} ${i===5?y-2:y}"/>`;
}).join('');
const landingBook=`<g class="listen-landing-book" transform="translate(109.7 35.4) scale(.835 .88)" stroke-width="1.55">${bookPaths}${bookText}</g>`;
const star=(x,y,r=5)=>`<path d="M${x-r} ${y}h${r*2}m-${r} -${r}v${r*2}"/>`;
const cross=(x,y)=>`<path d="M${x} ${y-13}v30m-9-21h18"/>`;
export const listenArt=`<div class="bible-audio-art" aria-hidden="true"><svg viewBox="0 0 520 250" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
<g opacity=".28" stroke-dasharray="1 7"><ellipse cx="260" cy="124" rx="208" ry="83"/><path d="M40 148c95-139 344 123 444-25"/><path d="M98 32c52 179 275 171 329-6"/></g>
<g opacity=".55">${star(78,83,6)}${star(420,171,7)}${star(391,47,4)}${star(129,199,4)}${cross(111,119)}${cross(421,90)}<circle cx="156" cy="49" r="2"/><circle cx="367" cy="206" r="2"/><circle cx="54" cy="174" r="2"/></g>
<circle cx="260" cy="122" r="91" opacity=".13"/><path d="M182 128V98a78 78 0 0 1 156 0v30" stroke-width="3"/><path d="M191 97a69 69 0 0 1 138 0" opacity=".35" stroke-width="6"/>
<rect x="175" y="112" width="25" height="55" rx="11" fill="currentColor" fill-opacity=".12" stroke-width="1.5"/><rect x="320" y="112" width="25" height="55" rx="11" fill="currentColor" fill-opacity=".12" stroke-width="1.5"/>
<path d="M209 146v-13m10 22v-31m10 38v-46m10 38v-31m10 39v-52m11 60v-68m11 58v-48m10 38v-28m10 34v-40m10 28v-16m10 12v-8" stroke-width="2"/>
${landingBook}
<circle cx="260" cy="70" r="17" fill="var(--surface)"/><path d="m256 63 10 7-10 7z" fill="currentColor" stroke="none"/>
</svg></div>`;
const emblem=`<svg viewBox="0 0 84 102" fill="none" stroke="currentColor" aria-hidden="true"><g opacity=".35" stroke-dasharray="1 4"><circle cx="42" cy="46" r="32"/></g><path d="M42 19v37M30 31h24M24 64l-5-18 15 9 8-12 8 12 15-9-5 18zM24 70h36" stroke-width="1.6" stroke-linejoin="round"/><path d="m42 80 2 5 6 1-5 4 1 6-4-3-5 3 1-6-4-4 6-1z" stroke-width="1"/>${star(13,22,3)}${star(70,28,3)}</svg>`;
const groups=[['Historical books','history'],['Poetical books','poetry'],['Prophetical books','prophets'],['Gospels','gospels'],['Epistles','epistles']];
const categoryPaths={
 history:'<path d="M4 21V9h4V4h3v5h3V4h3v5h3v12H4Zm6 0v-5a2 2 0 0 1 4 0v5M4 12h16"/>',
 poetry:'<path d="M6 4c2 1 3 3 3 5v7c0 3 6 3 6 0V9c0-2 1-4 3-5M6 4h12M6 4v12a6 6 0 0 0 12 0V4M9 8h6m-3 0v10"/>',
 prophets:'<path d="m4 13 12-5V4l4-2v18l-4-2v-4L4 17v-4Zm4 3 1 5h4l-2-6M2 13v4M23 7h1m-1 8h1"/>',
 gospels:'<path d="M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z"/>',
 epistles:'<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3 6 9 7 9-7M3 18l6-6m12 6-6-6"/>',
 revelation:'<path d="m3 6 5 5 4-7 4 7 5-5-3 13H6L3 6Zm3 10h12"/><circle cx="3" cy="5" r="1"/><circle cx="12" cy="3" r="1"/><circle cx="21" cy="5" r="1"/>'
};
const categoryIcon=color=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${categoryPaths[color]}</svg>`;
export function libraryArt(variant){
 if(variant===2||variant===3)return categoryStacks(variant);
 const volumes=variant===2?[...groups,['Revelation','revelation']]:groups;
 return `<div class="library-illustration library-art-${variant}" aria-hidden="true"><div class="library-stars"><svg viewBox="0 0 600 280" fill="none" stroke="currentColor">${star(35,47,5)}${star(310,19,5)}${star(566,54,6)}${star(463,249,4)}<path d="M42 82Q240-10 510 79M75 240Q290 293 555 219" stroke-dasharray="1 7" opacity=".4"/></svg></div><div class="library-volumes"><div class="horizontal-books">${volumes.map(([title,color],i)=>`<div class="horizontal-book book-${i}" style="--book-color:var(--${color})"><span class="spine-rule"></span><span class="spine-symbol">${categoryIcon(color)}</span><span class="spine-title">${title}</span><span class="spine-rule"></span></div>`).join('')}</div>${variant===2?'':`<div class="revelation-volume"><span class="volume-top">THE REVELATION</span>${emblem}<strong>Revelation</strong><span class="volume-bottom">OF JESUS CHRIST</span></div>`}</div><div class="library-shelf-line"></div></div>`;
}
const bibleGroups=[
 ['Historical','history',['Genesis','Exodus','Joshua','Ruth','1 Samuel','1 Kings','Esther','Acts']],
 ['Poetical','poetry',['Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon']],
 ['Prophetical','prophets',['Isaiah','Jeremiah','Ezekiel','Daniel','Hosea','Jonah','Micah','Malachi']],
 ['Gospels','gospels',['Matthew','Mark','Luke','John']],
 ['Epistles','epistles',['Romans','1 Corinthians','Galatians','Ephesians','Philippians','Hebrews','James','1 Peter']],
 ['Revelation','revelation',['Revelation']]
];
function categoryStacks(variant){
 return `<div class="category-library category-library-${variant}">${bibleGroups.map(([label,color,books],groupIndex)=>{
 const rows=variant===3&&books.length>10?[books.slice(0,Math.ceil(books.length/2)),books.slice(Math.ceil(books.length/2))]:[books];
 return `<div class="category-stack" style="--book-color:var(--${color})"><div class="category-piles">${rows.map((pile,pileIndex)=>`<div class="individual-pile">${pile.map((name,i)=>`<div class="individual-book" style="--offset:${variant===2?[0,3,-2,5,-1][(i+groupIndex)%5]:[0,2,-1][(i+pileIndex)%3]}px" title="${name}"><span>${name}</span></div>`).join('')}</div>`).join('')}${color==='revelation'?`<div class="category-revelation-art" aria-hidden="true">${emblem}</div>`:''}</div><div class="category-label"><span aria-hidden="true">${categoryIcon(color)}</span><strong>${label}</strong><small>${books.length} ${books.length===1?'book':'books'}</small></div></div>`;
 }).join('')}</div>`;
}
