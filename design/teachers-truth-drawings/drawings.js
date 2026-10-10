// Original drawings. The complete resting layer stays visible while the live
// layer traces its strokes, using the teachers station's easing and line weights.
const P = (d, c = '', delay = 0) => `<path d="${d}" class="${c}" pathLength="1" style="--d:${delay}"/>`;
const C = (x, y, r, c = '') => `<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const E = (x, y, rx, ry, c = 'fine') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="${c}"/>`;
const G = (c, content) => `<g class="${c}">${content}</g>`;

function book(x, y, width, height, cross = false) {
  const l = x - width / 2, r = x + width / 2;
  let drawing = P(`M${l} ${y}Q${x-width/4} ${y-8} ${x} ${y+2}Q${x+width/4} ${y-8} ${r} ${y}V${y+height}Q${x+width/4} ${y+height-8} ${x} ${y+height+2}Q${x-width/4} ${y+height-8} ${l} ${y+height}ZM${x} ${y+2}V${y+height+2}`, '', .1)
    + P(`M${l-4} ${y+3}V${y+height+4}Q${x-width/4} ${y+height-4} ${x} ${y+height+6}Q${x+width/4} ${y+height-4} ${r+4} ${y+height+4}V${y+3}`, 'fine', .16);
  for (let i = 0; i < 3; i++) {
    const yy = y + 7 + i * 5;
    drawing += P(`M${x+6} ${yy+2}Q${x+width/4} ${yy-4} ${r-7} ${yy}`, 'fine', .23 + i*.04);
    if (!cross) drawing += P(`M${l+7} ${yy}Q${x-width/4} ${yy-4} ${x-6} ${yy+2}`, 'fine', .23+i*.04);
  }
  if (cross) drawing += P(`M${x-width/4} ${y+5}V${y+height-5}M${x-width/4-6} ${y+11}H${x-width/4+6}`, 'ink', .36);
  return drawing;
}
function stars(points) {
  return points.map(([x,y,s],i) => P(`M${x} ${y-s}Q${x} ${y} ${x+s} ${y}Q${x} ${y} ${x} ${y+s}Q${x} ${y} ${x-s} ${y}Q${x} ${y} ${x} ${y-s}Z`, 'faint sparkle', .35+i*.07)).join('');
}

// A · Your word is a lamp: an ancient oil lamp illuminates the open Word;
// a fine winding path continues into the distant hills.
const light =
  P('M23 145H217', 'fine', .02)
  + P('M128 83Q145 70 165 77Q185 64 216 80M151 89Q171 78 217 89', 'faint', .03)
  + P('M174 79C196 86 144 87 166 97C176 102 163 106 155 110M179 79C204 86 153 88 177 97C190 103 182 108 173 113', 'faint', .12)
  + book(139, 111, 119, 26, true)
  + P('M27 91C29 105 43 110 59 110C75 110 87 103 90 91L79 85C74 92 62 96 46 93L35 87ZM35 87L29 78L39 80L45 91', '', .18)
  + E(59, 91, 17, 4)
  + P('M82 91C106 69 110 106 84 103M47 110V114H71V110M43 114H75', 'fine', .3)
  + G('moving flame', P('M30 76C22 67 31 59 29 51C39 61 42 68 34 77C37 69 32 66 32 62', '', .4))
  + G('rays', P('M44 63L58 60M43 75L62 79M38 48L43 39M17 59L10 54M32 43V34', 'faint', .5))
  + stars([[114,43,2.4],[192,42,2],[206,61,1.6]]);

