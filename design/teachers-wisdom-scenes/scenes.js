const P=(d,c='sa-line',t=0)=>`<path d="${d}" pathLength="1" class="${c}" style="--d:${t}"/>`;
const E=(x,y,rx,ry,c='sa-fine',t=0)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" pathLength="1" class="${c}" style="--d:${t}"/>`;
const G=(c,s)=>`<g class="${c}">${s}</g>`;
const star=(x,y,r=2.5,i=0)=>`<path d="M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z" pathLength="1" class="sa-faint sa-star" style="--d:${.2+i*.03};--i:${i}"/>`;
const stars=()=>[[21,29,2.5],[68,17,2],[169,15,2.4],[216,31,2.5],[29,58,1.7],[207,64,1.7]].map((s,i)=>star(...s,i)).join('');
const archedWindow=(x,y,w,h)=>P(`M${x} ${y+h}V${y+w/2}A${w/2} ${w/2} 0 0 1 ${x+w} ${y+w/2}V${y+h}ZM${x+w/2} ${y}V${y+h}M${x} ${y+h*.58}H${x+w}`,'sa-faint');

// A. A treasure chamber: a domed chest is the focal point, with stone niches,
// coins and fitted ironwork. Only the light and tiny stars move.
let chest=archedWindow(30,65,29,68)+archedWindow(181,65,29,68)+stars();
chest+=P('M17 149H223M66 149V144H174V149','sa-fine',.05);
chest+=P('M75 98V67C75 38 165 38 165 67V98ZM82 94V68C82 46 158 46 158 68V94','sa-line',.14);
chest+=P('M91 53V92M98 51V91M142 51V91M149 53V92M82 74H158','sa-fine',.22);
chest+=P('M106 64Q120 58 134 64M112 70H128','sa-faint',.27);
chest+=P('M72 101H168V142H72ZM72 101L80 93H160L168 101M78 107H162V136H78Z','sa-line',.31);
chest+=P('M86 102V141M93 102V141M147 102V141M154 102V141M72 118H78M162 118H168','sa-fine',.37);
chest+=P('M113 108H127V123H113ZM120 113V118','sa-tone',.45);
chest+=P('M91 96L99 84L108 84L115 96M99 84L103 97M133 96L139 87L149 94','sa-fine',.44);
chest+=E(123,94,8,2.7)+E(123,91,8,2.7);
chest+=P('M42 146V139M42 139Q49 134 57 139V146M42 142Q49 147 57 142M183 146V140M183 140Q191 135 199 140V146M183 143Q191 148 199 143','sa-fine',.55);
chest+=G('treasure-light',P('M107 37L103 26M120 34V20M133 37L138 26','sa-fine',.6));

// B. A courtyard fountain: dimensional basins, falling water, tiled footing,
// arched garden walls, and individual leaves around one central axis.
let fountain=archedWindow(24,48,34,72)+archedWindow(182,48,34,72)+stars();
fountain+=P('M14 150H226M41 150V144H199V150M52 144V139H188V144','sa-fine',.08);
fountain+=P('M61 128Q61 116 120 116Q179 116 179 128Q179 144 120 144Q61 144 61 128Z','sa-line',.13);
fountain+=E(120,126,59,10,'sa-fine',.18);
fountain+=P('M104 132L111 106H129L136 132M106 124H134','sa-line',.24);
fountain+=P('M83 90Q83 82 120 82Q157 82 157 90Q151 108 120 108Q89 108 83 90Z','sa-line',.29);
fountain+=E(120,90,37,7,'sa-fine',.32);
fountain+=P('M114 86V66H126V86M108 66H132L128 60H112Z','sa-line',.36);
fountain+=P('M120 60V40C120 23 95 28 94 53M120 40C120 23 145 28 146 53','sa-fine',.4);
fountain+=G('moving',P('M94 56V82M146 56V82M91 99V121M149 99V121','sa-fine flow',.47));
fountain+=G('ripple',P('M72 129Q84 135 99 132M142 132Q157 135 168 129','sa-fine',.53));
fountain+=P('M30 145V129M30 137C20 136 19 127 20 123C30 124 33 131 30 137M30 132C29 122 35 117 41 116C44 125 39 131 30 132M208 145V132C198 132 195 125 197 120C206 121 210 126 208 132M208 137C207 127 215 125 220 125C221 132 215 138 208 137','sa-fine',.6);

