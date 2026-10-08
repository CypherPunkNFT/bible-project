// The eight line drawings, drawn here by hand as inline SVG (no stock images), all in one 320 × 240 scene space.
// Plain strokes take the drawing's line colour; .t is its one tone, .f faint, .ft faint tone; .pf is a page-coloured
// fill with no stroke that hides what lies behind (hills over the sun). Every moving part has a class the CSS loops.
(() => {
  const { svg, tuft, leaf, sheepLying, sheepGrazing, stars, bird, featherEdge, weave } = window.Parts;
  const range = (count, fn) => Array.from({ length: count }, (_, i) => fn(i)).join("");

  const DRAW = {
    // 1 · Still waters: a calm lake below green hills, sheep lying down in the pasture, reeds on the near bank, a dove.
    waters: () => svg("Line drawing: sheep lying down in a pasture beside a still lake below the hills, reeds on the near bank, a dove gliding above", `
      <circle class="f" cx="252" cy="54" r="13"/><path class="f" d="M30 44C50 40 70 40 86 44M190 28C204 25 220 25 232 28"/>
      <path class="f" d="M0 98C30 86 62 82 96 88C124 93 146 86 172 80C204 73 236 78 262 86C286 93 304 92 320 88"/>
      <path d="M0 126C40 114 84 110 124 116C164 122 196 112 236 110C272 108 300 114 320 118"/>
      <path d="M0 150C60 146 120 148 180 147C240 146 290 147 320 149"/>
      ${sheepLying(46, 146, 1.15)}${sheepGrazing(150, 141, .72, "far")}${sheepLying(236, 135, .62)}
      ${tuft(22, 146, .9)}${tuft(118, 146, .7)}${tuft(204, 140, .6)}${tuft(292, 136, .6)}${tuft(184, 128, .5)}
      <g class="t water">
        <path class="ripple" style="--dx:4px" d="M40 160H112M150 160H198M236 160H296"/>
        <path class="ripple" style="--dx:-5px" d="M66 172H180M212 172H284"/>
        <path class="ripple" style="--dx:6px" d="M24 186H92M122 186H252"/>
        <path class="ripple" style="--dx:-7px" d="M74 202H146M206 202H312"/>
        <path class="ripple" style="--dx:8px" d="M108 218H220M248 218H304"/>
        <path class="ripple" style="--dx:-6px" d="M128 232H260"/></g>
      <g class="ft shimmer"><path d="M244 166H260"/><path d="M247 178H257"/><path d="M249 192H255"/></g>
      <path class="f" d="M30 154C70 158 120 158 160 155"/>
      <g class="pad"><path d="M164 192C164 187 176 184 188 186C194 187 196 191 192 194C186 197 168 197 164 192Z"/><path class="f" d="M180 185L178 191"/>
        <path class="t" d="M174 187C172 182 174 179 176 178C178 180 179 183 178 187M178 187C179 182 182 180 185 180C185 183 183 186 180 188"/></g>
      <path d="M0 212C30 206 58 208 78 220C88 226 94 234 96 240"/>
      <g class="reeds"><path d="M30 210C29 192 30 178 34 164"/><path d="M40 211C41 196 44 184 49 174"/><path d="M22 210C19 200 15 193 9 187"/><path d="M50 214C53 204 58 197 64 192"/>
        <path class="ft" d="M34 164C32 159 33 153 36 150C38 154 38 160 34 164Z"/><path class="ft" d="M49 174C48 169 49 164 52 161C53 165 53 171 49 174Z"/></g>
      ${tuft(64, 222, .9)}${tuft(80, 232, .8)}
      <g class="glide"><g transform="translate(84 60)">
        <path class="f wing" d="M8-2C12-12 22-20 34-22C30-15 26-8 18-2"/>
        <path d="M-20 4C-10-2 8-4 18-3C23-2 26-5 29-7C33-9 37-7 37-4L41-2.6L37-1.2C36 3 29 7 18 8C4 9-10 8-20 4Z"/>
        <path d="M-20 4L-33 .5L-33 7.5L-20 6.5"/><circle cx="33.4" cy="-4.4" r=".9" fill="currentColor"/>
        <g class="wing"><path d="M2-2C-2-12 2-24 13-33C13-27 15-23 19-21C17-17 17-13 19-10C15-8 12-5 10-1"/><path class="f" d="M5-6C6-14 9-22 14-28"/></g></g></g>`),

    // 2 · The shepherd of Isaiah 40:11: a robed figure, his head covered and no face, a lamb gathered at his chest.
    shepherd: () => svg("Line drawing: a shepherd with his head covered, carrying a lamb at his chest, his staff in his other hand, sheep grazing nearby", `
      <path class="f" d="M0 140C40 124 80 120 120 128C160 136 200 116 250 114C280 113 302 120 320 124"/>
      <path class="f" d="M180 160C214 152 260 150 320 156"/>
      <g class="cloud f"><path d="M216 44C216 38 224 36 228 40C230 34 240 34 242 40C248 39 252 44 248 48H218C215 48 214 46 216 44Z"/></g>
      <g class="cloud slow f"><path d="M30 60C30 55 37 53 40 56C42 51 50 51 52 56C56 56 58 60 55 62H32C30 62 29 61 30 60Z"/></g>
      <path d="M0 206C80 202 160 208 240 204C270 202 300 204 320 206"/>
      <path class="pf" d="M118 86C110 104 108 124 110 140C106 160 104 182 102 202C120 208 154 208 174 202C172 180 170 156 166 132L168 110L158 85C146 82 130 82 118 86ZM127 58C126 46 134 42 141 43C150 44 154 56 152 64C150 70 146 72 144 70L130 80Z"/>
      <path d="M92 208L102 46"/><path d="M102 46C104 34 92 28 86 36C82 42 86 48 90 46"/>
      <path d="M150 52C148 45 141 42 135 44C129 46 126 52 127 58C127 66 124 76 118 86"/>
      <path d="M150 52C153 55 154 60 152 64C151 67 149 69 146 70"/><path d="M146 49C143 55 142 63 144 70"/><path d="M130 50C136 46 144 46 149 49"/>
      <path d="M144 70C146 77 150 81 158 85"/><path d="M118 86C130 82 146 82 158 85"/>
      <path d="M118 86C110 104 108 124 110 140C106 160 104 182 102 202"/><path d="M166 132C170 156 172 180 174 202"/>
      <path d="M117 102C110 110 105 116 100 120"/><path d="M98 116C101 117 103 121 101 124"/>
      <path d="M102 202C120 208 154 208 174 202"/><path d="M118 206L112 210H122M158 206L166 210H156"/>
      <path d="M110 138C126 144 150 144 166 136"/><path d="M152 142C152 151 154 159 157 165"/>
      <path class="f" d="M124 148C122 168 122 186 124 204M142 148C144 168 146 186 148 205"/>
      <path d="M158 85C150 98 140 112 144 124"/>
      <g class="held">
        <path class="t wool" d="M128 122C120 120 118 110 124 106C122 98 130 92 137 96C140 90 150 89 154 94C159 90 167 93 168 99C174 100 176 108 172 112C174 118 168 124 162 122C154 126 136 127 128 122Z"/>
        <path class="t wool" d="M168 98C169 91 175 87 181 88C186 89 189 94 188 98C187 102 183 104 179 103C176 103 173 103 171 104Z"/>
        <path class="t" d="M176 89C173 85 168 84 165 86C168 88 171 90 174 91"/><circle cx="182.5" cy="94" r=".9" fill="currentColor"/>
        <path class="t" d="M134 124L131 134M142 125L141 135M170 119L173 129M176 115L180 124"/>
        <path d="M144 124C150 130 166 128 180 116"/><path d="M180 116C183 113 184 110 183 107"/></g>
      ${sheepGrazing(214, 203, 1.2, "flock")}${sheepGrazing(270, 204, .8, "flock late")}
      ${tuft(200, 205, .8)}${tuft(306, 205)}${tuft(60, 206, .9)}${tuft(252, 205, .6)}`),

    // 3 · The lamp of Psalm 119:105: a clay oil lamp at the feet, its flame breathing; the stones of the path ahead lit in turn.
    lamp: () => svg("Line drawing: a clay oil lamp burning at night beside a footpath, the stones of the path lit one after another", `
      ${stars([[34, 28], [70, 50, 1.2], [118, 22], [160, 42], [204, 18, 1.2], [234, 46], [300, 70, .9], [20, 84, .9], [140, 70, .8]])}
      <path class="f" d="M282 24A14 14 0 1 0 296 46A11 11 0 0 1 282 24Z"/>
      <path class="f" d="M0 120C40 104 84 102 120 112C150 120 176 108 206 106C246 104 286 114 320 112"/>
      <path class="f" d="M150 130C190 122 250 122 320 132"/>
      <path d="M84 240C110 216 150 206 186 196C220 186 236 170 220 156C206 144 196 134 206 118"/>
      <path d="M150 240C170 224 200 214 230 204C262 192 270 170 248 154C232 142 220 132 212 118"/>
      ${[[124, 228, 12, 4], [172, 212, 10, 3.4], [216, 196, 8.5, 3], [240, 178, 7, 2.6], [234, 162, 5.6, 2.1], [222, 148, 4.4, 1.7], [213, 136, 3.4, 1.3], [209, 126, 2.4, 1]].map(([x, y, rx, ry], i) => `<ellipse class="t stone" style="--i:${i}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join("")}
      ${tuft(78, 232, 1.1)}${tuft(268, 214)}${tuft(196, 228, .8)}${tuft(258, 160, .6)}${tuft(196, 150, .6)}
      <path class="f" d="M10 207C50 205 100 205 150 208"/>
      <g class="ring"><ellipse class="ft" cx="90" cy="206" rx="44" ry="6"/></g><g class="ring late"><ellipse class="ft" cx="90" cy="206" rx="70" ry="11"/></g>
      <path class="pf" d="M52 192C52 182 64 176 80 176C94 176 102 180 108 182L122 180C126 180 127 184 124 186L110 190C106 198 94 204 80 204C64 204 52 200 52 192Z"/>
      <path d="M52 192C52 182 64 176 80 176C94 176 102 180 108 182L122 180C126 180 127 184 124 186L110 190C106 198 94 204 80 204C64 204 52 200 52 192Z"/>
      <ellipse cx="80" cy="181.5" rx="15" ry="3.2"/><circle cx="80" cy="181.5" r="2.4"/>
      <path class="f" d="M56 194C68 199 96 199 108 192"/><path class="f" d="M60 188l2 3M68 186.5l1 3M92 186.5l-1 3M100 188l-2 3"/>
      <path d="M70 203.5C76 206.5 86 206.5 92 203.5"/>
      <path d="M54 187C44 186 41 178 47 174C51 172 56 176 56 181"/>
      <g class="rays ft"><path d="M124 130V124M110 136L106 132M138 136L142 132M102 152H96M146 152H152"/></g>
      <g class="flame"><path class="t" d="M124 178C116 170 117 158 124 144C129 156 135 168 124 178Z"/><path class="t" d="M124 174C121 170 121 164 124 158C126 164 127 170 124 174Z"/></g>`),

    // 4 · Under his wings (Psalm 91:4): a mother bird on her nest in a branch, her wing spread over her young.
    wings: () => {
      const outer = featherEdge([258, 158], [214, 146], [150, 150], 9, -4.6, [150, 108], .3);
      const inner = featherEdge([246, 136], [210, 126], [158, 132], 8, -3.6);
      const coverts = featherEdge([232, 118], [200, 104], [156, 116], 7, -3);
      const bough = [[300, 24, 118], [284, 27, 96], [268, 31, 128], [252, 36, 104], [238, 42, 136], [224, 48, 112], [212, 55, 142], [292, 26, 70], [258, 34, 60], [230, 45, 74]];
      const chick = (x, y, r) => `<circle class="chick t" cx="${x}" cy="${y}" r="${r}"/><path class="t" d="M${x - r + .4} ${y - 1}L${x - r - 4.6} ${y + .6}L${x - r + .6} ${y + 2}"/><circle cx="${x - r * .35}" cy="${y - r * .25}" r=".9" fill="currentColor"/>`;
      return svg("Line drawing: a mother bird sitting on her nest in a branch, one wing spread over her chicks, a leafy bough above", `
      <path d="M320 18C282 22 244 32 206 54"/><path d="M262 33C254 22 244 16 232 14"/>
      ${bough.map(([x, y, a], i) => leaf(x, y, a, a < 90 ? 12 : 16, a < 90 ? 3.6 : 4.4, i % 2 ? "lf" : "lf late")).join("")}
      ${leaf(232, 14, 190, 13, 4, "lf")}${leaf(244, 17, 230, 12, 3.6, "lf late")}${leaf(206, 54, 150, 15, 4.4, "lf")}
      <path d="M0 204C40 198 74 196 104 198"/><path d="M0 212C40 206 74 205 106 206"/>
      <path d="M248 200C276 196 300 188 320 178"/><path d="M250 207C278 204 302 196 320 188"/>
      <path d="M40 200C34 190 24 184 10 182"/><path d="M292 191C298 180 306 172 318 168"/><path d="M70 207C66 216 58 222 46 226"/>
      ${leaf(10, 182, 196, 16, 4.6, "lf")}${leaf(24, 185, 230, 14, 4, "lf late")}${leaf(32, 192, 160, 13, 4, "lf")}
      ${leaf(318, 168, -20, 15, 4.4, "lf late")}${leaf(304, 175, -70, 14, 4, "lf")}${leaf(298, 183, 10, 13, 4, "lf late")}
      ${leaf(46, 226, 150, 14, 4, "lf")}${leaf(58, 220, 100, 12, 3.6, "lf late")}${leaf(274, 197, 60, 13, 4, "lf")}
      <path class="pf" d="M96 172C98 196 132 208 176 208C220 208 254 196 258 172Z"/>
      <path d="M96 172C98 196 132 208 176 208C220 208 254 196 258 172"/><path class="f" d="${weave(177, 174, 204, 78, 52, 3, 12)}"/>
      <path d="M96 172l-9-3M258 172l9-4M110 197l-9 4M244 197l9 4"/>
      <path class="pf" d="M118 166C112 150 112 128 116 118C126 92 160 92 200 100C236 108 258 140 258 166Z"/>
      <path d="M116 90C108 88 101 93 100 100L91 102.5L100 105.5C102 112 108 117 116 118"/><circle cx="106.5" cy="99" r="1.2" fill="currentColor"/>
      <path d="M116 90C126 88 134 94 142 104"/><path d="M116 118C112 130 114 148 124 164"/><path class="f" d="M118 130c3 2 4 6 4 9M120 146c3 2 4 5 4 8"/>
      <g class="chicks">${chick(184, 158, 7)}${chick(204, 159.5, 6.4)}${chick(222, 161, 5.6)}</g>
      <path d="M98 172C130 163 222 163 256 172"/>
      <g class="shelter"><path class="pf" d="M252 152C264 150 276 152 288 158C276 160 264 160 254 158ZM254 146C266 142 280 144 292 150C280 152 266 152 256 152Z"/>
        <path d="M252 152C264 150 276 152 288 158C276 160 264 160 254 158"/><path class="f" d="M254 146C266 142 280 144 292 150C280 152 266 152 256 152"/>
        <path class="pf" d="M142 104C176 88 222 96 246 124C254 134 258 146 258 158Q236 150 214 148Q186 147 150 150Z"/>
        <path d="M142 104C176 88 222 96 246 124C254 134 258 146 258 158"/><path d="${outer.edge}"/><path class="f" d="${outer.shafts}"/>
        <path class="f" d="${inner.edge}"/><path class="f" d="${coverts.edge}"/><path d="M150 150C146 156 140 162 136 166"/></g>`);
    },

    // 5 · Come unto me (Matthew 11:28): Jesus standing in the open doorway of a house at night, arms open, warm light around
    // him falling across the step. Drawn at the owner's wish (2026-10-08): a robed figure, no face; the light is the one focal point.
    door: () => svg("Line drawing: Jesus standing in the open doorway of a small stone house at night, his arms open, warm light around him falling across the step", `
      <defs><radialGradient id="door-glow"><stop offset="0" style="stop-color: var(--c); stop-opacity: .5"/><stop offset=".5" style="stop-color: var(--c); stop-opacity: .16"/><stop offset="1" style="stop-color: var(--c); stop-opacity: 0"/></radialGradient></defs>
      ${stars([[12, 30], [40, 14, 1.2], [70, 40, .9], [96, 20], [124, 8, .8], [150, 34, 1.1], [178, 16], [204, 42, .8], [226, 22, 1.2], [252, 10], [276, 34, 1.1], [300, 18], [314, 52, .9], [262, 66, .8], [52, 56, .8], [188, 58, .7], [236, 80, .8], [300, 86, .9]])}
      <path class="f" d="M234 146C262 140 292 140 320 146"/>
      <path d="M22 76H234"/><path d="M27 69H229"/><path d="M22 76L27 69M234 76L229 69"/>
      <path class="f" d="M44 80v4M64 80v4M84 80v4M172 80v4M192 80v4M212 80v4"/>
      <path d="M33 76V200"/><path d="M223 76V200"/>
      <path class="f" d="M38 108h20M42 150h16M46 180h22M174 112h30M188 150h24M168 184h20M86 92h24M150 92h26"/>
      <path d="M58 138V116C58 110 63 106 69 106C75 106 80 110 80 116V138Z"/><path class="ft" d="M69 109V137M60 122H78"/><path d="M55 139H83"/>
      <g class="glow-door"><ellipse cx="128" cy="150" rx="44" ry="62" fill="url(#door-glow)" stroke="none"/><ellipse cx="128" cy="214" rx="58" ry="16" fill="url(#door-glow)" stroke="none"/></g>
      <path d="M105 200V128C105 114 115 105 128 105C141 105 151 114 151 128V200"/>
      <path d="M151 200L143 195V124C145 118 148 114 151 112"/><path class="f" d="M147 191V122"/>
      <g class="t">
        <circle cx="128" cy="124" r="6.4"/>
        <path d="M122.6 127.6C121 131 119.6 134 117.6 137M133.4 127.6C135 131 136.4 134 138.4 137"/><path d="M117.6 137C121 134.6 124 134 128 134C132 134 135 134.6 138.4 137"/>
        <path d="M118 137C116 156 114 178 112 200"/><path d="M138 137C140 156 142 178 144 200"/><path d="M112 200C120 202 136 202 144 200"/>
        <path class="ft" d="M121 142C126 152 134 162 140 178M124 152C123 170 122 186 122 200M133 154C134 170 135 186 135 200"/>
        <path d="M118 138C112 147 106 154 99 159"/><path d="M121 147C116 153 111 158 104 163"/><path d="M99 159C96.5 160.5 97 164.5 100.5 164.6C102 164.5 103 163.8 104 163"/>
        <path d="M138 138C144 147 150 154 157 159"/><path d="M135 147C140 153 145 158 152 163"/><path d="M157 159C159.5 160.5 159 164.5 155.5 164.6C154 164.5 153 163.8 152 163"/></g>
      <path d="M98 200H158"/><path d="M94 206H162"/>
      <g class="spill"><path class="t" d="M98 206L64 240"/><path class="t" d="M158 206L194 240"/><path class="ft" d="M110 206L96 240M128 206V240M146 206L160 240"/></g>
      ${range(7, (i) => `<circle class="mote" style="--i:${i}" cx="${108 + (i * 9) % 40}" cy="${236 - (i * 5) % 22}" r="1" fill="currentColor"/>`)}
      <path d="M4 200H98M158 200H316"/>
      <path d="M78 200L80 187H94L96 200"/><path d="M87 187C85 179 80 175 74 175M87 187C88 179 92 174 98 173M87 187V177"/>
      <path d="M282 200C285 188 279 178 283 166C285 158 281 150 282 142"/><path d="M290 200C288 188 293 178 290 166C289 158 292 150 291 142"/><path class="f" d="M286 196C287 186 284 176 287 168"/>
      <g class="crown"><path class="pf" d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z"/><path d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z"/><path class="f" d="M266 128l5-3M276 116l5 1M292 110l4 3M302 122l5-2M284 132l5 2M296 134l4-3M272 138l4 1M288 122l-3 4"/><path d="M282 142C278 138 274 136 270 136M291 142C296 138 300 136 304 136"/></g>
      ${tuft(12, 200)}${tuft(24, 201, .7)}${tuft(240, 201, .8)}${tuft(262, 200, .7)}${tuft(170, 201, .7)}`),

    // 6 · The rock higher than I (Psalm 61:2): a lighthouse on a high rock above the sea, its beam sweeping; a boat coming in.
    rock: () => svg("Line drawing: a lighthouse on a high rock above the sea, its beam sweeping slowly, a small boat sailing in", `
      ${stars([[30, 24], [96, 14, 1.2], [150, 34], [292, 22], [312, 72, .9], [60, 50, .8]])}
      <g class="beam"><path class="ft" d="M222 58L34 26M222 58L34 96"/><path class="ft" d="M222 58L40 61" stroke-dasharray="2 7"/></g>
      <path class="pf" d="M150 240L154 222L164 212L168 194L178 184L182 164L192 154L196 134L208 124H244L254 134L258 150L268 160L272 180L286 192L292 210L306 218L320 222V240Z"/>
      <path d="M150 240L154 222L164 212L168 194L178 184L182 164L192 154L196 134L208 124H244L254 134L258 150L268 160L272 180L286 192L292 210L306 218L320 222"/>
      <path class="f" d="M168 194L184 198L196 190M182 164L198 168L206 160M196 134L212 140L222 136M254 134L246 146L250 156M258 150L252 166L262 176M272 180L262 196L274 206M222 186L238 194L234 210M196 212L214 218M232 160L244 168"/>
      ${tuft(212, 124, .7)}${tuft(240, 124, .6)}${tuft(190, 156, .6)}
      <path class="pf" d="M216 124L220 70H232L236 124Z"/><path d="M216 124L220 70M232 70L236 124"/>
      <path class="f" d="M218.4 106H233.6M219.6 90H232.4"/><path d="M223 124V116C223 113 229 113 229 116V124"/><path class="f" d="M225 80h2v5h-2z"/>
      <path d="M214 70H238"/><path d="M216 70V64H236V70"/><path class="f" d="M220 64v6M224 64v6M228 64v6M232 64v6"/>
      <path d="M219 64V52H233V64"/><path class="f" d="M226 52V64"/><path d="M217 52C218 44 234 44 235 52"/><path d="M226 45V40M224 40h4"/>
      <circle class="t lamp-light" cx="226" cy="58" r="1.5"/>
      <g class="t sea"><path class="ripple" style="--dx:-8px" d="M0 214H132M44 214C48 210 52 210 56 213"/><path class="ripple" style="--dx:10px" d="M10 224H148M98 224C102 220 107 220 110 223"/>
        <path class="ripple" style="--dx:-6px" d="M0 234H140M24 234C28 230 32 230 35 233"/><path class="ripple" style="--dx:6px" d="M298 230H320M290 238H320"/></g>
      <path class="t surf" d="M136 212C140 205 148 205 151 211M128 222C134 215 143 215 147 222M134 232C140 226 147 226 150 232"/>
      <g class="boat"><path d="M54 208H96C94 212 90 215 86 216H64C60 215 56 212 54 208Z"/><path d="M76 208V168"/>
        <path d="M77 170C88 180 94 192 96 204H77Z"/><path class="f" d="M75 174C68 184 64 194 62 204H75Z"/></g>
      <g class="gull">${bird(108, 74, 1.1)}${bird(132, 92, .8)}</g>`),

    // 7 · New every morning (Lamentations 3:22–23): the sun rising behind layered hills, mist in the valleys, flowers open.
    morning: () => svg("Line drawing: the sun rising behind layered hills, mist in the valleys, wildflowers open in the foreground", `
      <g class="sunrise"><g class="rays ft">${range(16, (i) => { const a = (i * 22.5) * Math.PI / 180, r1 = 36, r2 = i % 2 ? 46 : 58; return `<path d="M${(160 + Math.cos(a) * r1).toFixed(1)} ${(146 + Math.sin(a) * r1).toFixed(1)}L${(160 + Math.cos(a) * r2).toFixed(1)} ${(146 + Math.sin(a) * r2).toFixed(1)}"/>`; })}</g>
        <circle class="t" cx="160" cy="146" r="28"/></g>
      <g class="birds">${bird(0, 0)}${bird(20, -10, .8)}${bird(14, 10, .7)}</g>
      <path class="pf" d="M0 150C40 132 86 134 126 146C150 153 176 156 200 148C240 134 284 130 320 138V240H0Z"/>
      <path class="f" d="M0 150C40 132 86 134 126 146C150 153 176 156 200 148C240 134 284 130 320 138"/>
      <g class="mist f"><path d="M40 160H120"/><path d="M180 166H290"/></g>
      <path class="pf" d="M0 178C50 160 100 160 150 172C190 182 236 166 280 162C296 161 310 162 320 164V240H0Z"/>
      <path d="M0 178C50 160 100 160 150 172C190 182 236 166 280 162C296 161 310 162 320 164"/>
      ${[[56, 167], [74, 164], [250, 166], [267, 163]].map(([x, y]) => `<path d="M${x} ${y}V${y - 7}"/><path d="M${x - 6} ${y - 10}C${x - 8} ${y - 16} ${x - 2} ${y - 20} ${x + 1} ${y - 17}C${x + 5} ${y - 20} ${x + 9} ${y - 14} ${x + 6} ${y - 10}C${x + 4} ${y - 6} ${x - 4} ${y - 6} ${x - 6} ${y - 10}Z"/>`).join("")}
      <path class="f" d="M20 224C80 214 140 216 190 226M60 236C110 228 150 230 186 238M226 226C250 220 280 218 310 214"/>
      <g class="mist slow f"><path d="M10 190H96"/><path d="M200 192H300"/></g>
      <path class="pf" d="M0 208C70 192 140 196 200 206C240 212 280 206 320 198V240H0Z"/>
      <path d="M0 208C70 192 140 196 200 206C240 212 280 206 320 198"/>
      <path class="f" d="M196 240C200 228 212 220 230 212"/>
      ${[[40, 238, 26, -6], [54, 238, 18, 4], [282, 238, 22, 6], [296, 238, 14, -4]].map(([x, y, h, lean], i) => `<g class="bloom" style="transform-origin:${x}px ${y}px;--i:${i}"><path d="M${x} ${y}C${x} ${y - h / 2} ${x + lean / 2} ${y - h * .8} ${x + lean} ${y - h}"/>
        <circle class="t" cx="${x + lean}" cy="${y - h - 3}" r="2.2"/>${range(5, (k) => { const a = (k * 72 - 90) * Math.PI / 180; return `<circle class="ft" cx="${(x + lean + Math.cos(a) * 5).toFixed(1)}" cy="${(y - h - 3 + Math.sin(a) * 5).toFixed(1)}" r="2.6"/>`; })}</g>`).join("")}
      ${tuft(70, 238)}${tuft(268, 238, .9)}${tuft(120, 214, .6)}`),

    // 8 · Mending (Psalm 147:3): a young plant whose stem broke, tied to a stake with a strip of cloth, growing new leaves.
    sprout: () => svg("Line drawing: a young plant with a bent stem bound with cloth to a stake, new leaves growing above the binding", `
      <circle class="f" cx="250" cy="56" r="13"/><g class="f halo"><path d="M250 34V28M250 84V78M228 56H222M278 56H272M234 40L230 36M266 72L270 76M266 40L270 36M234 72L230 76"/></g>
      <path d="M14 206C80 200 140 202 170 204C220 207 270 202 306 206"/>
      <path d="M126 206C138 197 186 197 198 206"/><path class="f" d="M90 214c3-2 7-2 9 0M220 212c2-2 6-2 8 0M150 216c2-1 5-1 7 0"/>
      ${tuft(40, 205)}${tuft(60, 204, .7)}${tuft(248, 205, .9)}${tuft(272, 204, .7)}${tuft(120, 206, .6)}${tuft(206, 206, .6)}
      <path class="f" d="M100 206C100 198 101 192 103 186"/>${leaf(103, 188, -30, 8, 2.6, "lf ft", false)}${leaf(102, 190, -150, 7, 2.4, "lf late ft", false)}
      <g transform="translate(-56 -72) scale(1.35)">
      <path d="M176 208L176 74"/><path d="M173 77L176 72L179 77"/><path class="f" d="M178 112v16M174 170v14"/>
      <path d="M160 206C160 192 164 176 172 160"/>
      ${leaf(163, 188, 196, 13, 3.8, "lf", true)}${leaf(165, 180, 18, 12, 3.6, "lf late", true)}
      <g class="shoot"><path d="M172 154C172 136 170 118 166 100C164 92 165 86 168 80"/>
        <g class="t">${leaf(171, 136, -24, 20, 5.6, "lf")}${leaf(171, 128, -158, 18, 5.2, "lf late")}${leaf(168, 112, -18, 16, 4.8, "lf late")}${leaf(167, 106, -164, 15, 4.4, "lf")}${leaf(168, 82, -56, 9, 3, "lf")}${leaf(168, 84, -128, 9, 3, "lf late")}</g></g>
      <path class="t" d="M168 160C172 156 180 156 182 159M168 153C172 149 180 149 182 152"/>
      <g class="tails t"><path d="M182 156C187 157 190 160 194 160"/></g>
      <path class="t drop" d="M190 130C188 133 188 136 190 137C192 136 192 133 190 130Z"/></g>`),
  };

  window.ART = DRAW;
})();