// B · The sure compass: a compass suspended above Scripture, with a fine
// north cross, engraved ticks, and a needle that gently settles toward north.
const ticks = Array.from({length:24}, (_,i) => {
  const a = i*Math.PI/12, outer = 42, inner = i%6===0 ? 34 : i%3===0 ? 37 : 39;
  const x = r => (120+Math.sin(a)*r).toFixed(2), y = r => (66-Math.cos(a)*r).toFixed(2);
  return P(`M${x(inner)} ${y(inner)}L${x(outer)} ${y(outer)}`, 'fine', .16+i*.008);
}).join('');
const compass =
  book(120, 121, 150, 23, true)
  + C(120,66,47) + C(120,66,43,'fine')
  + ticks
  + P('M117 18V13Q120 9 123 13V18M120 31V43M116 35H124', 'ink', .22)
  + P('M87 66H96M144 66H153M120 91V100', 'faint', .26)
  + G('moving needle', P('M120 40L128 66L120 92L112 66ZM120 40V92M112 66H128', '', .42) + C(120,66,2.4,'ink'))
  + P('M70 95Q62 106 75 116M170 95Q178 106 165 116', 'faint', .44)
  + stars([[47,47,2.8],[195,39,2.2],[39,93,1.8],[203,93,1.8]]);

// C · Search the Scriptures: the rolled manuscript is complete beneath
// the lens; the lens has an opaque ground and a magnified cross and writing.
const manuscript =
  P('M47 49H178Q193 49 193 62V127H62V62Q62 49 47 49Q33 49 33 62V69H52V61Q50 57 45 60', '', .08)
  + P('M62 127H193Q202 127 202 137Q202 146 192 146H63Q49 146 49 135Q49 127 62 127M62 127Q73 127 73 137Q73 141 68 142M193 127Q185 127 185 136Q185 141 192 142', '', .18)
  + P('M40 69V116Q40 123 47 124M67 56H175', 'faint', .2)
  + P('M76 68H107M76 75H115M76 82H109M76 96H114M76 103H103M76 110H115M166 110H179M163 117H179', 'fine', .28)
  + G('moving lens', C(143,81,28,'lens-ground') + C(143,81,24,'fine')
    + P('M162 103L185 127Q189 131 193 127Q197 123 193 119L169 96M168 108L174 102', '', .43)
    + P('M142 65V89M133 73H151M133 96H153M136 101H148', 'ink', .5)
    + P('M124 79Q125 66 135 63', 'faint', .54))
  + stars([[24,33,2],[206,43,2.5],[99,27,1.8]]);

// D · A firm foundation: the open Bible rests on a dressed cornerstone;
// a simple portico and cross rise above it, with a plumb line at the side.
const foundation =
  P('M22 150H218M46 150V140H194V150M57 140V131H183V140M66 140V150M104 140V150M144 140V150M181 140V150', 'fine', .04)
  + book(120,108,125,19)
  + P('M70 101V60H82V101M158 101V60H170V101M67 101H85V106H67ZM155 101H173V106H155ZM67 56H85V61H67ZM155 56H173V61H155Z', '', .18)
  + P('M75 64V97M165 64V97', 'faint', .24)
  + P('M59 55L120 24L181 55ZM77 49L120 31L163 49Z', '', .27)
  + P('M120 4V23M113 11H127M59 58H181', 'ink', .34)
  + P('M102 103V85A18 18 0 0 1 138 85V103M109 103V85A11 11 0 0 1 131 85V103', 'fine', .38)
  + P('M198 56H210M204 56V66', 'faint', .43)
  + G('moving plumb', P('M204 66V105M204 105L199 115L204 121L209 115ZM201 114H207', 'fine', .5))
  + stars([[30,56,2],[188,25,2],[35,104,1.6]]);

const drawings = [light, compass, manuscript, foundation];
const names = ['Scripture lights the way', 'The sure compass', 'Search the Scriptures', 'A firm foundation'];
document.getElementById('drawings').innerHTML = drawings.map((scene,i) => `<div class="drawing" tabindex="0" aria-label="${names[i]}"><span>${'ABCD'[i]}</span><svg viewBox="0 0 240 160" role="img" aria-label="${names[i]}"><g class="base">${scene}</g><g class="live">${scene}</g></svg></div>`).join('');
