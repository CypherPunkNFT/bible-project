(() => {
// Six original scenes for the Resources landing; the existing mockups remain independent.
const p=(d,c='')=>`<path d="${d}" class="${c}"/>`;
const circle=(x,y,r,c='')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const group=(s,c)=>`<g class="${c}">${s}</g>`;
function book(x,y,w=90,h=27){const l=x-w/2,r=x+w/2;let s=p(`M${l} ${y}Q${x-20} ${y-10} ${x} ${y+1}Q${x+20} ${y-10} ${r} ${y}V${y+h}Q${x+20} ${y+h-9} ${x} ${y+h+1}Q${x-20} ${y+h-9} ${l} ${y+h}ZM${x} ${y+1}V${y+h+1}`,'paper');s+=p(`M${l-4} ${y+3}V${y+h+5}Q${x-20} ${y+h-4} ${x} ${y+h+6}Q${x+20} ${y+h-4} ${r+4} ${y+h+5}V${y+3}`,'fine');for(let i=0;i<4;i++)s+=p(`M${l+7} ${y+5+i*5}Q${x-20} ${y+i*5} ${x-6} ${y+7+i*5}M${x+6} ${y+7+i*5}Q${x+20} ${y+i*5} ${r-7} ${y+5+i*5}`,'fine');return s;}
function star(x,y,r=4){return p(`M${x-r} ${y}Q${x} ${y} ${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Z`,'breathe');}
function leaves(x,y,flip=1){return `<g transform="translate(${x} ${y}) scale(${flip} 1)">${p('M0 0Q-3-26 10-48','fine')}${[0,1,2].map(i=>p(`M${i*2} ${-10-i*12}Q${-19+i*3} ${-12-i*12} ${-15+i*3} ${-24-i*12}Q${i*3} ${-26-i*12} ${i*2} ${-10-i*12}M${i*2} ${-15-i*12}Q${20+i*2} ${-17-i*12} ${19+i*2} ${-30-i*12}Q${i*2} ${-29-i*12} ${i*2} ${-15-i*12}`,'fine')).join('')}</g>`;}
const ground=p('M25 183H255M65 188H215','faint');
// A: A working study desk: pages, annotations, pencil and a growing branch.
let study=p('M63 110V49Q140-4 217 49V110M70 101V53Q140 7 210 53V101M140 23V93M70 70H210','faint');
study+=group(p('M94 104Q93 86 108 70M101 84Q83 85 84 72Q99 68 101 84M105 74Q104 59 118 58Q122 70 105 74','fine'),'drift');
study+=p('M34 159H246M44 164H236M55 164V179M225 164V179','fine')+book(139,116,119,29);
study+=p('M41 147L56 104L60 106L45 149ZM41 147L41 153L45 149M216 148H238V122H216ZM220 122V118H234V122M220 128H234M219 143H233','fine');
study+=p('M88 164L81 176H176L183 164M99 169H159M96 172H145','fine')+star(112,40,4)+star(178,49,3)+ground;
// B: An open place at the table, people and the Word at its centre.
let table=p('M46 117C46 92 234 92 234 117V132C234 161 46 161 46 132ZM46 117C46 146 234 146 234 117M65 145V174M215 145V174','fine');
for(const [x,y] of [[80,66],[121,53],[165,55],[205,70]])table+=circle(x,y,9)+p(`M${x-16} 99V${y+23}Q${x-14} ${y+11} ${x} ${y+11}Q${x+14} ${y+11} ${x+16} ${y+23}V100M${x-6} ${y+12}L${x} ${y+20}L${x+6} ${y+12}`);
table+=book(140,109,56,15)+p('M116 180V160Q140 149 164 160V180M121 176V163Q140 157 159 163V176M113 180H167','paper');
table+=leaves(37,116)+leaves(245,116,-1)+group(p('M105 35Q140 22 174 35M64 43Q140-1 220 48','faint'),'breathe')+ground;
// C: A lantern at an open shelter: a place of welcome and practical care.
let shelter=p('M62 174V78Q62 23 119 23Q176 23 176 78V174M71 174V79Q71 33 119 33Q167 33 167 79V174','fine');
shelter+=p('M88 172V68L143 48V164ZM99 117V128M82 174H188M76 181H194','paper');
shelter+=group(p('M106 62L147 32M119 89L159 79M120 146L159 158','faint'),'breathe');
shelter+=p('M190 164V122H226V164ZM187 122H229L219 111H197ZM200 111V104Q208 94 216 104V111M195 128V157H221V128M187 166H229','paper');
shelter+=group(p('M209 153C195 144 207 137 208 129C219 140 220 147 209 153Z'),'flame');
shelter+=leaves(49,178)+p('M93 188Q126 196 137 203M146 189Q171 194 182 203','faint')+ground;
// D: Scripture as the root of understanding: a tree growing out of the pages.
let tree=book(140,143,144,28)+p('M136 141Q124 115 135 89Q144 65 136 38M144 140Q135 113 149 91M135 96Q109 86 93 67M141 76Q165 67 180 47M133 116Q166 109 189 91');
tree+=group(p('M93 67Q71 66 73 45Q92 43 93 67M111 81Q88 82 92 62Q113 61 111 81M139 57Q120 46 128 28Q148 35 139 57M159 66Q153 44 175 39Q184 57 159 66M180 47Q180 26 201 27Q203 47 180 47M163 109Q160 88 180 82Q190 103 163 109M189 91Q189 69 211 70Q211 92 189 91','fine'),'drift');
tree+=p('M140 178L126 190M141 178L147 194M144 179L165 188','fine')+star(67,96,4)+star(207,120,3)+circle(83,115,1,'fine')+ground;
// E: Many paths reach one house; fellowship as gathering and shared prayer.
let house=p('M82 156V87L140 48L198 87V156ZM75 87L140 42L205 87M133 57V36M126 43H140M122 155V121A18 18 0 0 1 158 121V155M91 102V90H107V111H91ZM173 102V90H189V111H173Z','fine');
house+=p('M133 153V122Q140 114 147 122V153M98 91V110M91 101H107M181 91V110M173 101H189','fine');
house+=group(p('M22 177Q75 174 126 157M258 177Q204 174 154 157M140 199V161','flow'),'breathe');
for(const [x,y] of [[47,131],[224,131],[111,179],[169,179]])house+=circle(x,y,5)+p(`M${x-9} ${y+21}V${y+13}Q${x} ${y+3} ${x+9} ${y+13}V${y+21}M${x-4} ${y+22}V${y+29}M${x+4} ${y+22}V${y+29}`,'fine');
house+=leaves(31,115)+leaves(250,115,-1)+star(93,47,3)+star(191,40,4);
// F: A shared basket: bread, a folded blanket and olive branches, carried by two people.
let basket=p('M82 107H198L183 169H98ZM86 117H194M92 143H188M97 159H184M109 118L116 165M130 118L133 165M151 118L150 165M172 118L168 165','fine');
basket+=p('M101 107C84 77 111 52 139 69L156 105M109 80L122 87M117 71L131 79M103 91L115 97','paper');
basket+=p('M151 105V72Q171 65 191 74V107M157 78Q171 74 185 79M160 85H183M161 91H183M166 98H183','paper')+leaves(147,100);
basket+=p('M23 120L58 135L86 123Q96 121 97 128L80 140L109 135Q119 137 114 144L78 158Q68 162 58 157L23 144M257 120L222 135L194 123Q184 121 183 128L200 140L171 135Q161 137 166 144L202 158Q212 162 222 157L257 144','paper');
basket+=p('M47 132L41 150M233 132L239 150','fine')+group(p('M130 42C116 33 126 23 134 31L140 37L146 31C155 23 165 33 150 44L140 53Z','fine'),'breathe')+ground;
const scenes=[study,table,shelter,tree,house,basket];
const concepts=['The study desk','A place at the table','A door left open','Rooted in the Word','Gathered in one place','One another’s burdens'];
window.resourceStudies=[...scenes.map((art,i)=>({art,concept:concepts[i]}))];
})();
