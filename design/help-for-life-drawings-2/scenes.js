// The four round-2 drawings, in the same 320 × 240 scene space and classes as the 24-drawing page
// (../help-for-life-drawings/): .t tone, .f faint, .ft faint tone, .pf a page-coloured fill with no stroke.
(() => {
  const { n, svg, tuft, leaf, stars, bird } = window.Parts;
  const range = (count, fn) => Array.from({ length: count }, (_, i) => fn(i)).join("");
  /** A small round-crowned olive tree standing at (x, y). */
  const olive = (x, y, s = 1, cls = "") => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-7"/><path class="pf" d="M-6-10C-8-16-2-20 1-17C5-20 9-14 6-10C4-6-4-6-6-10Z"/><path d="M-6-10C-8-16-2-20 1-17C5-20 9-14 6-10C4-6-4-6-6-10Z"/></g>`;
  /** A radial glow fill for a focal light, in the colour named. */
  const glow = (id, color, strength = .5) => `<radialGradient id="${id}"><stop offset="0" style="stop-color: ${color}; stop-opacity: ${strength}"/><stop offset=".5" style="stop-color: ${color}; stop-opacity: ${n(strength * .32)}"/><stop offset="1" style="stop-color: ${color}; stop-opacity: 0"/></radialGradient>`;
  // Jesus in the doorway as one solid silhouette: head, hair to the shoulders, open sleeves and hands, the robe to the step.
  const FIGURE = "M122.6 127.6C121 131 119.6 134 117.6 137C112 147 106 154 99 159C96.5 160.5 97 164.5 100.5 164.6C102 164.5 103 163.8 104 163C111 158 116 153 119.6 148.6C117 166 114 184 112 200C120 202 136 202 144 200C142 184 139 166 136.4 148.6C140 153 145 158 152 163C153 163.8 154 164.5 155.5 164.6C159 164.5 159.5 160.5 157 159C150 154 144 147 138.4 137C136.4 134 135 131 133.4 127.6A6.4 6.4 0 1 0 122.6 127.6Z";
  const TREE = `<path class="pf" d="M282 200C285 188 279 178 283 166C285 158 281 150 282 142H291C292 150 289 158 290 166C293 178 288 188 290 200Z"/><path d="M282 200C285 188 279 178 283 166C285 158 281 150 282 142"/><path d="M290 200C288 188 293 178 290 166C289 158 292 150 291 142"/><path class="f" d="M286 196C287 186 284 176 287 168"/>
      <g class="crown"><path class="pf" d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z"/><path d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z"/><path class="f" d="M266 128l5-3M276 116l5 1M292 110l4 3M302 122l5-2M284 132l5 2M296 134l4-3M272 138l4 1M288 122l-3 4"/><path d="M282 142C278 138 274 136 270 136M291 142C296 138 300 136 304 136"/></g>`;

  window.ART = {
    // A · Come unto me (Matthew 11:28): Jesus as a solid, softly lit figure in the open doorway; the door's lines stop at
    // his outline. Low hills either side; the tree stands in front of the house's right side.
    doorSolid: () => svg("Line drawing: Jesus standing as a softly lit figure in the open doorway of a small stone house at night, his arms open, the light falling across the step; a hill behind the house and a tree beside it", `
      <defs>${glow("door-glow-2", "var(--c)", .5)}</defs>
      ${stars([[12, 26], [40, 14, 1.2], [70, 34, .9], [96, 18], [124, 8, .8], [190, 12],  [204, 40, .8], [226, 22, 1.2], [252, 10], [276, 34, 1.1], [300, 18], [314, 52, .9], [262, 66, .8], [236, 80, .8], [300, 86, .9], [190, 50, .7]])}
      <circle class="t" cx="158" cy="36" r="10"/><g class="t sunrays">${range(12, (i) => { const a = i * Math.PI / 6, r2 = i % 2 ? 17 : 20; return `<path d="M${n(158 + Math.cos(a) * 14)} ${n(36 + Math.sin(a) * 14)}L${n(158 + Math.cos(a) * r2)} ${n(36 + Math.sin(a) * r2)}"/>`; })}</g>
      <path class="f" d="M64 164C44 159 22 159 0 164"/>
      <path class="f" d="M256 164C276 159 298 159 320 164"/>
      <g transform="translate(30 0)">
      <path class="pf" d="M22 69H234V200H22Z"/>
      <path d="M22 76H234"/><path d="M27 69H229"/><path d="M22 76L27 69M234 76L229 69"/>
      <path class="f" d="M44 80v4M64 80v4M84 80v4M172 80v4M192 80v4M212 80v4"/>
      <path d="M33 76V200"/><path d="M223 76V200"/>
      <path class="f" d="M38 108h20M42 150h16M46 180h22M174 112h30M188 150h24M168 184h20M86 92h24M150 92h26"/>
      <path d="M58 138V116C58 110 63 106 69 106C75 106 80 110 80 116V138Z"/><path class="ft" d="M69 109V137M60 122H78"/><path d="M55 139H83"/>
      <g class="glow-door"><ellipse cx="128" cy="150" rx="46" ry="64" fill="url(#door-glow-2)" stroke="none"/><ellipse cx="128" cy="214" rx="60" ry="16" fill="url(#door-glow-2)" stroke="none"/></g>
      <path d="M105 200V128C105 114 115 105 128 105C141 105 151 114 151 128V200"/>
      <path d="M151 200L143 195V110.2"/><path class="f" d="M147 191V122"/>
      <g class="spill"><path class="t" d="M105 200L64 240"/><path class="t" d="M151 200L194 240"/><path class="ft" d="M116.5 200L96 240M128 200V240M139.5 200L160 240"/></g>
      <path class="solid" d="${FIGURE}"/>
      <path class="fold" d="M121.4 142C126 151 133 160 139 175M124.6 156C123.8 172 123 186 122.6 199M132.6 158C133.4 172 134 186 134.6 199M117.6 137C121 134.6 124 134 128 134C132 134 135 134.6 138.4 137"/>
      ${range(7, (i) => `<circle class="mote" style="--i:${i}" cx="${108 + (i * 9) % 40}" cy="${236 - (i * 5) % 22}" r="1" fill="currentColor"/>`)}
      <path d="M78 200L80 187H94L96 200"/><path d="M87 187C85 179 80 175 74 175M87 187C88 179 92 174 98 173M87 187V177"/>
      </g>
      <path d="M4 200H135M181 200H316"/>
      ${TREE}
      ${tuft(10, 200)}${tuft(34, 233, .7)}${tuft(22, 239, .8)}${tuft(240, 201, .8)}${tuft(262, 200, .7)}${tuft(170, 201, .7)}${tuft(204, 200, .6)}${tuft(70, 222, .8)}${tuft(90, 231, .7)}${tuft(238, 224, .8)}${tuft(258, 232, .7)}
      ${[[58, 230, 12, -2], [78, 238, 9, 2], [48, 238, 8, 1], [250, 228, 11, 2], [272, 236, 9, -2], [288, 230, 8, 1]].map(([x, y, h, lean], i) => `<g class="bloom" style="transform-origin:${x}px ${y}px;--i:${i}"><path d="M${x} ${y}C${x} ${y - h / 2} ${x + lean / 2} ${y - h * .8} ${x + lean} ${y - h}"/>${range(5, (k) => { const a = (k * 72 - 90) * Math.PI / 180; return `<circle class="${i % 2 ? "violet" : "blue"} petal" cx="${n(x + lean + Math.cos(a) * 2.6)}" cy="${n(y - h - 2 + Math.sin(a) * 2.6)}" r="1.5"/>`; })}<circle class="heart" cx="${x + lean}" cy="${y - h - 2}" r="1"/></g>`).join("")}`),

    // B · New every morning (Lamentations 3:22–23), refined: a yellow sun rising, its beams falling across the hills,
    // the last stars fading, olive trees on the hills, pale blue and violet flowers in thick grass.
    morning: () => svg("Line drawing: a yellow sun rising behind hills dotted with olive trees, its beams falling across them, the last stars fading, pale flowers and grass in front", `
      <defs>${glow("sun-glow-m", "var(--sun)", .55)}</defs>
      <g class="night">${stars([[20, 20], [52, 44, 1.2], [88, 16], [118, 54, .9], [210, 18, 1.1], [244, 50], [276, 24, 1.2], [304, 58, .9], [150, 12, .8], [34, 86, .8], [292, 96, .8]])}</g>
      <g class="sunrise"><circle cx="160" cy="146" r="64" fill="url(#sun-glow-m)" stroke="none" class="sun-glow"/>
        <g class="rays sunline">${range(16, (i) => { const a = (i * 22.5) * Math.PI / 180, r1 = 36, r2 = i % 2 ? 46 : 58; return `<path d="M${n(160 + Math.cos(a) * r1)} ${n(146 + Math.sin(a) * r1)}L${n(160 + Math.cos(a) * r2)} ${n(146 + Math.sin(a) * r2)}"/>`; })}</g>
        <circle class="sun" cx="160" cy="146" r="28"/></g>
      <g class="birds">${bird(0, 0)}${bird(20, -10, .8)}${bird(14, 10, .7)}</g>
      <path class="pf" d="M0 150C40 132 86 134 126 146C150 153 176 156 200 148C240 134 284 130 320 138V240H0Z"/>
      <path class="f" d="M0 150C40 132 86 134 126 146C150 153 176 156 200 148C240 134 284 130 320 138"/>
      ${[[22, 144, .55], [34, 141, .45], [62, 136, .5], [212, 145, .5], [230, 140, .55], [264, 134, .45], [298, 134, .55]].map(([x, y, s]) => olive(x, y, s, "f")).join("")}
      <path class="pf" d="M0 178C50 160 100 160 150 172C190 182 236 166 280 162C296 161 310 162 320 164V240H0Z"/>
      <path d="M0 178C50 160 100 160 150 172C190 182 236 166 280 162C296 161 310 162 320 164"/>
      ${[[18, 173, .8], [38, 168, 1], [52, 167, .7], [84, 164, .9], [118, 166, .75], [226, 171, .8], [244, 168, 1], [256, 166, .7], [290, 162, .9], [310, 163, .7]].map(([x, y, s]) => olive(x, y, s)).join("")}
      <path class="pf" d="M0 208C70 192 140 196 200 206C240 212 280 206 320 198V240H0Z"/>
      <path d="M0 208C70 192 140 196 200 206C240 212 280 206 320 198"/>
      <g class="beams">${range(9, (i) => { const a = (24 + i * 16.5) * Math.PI / 180; return `<path d="M${n(160 + Math.cos(a) * 66)} ${n(146 + Math.sin(a) * 66)}L${n(160 + Math.cos(a) * 190)} ${n(146 + Math.sin(a) * 190)}"/>`; })}</g>
      <path class="f" d="M196 240C200 228 212 220 230 212"/>
      ${[[20, 205], [36, 203], [62, 200], [90, 199], [110, 198], [150, 200], [176, 203], [214, 207], [244, 208], [276, 206], [300, 201], [128, 222, .8], [168, 230, .8], [250, 226, .7], [80, 232, .8], [12, 236]].map(([x, y, s = 1]) => tuft(x, y, s)).join("")}
      ${[[40, 238, 26, -6], [54, 238, 18, 4], [100, 238, 22, 3], [116, 238, 14, -4], [214, 238, 18, -3], [282, 238, 22, 6], [296, 238, 14, -4]].map(([x, y, h, lean], i) => `<g class="bloom" style="transform-origin:${x}px ${y}px;--i:${i}"><path d="M${x} ${y}C${x} ${y - h / 2} ${x + lean / 2} ${y - h * .8} ${x + lean} ${y - h}"/>
        <circle class="${i % 2 ? "violet" : "blue"} heart" cx="${x + lean}" cy="${y - h - 3}" r="2"/>${range(5, (k) => { const a = (k * 72 - 90) * Math.PI / 180; return `<circle class="${i % 2 ? "violet" : "blue"} petal" cx="${n(x + lean + Math.cos(a) * 5)}" cy="${n(y - h - 3 + Math.sin(a) * 5)}" r="2.6"/>`; })}</g>`).join("")}`),

    // C · The well of John 4:14, refined: a plain line sun with turning rays, soft clouds drifting, a flock crossing high up,
    // olive trees on the hills.
    well: () => svg("Line drawing: a stone well with a small roof and a bucket on its rope under the sun and drifting clouds, birds flying high, olive trees on the hills, a clay water jar beside it", `
      <g class="cloud f"><path transform="translate(226 46) scale(1.1)" d="M0 0C0-6 8-8 12-4C14-10 26-10 28-3C34-4 38 2 34 6H2C-2 6-2 2 0 0Z"/></g><g class="cloud slow f"><path transform="translate(268 82) scale(0.8)" d="M0 0C0-6 8-8 12-4C14-10 26-10 28-3C34-4 38 2 34 6H2C-2 6-2 2 0 0Z"/></g><g class="cloud slower f"><path transform="translate(18 96) scale(0.7)" d="M0 0C0-6 8-8 12-4C14-10 26-10 28-3C34-4 38 2 34 6H2C-2 6-2 2 0 0Z"/></g>
      <g class="flock">${bird(0, 0)}${bird(18, -6, .8)}${bird(12, 6, .7)}</g>
      <g class="rays sunline">${range(12, (i) => { const a = i * Math.PI / 6; return `<path d="M${n(56 + Math.cos(a) * 18)} ${n(46 + Math.sin(a) * 18)}L${n(56 + Math.cos(a) * (i % 2 ? 24 : 28))} ${n(46 + Math.sin(a) * (i % 2 ? 24 : 28))}"/>`; })}</g>
      <circle class="sun" cx="56" cy="46" r="12"/>
      <path class="f" d="M0 150C40 136 80 132 120 140M200 138C240 130 280 132 320 142"/>
      ${[[18, 145], [40, 139], [64, 136], [86, 136], [222, 134], [246, 131], [268, 131], [300, 137]].map(([x, y], i) => olive(x, y, i % 3 === 1 ? .8 : 1, "f")).join("")}
      <path d="M10 198C80 194 240 194 310 198"/>
      <path d="M98 64L150 38L202 64"/><path class="f" d="M108 59L150 44L192 59"/>
      <path d="M112 142V62M188 142V62"/>
      <rect x="116" y="74" width="68" height="6" rx="3"/><path d="M184 77H194V88"/><path class="f" d="M132 74v6M150 74v6M168 74v6"/>
      <g class="swing"><path d="M150 80V114"/><path class="pf" d="M140 114H160L157 130H143Z"/><path d="M140 114H160L157 130H143Z"/><path class="f" d="M141 119H159"/>
        <path d="M140 114C140 106 160 106 160 114"/></g>
      <path class="pf" d="M104 142V192C114 200 186 200 196 192V142Z"/><path d="M104 142V192C114 200 186 200 196 192V142"/>
      <ellipse cx="150" cy="142" rx="46" ry="10"/><ellipse class="ft" cx="150" cy="143.5" rx="36" ry="6.4"/>
      <g class="ring"><ellipse class="ft" cx="150" cy="143.5" rx="8" ry="1.6"/></g>
      <path class="t drop" d="M150 132C148.6 134.4 148.6 136.4 150 137.2C151.4 136.4 151.4 134.4 150 132Z"/>
      <path class="f" d="M104 158C120 164 180 164 196 158M104 176C120 182 180 182 196 176M120 152v8M146 154v9M172 153v9M132 166v10M160 167v10M186 165v9M118 181v10M150 183v10M178 182v10"/>
      <path class="pf" d="M232 196C224 186 224 170 232 162C229 159 230 154 234 153H246C250 154 251 159 248 162C256 170 256 186 248 196Z"/>
      <path d="M232 196C224 186 224 170 232 162C229 159 230 154 234 153H246C250 154 251 159 248 162C256 170 256 186 248 196Z"/>
      <path d="M233 163C226 161 225 170 229 173M247 163C254 161 255 170 251 173"/><path class="f" d="M227 178C236 182 244 182 253 178M234 157H246"/>
      ${tuft(40, 198)}${tuft(58, 197, .7)}${tuft(214, 197, .7)}${tuft(276, 198)}${tuft(292, 197, .6)}${tuft(80, 196, .6)}`),

    // D · The Door as first drawn (Matthew 11:28), copied unchanged from design/help-for-life-drawings/art.js at commit 8599a7cc.
    doorOriginal: () => svg("Line drawing: a small stone house at dusk with its door standing open and light falling out across the step", `
      ${stars([[30, 34], [62, 18, 1.2], [276, 26], [306, 56, .9], [244, 12], [126, 30, .8], [194, 22, .8]])}
      <path class="f" d="M0 150C24 142 46 142 76 148M244 146C270 140 296 140 320 146"/>
      <path d="M66 92H254"/><path d="M70 86H250"/><path d="M66 92L70 86M254 92L250 86"/>
      <path class="f" d="M86 96v4M104 96v4M122 96v4M198 96v4M216 96v4M234 96v4"/>
      <path d="M76 92V200"/><path d="M244 92V200"/>
      <path class="f" d="M80 122h18M84 156h14M90 182h18M206 128h26M214 160h22M200 186h16M126 106h20M176 106h22"/>
      <path d="M98 142V124C98 118 102 114 108 114C114 114 118 118 118 124V142Z"/><path class="ft lit" d="M108 117V140M100 128H116"/><path d="M95 143H121"/>
      <path class="ft lit" d="M144 200V137C144 128 151 121 160 121C169 121 176 128 176 137V200"/>
      <path d="M140 200V136C140 124 149 116 160 116C171 116 180 124 180 136V200"/>
      <path d="M180 200L172 195V132C174 127 177 124 180 122"/><path class="f" d="M176 192V130"/>
      <path d="M134 200H186"/><path d="M130 206H190"/>
      <path d="M190 128H196V132"/><path d="M192 132H200L199 142H193Z"/><path class="t lit" d="M196 140C194.6 138.6 195 136.6 196 135C197 136.6 197.4 138.6 196 140Z"/>
      <g class="spill"><path class="t" d="M136 206L100 240"/><path class="t" d="M184 206L226 240"/><path class="ft" d="M148 206L134 240M160 206V240M172 206L188 240"/></g>
      ${range(7, (i) => `<circle class="mote" style="--i:${i}" cx="${144 + (i * 9) % 34}" cy="${236 - (i * 5) % 22}" r="1" fill="currentColor"/>`)}
      <path d="M8 200H130M190 200H312"/>
      <path d="M116 200L118 188H132L134 200"/><path d="M125 188C123 180 118 176 112 176M125 188C126 180 130 175 136 174M125 188V178"/>
      <path d="M282 200C285 188 279 178 283 166C285 158 281 150 282 142"/><path d="M290 200C288 188 293 178 290 166C289 158 292 150 291 142"/><path class="f" d="M286 196C287 186 284 176 287 168"/>
      <g class="crown"><path class="pf" d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z"/><path d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z"/><path class="f" d="M266 128l5-3M276 116l5 1M292 110l4 3M302 122l5-2M284 132l5 2M296 134l4-3M272 138l4 1M288 122l-3 4"/><path d="M282 142C278 138 274 136 270 136M291 142C296 138 300 136 304 136"/></g>
      ${tuft(34, 200)}${tuft(50, 201, .7)}${tuft(232, 201, .8)}${tuft(262, 200, .7)}`),
  };
})();
