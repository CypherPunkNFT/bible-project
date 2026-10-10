// One restrained composition, four poses. No surrounding arc or connecting rays.
const P=(d,c='sa-line',t=0)=>`<path d="${d}" pathLength="1" class="${c}" style="--d:${t}"/>`;
const G=(transform,content)=>`<g transform="${transform}">${content}</g>`;
function stars(points){return points.map(([x,y,r],i)=>`<path pathLength="1" class="sa-fine star" style="--d:${.05+i*.045};--i:${i}" d="M${x} ${y-r}C${x+.4} ${y-1} ${x+1} ${y-.4} ${x+r} ${y}C${x+1} ${y+.4} ${x+.4} ${y+1} ${x} ${y+r}C${x-.4} ${y+1} ${x-1} ${y+.4} ${x-r} ${y}C${x-1} ${y-.4} ${x-.4} ${y-1} ${x} ${y-r}Z"/>`).join('');}

// The book's leaves have bowed top and bottom edges, a recessed gutter,
// separate cover and page block, and text following the curvature of the paper.
function bible(){
  let b=P('M54 108L58 142C80 137 103 140 120 150C137 140 160 137 182 142L186 108','sa-fine',.22);
  b+=P('M58 105C80 98 102 101 120 111C138 101 160 98 182 105L179 137C158 132 138 137 120 146C102 137 82 132 61 137Z','sa-line paper',.26);
  b+=P('M120 111V146M62 137L62 140C82 135 102 139 120 148C138 139 158 135 178 140L178 137','sa-fine',.31);
  b+=P('M63 104C83 100 103 104 116 111M124 111C137 104 157 100 177 104','sa-fine',.35);
  for(let i=0;i<4;i++){
    const y=110+i*6;
    b+=P(`M68 ${y}C84 ${y-3} 100 ${y} 112 ${y+6}M128 ${y+6}C140 ${y} 155 ${y-3} 172 ${y}`,'sa-fine book-text',.4+i*.035);
  }
  b+=P('M136 141L136 153L140 150L144 151L144 138','sa-fine',.6);
  return b;
}
function face(){return P('M110 56C108 49 112 43 119 43C128 43 133 49 131 57L130 64C129 71 125 75 120 75C115 75 111 70 110 64Z','sa-line',.12)
  +P('M110 56C113 54 115 51 116 48C120 53 126 54 131 54M110 59C106 56 106 64 111 65M131 59C135 56 134 64 130 65','sa-fine',.16)
  +P('M114 61L117 62M124 62L127 61M120 62L119 67H122M117 70Q120 72 123 70','sa-fine face-detail',.2);}

// A: a calm, frontal reader. The broad shoulder silhouette frames the book.
let reader=stars([[54,34,3],[82,23,3.8],[119,15,5],[155,23,3.8],[186,36,3]]);
reader+=face()+P('M114 73V80L101 84C87 86 81 96 80 108M126 73V80L139 84C153 87 158 96 160 108M114 80L120 86L126 80M101 84L114 96L120 86L126 96L139 84M91 96L88 105M149 96L152 105','sa-line',.23);
reader+=bible();
reader+=P('M60 116C55 115 55 119 59 121M60 122C55 121 56 125 60 126M180 116C185 115 185 119 181 121M180 122C185 121 184 125 180 126','sa-fine skin',.58);

// B: a teacher speaking, with one open hand; the other rests at the book.
let speaker=stars([[58,33,3.5],[88,19,3],[125,13,4.6],[159,25,3],[191,39,3.4]]);
speaker+=G('translate(-5 2)',face());
speaker+=P('M109 75V81L96 85C87 88 82 96 82 108M121 75V81L135 86L150 97L169 79M108 82L115 88L123 82M98 87L109 99M130 87L125 100M153 103L175 84','sa-line',.23);
speaker+=P('M169 79L166 71Q165 67 168 67L172 73L174 60Q175 57 177 60V70L180 60Q182 58 183 62L182 73L186 65Q188 63 189 67L186 78Q183 84 175 84','sa-fine',.29);
speaker+=G('translate(-3 3) scale(1 .98)',bible());
speaker+=P('M59 119C54 118 54 122 59 123M59 125C55 124 55 128 60 129','sa-fine skin',.6);

// C: a bowed reader. His head inclines toward the right-hand page;
// shoulders and elbows remain quiet, with a lower, flatter book.
let bowed=stars([[55,29,3.5],[86,17,3],[121,11,4.5],[157,23,4],[187,40,2.8]]);
bowed+=G('translate(4 4) rotate(12 120 60)',face());
bowed+=P('M119 80L108 83C94 85 87 96 85 111M131 79L142 84C155 88 161 99 161 110M111 85L120 95L129 85M96 97L96 108M149 97L152 109','sa-line',.23);
bowed+=G('translate(0 12) scale(1 .92)',bible());
bowed+=P('M64 124C59 123 60 129 65 130M176 124C181 123 180 129 175 130','sa-fine skin',.58);

// D: a close, simple bust holding the book. Fewer garment marks, a wider
// spread, and five stars with an intentionally uneven rhythm.
let holding=stars([[49,39,3],[78,19,4],[117,12,5.2],[156,27,3],[190,34,4]]);
holding+=G('translate(0 2) scale(1 1.03)',face());
holding+=P('M113 79L111 84C100 85 88 91 82 100L72 121M127 79L129 84C141 86 151 91 157 100L168 121M112 84Q120 93 128 84M99 94L92 103M141 94L148 103','sa-line',.24);
holding+=G('translate(-7 -2) scale(1.06 1)',bible());
holding+=P('M64 119L60 115Q56 113 56 117L60 121L60 127Q60 131 65 131M176 119L180 115Q184 113 184 117L180 121V127Q180 131 175 131','sa-fine skin',.57);

const scenes=[reader,speaker,bowed,holding];
const names=['The reader','The teacher','The quiet study','Holding the Word'];
document.getElementById('grid').innerHTML=scenes.map((scene,i)=>`<article class="sample" tabindex="0" aria-label="${'ABCD'[i]}: ${names[i]}"><span class="letter">${'ABCD'[i]}</span><div class="scene"><svg class="sa-art" viewBox="0 0 240 165" fill="none" role="img" aria-label="${names[i]}"><g class="sa-base">${scene}</g><g class="sa-live">${scene}</g></svg></div></article>`).join('');
document.getElementById('theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';};
