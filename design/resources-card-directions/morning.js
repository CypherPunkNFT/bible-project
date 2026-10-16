(() => {
// Six new compositions developed from drawing 7, Morning (Lamentations 3:22–23).
const p=(d,c='land')=>`<path d="${d}" class="${c}"/>`;
const g=(s,c)=>`<g class="${c}">${s}</g>`;
const n=v=>+v.toFixed(2);
function sun(x,y,r){let rays='';for(let i=0;i<15;i++){const a=Math.PI+(i/14)*Math.PI,inner=r+7,outer=r+(i%2?13:20);rays+=p(`M${n(x+Math.cos(a)*inner)} ${n(y+Math.sin(a)*inner)}L${n(x+Math.cos(a)*outer)} ${n(y+Math.sin(a)*outer)}`,'morning-ray');}return `<circle cx="${x}" cy="${y}" r="${r}" class="morning-disc"/>`+g(rays,'morning-radiance');}
function hill(d,c='land'){return p(d+'L272 208H8Z','land-mask')+p(d,c);}
function birds(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})" class="morning-birds">${p('M0 0Q4-5 9 0Q13-4 17-1M19-9Q22-13 26-9Q29-12 32-10M13 10Q16 6 20 10Q23 7 26 9','bird-line')}</g>`;}
function tree(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">${p('M-2 0L0-19L3-34M2-10L11-26M1-18L-9-29','tree-trunk')}${p('M-16-23C-25-23-26-32-19-36C-23-43-15-49-8-47C-6-55 5-55 10-48C17-52 27-45 23-38C31-32 24-22 16-24C13-18 3-18 0-22C-7-17-14-17-16-23Z','tree-crown')}${p('M-17-33Q-12-39-7-35M-9-43Q-3-48 3-43M7-39Q14-45 19-38M-10-26Q-5-31 0-27M6-29Q13-34 19-29M-3-36Q1-40 6-36','leaf-detail')}${p('M-7 1Q0-2 7 1','land-fine')}</g>`;}
function cypress(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">${p('M0 0V-17M0-67C-3-54-14-26-10-16C-7-9 7-9 10-16C14-26 3-54 0-67Z','tree-crown')}${p('M0-20V-55M0-27L-5-33M0-35L5-43','leaf-detail')}</g>`;}
function flower(x,y,h=29,lean=0,s=1){let petals='';for(let i=0;i<7;i++)petals+=`<ellipse cx="0" cy="-4.6" rx="2.2" ry="3.8" transform="rotate(${i*360/7})" class="flower-petal"/>`;return `<g transform="translate(${x} ${y}) scale(${s})"><g class="morning-flower">${p(`M0 0Q${lean+3} ${-h*.48} ${lean} ${-h}M${lean/2} ${-h*.35}Q-14 ${-h*.42}-12 ${-h*.62}Q-1 ${-h*.62} ${lean/2} ${-h*.35}M${lean/2} ${-h*.55}Q14 ${-h*.68} 15 ${-h*.88}Q4 ${-h*.83} ${lean/2} ${-h*.55}`,'stem')}<g transform="translate(${lean} ${-h})">${petals}<circle r="2.1" class="flower-core"/></g></g></g>`;}
function grass(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">${p('M0 0Q-3-8-8-11M0 0Q1-12 5-16M0 0Q5-6 10-8M-4 0L-9-5','grass')}</g>`;}
function foreground(variant=0){const a=variant%2;return flower(31,201,35,-4,.95)+flower(52,203,25,4,.8)+flower(246,201,39,5,.88)+flower(227,205,25,-3,.75)+grass(15,200,.7)+grass(70,198,.6)+grass(209,200,.7)+grass(265,201,.75)+p(a?'M83 200Q111 193 132 198M159 201Q182 196 195 197':'M80 201Q105 196 121 198M173 200L193 196','land-fine');}
function stones(x,y){return p(`M${x} ${y}q4-6 9-2q3 4-1 4h-9ZM${x+14} ${y+3}q4-4 7-1q2 3-1 3h-6Z`,'land-fine');}
// 1: closest to the original — a broad sunrise, generous rolling land and botanical flowers.
let meadow=sun(140,100,26)+birds(69,39,.72);
meadow+=hill('M8 113C45 93 79 92 112 105C137 114 159 113 185 102C219 88 247 93 272 103','land-far');
meadow+=hill('M8 139C58 116 89 118 133 132C179 146 224 116 272 126');
meadow+=tree(62,130,.46)+tree(86,128,.35)+tree(224,130,.48)+tree(245,128,.32);
meadow+=p('M20 147Q59 136 96 142M194 146Q228 138 258 141','land-fine');
meadow+=hill('M8 168C51 157 99 155 148 166C198 177 230 168 272 158');
meadow+=p('M146 168Q181 176 164 190Q157 196 142 205M160 168Q201 179 183 192Q177 200 172 207','land-fine');
meadow+=foreground()+grass(106,172,.45)+grass(197,179,.45);
// 2: a ribbon of water leads the eye from near flowers into a dawn valley.
let river=sun(149,88,24)+birds(55,38,.8);
river+=hill('M8 102Q43 70 79 82Q108 104 141 109Q184 99 212 79Q249 68 272 88','land-far');
river+=hill('M8 129Q61 97 114 125L146 138Q207 99 272 118');
river+=tree(52,124,.56)+tree(79,122,.4)+cypress(226,120,.48)+cypress(244,117,.36);
river+=p('M145 134Q124 146 158 154Q196 167 157 180Q136 190 119 207M153 134Q140 145 176 154Q221 169 180 187L152 208','river-edge');
river+=p('M8 163Q61 143 126 158M203 155Q237 150 272 162','land');
river+=p('M146 145H155M157 163H181M158 177H180M142 194H162','water-light');
river+=foreground(1)+stones(189,188)+grass(94,172,.55);
// 3: a calm lake, reflected sunrise, low hills and reeds.
let lake=sun(133,83,26)+birds(207,33,.7);
lake+=hill('M8 111Q36 97 62 103Q92 116 128 109Q178 100 204 98Q241 96 272 111','land-far');
lake+=p('M8 124Q77 117 133 121Q210 118 272 126M17 131H86M182 130H258','land-fine');
lake+=tree(44,116,.41)+tree(64,116,.29)+tree(235,119,.45);
lake+=g(p('M118 128H148M113 136H155M120 144H151M103 153H163M110 162H151','water-light'),'morning-reflection');
lake+=p('M26 143H71M190 146H244M39 157H91M180 166H251','water-line');
lake+=hill('M8 176Q48 165 84 180Q115 191 142 185Q209 164 272 171');
lake+=p('M17 188Q21 170 17 149M25 189Q34 170 33 154M17 155V144M33 161V151M255 184Q247 170 249 151','reed');
lake+=foreground(1)+stones(185,185);
// 4: a sunlit garden path between olives and a pair of tall cypresses.
let garden=sun(150,79,23)+birds(73,29,.65);
garden+=hill('M8 115Q50 87 92 106Q139 124 184 103Q234 85 272 107','land-far');
garden+=p('M8 151Q53 127 114 142M179 141Q226 126 272 148','land');
garden+=cypress(59,146,.9)+cypress(84,141,.66)+tree(226,146,.86)+tree(252,144,.53);
garden+=p('M143 132Q119 149 145 166Q160 179 116 207M155 133Q138 149 166 165Q186 183 155 207','land');
garden+=p('M140 153L153 153M146 164L164 168M142 184L162 190M121 204L149 207','land-fine');
garden+=p('M19 169Q60 154 105 168M188 168Q227 155 266 167','land-fine')+foreground()+grass(97,171,.55)+grass(196,178,.6);
// 5: terraced hills with a simple field gate: the quiet promise of another day.
let terraces=sun(183,91,26)+birds(47,37,.75);
terraces+=hill('M8 109Q39 92 67 97Q102 109 144 110Q210 123 272 98','land-far');
terraces+=hill('M8 136Q60 112 112 126Q181 151 272 119');
terraces+=p('M17 144Q65 127 111 138Q183 161 258 139M33 157Q77 142 119 153Q177 173 244 153','land-fine');
terraces+=tree(47,127,.4)+tree(67,124,.32)+cypress(239,127,.44);
terraces+=hill('M8 180Q69 157 135 176Q208 198 272 164');
terraces+=p('M96 190V160H101V190M155 193V164H160V193M101 167L155 170M101 181L155 184M104 169L151 182M105 182L151 171M97 174L75 169M74 165V186','gate');
terraces+=p('M111 190Q129 197 111 208M148 193Q163 201 158 208','land-fine')+foreground(1);
// 6: sunrise in an open grove, with one mature foreground olive and a flowered clearing.
let grove=sun(164,86,25)+birds(214,39,.7);
grove+=hill('M8 111Q52 94 94 108Q148 127 193 106Q238 85 272 105','land-far');
grove+=hill('M8 149Q83 118 143 144Q200 165 272 131');
grove+=tree(50,166,1.24)+tree(244,143,.6)+tree(221,146,.4);
grove+=p('M16 172Q69 157 106 172M174 171Q223 159 265 168','land-fine');
grove+=p('M173 150Q137 166 173 181Q199 194 174 208M183 151Q151 166 188 181Q221 197 207 208','land-fine');
grove+=foreground()+flower(106,193,22,3,.65)+grass(119,183,.5)+stones(133,194);
// AG03 variations: the same quiet lake, with independently animated rays, wings and ripples.
function rotatingSun(x,y,r){let rays='';for(let i=0;i<28;i++){const a=i*Math.PI/14,inner=r+7,outer=r+(i%2?13:18);rays+=p(`M${n(Math.cos(a)*inner)} ${n(Math.sin(a)*inner)}L${n(Math.cos(a)*outer)} ${n(Math.sin(a)*outer)}`,'lake-ray');}return `<circle cx="${x}" cy="${y}" r="${r}" class="morning-disc"/><g transform="translate(${x} ${y})"><g class="lake-sun-rays">${rays}</g></g>`;}
function flyingBirds(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})"><g class="lake-flock" style="--flight-start:${(-35-x)/s}px;--flight-end:${(305-x)/s}px;--flight-delay:${-(x+35)/340*42}s">${[[0,0,1],[23,-10,.8],[15,13,.7]].map(([xx,yy,ss])=>`<g transform="translate(${xx} ${yy}) scale(${ss})">${p('M-9-2Q-4-7 0 0Q4-7 9-2','bird-line')}</g>`).join('')}</g></g>`;}
function wave(x,y,w,i,gold=false){return `<g class="lake-ripple" style="--ripple-delay:${-i*1.3}s;--ripple-time:${7+i%3}s">${p(`M${x} ${y}q${n(w/8)}-1.6 ${n(w/4)} 0t${n(w/4)} 0t${n(w/4)} 0t${n(w/4)} 0`,gold?'lake-reflection':'lake-water')}</g>`;}
function lakeStudy(v){const sx=[133,123,153][v],sy=[83,99,84][v],r=[26,22,25][v];
 let s=rotatingSun(sx,sy,r)+flyingBirds(...[[205,35,.72],[65,35,.78],[70,38,.75]][v]);
 s+=hill(v===1?'M8 109Q40 94 76 105Q112 114 151 107Q211 94 272 109':'M8 111Q36 97 62 103Q92 116 128 109Q178 100 204 98Q241 96 272 111','land-far');
 s+=p('M8 124Q77 117 133 121Q210 118 272 126M17 131H76M210 131H258','land-fine');
 s+=tree(44,116,.41)+tree(64,116,.29);
 // New trees sit to the LEFT of the original right-hand tree; smaller trees stay behind it.
 const grove=v===0?[[185,117,.28],[204,116,.36],[219,117,.31],[235,119,.45]]:v===1?[[179,117,.27],[197,116,.4],[216,116,.32],[235,119,.45],[252,121,.32]]:[[169,118,.3],[191,116,.43],[213,117,.5],[237,120,.61]];
 s+=grove.map(t=>tree(...t)).join('');
 const reflections=v===1?[[sx-13,130,26],[sx-18,140,37],[sx-25,151,49],[sx-30,164,60]]:[[sx-12,130,24],[sx-17,139,34],[sx-14,148,30],[sx-25,158,50],[sx-20,168,43]];
 s+=reflections.map(([x,y,w],i)=>wave(x,y,w,i,true)).join('');
 const waves=v===0?[[19,140,65],[191,140,59],[34,150,52],[178,151,79],[20,162,62],[191,171,58]]:v===1?[[17,141,70],[183,139,74],[31,153,52],[192,154,66],[19,168,59],[178,177,74],[64,185,64]]:[[21,138,76],[193,141,61],[30,151,84],[197,156,58],[49,167,61],[190,173,65]];
 s+=waves.map(([x,y,w],i)=>wave(x,y,w,i+5)).join('');
 s+=hill(v===1?'M8 187Q57 171 93 189Q121 201 159 190Q219 174 272 185':v===2?'M8 172Q57 153 91 174Q123 195 158 184Q214 155 272 166':'M8 176Q48 165 84 180Q115 191 142 185Q209 164 272 171');
 if(v===0){s+=p('M17 188Q21 170 17 149M25 189Q34 170 33 154M17 155V144M33 161V151M255 184Q247 170 249 151','reed')+foreground(1)+stones(185,185);}
 if(v===1){s+='<g class="al-foreground">'+flower(31,204,26,-4,.84)+flower(51,207,20,3,.65)+flower(247,205,29,4,.8)+grass(15,204,.7)+grass(264,204,.7)+stones(211,194);
  // Small, spaced foreground details beside the left flowers and through the open centre.
  s+=grass(72,202,.56)+stones(83,196)+grass(114,205,.46)+stones(137,199)+grass(175,204,.82)+grass(197,201,.42)+'</g>';
 }
 if(v===2){s+=flower(28,203,39,-3,1)+flower(49,207,29,4,.8)+flower(245,204,44,3,1)+flower(224,207,30,-5,.8)+grass(72,199,.7)+grass(207,201,.65)+p('M98 191Q116 184 133 188M161 190Q178 181 192 184','land-fine');}
 return s;
}
const verse='It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.';
const item=(art,concept)=>({art:`<g class="morning-art">${art}</g>`,concept,verse,morning:true});
window.resourceFocusedRows.push(
 {id:'morning-studies',nav:'Morning / six new scenes',label:'Morning / meadows, rivers & still waters',category:2,items:[item(meadow,'New mercies in the meadow'),item(river,'Dawn along the river'),item(lake,'Morning beside still waters')]},
 {id:'morning-studies-2',nav:'Morning / gardens & groves',label:'Morning / garden paths, open fields & olive groves',category:2,items:[item(garden,'The garden waking'),item(terraces,'A new day beyond the gate'),item(grove,'First light in the olive grove')]},
 {id:'ag03-variations',nav:'AG03 / animated lake variations',label:'AG03 variations / rippling water, birds & turning sunrays',category:2,items:[item(lakeStudy(0),'Soft ripples at sunrise'),item(lakeStudy(1),'The open lake at dawn'),item(lakeStudy(2),'A flower-framed morning')]}
);
})();