// C. Truth opens the gate: a broad stone arch frames an open scroll. Gate
// leaves turn out toward the side piers; a broken chain rests on the threshold.
let gate=P('M35 141V72A85 64 0 0 1 205 72V141M45 141V72A75 54 0 0 1 195 72V141','sa-faint');
gate+=P('M35 90H45M35 113H45M195 90H205M195 113H205M49 42L57 47M78 17L84 26M120 8V18M162 17L156 26M191 42L183 47','sa-faint',.08);
gate+=P('M16 149H224M33 149V142H207V149','sa-fine',.13);
gate+=P('M47 141V67L75 82V134ZM193 141V67L165 82V134ZM54 72V139M62 76V137M69 80V135M186 72V139M178 76V137M171 80V135M47 92L75 102M47 119L75 120M193 92L165 102M193 119L165 120','sa-line',.22);
gate+=P('M90 52H143Q151 52 151 60V109M90 52Q82 52 82 61V66H94V60M99 61V106M99 106H150Q158 106 158 114Q158 122 150 122H99Q91 122 91 114Q91 106 99 106Q107 106 107 114Q107 118 103 118','sa-line',.34);
gate+=P('M109 65H140M109 72H140M109 79H136M109 86H141M109 93H132','sa-fine',.43);
gate+=G('moving left-link',P('M83 131L92 127Q97 125 99 130Q101 134 96 136L87 140Q82 142 80 137Q78 133 83 131M96 135L105 131Q110 129 112 134M111 140L104 143Q99 145 97 140','sa-fine',.5));
gate+=G('moving right-link',P('M129 134Q132 129 137 132L145 136Q150 139 147 143Q145 146 141 144L132 139M144 133L153 129Q158 127 160 132Q162 136 157 138L151 141','sa-fine',.54));
gate+=G('treasure-light',P('M120 130V125M115 129L112 125M125 129L129 125','sa-tone',.6));

// D. Wisdom like honey: a pottery jar, dripping dipper, hanging honeycomb,
// woven skep and garden plants make a quiet apiary still life.
let honey=P('M17 149H223M24 37H88M36 37V47M77 37V47','sa-faint',.03);
honey+=P('M32 49L44 43H70L82 51V84L71 94H44L32 85Z','sa-line',.11);
const hex=(x,y)=>P(`M${x} ${y-6}L${x+5.2} ${y-3}V${y+3}L${x} ${y+6}L${x-5.2} ${y+3}V${y-3}Z`,'sa-fine',.22);
for(let row=0;row<4;row++)for(let col=0;col<3;col++)honey+=hex(44+col*11+(row%2)*5.5,53+row*10);
honey+=P('M102 86Q94 98 94 120Q94 140 102 145H148Q156 140 156 120Q156 98 148 86M100 80H150V87H100ZM108 76H142V80M108 76Q125 70 142 76','sa-line',.3);
honey+=E(125,145,23,4,'sa-fine',.34);
honey+=P('M96 106Q125 116 154 106M96 127Q125 137 154 127M104 112V125M111 114V128M139 114V128M146 112V125','sa-fine',.39);
honey+=P('M153 83L181 47Q184 43 187 46Q190 49 186 52L159 87M144 91L156 75Q160 74 164 80L153 96ZM145 87L155 94M148 83L158 90M151 79L161 86','sa-line',.43);
honey+=G('moving honey',P('M151 95V103Q151 107 154 107Q157 107 157 103V96','sa-fine',.5));
honey+=P('M40 147C35 127 43 110 58 110C73 110 81 127 76 147ZM39 138H77M39 130H77M42 122H74M48 115H68M54 147V139Q58 133 62 139V147','sa-fine',.52);
honey+=P('M195 148V126M195 137Q183 135 182 124Q194 124 195 137M195 132Q195 119 207 116Q211 128 195 132M202 147V136Q213 131 217 138','sa-fine',.56);
honey+=G('moving bee',E(124,36,7,4,'sa-fine',.6)+P('M121 32V40M126 32V40M131 36L135 34','sa-fine',.62)+G('wing',P('M121 32C112 21 123 19 124 30C128 19 139 23 128 32','sa-fine',.63)));
honey+=star(99,20,2)+star(213,32,2.5,1)+star(201,66,1.8,2);

const scenes=[chest,fountain,gate,honey],refs=['Proverbs 2:4–6','Proverbs 13:14','John 8:31–32','Proverbs 24:13–14'],names=['Seeking wisdom as hidden treasure','The teaching of the wise is a fountain of life','Truth brings freedom','Wisdom is sweet to the soul'];
document.getElementById('grid').innerHTML=scenes.map((scene,i)=>`<article class="sample" tabindex="0" aria-label="${names[i]}"><span class="letter">${'ABCD'[i]}</span><div class="scene"><svg class="sa-art" viewBox="0 0 240 160" fill="none" role="img" aria-label="${names[i]}"><g class="sa-base">${scene}</g><g class="sa-live">${scene}</g></svg></div><a class="passage" target="_blank" rel="noreferrer" href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(refs[i])}&version=KJV">${refs[i]}</a></article>`).join('');
document.getElementById('theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';};
