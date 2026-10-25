(() => {
// Twelve example answer pictures, one for each kind of answer the drawing sessions meet. Real children's questions
// from the bank; verses from the BSB. Parts: kit.js.
const {p,g,at,hill,sun,birds,cloud,tree,cypress,palm,flower,grass,stones,reeds,foreground,person,star,twinkle,waves,bricks,house}=window.AP;

// 1 Babel: the tower itself, unfinished, its top among the clouds
function babel(){let s=sun(50,62,14)+birds(212,34,.7)+cloud(96,46,.8);
 s+=hill('M0 130Q40 114 80 121Q120 130 152 125Q200 113 240 119Q262 122 280 127','far');
 s+=p('M196 152Q230 147 272 153M206 160Q236 157 264 162','water');
 const tiers=[[76,204,176,150,6],[88,192,150,126,5],[100,180,126,104,5],[112,168,104,84,4]];
 for(const [a,b,lo,hi,r] of tiers)s+=p(`M${a} ${lo}V${hi}H${b}V${lo}Z`,'paper-line')+bricks(a,b,hi,lo,r,10);
 s+=p('M124 84V67L128 64L131 69L135 62L139 68L143 61L147 67L151 63L156 67V84Z','paper-line')+bricks(124,156,67,84,3,8);
 s+=p('M131 176L135 104M149 176L145 104','line')+p('M132 168H148M133 160H147M133 152H147M134 144H146M134 136H146M135 128H145M135 120H145M135 112H145','fine');
 s+=p('M133 176V167Q140 160 147 167V176','paper-line');
 s+=p('M120 84V52M160 84V50M118 60H162M118 72H162M120 72L160 60','line');
 s+=p('M160 50L188 40','trunk')+g(p('M188 40V57','fine')+p('M183 57h10v6h-10z','gold-fill'),'sway');
 s+=cloud(196,62,1);
 s+=person(104,150,.26,{brick:true})+person(176,126,.24)+person(124,104,.22,{brick:true})+person(166,84,.2);
 s+=hill('M0 186Q70 177 140 182Q210 188 280 178');
 s+=person(56,188,.5,{brick:true})+p('M22 196h24v-6H22zM26 190h16v-6H26z','paper-line')+p('M34 190v6M30 184v6M38 184v6','fine');
 s+=reeds(250,200,.8)+reeds(262,202,.6)+grass(212,202,.7)+grass(94,200,.6)+stones(176,196);
 return s;}

// 2 The scattering: the half-built tower far behind, little groups walking away on every road
function scattered(){let s=birds(64,36,.7)+cloud(214,44,.9);
 s+=hill('M0 116Q50 100 100 110Q150 120 200 106Q240 98 280 108','far');
 s+=p('M118 122V111H162V122Z','paper-line')+p('M124 111V102H156V111Z','paper-line')+p('M130 102V94H150V102Z','paper-line')+p('M134 94V87L137 89L140 85L143 89L146 87V94Z','paper-line')+p('M121 116H159M127 106H153M133 98H147','fine')+p('M132 94V80M148 94V82M131 86H149','fine');
 s+=hill('M0 132Q70 122 140 124Q210 126 280 134','land');
 const roads=['M140 124Q96 132 18 132','M140 124Q186 134 262 142','M140 124Q118 160 64 206','M140 124Q168 162 218 208','M140 124Q100 146 26 166','M140 124Q190 150 268 176'];
 s+=roads.map(d=>p(d,'gold-dots')).join('');
 const group=(x,y,sc,dir)=>[0,1,2].map(i=>person(x+i*dir*sc*16,y+i*sc*2,sc,{walk:true,bundle:i!==1,staff:i===1})).join('');
 s+=g(group(54,132,.28,-1),'','')+group(226,140,.3,1)+group(52,166,.42,-1);
 s+=group(196,180,.52,1)+person(96,194,.62,{walk:true,staff:true})+person(82,197,.6,{walk:true,bundle:true});
 s+=foreground(true,true)+stones(150,194);
 return s;}

// 3 Three sons: three people, the ark at rest on the mountains under the rainbow
function threeSons(){let s='';
 s+=p('M40 142A100 100 0 0 1 240 142','gold-thick')+p('M48 142A92 92 0 0 1 232 142','rose')+p('M56 142A84 84 0 0 1 224 142','leaf-line');
 s+=at(214,64,.9,p('M-10 0Q-4-6 0 0Q4-8 12-4Q6 0 2 4Q-4 4-10 0Z','paper-line')+p('M12-4l6-2','fine'),'drift');
 s+=hill('M0 142L58 96L92 118L140 74L188 118L222 98L280 140','land');
 s+=p('M112 76H168L160 88H120Z','paper-line')+p('M124 76V66H156V76Z','paper-line')+p('M120 67L140 58L160 67Z','paper-line')+p('M118 82H162M134 70h12','fine');
 s+=p('M70 112L80 120M200 112L214 120M150 96L160 104','fine');
 s+=hill('M0 158Q70 144 140 152Q210 160 280 148','land')+tree(40,154,.5)+tree(244,150,.46)+cypress(60,154,.42);
 s+=hill('M0 192Q70 182 140 188Q210 194 280 184');
 s+=person(98,190,1.05,{staff:true})+person(140,188,1.12)+person(182,190,1.05);
 s+=foreground(true,true);
 return s;}

// 4 God made the sky, the sun, the moon and the stars: his works, never him
function lights(){let s=sun(74,74,22);
 s+=p('M210 44A22 22 0 1 0 226 84A17 17 0 1 1 210 44Z','gold-fill');
 s+=twinkle([[176,38,4.5],[244,40,5],[254,80,3.5],[236,104,3],[184,96,3.5],[160,62,3],[262,58,2.5]]);
 s+=cloud(134,50,.6);
 s+=hill('M0 126Q46 108 90 116Q130 124 160 118Q210 106 280 120','far');
 s+=p('M150 138Q215 132 280 138','water')+waves(170,276,146,16,'water',0)+waves(160,270,156,18,'gold-glint',-2)+waves(176,272,166,16,'water',-4);
 s+=hill('M0 150Q50 132 100 140Q130 146 150 158Q160 170 150 210H0Z','land')+tree(36,144,.62)+tree(70,140,.5)+cypress(104,150,.5);
 s+=birds(118,96,.6);
 s+=hill('M0 194Q60 184 120 190Q200 198 280 188');
 s+=foreground(true,true)+stones(130,198);
 return s;}

// 5 A star in the sky: the star goes ahead of three travellers to the little town
function star5(){let s=twinkle([[40,30,3],[84,52,2.5],[120,26,3],[160,48,2.5],[256,90,3],[30,84,2.5],[262,30,2.5]]);
 s+=g(star(212,44,16,8,'gold-fill'),'breathe-strong')+p('M212 64L204 112','gold-dots');
 s+=hill('M0 120Q50 104 100 114Q150 124 200 104Q240 92 280 106','far');
 s+=hill('M120 150Q170 116 230 124Q262 128 280 136','land');
 s+=house(176,132,16,12)+house(194,128,14,15)+house(210,130,18,11)+house(230,134,13,10)+house(188,142,14,10)+house(206,144,16,11);
 s+=palm(250,150,.7)+palm(156,146,.55);
 s+=hill('M0 168Q60 152 120 160Q200 170 280 158');
 s+=p('M18 210Q70 192 62 180Q56 168 112 162Q160 158 176 148M40 210Q90 196 84 184Q80 174 120 170Q168 166 186 152','fine');
 s+=person(86,180,.78,{walk:true,staff:true})+person(108,174,.74,{walk:true,gift:true})+person(128,170,.7,{walk:true,staff:true,bundle:true});
 s+=palm(30,188,.95)+grass(12,204,.7)+grass(160,198,.6)+grass(250,202,.7)+stones(204,196);
 return s;}

// 6 Walking on the water: Jesus small and far off on the waves, the boat near, no face
function water(){let s=cloud(214,40,1.1)+`<circle cx="236" cy="34" r="11" class="disc"/>`+cloud(246,46,.7)+cloud(90,34,.8);
 s+=p('M20 70Q60 58 100 66T180 62','flow')+p('M40 86Q90 74 140 82','flow');
 s+=hill('M0 108Q70 102 140 106Q210 110 280 104','far');
 for(let i=0;i<5;i++)s+=waves(4+(i%2)*12,276,118+i*17,26+i*6,'water',-i*1.3);
 s+=waves(40,100,132,12,'gold-glint',-1)+p('M62 134H78M58 138H82','gold-glint');
 s+=person(70,132,.5,{back:true});
 s+=p('M150 168Q204 182 266 164L254 188Q206 198 160 188Z','paper-line')+p('M156 176Q204 188 260 172','fine');
 s+=p('M208 172V92','trunk')+p('M208 98L240 150M208 100L176 150','fine')+p('M200 108Q212 118 202 132','fine');
 for(const x of [176,192,224,240])s+=`<circle cx="${x}" cy="166" r="5" class="paper-line"/>`+p(`M${x-6} 175Q${x} 168 ${x+6} 175`,'line');
 s+=person(168,176,.7,{arm:'M-8-26L-20-32'});
 s+=waves(130,280,192,20,'water',-.5)+waves(120,280,202,24,'water',-2);
 return s;}

// 7 Tongues like flames of fire: a flame resting on each person in the room
function flames(){let s=p('M40 188V100Q140 4 240 100V188','line')+p('M48 188V102Q140 16 232 102V188','fine');
 s+=p('M104 130V84Q140 52 176 84V130Z','paper-line')+p('M104 120Q120 112 134 116Q152 110 176 114','far')+`<circle cx="158" cy="90" r="6" class="disc"/>`+p('M140 60V130M104 106H176','fine');
 s+=p('M58 104Q86 80 112 92M168 88Q196 76 222 100M64 126Q90 110 104 116M176 112Q200 104 216 120','flow');
 s+=p('M24 188H256','line')+p('M70 188L58 208M110 188L106 208M170 188L174 208M210 188L222 208','fine');
 for(const x of [68,104,176,212])s+=person(x,160,.64,{flame:true});
 for(const x of [88,140,192])s+=person(x,188,.8,{flame:true});
 s+=at(28,188,1,p('M0 0V-28h8V0','paper-line')+p('M-4-28h16','line'))+g(p('M32-30Q28-35 32-42Q36-35 32-30Z','gold-fill'),'flame','translate(0 158)')+at(250,188,1,p('M-8 0Q-14-18-6-26H6Q14-18 8 0Z','paper-line'));
 return s;}

// 8 Barabbas: released, walking out of the open prison into the sun
function barabbas(){let s=sun(236,62,17)+birds(176,40,.75)+birds(214,104,.5);
 s+=hill('M120 130Q180 112 230 120Q260 124 280 128','far');
 s+=p('M22 180V72H138V180Z','paper-line')+bricks(22,138,72,180,9,18);
 s+=p('M18 72H142','line')+p('M44 92h24v20H44zM50 92v20M56 92v20M62 92v20','line');
 s+=p('M84 180V134Q104 114 124 134V180Z','mask')+p('M84 180V134Q104 114 124 134V180','line')+p('M90 140V180M98 132V180M106 130V180M114 132V180M120 138V180','fine');
 s+=p('M124 134L146 140V186L124 180Z','paper-line')+p('M130 146L140 148M130 160L140 162M130 172L140 174','fine');
 s+=hill('M0 182Q90 180 150 186Q210 190 280 182');
 s+=p('M110 184Q160 190 210 196M124 194Q180 200 240 208','fine');
 s+=`<ellipse cx="156" cy="194" rx="5" ry="3" class="line"/><ellipse cx="165" cy="195" rx="5" ry="3" class="line"/>`+p('M171 194q6-4 8 1M146 193q-6-3-9 1','line');
 s+=person(204,192,1.1,{walk:true,arm:'M6-24L16-14'});
 s+=foreground(false,true)+grass(176,204,.6);
 return s;}

// 9 Bring the people into the land: Moses, seen from behind on the mountain, looks over the land he will not enter
function promised(){let s=sun(222,92,15,'breathe')+birds(150,44,.7);
 s+=hill('M60 104Q110 88 160 98Q210 108 280 96','far');
 s+=p('M196 108h22v8h-22zM196 108v-5h4v5M214 108v-5h4v5M205 108v-4h4v4','line');
 s+=hill('M40 124Q120 106 200 118Q240 124 280 118','land')+palm(190,122,.5)+palm(234,120,.44)+tree(150,120,.4);
 s+=p('M170 112Q196 126 180 140Q160 154 204 164Q248 176 232 210','water')+p('M180 112Q206 126 192 140Q176 154 218 164Q262 178 250 210','water')+p('M188 146h10M206 166h14M234 186h10','gold-glint');
 s+=p('M90 140Q140 132 170 140M110 154Q150 146 176 152M218 136Q250 130 278 138','fine')+p('M120 140L126 154M146 136L150 150','fine');
 s+=hill('M0 132L30 118L62 126L86 140L110 170L128 210H0Z','land')+p('M20 150l12-4M40 170l16-6M14 182l10-2M60 150l8 6','fine');
 s+=person(58,128,1.25,{back:true,staff:true});
 s+=flower(100,196,22,3,.7)+grass(84,204,.7)+grass(16,204,.6)+flower(258,204,30,4,.8)+grass(236,204,.6);
 return s;}

// 10 Genesis: the book open at Joseph's robe of many colours
function genesis(){let s=p('M90 70V40Q140 6 190 40V70','far')+p('M140 12V70M90 50H190','fine');
 s+=p('M140 158Q106 146 52 152L44 82Q98 74 140 88Z','paper-line')+p('M140 158Q174 146 228 152L236 82Q182 74 140 88Z','paper-line');
 s+=p('M52 152L50 160Q100 152 140 166Q180 152 230 160L228 152','line')+p('M140 88V158','line');
 let lines='';for(let i=0;i<8;i++)lines+=`M${58+i*.6} ${96+i*7}Q${96} ${91+i*7} ${132} ${100+i*7}`;s+=p(lines,'fine');
 s+=p('M170 96L185 100L200 96L216 110L209 117L204 112V148H166V112L161 117L154 110Z','paper-line')+p('M178 98Q185 108 192 98','line');
 s+=p('M166 120H204','gold-thick')+p('M166 128H204','rose-thick')+p('M166 136H204','leaf-thick')+p('M166 144H204','gold-thick')+p('M157 112L163 106M213 112L207 106','rose-thick');
 s+=g(p('M140 160Q146 176 138 190','gold-thick'),'sway');
 s+=p('M20 184H260','line')+p('M30 184V206M250 184V206','fine');
 s+=at(236,184,1,p('M-14 0Q-16-10-4-12H8Q16-10 14 0Z','paper-line')+p('M10-8Q20-10 22-4','line'))+g(p('M234 172Q228 165 234 156Q240 165 234 172Z','gold-fill'),'flame');
 s+=at(38,184,1,p('M-4 0h26v-7H-4z','paper-line')+`<circle cx="-4" cy="-3.5" r="3.5" class="paper-line"/><circle cx="22" cy="-3.5" r="3.5" class="paper-line"/>`);
 return s;}

// 11 The Bible: the open book on a stone in the meadow, light rising from its pages
function bible(){let s=birds(52,40,.7)+birds(222,30,.6);
 let rays='';for(let i=0;i<9;i++){const a=(-160+i*17.5)*Math.PI/180;rays+=`M${(140+Math.cos(a)*44).toFixed(1)} ${(96+Math.sin(a)*44).toFixed(1)}L${(140+Math.cos(a)*(i%2?66:80)).toFixed(1)} ${(96+Math.sin(a)*(i%2?66:80)).toFixed(1)}`;}
 s+=g(p(rays,'ray'),'breathe');
 s+=hill('M0 116Q50 98 100 108Q150 118 200 102Q240 92 280 104','far')+tree(30,112,.4)+tree(250,106,.44)+cypress(52,114,.4);
 s+=hill('M0 150Q70 132 140 140Q210 148 280 136','land');
 s+=p('M100 156Q96 134 120 132H160Q184 134 180 156Z','paper-line')+p('M112 142Q140 138 168 142','fine');
 s+=p('M140 128Q118 118 90 122L86 92Q114 88 140 98Z','paper-line')+p('M140 128Q162 118 190 122L194 92Q166 88 140 98Z','paper-line')+p('M140 98V128','line');
 s+=p('M94 100Q116 96 134 104M95 107Q116 103 134 111M96 114Q116 110 134 118M146 104Q164 96 186 100M146 111Q164 103 185 107M146 118Q164 110 184 114','fine');
 s+=g(p('M140 128Q144 140 138 152','gold-thick'),'sway');
 s+=p('M70 210Q110 186 118 158M210 210Q170 186 162 158','fine');
 s+=hill('M0 196Q60 186 120 194Q200 202 280 190')+foreground(true,true)+stones(196,200);
 return s;}

// 12 He saves us from our sins: the empty cross on the hill at sunrise, a broken chain at its foot
function cross(){let s=sun(140,126,30,'turn')+birds(62,46,.7)+birds(214,40,.6);
 s+=hill('M0 120Q60 104 110 114M170 114Q220 104 280 118','far');
 s+=hill('M0 172Q70 152 140 112Q210 152 280 170','land');
 s+=p('M136 114V36H144V114Z','paper-line')+p('M114 54H166V62H114Z','paper-line')+p('M140 40V110M118 58H162','fine');
 s+=p('M112 196Q126 158 136 116M168 196Q154 158 144 116','fine')+p('M124 176h6M131 150h4M150 150h-4M156 176h-6','fine');
 s+=tree(46,166,.5)+cypress(232,160,.5)+tree(252,170,.36);
 s+=hill('M0 190Q60 182 120 188Q200 196 280 186');
 s+=`<ellipse cx="96" cy="200" rx="6" ry="3.4" class="line"/><ellipse cx="107" cy="201" rx="6" ry="3.4" class="line"/>`+p('M114 200q7-5 9 1M89 199q-7-4-10 1','line');
 s+=foreground(true,true);
 return s;}

window.AP_EXAMPLES=[
 {art:babel,kind:'A place: draw the place itself',q:'What was the name of the city where the tower was built to reach heaven?',a:'Babel',ref:'Genesis 11:9',verse:'That is why it is called Babel, for there the LORD confused the language of the whole world, and from that place the LORD scattered them over the face of all the earth.',idea:'A tall stepped tower of bricks rising into the clouds, unfinished at the top, with tiny builders carrying bricks.',name:'tower-of-babel',shows:'none'},
 {art:scattered,kind:'The same story, a different answer: a different picture',q:'At the tower of Babel, what did the LORD do that led the people to be scattered over the whole earth?',a:'He confused their language so they could not understand one another.',ref:'Genesis 11:8',verse:'So the LORD scattered them from there over the face of all the earth, and they stopped building the city.',idea:'Little groups of people walking away on roads in every direction from a half-built tower far behind them.',name:'people-scattering-from-babel',shows:'god'},
 {art:threeSons,kind:'A number: count it with things, never write it',q:'How many sons did Noah have?',a:'Three',ref:'Genesis 6:10',verse:'And Noah had three sons: Shem, Ham, and Japheth.',idea:'Three robed men standing side by side, the ark resting on the mountains behind them under a rainbow.',name:'noahs-three-sons',shows:'none'},
 {art:lights,kind:'God: show his work, never him',q:'Who made the sky, the sun, the moon, and the stars?',a:'God',ref:'Genesis 1:16',verse:'God made two great lights: the greater light to rule the day and the lesser light to rule the night. And He made the stars as well.',idea:'The sun on one side and the moon among stars on the other, over hills, trees and a shining sea.',name:'sun-moon-and-stars',shows:'god'},
 {art:star5,kind:'An object in the sky: make it the brightest thing',q:'What led them on their journey to the land where Jesus was born?',a:'A star in the sky',ref:'Matthew 2:9',verse:'After they had heard the king, they went on their way, and the star they had seen in the east went ahead of them until it stood over the place where the Child was.',idea:'A great golden star shining over a little hill town, with three travellers walking toward it on the road.',name:'star-over-bethlehem',shows:'none'},
 {art:water,kind:'Jesus: small and far off, no face',q:'After feeding the five thousand, how did Jesus go to his disciples?',a:'By walking on the water',ref:'Matthew 14:25',verse:'During the fourth watch of the night, Jesus went out to them, walking on the sea.',idea:'A small faraway figure walking on the waves in the moonlight toward a boat full of disciples.',name:'jesus-walking-on-water',shows:'jesus'},
 {art:flames,kind:'The Holy Spirit: flames or a dove, never a person',q:'What did the Holy Spirit look like when the disciples received it?',a:'Tongues like flames of fire',ref:'Acts 2:3',verse:'They saw tongues like flames of fire that separated and came to rest on each of them.',idea:'A room of believers with a small flame resting above each head, and the wind blowing through.',name:'flames-at-pentecost',shows:'none'},
 {art:barabbas,kind:'A person: show what the verse says happened to them',q:'Which criminal did the crowd ask Pilate to release instead of Jesus?',a:'Barabbas',ref:'Matthew 27:26',verse:'So Pilate released Barabbas to them. But he had Jesus flogged, and handed Him over to be crucified.',idea:'A man walking free out of an open prison door into the sunshine, a broken chain on the road.',name:'barabbas-set-free',shows:'none'},
 {art:promised,kind:'Something not done: show what was missed',q:'Because Moses and Aaron did not trust Him, what did God say they would not do?',a:'Bring the people into the land',ref:'Numbers 20:12',verse:'But the LORD said to Moses and Aaron, “Because you did not trust Me to show My holiness in the sight of the Israelites, you will not bring this assembly into the land that I have given them.”',idea:'Moses seen from behind on a mountain top, leaning on his staff, looking across the river to a green land.',name:'moses-looking-at-the-land',shows:'none'},
 {art:genesis,kind:'A book of the Bible: the open book, at its story',q:'Which book of the Bible contains the story of Joseph and his robe of many colors?',a:'Genesis',ref:'Genesis 37:3',verse:'Now Israel loved Joseph more than his other sons, because Joseph had been born to him in his old age; so he made him a robe of many colors.',idea:'A large open book on a table, its page showing a robe of many colours, a lamp burning beside it.',name:'book-open-at-josephs-robe',shows:'none'},
 {art:bible,kind:'A belief: one picture from the set of symbols',q:'What book teaches us about God?',a:'The Bible',ref:'2 Timothy 3:16',verse:'All Scripture is God-breathed and is useful for instruction, for conviction, for correction, and for training in righteousness,',idea:'An open Bible resting on a stone in a meadow, light rising from its pages, a path leading to it.',name:'symbol-open-bible',shows:'none'},
 {art:cross,kind:'Jesus as a symbol: the empty cross',q:'Why is the Son of God called Jesus, that is, Saviour?',a:'Because He saves us from all our sins, and salvation is found in Him alone',ref:'Matthew 1:21',verse:'She will give birth to a Son, and you are to give Him the name Jesus, because He will save His people from their sins.',idea:'An empty cross on a hill against the rising sun, with a broken chain lying at the foot of the path.',name:'symbol-cross',shows:'jesus'}
];
})();
