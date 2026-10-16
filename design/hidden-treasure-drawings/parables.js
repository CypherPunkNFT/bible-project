// Reworked in the reference's own 320 x 240 drawing system. The mustard
// drawing is reused directly; the shepherd is adapted from the same source.
(() => {
 const {svg,tuft,leaf,bird}=Parts;
 const wheat=(x,y,h,lean)=>{
  const tx=x+lean,ty=y-h;
  return `<g class="grass"><path d="M${x} ${y}Q${x-2} ${y-h*.55} ${tx} ${ty}"/><path class="f" d="M${x} ${y-12}q-8-5-10-14"/><g class="t">${Array.from({length:5},(_,i)=>leaf(tx,ty-i*3,-55,5,1.6,'',false)+leaf(tx,ty-i*3,-125,5,1.6,'',false)).join('')}<path d="M${tx} ${ty-13}v-6"/></g></g>`;
 };
 const sower=svg('A robed sower walking through a terraced field, casting seed from a shoulder bag',`
 <path class="f" d="M0 118C40 100 66 107 102 109C148 110 171 89 210 93C260 97 277 114 320 105M0 130C47 113 77 121 98 123M213 107C252 106 280 124 320 117"/>
 <path class="ft" d="M221 96A19 19 0 0 1 256 96"/>
 <g class="f">${Array.from({length:7},(_,i)=>`<path d="M${170+i*25} 239C${148+i*20} 206 ${164+i*13} 163 ${189+i*8} 130"/>`).join('')}</g>
 <path class="f" d="M0 177Q43 155 84 159M7 195Q39 182 66 181M26 216l11-3M177 168l5-1M207 186l7-2M234 217l10-3M297 182l6 2"/>
 <g class="cloud f">${bird(254,54,.65)}${bird(272,45,.55)}${bird(288,58,.45)}</g>
 <path class="pf" d="M101 69C96 57 101 45 110 44C122 41 130 51 128 63L123 77L133 87L132 115L143 181L131 192L118 190L108 201L95 196L92 185L73 184L82 129L78 99C80 83 89 78 101 69Z"/>
 <path d="M101 69C96 57 101 45 110 44C122 41 130 51 128 63M128 63C127 70 124 74 120 74M110 47C106 55 108 65 113 70M120 74L126 82M101 69L94 80M100 53C103 48 111 46 119 49M113 70L108 79"/>
 <path d="M94 80C85 82 79 89 78 99L82 129L73 184C91 191 120 191 143 181L132 115M126 82L140 103L165 109L163 119L135 114L120 98M165 109L176 109C182 106 187 106 187 109L181 113L187 114C190 116 185 119 180 118L173 116L163 119M82 102L70 126L78 140L89 133L80 126L91 111"/>
 <path d="M90 185L92 199L105 201L112 198L106 193L107 188M126 187L134 199L149 204C153 203 153 200 148 198L142 193L137 183"/>
 <path class="f" d="M96 130C95 149 88 170 87 185M111 142L107 180M122 134L131 178M95 92L87 109M117 52L125 57M99 193l5 2M135 196l9 4"/>
 <path d="M96 82C106 97 108 112 115 127M101 80C113 99 115 113 120 125"/>
 <path class="pf" d="M104 119C113 115 129 118 137 122L136 144C126 154 111 151 104 143Z"/><path d="M104 119C113 115 129 118 137 122L136 144C126 154 111 151 104 143ZM104 124Q120 130 137 126"/>
 <path class="f" d="M110 133v8M114 145q9 4 16-1"/>
 <g class="t seed-fall">${[[186,124],[197,137],[183,145],[209,158],[195,172],[227,184],[214,199]].map(([x,y])=>`<path d="M${x} ${y}q-2 2 0 4q3-1 0-4Z"/>`).join('')}</g>
 ${wheat(14,238,44,5)}${wheat(25,240,53,-3)}${wheat(38,240,38,6)}${wheat(288,240,48,-5)}${wheat(300,240,57,4)}${wheat(312,240,40,3)}${tuft(65,216,.75)}${tuft(167,228,.6)}${tuft(249,234,.65)}
 `);
 const mustard=ART.mustard().replace('<g class="incoming">','<g class="incoming" transform="translate(270 54)">');
 const reference=new DOMParser().parseFromString(ART.shepherd(),'image/svg+xml');
 reference.querySelector('.held')?.remove();
 reference.querySelectorAll('.flock').forEach(node=>node.remove());
 const recovered=svg('A shepherd carrying the found sheep home',`
 ${reference.documentElement.innerHTML}
 <path class="pf" d="M115 86Q137 70 160 84L169 131L153 145L117 139L105 117Z"/>
 <path d="M118 86C113 101 108 113 111 127C116 134 124 130 127 122L131 107M159 86L168 111C172 121 168 130 161 131L153 112M119 136Q141 143 165 135"/>
 <g transform="translate(117 106)"><path class="wool t" d="M-8-4C-14-8-12-15-6-17C-8-25-2-30 5-28C9-35 18-35 23-29C29-34 36-30 37-25C44-28 50-22 47-16C53-12 49-5 43-4C33 1 5 2-8-4Z"/><path class="wool t" d="M44-22C47-29 56-30 61-24C65-19 63-8 59-6C53-4 49-10 47-15Z"/><path class="t" d="M49-25Q43-32 40-27Q41-22 48-21M59-24q8-5 11 0q-5 5-10 4M-3-2L-1 16Q1 21 5 17L7-1M29 0L32 17Q35 21 38 17L38-2"/><circle cx="58" cy="-17" r=".7" fill="var(--c)" stroke="none"/><path class="ft" d="M1-19q4-5 8-1M16-24q5-4 8 1M29-15q4-4 8 0"/></g>
 <path d="M187 240C198 223 250 220 266 205C280 191 260 183 247 177C232 170 238 163 248 159M239 240C251 229 285 226 292 210C302 189 281 178 266 173C255 168 253 163 252 159"/>
 ${tuft(222,219,.7)}${tuft(303,218,.8)}
 `);
 const pearl=svg('A merchant examining a small pearl on folded cloth, with coins and a balance nearby',`
 <path class="f" d="M24 158V48C24 34 35 24 49 24H101C115 24 126 34 126 48V121M31 154V49C31 38 39 31 50 31H100C111 31 119 39 119 49V120M32 65h86M50 32v119M100 32v57M51 93h48"/>
 <path class="pf" d="M175 62C166 50 173 36 184 35C198 34 207 47 200 60L191 76L213 94L231 136L207 157L171 144L150 141L149 98L161 80Z"/>
 <path d="M175 62C166 50 173 36 184 35C198 34 207 47 200 60C198 68 193 73 189 70M181 38C177 48 181 60 188 65M189 70L191 76M175 62L169 77M174 45Q187 39 198 49M169 77C156 82 150 89 149 98L145 139M191 76L213 94L231 136L219 147M166 91L166 116L186 132L180 144L151 130L149 114M201 91L210 119L202 136"/>
 <path class="f" d="M181 80L193 96M173 97l3 18M216 142l-11 4M160 84l-5 11"/>
 <path class="paper" d="M17 174L130 137L308 169L201 213Z"/><path d="M17 174L130 137L308 169L201 213ZM17 174v8l184 41l107-44v-10M201 213v10M31 185v48M287 188v45"/>
 <path class="f" d="M34 173L129 145M58 181l56-18M242 187l44-17M208 215l85-34M47 184l137 30"/>
 <path class="paper" d="M109 166L173 149L237 170L184 192L113 178Z"/><path d="M109 166L173 149L237 170L184 192L113 178ZM109 166L179 183L237 170M179 183L184 192"/>
 <path class="f" d="M124 164L172 153M132 167l28-7M190 187l33-13M116 173l52 13"/>
 <path class="paper" d="M186 132L198 139L202 145L195 149L188 146L181 144Z"/><path d="M186 132L198 139L202 145L195 149L188 146L181 144M194 141l4 4"/>
 <circle class="t paper" cx="178" cy="169" r="7"/><path class="ft glint" d="M174 168q1-3 4-3"/><path class="ft" d="M169 176q9 3 18-1"/>
 <g transform="translate(65 151)"><path d="M0 0v-50M-10 2Q0-3 10 2M-27-39L27-43M-21-40L-32-17M-21-40L-11-17M21-43L10-20M21-43L31-20"/><path class="paper" d="M-34-17Q-21-3-9-17ZM8-20Q21-6 33-20Z"/><circle class="t" cy="-41" r="2"/></g>
 <g class="t"><ellipse cx="246" cy="172" rx="6" ry="2.2"/><path d="M240 172v3c1 3 11 3 12 0v-3"/><ellipse cx="262" cy="166" rx="5" ry="2"/><ellipse cx="256" cy="178" rx="5" ry="2"/></g>
 `);
 window.PARABLE_ART=[sower,mustard,recovered,pearl];
})();
