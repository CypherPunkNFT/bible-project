(() => {
const p=(d,c='')=>`<path d="${d}" class="${c}"/>`;
const circle=(x,y,r,c='')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const ellipse=(x,y,rx,ry,c='fine')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="${c}"/>`;
const group=(s,c)=>`<g class="${c}">${s}</g>`;
// M: Scripture examined closely, with a manuscript, notes and a magnifying lens.
let reading=p('M50 61Q41 50 48 40Q54 32 69 39H210Q224 40 224 50Q224 59 213 62H202M65 40Q77 43 74 56L54 147Q51 160 65 165H207Q221 161 219 151Q217 142 205 145L202 157H75Q64 154 69 147L89 61H213','paper');
reading+=p('M75 157Q77 145 68 143M202 157Q213 166 219 153M211 42Q203 43 205 52H216M50 44Q59 40 63 45Q68 52 57 54','fine');
for(let i=0;i<7;i++)reading+=p(`M${93-i*2} ${73+i*9}H${[139,165,157,181,155,178,168][i]}`,'fine');
reading+=p('M43 173L67 175L62 194L38 191ZM44 179L58 181M43 184L55 186M218 181L242 126L247 123L247 131L223 184ZM221 175L226 177M218 181L217 188L223 184','fine');
let lens=circle(175,92,30,'paper')+circle(175,92,25,'fine')+p('M194 116L214 143Q219 147 223 142Q226 139 222 134L202 109M196 119L205 112','paper');
lens+=p('M158 79H174M158 87H191M158 97H186M158 105H179M183 72Q193 76 196 84','fine');
reading+=group(lens,'lens')+p('M27 199H256','faint');
// N: Hospitality, shared bread and warm cups around a common table.
let bread=ellipse(140,114,108,62,'faint')+ellipse(140,114,98,54,'fine');
bread+=ellipse(140,117,44,29,'fine')+ellipse(140,117,38,23,'faint');
bread+=p('M110 113Q105 97 119 91Q128 86 137 92L132 99L139 106L132 114L135 124Q117 130 110 113ZM145 91Q164 88 172 104Q178 123 145 126L149 117L142 110L149 102Z','paper');
bread+=p('M116 102L126 98M120 114L127 109M155 99L164 103M154 112L168 111','fine');
bread+=p('M25 69L66 88L101 98Q108 101 105 106Q103 110 96 108L79 103L102 116Q107 122 101 126L72 114L54 102L25 93M255 69L214 88L179 98Q172 101 175 106Q177 110 184 108L201 103L178 116Q173 122 179 126L208 114L226 102L255 93','paper');
bread+=p('M49 80L41 101M231 80L239 101','fine');
for(const [x,y] of [[105,57],[177,160]]){bread+=ellipse(x,y,12,4)+p(`M${x-12} ${y}V${y+17}Q${x} ${y+26} ${x+12} ${y+17}V${y}M${x+12} ${y+3}Q${x+26} ${y+1} ${x+24} ${y+12}Q${x+21} ${y+18} ${x+12} ${y+14}`,'paper');bread+=group(p(`M${x-3} ${y-8}Q${x-9} ${y-14} ${x-3} ${y-21}M${x+4} ${y-9}Q${x+10} ${y-15} ${x+5} ${y-22}`,'fine'),'steam');}
bread+=p('M61 151L91 158L81 179L52 172ZM60 157L79 162M59 163L72 168M211 128V159M207 128V138Q211 145 215 138V128M207 134H215','fine');
// O: One person makes room for another beneath an umbrella in the rain.
let shelter=group(p('M29 37L18 60M48 22L33 54M71 19L60 43M225 23L214 46M249 35L232 73M262 70L248 101M33 92L19 122M42 133L29 162M243 128L230 158','fine'),'rain');
shelter+=p('M57 79Q69 27 142 25Q211 25 229 79Q212 67 197 79Q178 66 160 79Q141 67 123 79Q104 67 86 79Q69 67 57 79ZM142 25V17M142 25Q106 37 86 79M142 25Q169 37 197 79M142 25Q141 40 142 71','paper');
shelter+=p('M142 79V135Q142 145 153 142Q158 140 155 135','fine');
shelter+=circle(110,103,10,'paper')+circle(178,107,10,'paper');
shelter+=p('M95 153V129Q97 115 110 115Q123 115 130 126L143 123L159 124Q173 117 183 120Q193 123 194 138V156M101 154L99 178H108L112 155L118 179H127L121 151M169 156L163 179H172L179 157L184 178H193L187 156M130 127L156 136L164 129M100 127L107 142L132 135M132 135L140 127M168 133L173 145L185 140','paper');
shelter+=p('M88 184H203M94 188H119M177 189H197','fine')+ellipse(140,191,95,8,'faint');
window.resourceStudies.push({art:reading,concept:'A closer reading'},{art:bread,concept:'Breaking bread together'},{art:shelter,concept:'Shelter through the storm'});
})();
