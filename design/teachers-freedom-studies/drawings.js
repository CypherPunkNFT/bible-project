const P=(d,c='sa-line',t=0)=>`<path d="${d}" pathLength="1" class="${c}" style="--d:${t}"/>`;
const E=(x,y,rx,ry=rx,c='sa-fine',t=0)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" pathLength="1" class="${c}" style="--d:${t}"/>`;
const G=(c,s)=>`<g class="${c}">${s}</g>`;
const T=(transform,s)=>`<g transform="${transform}">${s}</g>`;

// The open Bible is drawn as a bound object: shaped leaves, recessed gutter,
// separate page block and cover, curved writing, and a ribbon bookmark.
function bible(){
  let b=P('M54 108L58 142C80 137 103 140 120 150C137 140 160 137 182 142L186 108','sa-fine',.22);
  b+=P('M58 105C80 98 102 101 120 111C138 101 160 98 182 105L179 137C158 132 138 137 120 146C102 137 82 132 61 137Z','sa-line paper',.26);
  b+=P('M120 111V146M62 137L62 140C82 135 102 139 120 148C138 139 158 135 178 140L178 137','sa-fine',.31);
  b+=P('M63 104C83 100 103 104 116 111M124 111C137 104 157 100 177 104','sa-fine',.35);
  for(let i=0;i<4;i++){const y=110+i*6;b+=P(`M68 ${y}C84 ${y-3} 100 ${y} 112 ${y+6}M128 ${y+6}C140 ${y} 155 ${y-3} 172 ${y}`,'sa-fine book-text',.4+i*.035);}
  b+=P('M136 141L136 153L140 150L144 151L144 138','sa-fine',.6);
  return b;
}
const ground=()=>P('M18 165H222','sa-fine',.04);
const glint=(x,y)=>P(`M${x} ${y-5}V${y-1}M${x-6} ${y-3}L${x-3} ${y}M${x+6} ${y-3}L${x+3} ${y}`,'sa-tone freedom-glint',.6);

// A — An open prison cell. Square stone jambs, riveted bars, a plate lock,
// hinges and a stone threshold distinguish it from an ornamental gate.
let cell=P('M43 149V22H193V149M51 148V31H184V147M43 41H51M43 68H51M43 97H51M43 126H51M184 47H193M184 78H193M184 108H193M184 137H193M77 22V31M112 22V31M150 22V31','sa-faint masonry',.03);
cell+=P('M51 147L82 132H174L184 147M174 132V41H67M84 45H174','sa-faint',.11);
cell+=G('moving door',P('M48 35L103 54V137L48 153ZM54 44L97 59V130L54 142Z','sa-line iron',.18)
  +P('M65 47V138M76 51V135M87 55V132M53 72L98 84M53 112L98 115','sa-line iron',.25)
  +P('M86 91L98 94V107L86 104ZM47 53H53V60H47M47 125H53V132H47','sa-fine',.31)
  +E(92,98,1.4,1.4,'sa-tone',.35)+P('M92 99V102','sa-tone',.37));
cell+=P('M162 49V83H178V49ZM167 49V83M173 49V83M162 59H178M162 72H178','sa-faint iron',.38);
cell+=P('M38 155H201V162H38M63 155V162M174 155V162','sa-fine',.43)+ground();
cell+=T('translate(42 31) scale(.82)',bible());

// B — Released shackles. Two open iron wrist cuffs and separated chain ends
// sit above the full-size Bible. The central break stays plainly visible.
let shackles=ground();
shackles+=G('moving chain-left',P('M67 72C56 86 31 78 31 59C31 39 54 30 68 42M64 48C55 40 38 45 38 59C38 72 53 78 62 68','sa-line iron',.12)
  +P('M68 42L75 34L81 39L73 49M64 48L70 53L65 61M62 68L67 72','sa-fine',.2)
  +E(54,77,3,3,'sa-fine',.25)
  +P('M58 80L73 85Q79 88 77 93Q75 98 70 96L56 91Q50 88 53 83M76 91L90 97Q96 99 98 94M82 85L93 89Q98 92 101 88','sa-line',.3));
