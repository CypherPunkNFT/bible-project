const P=(d,c='sa-line',t=0)=>`<path d="${d}" pathLength="1" class="${c}" style="--d:${t}"/>`;
const E=(x,y,rx,ry=rx,c='sa-fine',t=0)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" pathLength="1" class="${c}" style="--d:${t}"/>`;
const G=(c,s)=>`<g class="${c}">${s}</g>`;
const star=(x,y,r=2.5,i=0)=>`<path d="M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z" pathLength="1" class="sa-fine sky-star" style="--d:${.25+i*.035};--i:${i}"/>`;
const arched=(x,y,w,h)=>P(`M${x} ${y+h}V${y+w/2}A${w/2} ${w/2} 0 0 1 ${x+w} ${y+w/2}V${y+h}ZM${x+w/2} ${y}V${y+h}M${x} ${y+h*.62}H${x+w}`,'sa-faint',.03);
function book(x,y,w=72,h=25){const l=x-w/2,r=x+w/2;let s=P(`M${l} ${y}Q${x-w/4} ${y-8} ${x} ${y+1}Q${x+w/4} ${y-8} ${r} ${y}V${y+h}Q${x+w/4} ${y+h-8} ${x} ${y+h+1}Q${x-w/4} ${y+h-8} ${l} ${y+h}ZM${x} ${y+1}V${y+h+1}`,'sa-line',.25)+P(`M${l-4} ${y+3}V${y+h+4}Q${x-w/4} ${y+h-4} ${x} ${y+h+5}Q${x+w/4} ${y+h-4} ${r+4} ${y+h+4}V${y+3}`,'sa-fine',.3);for(let i=0;i<3;i++)s+=P(`M${l+6} ${y+6+i*5}Q${x-w/4} ${y+1+i*5} ${x-5} ${y+8+i*5}M${x+5} ${y+8+i*5}Q${x+w/4} ${y+1+i*5} ${r-6} ${y+6+i*5}`,'sa-fine',.35+i*.03);return s;}
function spines(x,y,n){let s='';for(let i=0;i<n;i++){const h=[24,31,27,22,33,26][i%6],xx=x+i*8;s+=P(`M${xx} ${y}V${y-h}H${xx+5}V${y}M${xx+1} ${y-h+5}H${xx+4}M${xx+1} ${y-5}H${xx+4}`,'sa-fine',.08+i*.01);}return s;}
function person(x,y,r=4){return E(x,y,r,r,'sa-fine')+P(`M${x-r-3} ${y+13}V${y+9}Q${x-r-3} ${y+4} ${x} ${y+4}Q${x+r+3} ${y+4} ${x+r+3} ${y+9}V${y+13}`,'sa-fine',.5);}

// A — Daniel 12:3: an open Bible beneath a broad canopy of stars.
let starsScene=P('M24 95A96 76 0 0 1 216 95','sa-sky')+P('M32 96A88 68 0 0 1 208 96','sa-sky',.04);
const starsAt=[[120,31,7],[79,45,4],[163,45,4.5],[49,70,3.4],[191,73,3.7],[103,69,3.4],[143,76,3],[67,88,2],[176,96,2.1]];
starsScene+=starsAt.map((v,i)=>star(...v,i)).join('');
starsScene+=[[64,30],[95,21],[148,23],[183,33],[31,49],[210,51],[89,87],[127,56],[155,100]].map(([x,y])=>`<circle class="dot" cx="${x}" cy="${y}" r=".8"/>`).join('');
starsScene+=G('sky-rays',[[-1,79,53],[0,120,42],[1,163,54]].map(([i,x,y])=>`<path class="sa-sky sky-ray" style="--i:${i+1}" d="M${x} ${y}Q${x} 92 ${108+i*17} 106"/>`).join(''));
starsScene+=book(120,111,122,29)+P('M23 151H217M78 150H162','sa-fine',.5);
starsScene+=P('M28 143Q37 133 52 137M188 137Q203 133 212 143M36 141L32 132M202 139L208 130','sa-faint',.55);

