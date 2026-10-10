const p=(d,c='',t=0)=>`<path d="${d}" class="${c}" pathLength="1" style="--d:${t}"/>`;
const e=(x,y,rx,ry,c='fine')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="${c}"/>`;
function book(x,y,w=86,h=32){const a=w/2;return p(`M${x-a} ${y}Q${x-a/2} ${y-8} ${x} ${y+2}Q${x+a/2} ${y-8} ${x+a} ${y}V${y+h}Q${x+a/2} ${y+h-8} ${x} ${y+h+2}Q${x-a/2} ${y+h-8} ${x-a} ${y+h}ZM${x} ${y+2}V${y+h+2}`,'',.18)+p(`M${x-a-4} ${y+3}V${y+h+4}Q${x-a/2} ${y+h-4} ${x} ${y+h+6}Q${x+a/2} ${y+h-4} ${x+a+4} ${y+h+4}V${y+3}`,'fine',.23)+[0,1,2].map(i=>p(`M${x-a+7} ${y+7+i*6}Q${x-a/2} ${y+2+i*6} ${x-6} ${y+9+i*6}M${x+6} ${y+9+i*6}Q${x+a/2} ${y+2+i*6} ${x+a-7} ${y+7+i*6}`,'fine',.3+i*.035)).join('');}
function sparks(){return [[32,39,2],[204,29,2.5],[190,66,1.5]].map(([x,y,r])=>p(`M${x-r} ${y}H${x+r}M${x} ${y-r}V${y+r}`,'faint',.5)).join('');}
// A: the writer's study, an angled manuscript, an ink pot and a candle.
const desk=p('M22 143H218M35 143V151M205 143V151','fine',.05)
+p('M57 89L141 78L156 131L72 143ZM63 90L76 137L153 128','',.15)
+[0,1,2,3].map(i=>p(`M${72+i*2} ${99+i*8}L${132+i*2} ${91+i*8}`,'fine',.28+i*.04)).join('')
+p('M41 142V109M33 109H49M36 109V70H46V109M36 76H46','fine',.3)
+p('M34 143Q34 137 41 137Q48 137 48 143','',.32)
+`<g class="moving flame">${p('M41 68C33 61 38 53 42 48C41 55 49 60 44 68Z','',.4)}</g>`
+p('M173 143V133Q173 125 187 125Q201 125 201 133V143M179 128V120H195V128','',.38)+e(187,120,8,2.3)
+`<g class="moving quill">${p('M151 123C163 93 179 62 205 44C202 65 185 94 155 121ZM155 116L192 63','',.46)}${p('M171 93L181 91M179 82L192 78M185 70L197 65','fine',.53)}</g>`+sparks();
// B: an early wooden printing press with a threaded screw and a fresh sheet.
const press=p('M28 149H212M45 149V31H58V149M182 149V31H195V149M40 31H200V43H40Z','',.05)
+p('M58 51H182M52 47V136M188 47V136M37 149L45 138M195 138L204 149','faint',.12)
+p('M113 43V84H127V43M108 52H132M108 62H132M108 72H132','fine',.2)
+p('M97 61H151L157 57M147 61V67','',.27)
+`<g class="moving press">${p('M91 84H149V93H91ZM86 93H154V99H86Z','',.32)}${p('M102 87H138','fine',.38)}</g>`
+p('M65 117H176V125H65ZM75 125V140M166 125V140M70 140H171','',.43)
+p('M84 113L136 104L166 113L111 121Z','fine',.49)
+p('M105 111L133 107M113 114L142 109M121 116L152 111','faint',.55)
+p('M68 133L101 128L108 134L74 140ZM72 137L105 131M83 141L119 135L126 140L91 146Z','fine',.62)+sparks();
// C: a church bell under a stone arch; sound carries beyond the building.
const bell=p('M35 148H205M54 148V74A66 66 0 0 1 186 74V148M66 148V76A54 54 0 0 1 174 76V148','',.06)
+p('M54 97H66M54 122H66M174 97H186M174 122H186M72 44L80 53M93 25L98 37M120 17V29M147 25L142 37M168 44L160 53','fine',.18)
+p('M120 4V17M115 9H125M85 54H155M91 54V63M149 54V63','fine',.23)
+`<g class="moving bell">${p('M116 54V63H124V54M104 99V82C104 66 136 66 136 82V99L144 111H96ZM97 111Q120 119 143 111','',.34)}${p('M108 91V82Q108 74 116 73M101 106H139','fine',.4)}${p('M120 115V125','ink',.48)}${e(120,126,3,3,'ink')}</g>`
+p('M29 86Q23 103 30 121M19 79Q9 104 21 130M211 86Q217 103 210 121M221 79Q231 104 219 130','faint rays',.55)
+p('M82 148V137H158V148M94 137V130H146V137','fine',.61);
// D: a reading lamp, a Bible and an hourglass: patient study through time.
const lamp=p('M21 148H219','fine',.03)+book(100,107,105,28)
+p('M152 148Q159 142 169 142Q179 142 186 148M169 142V79M163 79H175','',.15)
+p('M147 79H192L182 47H157ZM157 47Q169 40 182 47M169 42V34','',.22)
+p('M151 82L138 95M161 85L157 99M177 85L181 99M188 82L201 95','faint rays',.3)
+p('M169 79V86','ink',.33)
+p('M31 146H55M31 97H55M34 97V104C34 115 51 121 51 132V146M52 97V104C52 115 35 121 35 132V146','',.42)
+p('M37 104Q43 109 49 104M37 141Q43 132 49 141Z','fine',.52)
+`<g class="moving">${p('M43 119V135','fine sand',.6)}</g>`
+p('M62 145V140H79M192 145V139H209V145M193 137H214V131H193Z','fine',.65)+sparks();
const scenes=[desk,press,bell,lamp],names=['The writer’s study','The printing press','The teaching bell','Study through time'];
document.getElementById('drawings').innerHTML=scenes.map((scene,i)=>`<div class="drawing" tabindex="0" aria-label="${names[i]}"><span>${'ABCD'[i]}</span><svg viewBox="0 0 240 160" role="img" aria-label="${names[i]}"><g class="base">${scene}</g><g class="live">${scene}</g></svg></div>`).join('');
