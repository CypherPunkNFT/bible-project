(() => {
const p=(d,c='')=>`<path d="${d}" class="${c}"/>`;
const circle=(x,y,r,c='')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const g=(s,c)=>`<g class="${c}">${s}</g>`;
const ground=p('M36 183H244M81 189H199','faint');
const heart=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M0 10C-7 4-18-4-18-13C-18-25-5-28 0-18C5-28 18-25 18-13C18-4 7 4 0 10Z')}</g>`;
// Y02: full-sized table, short arms and two simple circles for each person's own hands.
// Opaque silhouettes hide the table rim behind people, instead of shrinking the table.
let joined='<ellipse cx="140" cy="106" rx="75" ry="64" class="prayer-inner-ring"/>';
for(let i=0;i<6;i++){
 joined+=`<g transform="translate(140 106) rotate(${i*60})">`;
 joined+='<path d="M-21-66Q-22-91 0-94Q22-91 21-66Q18-59 6-54Q0-50-6-54Q-18-59-21-66Z" fill="var(--surface)" stroke="var(--surface)" stroke-width="4" stroke-linejoin="round"/>';
 joined+=p('M-21-66Q-22-91 0-94Q22-91 21-66M-21-66Q-17-60-6-54M21-66Q17-60 6-54M-11-69Q-10-61-3-56M11-69Q10-61 3-56','paper');
 joined+=circle(0,-73,10,'paper')+`<g class="praying-hands">${circle(-3,-53,3,'paper')}${circle(3,-53,3,'paper')}</g></g>`;
}
joined+=p('M118 91Q129 87 140 93Q151 87 162 91V121Q151 117 140 123Q129 117 118 121Z','paper');
joined+=p('M120 89Q130 86 140 91Q150 86 160 89V117Q150 114 140 120Q130 114 120 117ZM140 91Q138.5 105 140 120','paper');
joined+=p('M122 119Q130 116 138 121M142 121Q150 116 158 119M146 119V125L149 123L152 124V117','fine');
for(let line=0;line<5;line++){const y=95+line*4;joined+=p(`M124 ${y}Q130 ${y-1.5} 136 ${y+1}M144 ${y+1}Q150 ${y-1.5} 156 ${y}`,'bible-print');}
// Two friends sitting together, with a relaxed arm around a shoulder.
let bench=g(heart(140,53,.85),'heart-breath')+p('M83 51L73 45M198 47L208 41M140 20V13','faint');
bench+=p('M54 144H226V151H54ZM66 152V179M214 152V179M64 161H216M60 125H220V131H60Z','fine');
bench+=circle(108,84,11,'paper')+circle(168,88,11,'paper');
bench+=p('M92 136V115Q92 101 106 99Q117 98 126 106L143 113L153 108Q164 100 176 105Q188 108 189 125V138L175 144H147L144 132L140 118M98 113L103 131L127 133Q134 137 127 141H103Q95 139 94 132M122 108Q135 101 145 105L159 108Q165 109 163 114Q162 117 156 115L142 113M158 120L162 134L181 132','paper');
bench+=p('M101 144L98 172H111L116 148L121 171H134L128 143M151 145L145 173H158L164 149L177 171H190L179 144M96 173H112M120 173H135M143 175H159M176 173H193','paper')+ground;
// Friends joined hand in hand beneath a large, welcoming heart.
let friends=p('M140 168C114 146 51 106 51 67C51 30 96 17 122 42L140 62L158 42C184 17 229 30 229 67C229 106 166 146 140 168','friendship-heart');
for(const [x,y] of [[89,101],[140,89],[191,101]]){
 friends+=circle(x,y,9,'paper');
 friends+=p(`M${x-13} ${y+54}V${y+27}Q${x-13} ${y+12} ${x} ${y+12}Q${x+13} ${y+12} ${x+13} ${y+27}V${y+54}M${x-8} ${y+54}L${x-11} 180H${x-2}L${x+1} ${y+58}L${x+7} 180H${x+16}L${x+10} ${y+54}`,'paper');
}
friends+=p('M80 121L69 144Q66 152 73 153L82 135M100 121L112 136L128 113M151 113L167 136L180 121M200 121L211 143Q214 151 207 152L198 134','paper');
friends+=p('M108 132L113 139L117 134M163 132L168 139L172 134','hand-detail')+ground;
// Peaceful Tree of Life studies: generous canopies, sun, flowing water and open sky.
function leaf(x,y,a=0,s=1){return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${p('M0 0Q-11-7-6-21Q8-17 0 0M0-2L-4-15','fine')}</g>`;}
function tree(){let s=p('M128 169Q138 145 131 124Q124 106 132 91L138 81L145 82Q134 106 142 123Q153 148 146 169L163 178L145 174L139 168L133 175L111 178Z','paper');
 s+=p('M134 124Q106 116 88 98Q70 86 52 91M136 105Q113 93 103 70Q94 53 77 52M139 91Q151 68 143 41M145 119Q174 110 190 91Q207 72 225 80M146 99Q174 87 181 62Q186 46 204 42M88 99Q91 81 76 70M190 92Q195 108 214 109M105 73Q124 63 122 48M157 76Q169 54 159 37','fine');
 const leaves=[[49,90,-70,1],[64,83,-35,1.1],[77,71,-25,1],[86,101,-75,1],[102,114,-70,.85],[81,53,-50,1],[97,64,-20,1.1],[110,80,25,1],[124,52,25,1],[122,47,-25,.9],[143,42,-10,1],[154,61,40,1.1],[161,38,10,.9],[174,58,35,1],[181,76,45,1.1],[202,44,35,1],[214,66,65,1],[225,81,65,1],[207,85,30,1.05],[191,103,45,1],[215,112,70,.95],[171,118,65,.85]];
 s+=g(leaves.map(a=>leaf(...a)).join(''),'peace-canopy');
 s+=p('M135 143L139 159M134 127Q140 135 139 144','fine');return s;}
function sun(x,y,r){let s=circle(x,y,r,'sun-outline');for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=p(`M${x+Math.cos(a)*(r+6)} ${y+Math.sin(a)*(r+6)}L${x+Math.cos(a)*(r+11)} ${y+Math.sin(a)*(r+11)}`,'faint');}return g(s,'peace-sun');}
const bird=(x,y)=>p(`M${x} ${y}Q${x+5} ${y-5} ${x+10} ${y}Q${x+15} ${y-5} ${x+20} ${y}`,'fine');
let river=sun(217,36,17)+p('M23 148Q72 129 109 149M169 148Q214 130 258 146','faint');
river+=tree()+p('M133 176Q91 185 139 191Q173 197 127 207M150 177Q118 184 162 191Q199 201 159 207','fine water')+bird(36,45)+p('M29 184H85M197 182H250','faint');
let paradise=sun(140,49,35)+p('M29 132Q14 65 59 29M221 29Q266 65 251 132','faint');
paradise+=`<g transform="translate(18 9) scale(.87)">${tree()}</g>`;
paradise+=p('M33 178Q76 159 110 173M170 172Q214 158 247 178M25 189Q77 177 126 186M159 185Q210 176 254 190','fine');
paradise+=bird(36,65)+bird(224,65)+p('M119 177Q133 187 114 204M155 177Q149 191 169 204','fine water');
let garden=sun(67,49,21)+p('M34 154Q84 143 118 150M172 153Q216 142 255 151','faint');
garden+=`<g transform="translate(16 0) scale(.94)">${tree()}</g>`+bird(204,36);
garden+=p('M29 184Q57 166 86 178Q108 166 127 178M164 180Q198 161 227 176L250 181M118 183Q140 186 157 180M108 194Q140 198 170 190','fine water');
garden+=p('M42 174V158M42 165Q29 164 29 153Q43 153 42 165M42 159Q44 146 56 148Q55 159 42 159M232 172V158M232 163Q244 154 251 160Q246 171 232 163','fine');
window.resourceFocusedRows.push(
 {id:'fellowship-friendship',nav:'Prayer & friendship',label:'Fellowship / prayer, hearts & friendship',category:1,items:[{art:joined,concept:'United in prayer'},{art:bench,concept:'A friend beside you'},{art:friends,concept:'Held together in love'}]},
 {id:'help-tree-of-life',nav:'Tree of Life & peace',label:'Help for life / the Tree of Life, light & peace',category:2,items:[{art:river,concept:'Beside the river of life'},{art:paradise,concept:'A garden full of light'},{art:garden,concept:'Rest in the garden'}]}
);
})();