// B — A monastery cloister and a manuscript on a reading desk.
let monastery=P('M18 149H222M27 109V46H213V109M23 46L37 34H99M141 34H203L217 46M31 51H209','sa-faint',.04);
for(const x of [37,94,151])monastery+=P(`M${x} 108V78A24 24 0 0 1 ${x+48} 78V108M${x+4} 108V79A20 20 0 0 1 ${x+44} 79V108M${x-2} 108H${x+7}M${x+41} 108H${x+50}`,'sa-fine',.1);
monastery+=P('M101 45V15L120 6L139 15V45M105 16H135M111 41V27A9 9 0 0 1 129 27V41M116 5V1M112 3H120','sa-line',.18);
monastery+=G('moving monastery-bell',P('M120 21V25M115 34V29Q120 24 125 29V34L128 38H112ZM120 38V41','sa-fine',.28));
monastery+=P('M24 117H63M177 117H216M32 117L22 143M205 117L219 143','sa-faint',.3);
monastery+=book(121,113,75,20)+P('M73 139H169M81 139V150M160 139V150','sa-line',.4);
monastery+=P('M51 146V136H65V146M53 136V129H63V136M58 129V122','sa-fine',.5);
monastery+=G('moving reading-flame',P('M57 121C53 115 58 110 58 106C64 113 63 118 59 121Z','sa-fine',.55));
monastery+=P('M188 147V134M188 142Q176 137 178 130Q188 130 188 142M188 137Q188 126 199 124Q202 133 188 137','sa-fine',.6);

// C — A preacher above two rows of listeners, framed by chapel windows.
let congregation=arched(27,31,28,61)+arched(185,31,28,61)+P('M67 98H173M77 103H163','sa-faint',.05);
congregation+=E(120,41,6,7,'sa-line',.13)+P('M107 68V60Q107 50 120 50Q130 50 134 59L144 53M106 59L96 65M114 51L120 57L126 51','sa-line',.2);
congregation+=P('M91 74H149L143 67H97ZM99 74L95 99H145L141 74M106 81H134V94H106Z','sa-line',.29)+P('M120 84V91M116 87H124','sa-tone',.34);
congregation+=P('M105 67Q113 61 120 65Q127 61 135 67M120 65V68','sa-fine',.36);
congregation+=G('voices',[0,1,2].map(i=>`<path class="sa-fine voice-arc" style="--i:${i}" d="M${147+i*7} ${39-i*3}Q${158+i*8} 49 ${149+i*7} ${59+i*2}"/>`).join(''));
for(const x of [41,72,103,137,168,199])congregation+=person(x,114,3.7);
congregation+=P('M26 130H213M30 130V134M210 130V134','sa-fine',.5);
for(const x of [53,87,120,153,187])congregation+=person(x,136,4);
congregation+=P('M32 151H208M35 151V155M205 151V155','sa-fine',.6);
congregation+=star(78,23,2)+star(167,19,2,1);

// D — A historical study: books, a globe, divided window, manuscript and quill.
let office=P('M20 58H117M20 62H117M25 62V71M111 62V71','sa-faint',.03)+spines(23,58,11);
office+=P('M153 84V24H215V84ZM158 79V29H210V79ZM184 29V79M158 52H210M149 88H219','sa-faint',.1);
office+=P('M159 74Q169 64 180 71M188 70Q202 60 210 67','sa-faint',.16);
office+=E(52,97,22,22,'sa-line',.21)+P('M34 84Q52 104 72 103M30 96Q52 88 72 96M35 110Q49 116 66 111','sa-fine',.27);
office+=G('moving globe-turn',E(52,97,9,22,'sa-fine',.29));
office+=P('M36 78Q22 96 37 115Q50 130 70 116M52 121V130M42 132H63','sa-fine',.35);
office+=P('M22 137H217M29 141H210M35 141V152M203 141V152M28 137V141M211 137V141','sa-line',.38);
office+=book(116,110,63,22);
office+=P('M176 136V128H190V136M179 128V123H187V128','sa-fine',.46);
office+=G('moving writing',P('M182 124C180 109 186 97 200 92C199 107 191 117 182 124ZM183 121L194 102M186 111L194 107','sa-fine',.53));
office+=P('M196 120H212V125H196ZM199 114H215V119H199Z','sa-fine',.58);

