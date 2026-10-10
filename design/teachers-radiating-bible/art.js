const P=(d,c='',delay=0)=>`<path d="${d}" class="stroke ${c}" pathLength="1" style="--delay:${delay}"/>`;
function star(x,y,r,i){return `<path class="stroke fine moving star" pathLength="1" style="--i:${i};--delay:${.1+i*.035}" d="M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z"/>`;}

// The open Bible lies on its covers, seen at a shallow angle.
const arcs='<g class="moving signals">'+[25,44,63,82].map((r,i)=>`<path class="wave" style="--i:${i}" d="M${180-r} 146A${r} ${r} 0 0 1 ${180+r} 146"/>`).join('')+'</g>';
const rays='<g class="moving signals">'+[205,222,238,254,270,286,302,318,335].map((degrees,i)=>{
  const angle=degrees*Math.PI/180, start=i%2?35:27, end=[91,103,111,115,121,115,111,103,91][i];
  const point=r=>`${(180+Math.cos(angle)*r).toFixed(2)} ${(160+Math.sin(angle)*r).toFixed(2)}`;
  return `<path class="light-ray" style="--i:${i}" d="M${point(start)}L${point(end)}"/>`;
}).join('')+'</g>';
const distantStars=[[53,77,.65],[88,29,.8],[104,64,.6],[145,20,.65],[156,46,.7],[201,41,.65],[212,20,.7],[260,28,.75],[305,83,.65],[285,97,.6],[43,135,.8],[76,133,.6],[110,119,.65],[251,132,.7],[287,145,.6],[321,132,.7],[44,51,.5],[315,48,.5]];
// Each symbol has its own outer transform so the gentle float is independent
// of its position. All four stay outside the book and the central ray fan.
function heart(x,y,i){return `<g transform="translate(${x} ${y})"><g class="moving symbol" style="--i:${i}">${P('M0 5C-13 -3 -10 -12 -5 -12C-2 -12 0 -10 0 -8C0 -10 2 -12 5 -12C10 -12 13 -3 0 5Z','fine',.3+i*.04)}</g></g>`;}
function cross(x,y,i){return `<g transform="translate(${x} ${y}) rotate(${i%2?-7:6})"><g class="moving symbol" style="--i:${i}">${P('M-2 -12H2V-5H8V-1H2V10H-2V-1H-8V-5H-2Z','fine',.35+i*.04)}</g></g>`;}
function skyFor(curved){
  // Tighten positions, not the symbols themselves. Straight rays reach higher,
  // so their overhead stars retain enough clearance above the tallest ray.
  const at=(x,y)=>[180+(x-180)*.86,146+(y-146)*(curved?.86:1)];
  let sky=[[77,57,3.2],[119,31,3.7],[180,19,4.8],[238,34,3.4],[284,62,3.6],[59,115,2.5],[300,119,2.5],[101,60,1.9],[258,63,1.9]].map(([x,y,r],i)=>star(...at(x,y),r,i)).join('');
  sky+=distantStars.map(([x,y,r],i)=>{const [cx,cy]=at(x,y);return `<circle cx="${cx}" cy="${cy}" r="${r}" class="moving distant-star" style="--i:${i}"/>`;}).join('');
  return sky+heart(...at(62,92),0)+cross(...at(63,151),2)+cross(...at(293,89),3)+heart(...at(301,157),1);
}
let scene='';

// Narrow far corners and a wider near edge establish the perspective.
// The board cover and layered page block remain visible beneath the leaves.
scene+=P('M100 163L68 211C105 202 148 207 180 222C212 207 255 202 292 211L260 163','fine',.08);
scene+=P('M68 211V217C105 208 148 213 180 228C212 213 255 208 292 217V211M180 222V228','fine',.13);
scene+=P('M104 160C130 147 158 153 180 166C202 153 230 147 256 160L286 203C252 191 212 197 180 214C148 197 108 191 74 203Z','paper',.19);
scene+=P('M104 160L74 203V210C108 198 148 204 180 221C212 204 252 198 286 210V203L256 160','fine',.25);
scene+=P('M180 166V214M75 206C109 194 148 201 178 217M182 217C212 201 251 194 285 206','fine',.3);
scene+=P('M76 208C110 197 148 203 176 219M184 219C212 203 250 197 284 208','faint',.34);
scene+=P('M107 160C132 150 156 156 176 167M184 167C204 156 228 150 253 160','faint',.36);

// Writing follows the foreshortened, bowed pages, with shorter last lines.
for(let i=0;i<6;i++){
  const t=.13+i*.13;
  const left=+(104-30*t+8).toFixed(2), y=+(160+43*t).toFixed(2);
  const c1x=+(131-15*t).toFixed(2), c1y=+(148+44*t+3).toFixed(2);
  const c2y=+(154+44*t+3).toFixed(2), endY=+(166+47*t-1).toFixed(2);
  const end=i===5?161:172;
  scene+=P(`M${left} ${y}C${c1x} ${c1y} 153 ${c2y} ${end} ${i===5?endY-5:endY}`,'text',.4+i*.03);
  scene+=P(`M188 ${endY}C207 ${c2y} ${360-c1x} ${c1y} ${i===5?360-left-13:360-left} ${i===5?y-2:y}`,'text',.42+i*.03);
}
scene+=P('M191 216L202 228L208 226L214 230L203 211','fine',.65);
scene+=P('M177 221Q180 223 183 221','ink',.68);

document.getElementById('studies').innerHTML=[['A','Radiating arcs',arcs],['B','Rays of light',rays]].map(([letter,title,signal])=>{
  const drawing=signal+skyFor(letter==='A')+scene;
  return `<figure class="artwork"><svg viewBox="0 0 360 252" fill="none" role="img" aria-label="${title}: an open Bible lying flat beneath twinkling stars, distant stars, floating hearts and crosses"><g class="base">${drawing}</g><g class="live">${drawing}</g></svg><figcaption>${letter} · ${title}</figcaption></figure>`;
}).join('');
document.getElementById('theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';};
document.getElementById('motion').onclick=()=>{const running=document.getElementById('studies').classList.toggle('running');const button=document.getElementById('motion');button.textContent=running?'Pause motion':'Play motion';button.setAttribute('aria-pressed',String(running));};
