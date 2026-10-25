(() => {
// The shared parts of the answer pictures, drawn to the standard of the Resources card scenes (morning.js): a 280 x 210
// landscape, paper-filled shapes, fine detail lines, one gold accent. Classes: styles.css (.ap-art).
const n=v=>+v.toFixed(2);
const p=(d,c='land')=>`<path d="${d}" class="${c}"/>`;
const g=(s,c='',t='')=>`<g${c?` class="${c}"`:''}${t?` transform="${t}"`:''}>${s}</g>`;
const at=(x,y,s,inner,c='')=>g(inner,c,`translate(${x} ${y}) scale(${s})`);
const hill=(d,c='land')=>p(`${d}L280 210H0Z`,'mask')+p(d,c);
function sun(x,y,r,mode='turn'){let rays='';for(let i=0;i<28;i++){const a=i*Math.PI/14,i1=r+6,o=r+(i%2?11:17);rays+=p(`M${n(Math.cos(a)*i1)} ${n(Math.sin(a)*i1)}L${n(Math.cos(a)*o)} ${n(Math.sin(a)*o)}`,'ray');}
 return `<circle cx="${x}" cy="${y}" r="${r}" class="disc"/>`+g(g(rays,mode),'',`translate(${x} ${y})`);}
const bird='M-9-2Q-4-7 0 0Q4-7 9-2';
const birds=(x,y,s=1)=>at(x,y,s,g([[0,0,1],[22,-10,.8],[14,12,.7]].map(([a,b,c])=>at(a,b,c,p(bird,'bird'))).join(''),'drift'));
const cloud=(x,y,s=1)=>at(x,y,s,g(p('M-32 0Q-35-11-22-12Q-18-24-3-21Q6-30 19-22Q33-24 33-10Q41-4 32 2Z','cloud')+p('M-20-6Q-12-11-4-7M8-12Q15-16 22-11','fine'),'float'));
function tree(x,y,s=1){return at(x,y,s,p('M-2 0L0-19L3-34M2-10L11-26M1-18L-9-29','trunk')+p('M-16-23C-25-23-26-32-19-36C-23-43-15-49-8-47C-6-55 5-55 10-48C17-52 27-45 23-38C31-32 24-22 16-24C13-18 3-18 0-22C-7-17-14-17-16-23Z','crown')+p('M-17-33Q-12-39-7-35M-9-43Q-3-48 3-43M7-39Q14-45 19-38M-10-26Q-5-31 0-27M6-29Q13-34 19-29','leaf')+p('M-7 1Q0-2 7 1','fine'));}
function cypress(x,y,s=1){return at(x,y,s,p('M0 0V-17M0-67C-3-54-14-26-10-16C-7-9 7-9 10-16C14-26 3-54 0-67Z','crown')+p('M0-20V-55M0-27L-5-33M0-35L5-43','leaf'));}
function palm(x,y,s=1){return at(x,y,s,p('M0 0Q-3-26 4-52','trunk')+p('M-3-10H3M-2-20H4M0-30H5M1-40H6','fine')+g(p('M4-52Q-12-60-26-50M4-52Q-8-68-20-72M4-52Q8-70 20-74M4-52Q20-60 32-50M4-52Q18-50 24-38M4-52Q-10-48-16-36','leaf-line'),'sway'));}
function flower(x,y,h=29,lean=0,s=1){let petals='';for(let i=0;i<7;i++)petals+=`<ellipse cx="0" cy="-4.6" rx="2.2" ry="3.8" transform="rotate(${n(i*360/7)})" class="petal"/>`;
 return at(x,y,s,g(p(`M0 0Q${lean+3} ${-h*.48} ${lean} ${-h}M${lean/2} ${-h*.35}Q-14 ${-h*.42}-12 ${-h*.62}Q-1 ${-h*.62} ${lean/2} ${-h*.35}M${lean/2} ${-h*.55}Q14 ${-h*.68} 15 ${-h*.88}Q4 ${-h*.83} ${lean/2} ${-h*.55}`,'stem')+g(petals+'<circle r="2.1" class="core"/>','',`translate(${lean} ${-h})`),'sway'));}
const grass=(x,y,s=1)=>at(x,y,s,p('M0 0Q-3-8-8-11M0 0Q1-12 5-16M0 0Q5-6 10-8M-4 0L-9-5','stem'));
const stones=(x,y)=>p(`M${x} ${y}q4-6 9-2q3 4-1 4h-9ZM${x+14} ${y+3}q4-4 7-1q2 3-1 3h-6Z`,'fine');
const reeds=(x,y,s=1)=>at(x,y,s,p('M0 0Q4-18 0-38M7 0Q12-16 14-32M-6 0Q-10-14-8-28','stem')+p('M0-38V-46M14-32V-40','gold-thick'));
function foreground(left=true,right=true){return (left?flower(30,203,34,-4,.95)+flower(50,205,24,4,.78)+grass(14,202,.7)+grass(68,201,.6):'')+(right?flower(248,203,38,5,.88)+flower(229,206,24,-3,.74)+grass(210,202,.7)+grass(266,203,.75):'');}
// A robed person, feet at (x, y), about 46 tall at s = 1. No face is ever drawn. o: staff, back (seen from behind),
// walk (facing right, mid-stride), bundle (carried on the back), gift (a gold box held out), brick (held up), flame.
function person(x,y,s=1,o={}){let f='';
 if(o.bundle)f+=p(`M${o.walk?-15:-17}-36Q${o.walk?-19:-21}-26 ${o.walk?-13:-15}-21Q${o.walk?-6:-8}-22 ${o.walk?-7:-9}-32Z`,'paper-line')+p(`M${o.walk?-14:-16}-34L${o.walk?-7:-9}-25`,'fine');
 if(o.walk){f+=p('M-6-32Q-11-30-11-23L-12 0Q1 2 15-1L11-24Q10-31 5-32Q0-34-6-32Z','paper-line');
  f+=p('M-1-16L-3 0M5-14L8-1','fine')+p('M-8 0l-5 1.5M12-1l5 1','line')+p(o.arm||'M7-28Q14-20 16-12','line');}
 else{f+=p('M-7-31Q-11-30-11-24L-13 0H13L11-24Q11-30 7-31Q0-34-7-31Z','paper-line');
  f+=p('M-4-15L-5 0M4-13L5 0','fine')+p(o.arm?'M-9-27Q-13-17-10-9':'M-9-27Q-13-17-10-9M9-27Q13-17 10-9','line');}
 f+=p('M-10-18Q0-15 10-18','line');
 f+=p('M-7.5-36Q-8.8-47.5 0-48Q8.8-47.5 7.5-36L9.5-30Q0-27.5-9.5-30Z','paper-line');
 f+=o.back?p('M-7.6-43Q0-45.5 7.6-43M0-43V-30','fine'):`<ellipse cy="-38.5" rx="4.4" ry="5" class="paper-line"/>`+p('M-7.4-43.5Q0-46 7.4-43.5','fine');
 if(o.staff)f+=p(o.walk?'M17-48L14 0':'M15-48V0','trunk');
 if(o.gift)f+=p('M8-24h8v7h-8zM12-24v7M8-21h8','gold');
 if(o.brick)f+=p('M-8-28L-12-50M8-28L12-50','line')+p('M-14-56h28v6h-28zM0-56v6','gold-fill');
 if(o.arm)f+=p(o.arm,'line');
 if(o.flame)f+=g(p('M0-52Q-5.5-57 0-67Q5.5-57 0-52Z','gold-fill'),'flame');
 return at(x,y,s,f);}
function star(x,y,r,points=4,c='gold'){let d='';const k=points*2;for(let i=0;i<k;i++){const a=-Math.PI/2+i*Math.PI/points,rr=i%2?r*.28:(points===8&&i%4===2?r*.6:r);d+=`${i?'L':'M'}${n(x+Math.cos(a)*rr)} ${n(y+Math.sin(a)*rr)}`;}return p(d+'Z',c);}
const twinkle=(list)=>g(list.map(([x,y,r])=>star(x,y,r,4,'gold-thin')).join(''),'breathe');
const waves=(x1,x2,y,step,c='water',delay=0)=>{let d=`M${x1} ${y}`;for(let x=x1;x<x2;x+=step)d+=`q${n(step/4)}-${n(step/7)} ${n(step/2)} 0t${n(step/2)} 0`;return `<g class="ripple" style="animation-delay:${delay}s">${p(d,c)}</g>`;};
function bricks(x1,x2,y1,y2,rows,w,c='fine'){let d='';const h=(y2-y1)/rows;for(let r=1;r<rows;r++)d+=`M${x1} ${n(y1+r*h)}H${x2}`;for(let r=0;r<rows;r++){for(let x=x1+(r%2?w/2:w);x<x2-2;x+=w)d+=`M${n(x)} ${n(y1+r*h)}V${n(y1+(r+1)*h)}`;}return p(d,c);}
function house(x,y,w,h){return p(`M${x} ${y}V${y-h}H${x+w}V${y}Z`,'paper-line')+p(`M${x-1.5} ${y-h}H${x+w+1.5}`,'line')+p(`M${x+w/2-2} ${y}V${y-5}H${x+w/2+2}V${y}M${x+3} ${y-h+4}h3v3h-3z`,'fine');}
window.AP={n,p,g,at,hill,sun,birds,cloud,tree,cypress,palm,flower,grass,stones,reeds,foreground,person,star,twinkle,waves,bricks,house};
})();
