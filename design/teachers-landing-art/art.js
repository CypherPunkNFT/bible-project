const path = (d, cls = '', delay = 0) => `<path d="${d}" pathLength="1" class="${cls}" style="--d:${delay}"/>`;
function bible(y = 144) {
  return path(`M48 ${y}C73 ${y-10} 99 ${y-9} 120 ${y+1}C141 ${y-9} 167 ${y-10} 192 ${y}V${y+30}C164 ${y+22} 141 ${y+24} 120 ${y+34}C99 ${y+24} 76 ${y+22} 48 ${y+30}Z`, '', .04)
    + path(`M120 ${y+1}V${y+34}M42 ${y+3}V${y+35}C72 ${y+27} 100 ${y+29} 120 ${y+39}C140 ${y+29} 168 ${y+27} 198 ${y+35}V${y+3}`, 'fine', .1)
    + [0,1,2].map(i => path(`M57 ${y+8+i*6}Q84 ${y+2+i*6} 111 ${y+12+i*6}M129 ${y+12+i*6}Q156 ${y+2+i*6} 183 ${y+8+i*6}`, 'fine', .15+i*.04)).join('')
    + path(`M143 ${y+28}V${y+42}L148 ${y+39}L153 ${y+44}V${y+26}`, 'faint', .32);
}
function leaf(x,y,a,s=1) {return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${path('M0 0C-9 -5 -11 -14 -8 -20C1 -16 5 -7 0 0ZM0 0L-7 -15','fine',.55)}</g>`;}
function stars(){return [[30,62,2],[204,45,2.5],[192,108,1.8],[60,27,2]].map(([x,y,r],i)=>path(`M${x-r} ${y}H${x+r}M${x} ${y-r}V${y+r}`,'faint star',.3+i*.1)).join('');}
function tree(kind) {
  let art = bible() + stars();
  if(kind === 0){
    art += path('M115 144C118 130 116 119 120 103C124 84 120 64 120 40M125 144C123 129 125 115 120 103','',.22)
      + path('M120 118C105 105 88 102 79 86M121 101C138 95 154 86 161 71M120 86C106 75 96 63 94 50M121 70C136 64 145 49 146 37','',.3)
      + '<g class="leaves">' + [[79,86,-35],[94,65,-55],[99,101,-50],[111,79,20],[121,44,28],[143,58,70],[155,83,80],[138,98,40],[86,88,70],[147,40,25]].map(p=>leaf(...p)).join('') + '</g>'
      + path('M108 146Q115 137 120 139Q126 137 133 146M120 141V151','faint',.6);
  } else if(kind === 1){
    art += path('M119 144C115 123 121 107 120 88M124 144C130 121 123 106 120 88M120 88V33M120 106C94 104 80 88 65 71M120 106C146 104 160 88 175 71M120 78C100 76 92 61 84 45M120 78C140 76 148 61 156 45','',.28)
      + '<g class="leaves">' + [[64,71,-40],[84,45,-32],[120,33,25],[156,45,72],[175,71,72]].map(p=>leaf(...p,1.05)).join('') + '</g>'
      + [[82,87],[102,69],[140,69],[158,87]].map(([x,y],i)=>path(`M${x-7} ${y-8}Q${x-3} ${y-10} ${x} ${y-7}Q${x+3} ${y-10} ${x+7} ${y-8}V${y+2}Q${x+3} ${y} ${x} ${y+3}Q${x-3} ${y} ${x-7} ${y+2}ZM${x} ${y-7}V${y+3}`,'fine',.4+i*.07)).join('');
  } else if(kind === 2){
    art += path('M116 144Q122 122 120 99Q116 77 124 55M124 144Q129 122 120 99M120 113Q104 100 82 99Q63 99 58 78M120 92Q142 85 163 87Q178 89 183 69M121 75Q105 70 99 49','',.25)
      + '<g class="leaves">'+[[58,79,-28],[76,98,-72],[98,104,15],[100,49,-25],[122,57,35],[150,85,65],[182,69,58],[139,90,-20]].map(p=>leaf(...p)).join('')+'</g>'
      + path('M38 136A85 85 0 0 1 202 136','faint',.1)
      + [0,1,2,3,4].map((i)=>{let a=(205+i*32)*Math.PI/180,x=120+86*Math.cos(a),y=136+86*Math.sin(a);return `<circle cx="${x}" cy="${y}" r="2" class="fine"/>`;}).join('');
  } else {
    art += path('M118 144C122 126 118 105 125 88C135 70 130 54 123 38M125 144C133 123 128 104 125 88M124 116C106 104 86 105 76 89M127 95C145 91 161 77 161 58M130 69C112 66 103 52 102 37','',.25)
      + '<g class="leaves">'+[[76,89,-38],[88,102,-60],[107,106,12],[157,75,85],[162,58,35],[102,38,-30],[123,38,25],[128,59,90]].map(p=>leaf(...p)).join('')+'</g>'
      + path('M24 180H40M201 180H217M28 180V160Q28 150 37 148M213 180V158Q214 149 221 148','faint',.5)
      + path('M27 161Q19 157 20 151Q29 152 27 161M213 162Q205 159 206 152Q215 152 213 162','fine',.6)
      + path('M56 129Q57 119 67 117M59 124Q66 123 69 128','faint',.55);
  }
  return art;
}
const options=[['A','Rooted in the Word','An airy tree, a few deliberate leaves, and an open Bible.'],['B','Branches of teaching','Five branches, small books, and the shared source beneath them.'],['C','A living inheritance','A gentle century arc around an asymmetric tree.'],['D','Still growing','A quieter young tree, with new shoots beside the Bible.']];
document.getElementById('grid').innerHTML=options.map(([letter,title,note],i)=>`<article class="study" tabindex="0" aria-label="${letter}: ${title}"><div class="label"><b>${letter} · ${title}</b><span>Original SVG · hover to animate</span></div><div class="hero"><div><div class="kicker">Teachers in the library</div><h2>Five Centuries<br>Of Biblical Teachers</h2><p>52 pastors, preachers and missionaries, from Heinrich Bullinger to teachers still living today. Their sermons and books are in the library.</p></div><svg class="art" viewBox="0 0 240 200" aria-hidden="true"><g class="base">${tree(i)}</g><g class="live">${tree(i)}</g></svg></div><div class="utility"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" aria-label="Search preview ${letter}" placeholder="Find a teacher or a city"></label><dl><div><dt>TEACHERS</dt><dd>52</dd></div><div><dt>WORKS</dt><dd>18,104</dd></div><div><dt>SERMONS</dt><dd>7,957</dd></div><div><dt>SINCE</dt><dd>1504</dd></div></dl></div><div class="timeline"><p>Each circle is one teacher, placed by the year they were born.</p><div class="dots">${['HB','JC','JO','JE','GW','CH','CS','JM','JP'].map(n=>`<i>${n}</i>`).join('')}</div><div class="years"><span>1500</span><span>1600</span><span>1700</span><span>1800</span><span>1900</span><span>Today</span></div></div><p class="note">${note}</p></article>`).join('');
document.getElementById('theme').onclick=()=>document.body.classList.toggle('light');
document.getElementById('play').onclick=()=>{const on=document.body.classList.toggle('playing');document.getElementById('play').textContent=on?'Stop animation':'Animate all';};
