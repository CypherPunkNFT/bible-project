(() => {
// Round two: six independent, original SVG scenes, in the existing Resources mockup frame.
const p=(d,c='')=>`<path d="${d}" class="${c}"/>`;
const circle=(x,y,r,c='')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const g=(s,c)=>`<g class="${c}">${s}</g>`;
const ellipse=(x,y,rx,ry,c='fine')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="${c}"/>`;
const star=(x,y,r=3)=>p(`M${x-r} ${y}Q${x} ${y} ${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Z`,'breathe');
function book(x,y,w=90,h=27){const l=x-w/2,r=x+w/2;let s=p(`M${l} ${y}Q${x-20} ${y-10} ${x} ${y+1}Q${x+20} ${y-10} ${r} ${y}V${y+h}Q${x+20} ${y+h-9} ${x} ${y+h+1}Q${x-20} ${y+h-9} ${l} ${y+h}ZM${x} ${y+1}V${y+h+1}`,'paper');s+=p(`M${l-4} ${y+3}V${y+h+5}Q${x-20} ${y+h-4} ${x} ${y+h+6}Q${x+20} ${y+h-4} ${r+4} ${y+h+5}V${y+3}`,'fine');for(let i=0;i<4;i++)s+=p(`M${l+7} ${y+5+i*5}Q${x-20} ${y+i*5} ${x-6} ${y+7+i*5}M${x+6} ${y+7+i*5}Q${x+20} ${y+i*5} ${r-7} ${y+5+i*5}`,'fine');return s;}
const ground=p('M30 183H250M71 188H210','faint');
// G: A lamp illuminating a manuscript, with a quill and quiet shelves behind it.
let lamp=p('M42 48H142M42 51H142M45 94H110','faint');
for(let i=0;i<7;i++){let x=49+i*12,h=[26,32,23,29,34,27,25][i];lamp+=p(`M${x} 47V${47-h}H${x+8}V47M${x+2} ${52-h}H${x+6}M${x+2} 42H${x+6}`,'faint');}
lamp+=p('M190 133V120M175 137Q190 127 205 137ZM190 119V107M178 107H202M165 92Q179 111 199 101Q210 96 216 81Q197 94 177 82L166 76Q159 79 165 92ZM168 85Q154 73 153 84Q152 94 168 95M215 82L220 76','paper');
lamp+=g(p('M219 74C210 65 221 61 220 52C229 61 230 68 221 74Z'),'flame');
lamp+=g(p('M198 59L182 47M206 49L199 31M233 54L244 40M237 69L254 66','fine'),'breathe');
lamp+=p('M182 76L131 100M192 104L168 134M205 111L196 153','faint light-ray');
lamp+=g(book(120,132,135,32),'turning-page');
lamp+=p('M37 169H52V152H37ZM40 152V147H49V152M44 147Q44 124 61 109Q62 129 44 147M44 143L55 121M204 166L236 141M209 167L238 145M236 141L241 139L238 145','fine')+ground;
// H: A single living vine with many branches and fruit: connection rather than a crowd icon.
let vine=p('M126 178Q151 153 137 126Q120 99 146 80Q166 61 144 34M139 149Q102 150 86 117Q77 99 55 98M139 128Q174 135 192 111Q207 91 228 101M139 104Q107 99 95 73Q83 48 58 53M153 73Q190 79 210 50');
vine+=p('M134 179Q154 154 143 128M133 178L114 186M136 179L155 186','fine');
const leaf=(x,y,rotation=0)=>`<g transform="translate(${x} ${y}) rotate(${rotation})">${p('M0 0Q-23-4-22-25Q-5-29 3-12Q8-31 25-27Q27-7 0 0ZM0 0L-14-18M0 0L17-19','fine')}</g>`;
vine+=g(leaf(61,99,-55)+leaf(92,76,-30)+leaf(145,39,10)+leaf(208,52,65)+leaf(193,115,75),'drift');
for(const [x,y] of [[93,122],[173,86],[119,70]]){vine+=p(`M${x} ${y-9}V${y-2}`,'fine');for(const [dx,dy] of [[-5,0],[5,0],[-9,8],[1,9],[10,8],[-4,17],[5,18],[1,26]])vine+=circle(x+dx,y+dy,4,'paper');}
vine+=p('M43 165Q24 100 58 51M220 158Q251 106 227 68','faint')+star(52,143)+star(223,137)+ground;
// I: A sturdy stone bridge spanning troubled water; two people meet on its crest.
let bridge=p('M27 129Q140 35 253 129V154H218Q140 64 62 154H27ZM28 121Q140 25 252 121M31 116V131M249 116V131','paper');
for(let i=0;i<11;i++){const a=Math.PI+(i/10)*Math.PI;let x=140+109*Math.cos(a),y=145+62*Math.sin(a),xx=140+89*Math.cos(a),yy=151+44*Math.sin(a);bridge+=p(`M${x} ${y}L${xx} ${yy}`,'fine');}
bridge+=p('M29 138H53M227 139H250M62 112L79 123M200 122L217 112','fine');
bridge+=circle(125,47,5)+circle(155,47,5)+p('M116 75V60Q123 52 130 59L138 65L148 59Q155 52 163 61V76M122 76V84M130 76V83M150 76V83M158 77V85M129 60L139 69L151 61','fine');
bridge+=g(p('M20 171Q35 163 50 171T80 171T110 171T140 171T170 171T200 171T230 171T260 171M35 185Q50 177 65 185T95 185T125 185T155 185T185 185T215 185T245 185M84 157Q99 149 114 157T144 157T174 157T204 157','fine'),'water');
bridge+=p('M30 153L23 157M251 154L259 159M42 86Q55 72 68 79M202 74Q224 65 239 85','faint');
// J: A library staircase: knowledge made approachable, one step and one volume at a time.
let library=p('M47 173V43Q140-6 233 43V173M55 169V49Q140 3 225 49V169M140 20V108','faint');
for(const y of [75,111]){library+=p(`M56 ${y}H224M56 ${y+3}H224`,'fine');for(let i=0;i<12;i++){const x=62+i*13,h=[23,30,26,22,28][i%5];library+=p(`M${x} ${y}V${y-h}H${x+9}V${y}M${x+2} ${y-h+5}H${x+7}M${x+2} ${y-5}H${x+7}`,'fine');}}
library+=p('M62 180V163H96V149H130V135H164V122H200V180ZM62 168H96M96 154H130M130 140H164M164 127H200M96 163V180M130 149V180M164 135V180','paper');
library+=g(book(181,109,47,13),'turning-page');
library+=p('M78 153L111 139L145 124','faint flow')+star(111,32)+star(168,33)+ground;
// K: A circle of prayer viewed from above: each person turned toward the same centre.
// Table edge stays inside the nearest fingertips (radius 35), with visible clearance.
let prayer=ellipse(140,106,30.5,30.5,'prayer-inner-ring');
// Original figure silhouette; each person's own hands are simply two touching circles.
const prayingHands=`<g class="praying-hands">${circle(-3,-38,3,'paper')}${circle(3,-38,3,'paper')}</g>`;
for(let i=0;i<6;i++){const rotation=i*60;prayer+=`<g transform="translate(140 106) rotate(${rotation})">${p('M-21-66Q-22-91 0-94Q22-91 21-66M-21-66Q-15-57-9-47L-5-40M21-66Q15-57 9-47L5-40M-11-69L-7-56L-2-41M11-69L7-56L2-41','paper')}${circle(0,-73,10,'paper')}${prayingHands}</g>`;}
// A compact open Bible: upright page proportions, a curved gutter, page edges and ribbon.
prayer+=p('M118 91Q129 87 140 93Q151 87 162 91V121Q151 117 140 123Q129 117 118 121Z','paper');
prayer+=p('M120 89Q130 86 140 91Q150 86 160 89V117Q150 114 140 120Q130 114 120 117ZM140 91Q138.5 105 140 120','paper');
prayer+=p('M122 119Q130 116 138 121M142 121Q150 116 158 119M146 119V125L149 123L152 124V117','fine');
for(let line=0;line<5;line++){const y=95+line*4;prayer+=p(`M124 ${y}Q130 ${y-1.5} 136 ${y+1}M144 ${y+1}Q150 ${y-1.5} 156 ${y}`,'bible-print');}
// L: A safe harbour: a sheltered boat, a guiding beacon and a lifebuoy close at hand.
let harbour=p('M150 161L160 68H183L193 161ZM156 68H187V47H156ZM152 47L171 32L191 47M171 32V24M161 52H181V63H161ZM166 83H178V97H166ZM165 119H177V135H165Z','paper');
harbour+=p('M150 161H200M151 151H191M159 74H184M155 111H188M163 53V62M178 53V62','fine');
harbour+=g(p('M154 54L58 27M154 60L39 79M190 54L249 35M190 60L260 78','faint'),'breathe');
harbour+=p('M44 147H116L104 164H59ZM76 146V105L105 141H80M72 114L50 139H72','paper');
harbour+=g(p('M23 176Q38 168 53 176T83 176T113 176T143 176M39 189Q54 181 69 189T99 189T129 189M200 174Q214 168 228 174T256 174','fine'),'water');
harbour+=p('M200 162Q214 148 230 159L245 157L256 168M191 165Q174 186 151 192','fine');
harbour+=circle(220,122,22,'paper')+circle(220,122,12)+p('M203 108L211 115M229 130L237 137M205 138L212 130M229 114L236 106','fine');
harbour+=p('M237 139Q256 145 247 153Q239 159 230 151','fine')+star(122,35)+star(214,27);
const scenes=[lamp,vine,bridge,library,prayer,harbour];
const concepts=['A light for understanding','Many branches, one vine','Across troubled waters','One step deeper','United in prayer','A safe harbour'];
window.resourceStudies.push(...scenes.map((art,i)=>({art,concept:concepts[i]})));
})();
