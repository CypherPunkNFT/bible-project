// Four original passage-inspired line drawings; the faint complete drawing
// remains underneath the animated strokes, as on the Teachers station.
const p=(d,c='',t=0)=>`<path d="${d}" class="${c}" pathLength="1" style="--d:${t}"/>`;
const e=(x,y,rx,ry,c='fine')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="${c}"/>`;
const g=(c,s)=>`<g class="${c}">${s}</g>`;
const star=(x,y,r=2,t=.5)=>p(`M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z`,'faint glint',t);

// A — Proverbs 2:4–6. Knowledge sought as silver and hidden treasure.
const treasure=p('M25 147H214M35 147L44 137H65M187 139H202L210 147','faint',.02)
  +p('M66 88L156 78L184 94L94 106ZM66 88V130L94 145L184 131V94M94 106V145','',.08)
  +p('M73 98V126L87 134V109M102 111V138L176 126V101M110 110V137M161 103V129','fine',.17)
  +p('M66 88L61 48Q106 21 151 39L156 78M61 48L71 53Q110 34 143 46L148 75M71 53L76 83','',.23)
  +p('M79 55Q106 42 133 48M83 67L86 79M135 52L138 76','fine',.3)
  +p('M124 110L139 107V119L124 122ZM131 112V116','ink',.38)
  +e(100,88,10,3)+e(119,88,9,3)+e(138,85,9,3)
  +p('M87 88L95 76L106 77L113 88M95 76L101 89M144 89L153 79L164 87','fine',.45)
  +p('M45 143Q42 134 52 132Q63 133 61 141M191 134L201 124L207 128L203 138Z','fine',.5)
  +g('rays',p('M101 27L99 18M122 28L126 17M78 34L72 26M158 48L169 43','faint',.54))
  +star(37,63,2.7)+star(188,41,2.5,.6)+star(209,81,1.8,.7);

// B — Proverbs 13:14. The teaching of the wise as a fountain of life.
const fountain=p('M23 147H218','fine',.02)
  +p('M55 128Q120 158 185 128M55 128Q120 141 185 128M61 130L66 139Q120 161 174 139L179 130','',.09)
  +p('M106 138L112 112H128L134 138M113 119H127','fine',.18)
  +p('M82 96Q120 115 158 96M82 96Q120 124 158 96M88 100Q120 111 152 100','',.24)
  +p('M114 104V82H126V104M107 82Q120 87 133 82L129 76H111Z','fine',.3)
  +g('water',p('M120 77V43C120 22 83 27 83 64M120 48C120 22 158 28 158 65M120 56C120 35 102 41 102 71M120 56C120 35 139 41 139 71','fine',.36))
  +g('moving drops',p('M83 71V77M158 72V78M102 77V82M139 77V82','fine drop',.48))
  +p('M39 147V121M39 133Q26 128 29 120Q39 122 39 133M39 126Q49 120 49 112Q38 113 39 126M199 147V123M199 137Q210 130 209 123Q198 125 199 137','fine',.55)
  +g('ripples',p('M76 133Q85 136 94 136M146 136Q157 135 163 132','faint',.6))
  +star(49,43,2.5)+star(183,30,2.5,.6)+star(200,82,1.7,.7);

// C — John 8:31–32. Truth brings freedom: an open scroll and separated links.
const freedom=p('M31 144H210','faint',.03)
  +'<g transform="translate(24 -10) scale(.8)">'
  +p('M68 40H166Q180 40 180 52V112M68 40Q53 40 53 53V61H70V53Q67 47 63 52M78 53V112H165','',.1)
  +p('M78 112Q65 112 65 124Q65 135 78 135H180Q194 135 194 123Q194 112 180 112M78 112Q90 112 90 123Q90 129 84 129M180 112Q168 112 168 123Q168 129 176 129','',.19)
  +p('M92 56H154M92 64H162M92 72H150M92 80H159','fine',.29)+'</g>'
  +g('moving chain-left',p('M39 104L55 96Q61 92 65 98Q69 105 62 108L47 116Q40 119 37 113Q33 108 39 104ZM51 113L67 105Q74 102 77 108Q80 114 74 118L60 125Q52 129 49 122','',.4)
    +p('M70 122L88 113Q95 110 99 116L102 122M96 129L80 137Q73 140 70 133L68 129','',.48))
  +g('moving chain-right',p('M135 113L141 110Q148 107 152 114L156 120Q159 127 152 130L139 137Q132 140 128 133L125 127M150 116L166 107Q173 104 177 111Q180 117 173 121L157 129M174 113L188 105Q195 102 198 109Q201 115 194 119L182 126','',.46))
  +g('rays',p('M110 103V95M105 108L99 102M118 106L124 99M110 138V145','ink',.6))
  +star(38,45,2)+star(202,57,2.5,.6);

// D — Proverbs 24:13–14. Honey's sweetness illustrates wisdom for the soul.
function hex(x,y,r=9){return p(`M${x} ${y-r}L${x+r*.866} ${y-r*.5}V${y+r*.5}L${x} ${y+r}L${x-r*.866} ${y+r*.5}V${y-r*.5}Z`,'fine',.2);}
let cells='';
for(let row=0;row<4;row++)for(let col=0;col<4;col++){if((row===0&&col===3)||(row===3&&col===0))continue;cells+=hex(74+col*16+(row%2)*8,47+row*14,8.8);}
const honey=p('M28 147H213','fine',.02)
  +p('M60 34Q88 26 112 33L140 57L139 92L124 105L82 105L59 87Z','',.09)+cells
  +p('M106 115Q155 99 205 115L199 135Q155 151 112 135ZM112 121Q155 137 200 121M116 138Q155 151 194 138','',.3)
  +p('M100 114L125 117M185 116L211 113','fine',.4)
  +g('moving honey-drip',p('M103 99V116Q103 120 106 120Q109 120 109 116V103','',.44))
  +g('moving bee',e(169,51,8,5)+p('M165 47V55M170 46V56M177 50L181 47M161 51L157 52M166 46C157 35 166 33 170 43C173 32 183 35 174 45','fine',.5))
  +p('M183 53Q201 62 184 72Q173 80 184 88','faint trail',.6)
  +p('M40 147V120M40 136Q30 132 29 123Q41 124 40 136M40 127Q50 123 51 113Q40 114 40 127','fine',.62)
  +star(37,53,2)+star(194,30,2.5,.6);

const scenes=[treasure,fountain,freedom,honey];
const names=['Hidden treasure','A fountain of life','The truth sets free','Wisdom like honey'];
const refs=['Proverbs 2:4–6','Proverbs 13:14','John 8:31–32','Proverbs 24:13–14'];
document.getElementById('drawings').innerHTML=scenes.map((scene,i)=>`<div class="drawing" tabindex="0" aria-label="${names[i]}, ${refs[i]}"><span>${'ABCD'[i]}</span><svg viewBox="0 0 240 160" role="img" aria-label="${names[i]}"><g class="base">${scene}</g><g class="live">${scene}</g></svg><a class="passage" href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(refs[i])}&version=KJV" target="_blank" rel="noreferrer">${refs[i]}</a></div>`).join('');
