(() => {
const p=(d,c='')=>`<path d="${d}" class="${c}"/>`;
const circle=(x,y,r,c='')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const group=(s,c)=>`<g class="${c}">${s}</g>`;
const ground=p('M29 185H251M70 190H211','faint');
function book(x,y,w=70,h=20){const l=x-w/2,r=x+w/2;let s=p(`M${l} ${y}Q${x-18} ${y-8} ${x} ${y+1}Q${x+18} ${y-8} ${r} ${y}V${y+h}Q${x+18} ${y+h-7} ${x} ${y+h+1}Q${x-18} ${y+h-7} ${l} ${y+h}ZM${x} ${y+1}V${y+h+1}`,'paper');s+=p(`M${l-3} ${y+3}V${y+h+4}Q${x-18} ${y+h-3} ${x} ${y+h+5}Q${x+18} ${y+h-3} ${r+3} ${y+h+4}V${y+3}`,'fine');for(let i=0;i<3;i++)s+=p(`M${l+5} ${y+5+i*4}Q${x-18} ${y+i*4} ${x-5} ${y+6+i*4}M${x+5} ${y+6+i*4}Q${x+18} ${y+i*4} ${r-5} ${y+5+i*4}`,'fine');return s;}
function shelves(){let s=p('M47 177V44Q140-8 233 44V177M54 176V49Q140 4 226 49V176M140 20V113','faint');for(const y of [77,115]){s+=p(`M55 ${y}H225M55 ${y+3}H225`,'fine');for(let i=0;i<12;i++){const x=62+i*13,h=[25,31,23,28,26][i%5];s+=p(`M${x} ${y}V${y-h}H${x+8}V${y}M${x+2} ${y-h+5}H${x+6}M${x+2} ${y-5}H${x+6}`,'fine');}}return s;}
let desk=shelves().replace('M140 20V113','')+p('M76 151H204L195 141H85ZM82 152V181H89V154M191 153V181H198V152M91 154H189V164H91ZM137 159H146','paper');
desk+=group(book(140,121,56,23),'turning-page')+ground;
// Q is a copy of P. Only Q gets an opaque clearance behind the book;
// keep P's markup and drawing exactly as they were.
const bookClearance='<path d="M112 121Q122 113 140 122Q158 113 168 121V126H112Z" fill="var(--surface)" stroke="var(--surface)" stroke-width="5" stroke-linejoin="round"/>';
const corner=desk.replace('<g class="turning-page">','<g class="turning-page">'+bookClearance);
let lectern=shelves()+p('M93 151L102 129H178L188 151ZM101 153H180M115 152L109 181M165 152L172 181M114 168H168','paper');
lectern+=book(140,124,67,18)+p('M65 177V150H87V177M68 150V146H84V150M68 159H84M68 165H84','fine')+ground;
// Broad, woody vines. Berries are small relative to established trunks and foliage.
function leaf(x,y,a=0,s=1){return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${p('M0 0L-8-5L-18-4L-15-13L-22-20L-11-21L-8-32L0-25L8-32L11-21L22-20L15-13L18-4L8-5ZM0 0V-24M0-7L-13-17M0-7L13-17','fine')}</g>`;}
function grapes(x,y){let s=p(`M${x} ${y-7}V${y-1}`,'fine');for(const [dx,dy] of [[-3,0],[3,0],[-5,5],[0,5],[5,5],[-3,10],[3,10],[0,15]])s+=circle(x+dx,y+dy,2.1,'paper');return s;}
const bark=p('M134 176Q146 153 139 133M140 168L142 157M132 139L136 149','fine');
let mature=p('M126 181Q147 155 131 127Q117 101 137 85Q149 70 140 47L147 44Q161 72 144 91Q128 106 142 129Q158 157 138 181Z','paper')+bark;
mature+=p('M136 115Q101 119 78 89Q60 66 29 73M141 139Q180 141 201 108Q218 84 249 92M142 87Q174 93 196 62Q215 36 247 45M145 63Q115 57 93 37Q77 23 51 34M79 89Q75 110 48 119M198 111Q208 130 236 131');
mature+=group([[32,73,-45,.8],[59,71,-30,.9],[78,91,-45,.85],[50,119,-60,.7],[94,39,-30,.8],[121,55,25,.85],[171,84,35,.85],[202,62,35,.9],[240,47,60,.7],[202,107,35,.85],[236,94,55,.8],[232,131,65,.8]].map(a=>leaf(...a)).join(''),'vine-canopy');
mature+=[[90,104],[180,103],[219,63],[112,70]].map(a=>grapes(...a)).join('')+ground;
let trained=p('M38 182V62M242 182V62M33 76H247M33 126H247','faint');
trained+=p('M128 181Q149 151 133 124Q127 100 140 78L148 78Q138 101 143 123Q158 151 139 181Z','paper')+bark;
trained+=p('M141 88Q111 60 78 76Q57 87 32 71M146 83Q177 64 211 77Q234 86 251 69M137 122Q99 134 68 119M145 123Q183 137 218 119');
trained+=group([[40,74,-55,.8],[76,77,-15,.95],[110,74,-25,.9],[172,76,30,.9],[208,78,35,.95],[244,73,50,.8],[68,122,-55,.8],[100,127,-20,.8],[181,132,45,.8],[219,122,55,.8]].map(a=>leaf(...a)).join(''),'vine-canopy');
trained+=[[60,90],[105,87],[180,90],[223,91],[89,140],[195,145]].map(a=>grapes(...a)).join('')+ground;
let arbor=p('M45 179V65Q140-12 235 65V179M52 178V68Q140 2 228 68V178M58 72H222','faint');
arbor+=p('M48 181Q67 143 55 108Q43 80 67 57L74 57Q53 85 64 108Q77 148 58 181ZM224 181Q207 145 223 109Q235 80 211 58L205 59Q225 83 214 110Q196 147 214 181Z','paper');
arbor+=p('M65 67Q81 40 108 41Q134 20 165 39Q194 35 215 66M60 118Q85 107 99 88M219 119Q193 107 181 86M106 41Q103 59 124 66M164 39Q176 59 158 72');
arbor+=group([[57,91,-65,.85],[68,64,-40,.85],[92,48,-25,.9],[126,40,0,.8],[155,40,20,.85],[184,48,35,.9],[211,67,45,.85],[219,96,65,.85],[93,91,25,.8],[186,91,-25,.8],[60,141,-60,.85],[218,142,60,.85]].map(a=>leaf(...a)).join(''),'vine-canopy');
arbor+=[[86,68],[124,76],[161,74],[193,69],[77,130],[208,130]].map(a=>grapes(...a)).join('')+ground;
// Original scene from help-for-life-drawings-2/loaves.js, kept as the first comparison.
const original=window.ART.loavesCrowd().replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const hillside=`<g transform="scale(.875)">${original}</g>`;
// Same loaf and fish forms as the source, adapted into two quieter compositions.
function fish(x,y,a=0,s=1){return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${p('M0 0C8-7 26-8 36-2C38-1 38 1 36 2C26 8 8 7 0 0ZM36 0L46-6C44-2 44 2 46 6Z','paper')}${circle(7,-1,.85)}${p('M12-5C14-2 14 2 12 5M19-6L24-10L27-5M20 6L24 9L26 5','fine')}</g>`;}
function loaf(x,y,w=17,h=14){return p(`M${x-w} ${y}C${x-w} ${y-h*1.3} ${x+w} ${y-h*1.3} ${x+w} ${y}Z`,'paper')+p(`M${x-w*.5} ${y-h*.55}Q${x} ${y-h*.95} ${x+w*.4} ${y-h*.72}M${x-w*.6} ${y-h*.22}Q${x} ${y-h*.68} ${x+w*.6} ${y-h*.36}`,'fine');}
const five=loaf(104,101)+loaf(176,101)+loaf(140,96,19,17)+loaf(121,116)+loaf(158,116);
const warmth=group(p('M116 60Q111 54 116 47M140 51Q135 44 140 36M165 60Q160 54 165 47','fine'),'steam');
let basket=p('M67 116Q70 97 140 97Q210 97 213 116','fine')+five+fish(95,120,-9,.82)+fish(147,119,10,.82);
basket+=p('M67 116Q72 180 140 182Q208 180 213 116Q210 137 140 137Q70 137 67 116Z','paper');
basket+=p('M71 127Q140 151 209 127M82 151Q140 171 198 151M91 164Q140 179 188 164','fine');
basket+=p(window.Parts.weave(140,143,172,56,34,3,11),'fine')+warmth+ground;
let cloth=p('M59 145L82 93L202 96L226 151L204 173L63 171L49 156ZM62 148L71 156L63 171M204 173L202 160L221 151M78 104L71 137M197 110L205 144','fine');
cloth+=five+fish(91,133,-8,1)+fish(148,139,9,1)+warmth;
cloth+=p('M25 158L53 174L77 174L92 164Q100 164 96 171L82 183H56L25 173M255 158L227 174L203 174L188 164Q180 164 184 171L198 183H224L255 173','paper')+ground;
window.resourceFocusedRows=[
 {id:'learning-variations',label:'Learning / arched bookcases & compact desks',category:0,items:[{art:desk,concept:'The quiet study desk'},{art:corner,concept:'The study desk / clear book outline'},{art:lectern,concept:'The compact reading desk'}]},
 {id:'fellowship-variations',label:'Fellowship / mature vines, smaller grapes',category:1,items:[{art:mature,concept:'An established, spreading vine'},{art:trained,concept:'Branches on a shared trellis'},{art:arbor,concept:'The sheltering vineyard arch'}]},
 {id:'help-variations',label:'Help for life / five loaves & two fish',category:2,items:[{art:hillside,concept:'The hillside gathering',source:true},{art:basket,concept:'A basket of provision'},{art:cloth,concept:'An offering to share'}]}
];
})();