shackles+=G('moving chain-right',P('M173 72C184 86 209 78 209 59C209 39 186 30 172 42M176 48C185 40 202 45 202 59C202 72 187 78 178 68','sa-line iron',.16)
  +P('M172 42L165 34L159 39L167 49M176 48L170 53L175 61M178 68L173 72','sa-fine',.24)
  +E(186,77,3,3,'sa-fine',.29)
  +P('M182 80L167 85Q161 88 163 93Q165 98 170 96L184 91Q190 88 187 83M164 91L150 97Q144 99 142 94M158 85L147 89Q142 92 139 88','sa-line',.34));
shackles+=glint(120,88)+T('translate(0 8)',bible());

// C — A broken cell window: inset rectangular masonry, iron grid and bent
// broken bar ends, with the open book prominent on the deep stone sill.
let windowScene=P('M41 147V19H199V147M49 139V27H191V139M60 126V38H180V126','sa-faint masonry',.03);
windowScene+=P('M42 48H49M42 77H49M42 106H49M191 48H198M191 77H198M191 106H198M77 19V27M113 19V27M151 19V27M61 38L49 27M180 38L191 27','sa-faint masonry',.1);
windowScene+=P('M76 38V109M91 38V107M149 38V107M164 38V109M61 54H179M61 82H91M149 82H179','sa-line iron',.18);
windowScene+=P('M106 38V59L98 72L102 75M107 98L114 91L112 86M134 38V58L143 71L139 75M133 98L126 91L128 86','sa-line iron',.3);
windowScene+=P('M39 149H201V157H39M34 157H206V164H34M43 152H197','sa-fine',.36)+ground();
windowScene+=T('translate(0 8)',bible())+glint(120,74);

// D — An unlocked prison padlock: thick iron body and raised shackle,
// a short disconnected chain, and an open Bible in the foreground.
let unlocked=P('M144 29H207V87H144ZM149 34H202V82H149M161 34V82M174 34V82M187 34V82M149 49H202M149 68H202','sa-faint iron',.02);
unlocked+=P('M136 21H216V96H136M136 46H144M207 53H216M160 21V29M193 87V96','sa-faint masonry',.08);
unlocked+=G('moving open-shackle',P('M75 89V48C75 32 49 32 49 48V60M68 87V49C68 41 56 41 56 49V60','sa-line iron',.2));
unlocked+=P('M35 87Q35 81 41 81H82Q88 81 88 87V132Q88 141 80 141H43Q35 141 35 132ZM41 88H82V132H41Z','sa-line paper iron',.29);
unlocked+=P('M59 105C54 100 62 95 65 101Q66 104 63 106L65 117H57Z','keyhole',.38);
unlocked+=E(44,91,1,1)+E(78,91,1,1)+E(44,129,1,1)+E(78,129,1,1);
unlocked+=G('moving chain-left',P('M47 145L34 149Q29 151 31 156Q33 161 38 159L51 155Q56 153 54 148M50 160L60 163Q65 165 68 161M55 153L65 155Q70 157 73 153','sa-fine',.48));
unlocked+=ground()+T('translate(53 36) scale(.82)',bible());

const scenes=[cell,shackles,windowScene,unlocked];
const labels=['The cell stands open','The shackles are broken','The bars give way','The lock is opened'];
document.getElementById('grid').innerHTML=scenes.map((scene,i)=>`<article class="sample" tabindex="0" aria-label="${'ABCD'[i]}: ${labels[i]}"><span class="letter">${'ABCD'[i]}</span><div class="scene"><svg class="sa-art" viewBox="0 0 240 180" fill="none" role="img" aria-label="${labels[i]}"><g class="sa-base">${scene}</g><g class="sa-live">${scene}</g></svg></div><div class="caption">${labels[i]}</div></article>`).join('');
document.getElementById('theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';};