// E — A small teaching gathering: one teacher and three listeners around a book.
let teaching=arched(24,28,37,65)+P('M160 44H219M168 48V55M212 48V55','sa-faint',.05)+spines(165,44,6);
teaching+=E(92,61,6,7,'sa-line',.17)+P('M78 99V84Q78 73 91 73Q102 73 106 83L120 90M86 75L92 82M80 86L73 95M70 104V81H76M70 104V141','sa-line',.24);
teaching+=P('M72 141H84M82 109L89 138M88 111L100 135','sa-fine',.31);
teaching+=E(168,79,5.5,6.5,'sa-line',.2)+P('M156 108V98Q156 87 168 87Q180 87 180 98V111M174 112L169 139M182 91H188V140M177 115H188M179 140H192','sa-fine',.34);
teaching+=book(123,102,55,19)+P('M88 127H166M96 127V146M158 127V146M98 134H157','sa-line',.4);
teaching+=person(46,121,5)+P('M34 138H58V145M34 145V151M58 145V151','sa-fine',.5);
teaching+=person(206,121,5)+P('M194 138H218V145M194 145V151M218 145V151','sa-fine',.5);
teaching+=P('M19 152H222M119 86V78M115 79H123','sa-faint',.58);
teaching+=G('moving reading-flame',P('M118 76C114 69 121 65 120 61C126 68 124 73 121 76Z','sa-fine',.6));

// F — An antiquarian's workbench: pottery, an inscribed tablet and a field book.
let archive=P('M22 54H218M27 58V64M211 58V64','sa-faint',.02)+spines(139,54,9);
archive+=P('M38 53V33H49V53M34 33H53M36 29H51V33M67 54Q60 48 63 39L68 32V23H80V32L85 39Q88 48 81 54ZM66 23H82M66 43H83','sa-fine',.12);
archive+=P('M23 141H217M31 145H209M38 145V153M202 145V153M23 141V145M217 141V145','sa-line',.2);
archive+=P('M42 136L48 78L87 74L94 132ZM53 85L82 82M52 92L83 89M51 101L84 98M50 110L85 107M49 119L86 116','sa-line',.3);
archive+=P('M59 87L60 92M72 85L73 90M57 104L58 109M75 102L76 107M59 121L59 126M78 119L79 124','sa-faint',.35);
archive+=P('M104 128L111 100L129 94L145 110L138 133ZM111 100L124 107L129 94M124 107L121 122L138 133M121 122L104 128','sa-fine',.39);
archive+=G('moving brush',P('M135 119L160 84Q163 81 166 84Q168 86 165 89L141 123ZM135 119L130 124L134 128L141 123M133 124L136 126','sa-line',.47));
archive+=G('dust',E(130,117,.7,.7)+E(124,114,.7,.7)+E(128,109,.7,.7));
archive+=book(181,112,44,21)+P('M165 99H194V103H165M169 94H197V98H169','sa-fine',.56);

const drawings=[starsScene,monastery,congregation,office,teaching,archive];
const names=['Like the stars','Monastery scriptorium','Preacher & congregation','The historical study','Around the Word','The antiquarian’s workbench'];
document.getElementById('grid').innerHTML=drawings.map((scene,i)=>`<article class="sample" tabindex="0" aria-label="${names[i]}"><span class="letter">${'ABCDEF'[i]}</span><div class="scene"><svg class="sa-art" viewBox="0 0 240 160" fill="none" role="img" aria-label="${names[i]}"><g class="sa-base">${scene}</g><g class="sa-live">${scene}</g></svg></div><div class="caption">${names[i]}${i===0?' <a href="https://www.esv.org/verses/Daniel+12:3/" target="_blank" rel="noreferrer">Daniel 12:3</a>':''}</div></article>`).join('');
document.getElementById('theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';};
