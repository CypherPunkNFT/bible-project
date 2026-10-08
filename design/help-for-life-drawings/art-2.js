// Drawings 9–16, in the same 320 × 240 scene space and classes as art.js (.t tone, .f faint, .ft faint tone, .pf
// page-coloured fill). Added to window.ART.
(() => {
  const { n, svg, tuft, leaf, stars, bird, featherEdge, weave } = window.Parts;
  const range = (count, fn) => Array.from({ length: count }, (_, i) => fn(i)).join("");
  /** A fish lying or swimming, its mouth at (x, y), tail to the right. */
  const fish = (x, y, a = 0, s = 1, cls = "") => `<g class="${cls}" transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
      <path class="pf" d="M0 0C8-7 26-8 36-2C38-1 38 1 36 2C26 8 8 7 0 0ZM36 0L46-6C44-2 44 2 46 6Z"/>
      <path d="M0 0C8-7 26-8 36-2C38-1 38 1 36 2C26 8 8 7 0 0Z"/><path d="M36 0L46-6C44-2 44 2 46 6Z"/>
      <circle cx="7" cy="-1" r="1" fill="currentColor"/><path class="f" d="M12-5C14-2 14 2 12 5M19-6L24-10L27-5M20 6L24 9L26 5"/></g>`;
  /** A round loaf, its base centred at (cx, base). */
  const loaf = (cx, base, w, h) => `<path class="pf" d="M${cx - w} ${base}C${cx - w} ${n(base - h * 1.3)} ${cx + w} ${n(base - h * 1.3)} ${cx + w} ${base}Z"/>
      <path d="M${cx - w} ${base}C${cx - w} ${n(base - h * 1.3)} ${cx + w} ${n(base - h * 1.3)} ${cx + w} ${base}"/>
      <path class="f" d="M${n(cx - w * .5)} ${n(base - h * .55)}C${n(cx - w * .2)} ${n(base - h * .8)} ${n(cx + w * .15)} ${n(base - h * .85)} ${n(cx + w * .4)} ${n(base - h * .72)}M${n(cx - w * .6)} ${n(base - h * .22)}C${n(cx - w * .2)} ${n(base - h * .48)} ${n(cx + w * .25)} ${n(base - h * .52)} ${n(cx + w * .6)} ${n(base - h * .36)}"/>`;
  /** A lobed vine leaf hanging down from its stalk at (x, y), turned by a degrees (0 hangs straight down). */
  const vineLeaf = (x, y, a, s = 1, cls = "lf") => `<g class="${cls}" style="transform-origin:${x}px ${y}px"><g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
      <path class="pf" d="M0 2C-5-1-12 2-12 8C-12 11-10 13-8 14C-9 18-6 21-3 21C-2 23-1 24 0 25C1 24 2 23 3 21C6 21 9 18 8 14C10 13 12 11 12 8C12 2 5-1 0 2Z"/><path d="M0 2C-5-1-12 2-12 8C-12 11-10 13-8 14C-9 18-6 21-3 21C-2 23-1 24 0 25C1 24 2 23 3 21C6 21 9 18 8 14C10 13 12 11 12 8C12 2 5-1 0 2Z"/>
      <path class="f" d="M0 2V21M0 9L-7 7M0 9L7 7M0 15L-5 16M0 15L5 16"/></g></g>`;
  /** A hanging bunch of grapes from (x, y). */
  const grapes = (x, y, cls = "bunch") => `<g class="${cls}" style="transform-origin:${x}px ${y}px"><path d="M${x} ${y}V${y + 6}"/>${[4, 3, 3, 2, 1].map((count, row) => range(count, (i) => `<circle class="t chick" cx="${n(x + (i - (count - 1) / 2) * 5.2)}" cy="${n(y + 9 + row * 4.6)}" r="2.6"/>`)).join("")}</g>`;
  const fan = (cx, cy, r1, r2, from, to, count) => range(count, (i) => { const a = (from + (to - from) * i / (count - 1)) * Math.PI / 180; return `<path d="M${n(cx + Math.cos(a) * r1)} ${n(cy + Math.sin(a) * r1)}L${n(cx + Math.cos(a) * r2)} ${n(cy + Math.sin(a) * r2)}"/>`; });

  Object.assign(window.ART, {
    // 9 · Peace, be still (Mark 4:39): an empty fishing boat resting on a calm sea under the moon.
    calm: () => svg("Line drawing: an empty fishing boat resting on a calm sea at night, its sail furled, the moon on the water", `
      ${stars([[30, 30], [64, 18, 1.2], [110, 40], [180, 22], [300, 34], [206, 46, .8], [20, 70, .8], [140, 16, .9]])}
      <circle class="ft" cx="252" cy="52" r="14"/>
      <path class="f" d="M0 126C30 118 60 116 90 120C120 124 150 114 186 112C220 110 260 118 320 116"/><path class="f" d="M0 132H320"/>
      <g class="t water">
        <path class="ripple" style="--dx:5px" d="M20 142H120M160 142H232M270 142H312"/><path class="ripple" style="--dx:-6px" d="M0 154H70M100 154H210M240 154H300"/>
        <path class="ripple" style="--dx:6px" d="M30 168H150M180 168H290"/><path class="ripple" style="--dx:-7px" d="M0 184H90M120 184H230M262 184H320"/>
        <path class="ripple" style="--dx:7px" d="M40 200H170M200 200H300"/><path class="ripple" style="--dx:-8px" d="M10 216H120M150 216H262"/>
        <path class="ripple" style="--dx:8px" d="M60 230H220M250 230H318"/></g>
      <g class="ft shimmer"><path d="M244 146H260M246 158H258M242 196H262M248 208H256"/></g>
      <g class="f"><path d="M112 186C134 192 186 192 208 186M126 196C146 200 174 200 194 196"/></g>
      <g class="rocking">
        <path class="pf" d="M88 142L94 150C120 158 200 158 228 148L234 138C232 150 224 162 212 170C190 178 130 178 108 170C98 164 92 154 88 142Z"/>
        <path d="M88 142L94 150C120 158 200 158 228 148L234 138C232 150 224 162 212 170C190 178 130 178 108 170C98 164 92 154 88 142Z"/>
        <path class="f" d="M98 160C128 168 192 168 222 156M106 168C132 174 188 174 214 164"/>
        <path d="M160 154V84"/><path d="M122 104L202 88"/><path d="M128 103C140 98 150 102 162 96C176 93 186 94 196 89"/><path class="f" d="M138 101l2 4M154 98l2 4M172 94l2 4M186 91l2 4"/>
        <path class="f" d="M160 86L228 146M160 86L94 148"/>
        <path class="f" d="M120 155L123 167M128 156L130 168M136 157L137 169M144 157L144 169M120 160C128 162 138 163 146 162M121 165C129 167 139 168 146 167"/></g>`),

    // 10 · The well of John 4:14: a stone well with its roof and windlass, the bucket swaying, drops falling, a water jar.
    well: () => svg("Line drawing: a stone well with a small roof and a bucket on its rope, drops falling into the water, a clay water jar beside it", `
      <circle class="f" cx="56" cy="46" r="12"/>
      <path class="f" d="M0 150C40 136 80 132 120 140M200 138C240 130 280 132 320 142"/>
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
      ${tuft(40, 198)}${tuft(58, 197, .7)}${tuft(214, 197, .7)}${tuft(276, 198)}${tuft(292, 197, .6)}`),

    // 11 · The loaves and fishes (John 6:11): five loaves in a woven basket, two fish across its rim, warmth rising.
    loaves: () => svg("Line drawing: five round loaves in a woven basket on the grass, two fish lying across its rim, warmth rising from the bread", `
      <path class="f" d="M0 116C40 104 90 100 140 108C190 116 240 102 320 106"/>
      <path class="f" d="M30 136C70 130 110 130 140 134M200 132C240 128 280 128 310 132"/>
      <path d="M8 202C80 198 240 198 312 202"/>
      <g class="steam ft"><path style="--i:0" d="M136 100C132 94 140 88 136 82C132 76 140 70 136 64"/><path style="--i:1" d="M160 94C156 88 164 82 160 76C156 70 164 64 160 58"/><path style="--i:2" d="M186 100C182 94 190 88 186 82C182 76 190 70 186 64"/></g>
      <path d="M88 132C90 120 130 118 160 118C190 118 230 120 232 132"/>
      ${loaf(122, 134, 20, 16)}${loaf(198, 134, 20, 16)}${loaf(160, 132, 22, 19)}${loaf(140, 141, 19, 14)}${loaf(181, 141, 19, 14)}
      <path class="pf" d="M88 132C90 172 120 198 160 198C200 198 230 172 232 132C230 146 190 148 160 148C130 148 90 146 88 132Z"/>
      <path d="M88 132C90 172 120 198 160 198C200 198 230 172 232 132"/><path d="M88 132C90 146 130 148 160 148C190 148 230 146 232 132"/>
      <path class="f" d="M92 140C104 152 216 152 228 140"/><path class="f" d="${weave(160, 154, 192, 68, 38, 3, 11)}"/>
      <g class="t">${fish(98, 150, -10, .95)}${fish(156, 158, 8, .95)}</g>
      ${tuft(50, 202)}${tuft(66, 201, .7)}${tuft(248, 201, .8)}${tuft(270, 202)}${tuft(30, 203, .6)}${tuft(292, 202, .6)}`),

    // 12 · An anchor of the soul (Hebrews 6:19): an anchor resting on the sea floor, light from above, fish passing, weed swaying.
    anchor: () => svg("Line drawing: an anchor resting on the sea floor, its rope rising to the surface, light falling through the water, small fish passing", `
      <path class="t surface ripple" style="--dx:-10px" d="M-20 34C0 30 20 38 40 34S80 30 100 34S140 38 160 34S200 30 220 34S260 38 280 34S320 30 340 34"/>
      <g class="rays"><path class="ft" d="M70 38L40 196M120 38L108 176M206 38L232 186M262 38L300 168" stroke-dasharray="1 0" opacity=".3"/></g>
      <path d="M0 210C40 202 80 206 120 208C170 210 220 200 260 204C290 206 310 208 320 206"/>
      <path class="f" d="M30 220C50 216 70 216 90 220M190 222C214 218 238 218 262 222M110 230C130 227 150 227 170 230"/>
      <path class="f" d="M84 206c3-2 7-2 9 0M226 203c3-2 6-2 8 0M248 206c2-1 5-1 7 0"/>
      ${[[40, 208, 0], [54, 210, 1], [270, 204, 2], [286, 206, 3]].map(([x, y, i]) => `<path class="t weed" style="transform-origin:${x}px ${y}px;--i:${i}" d="M${x} ${y}C${x - 6} ${y - 18} ${x + 6} ${y - 32} ${x - 2} ${y - 50}C${x - 8} ${y - 64} ${x + 2} ${y - 76} ${x - 2} ${y - 90 + i * 12}"/>`).join("")}
      <path class="rope" d="M138 74C134 62 138 48 130 34"/>
      <g transform="rotate(-10 160 196)">
        <circle cx="160" cy="80" r="8"/><path d="M156.5 88V186M163.5 88V186"/>
        <path d="M132 101H188M132 107H188M132 101C129 101 129 107 132 107M188 101C191 101 191 107 188 107"/>
        <path d="M114 160C116 188 140 198 160 198C180 198 204 188 206 160"/><path d="M122 162C126 182 144 190 160 190C176 190 194 182 198 162"/>
        <path d="M108 160L118 148L126 162Z"/><path d="M212 160L202 148L194 162Z"/></g>
      <g class="swim"><g class="t">${fish(0, 116, 180, .6)}${fish(26, 134, 180, .46)}</g></g>
      <g class="swim late"><g class="t">${fish(0, 156, 180, .5)}</g></g>
      ${range(5, (i) => `<circle class="ft bubble" style="--i:${i}" cx="${[214, 220, 210, 224, 216][i]}" cy="200" r="${[1.6, 1.2, 2, 1, 1.4][i]}"/>`)}`),

    // 13 · The vine (John 15:5): an old vine on a trellis, its branches along the wires, leaves and hanging grapes.
    vine: () => svg("Line drawing: an old grapevine on a trellis, its branches running along the wires, with leaves and hanging bunches of grapes", `
      <circle class="f" cx="266" cy="38" r="11"/>
      <path d="M30 206V64M290 206V64"/><path class="f" d="M30 76H290M30 126H290"/>
      <path d="M8 206C80 202 240 202 312 206"/>
      <path d="M150 206C146 188 156 172 152 154C150 142 156 132 160 124"/><path d="M166 206C170 188 160 172 166 154C168 142 162 132 160 124"/>
      <path class="f" d="M154 196C158 188 160 180 158 170M160 160C162 150 160 142 162 134"/>
      <path d="M160 124C140 112 110 100 80 90C60 84 44 78 30 76"/><path d="M160 124C180 110 210 98 240 88C260 82 276 78 290 76"/>
      <path d="M156 152C130 142 100 134 60 130C48 129 38 128 30 128"/><path d="M164 150C190 142 230 134 270 130C278 129 284 128 290 128"/>
      <path class="f tendril" d="M100 96c-3-6 2-10 6-8c3 2 1 6-2 5M226 92c3-6-2-10-6-8c-3 2-1 6 2 5M90 134c-2-6 3-9 6-7c2 2 0 5-2 4M244 132c2-6-3-9-6-7c-2 2 0 5 2 4"/>
      ${grapes(110, 100)}${grapes(214, 98, "bunch late")}${grapes(126, 140, "bunch late")}${grapes(236, 134)}${grapes(70, 132)}
      ${[[60, 84, -14], [88, 92, 12], [134, 110, 22], [188, 110, -22], [256, 82, -6], [278, 78, 16], [42, 80, 24], [230, 90, 8]].map(([x, y, a], i) => vineLeaf(x, y, a, 1.05, i % 2 ? "lf" : "lf late")).join("")}
      ${[[48, 128, -4], [100, 134, 14], [146, 146, 28], [178, 146, -26], [212, 138, -8], [262, 130, 10]].map(([x, y, a], i) => vineLeaf(x, y, a, .95, i % 2 ? "lf late" : "lf")).join("")}
      ${tuft(64, 206)}${tuft(84, 205, .7)}${tuft(232, 205, .8)}${tuft(254, 206)}`),

    // 14 · The valley (Psalm 23:4): a walker with a staff on a path through a steep valley, toward the light at its end.
    valley: () => svg("Line drawing: a small figure with a staff walking a path through a steep valley toward the light at its far end", `
      <g class="dawn"><g class="ft">${fan(176, 112, 14, 30, 200, 340, 7)}</g><circle class="t" cx="176" cy="112" r="9"/></g>
      <path class="pf" d="M150 112C160 108 168 106 176 106C186 106 194 108 204 112V124H150Z"/>
      <path class="f" d="M150 112C160 108 168 106 176 106C186 106 194 108 204 112"/>
      <path class="pf" d="M0 22L24 34L40 30L62 52L84 58L104 78L126 84L150 102L170 114L170 122C152 128 130 140 110 152C80 170 40 186 0 196Z"/>
      <path d="M0 22L24 34L40 30L62 52L84 58L104 78L126 84L150 102L170 114"/><path d="M0 196C40 186 80 170 110 152C130 140 152 128 170 122"/>
      <path class="pf" d="M320 30L298 40L282 36L262 58L244 62L226 82L208 88L192 104L184 114L186 122C194 132 206 146 222 158C246 176 282 194 320 206Z"/>
      <path d="M320 30L298 40L282 36L262 58L244 62L226 82L208 88L192 104L184 114"/><path d="M320 206C282 194 246 176 222 158C206 146 194 132 186 122"/>
      <path class="f" d="M8 60L28 102M22 76L46 124M42 96L66 140M62 112L88 154M84 124L108 160M104 134L124 148M24 44L40 62M60 66L72 84M96 92L110 104"/>
      <path class="f" d="M300 52L284 72L292 88M262 72L250 90L262 104M238 92L226 108M214 104L206 118M300 120L280 140L296 160M266 132L250 148"/>
      <path d="M128 240C142 220 170 206 168 188C166 172 150 160 160 146C168 136 174 128 176 122"/><path d="M210 240C204 222 196 208 194 190C192 174 180 162 184 148C186 138 182 128 180 122"/>
      <g class="ft"><path d="M178 126L176 150M180 160L184 186M190 200L196 228"/></g>
      <g class="mist f"><path d="M60 196H130M200 190H280"/></g><g class="mist slow f"><path d="M20 222H110M226 220H316"/></g>
      <circle cx="181" cy="176" r="2.8"/><path class="pf" d="M181 179C177 182 175 190 174 198H188C187 190 185 182 181 179Z"/><path d="M181 179C177 182 175 190 174 198H188C187 190 185 182 181 179Z"/><path d="M189 175L186.5 199"/>
      <g class="gull">${bird(120, 60, .9)}</g>`),

    // 15 · The olive leaf (Genesis 8:11): the dove coming home in the evening with an olive leaf, the waters going down.
    olive: () => {
      const trailing = featherEdge([152, 24], [124, 70], [140, 104], 8, 4, [178, 96], .3);
      const coverts = featherEdge([166, 50], [146, 78], [156, 100], 5, 3);
      return svg("Line drawing: a dove flying in the evening with an olive leaf in its beak, above waters going down from a mountain", `
      <g class="dusk"><g class="ft">${fan(54, 172, 22, 34, 200, 340, 7)}</g><path class="t" d="M38 172A16 16 0 0 1 70 172"/></g>
      <path class="f" d="M0 172H320"/>
      <path class="pf" d="M222 172L244 142L254 150L270 128L298 172Z"/><path d="M222 172L244 142L254 150L270 128L298 172"/><path class="f" d="M262 140L270 128L278 142M266 146L272 150"/>
      <g class="t water"><path class="ripple" style="--dx:6px" d="M10 184H120M150 184H300"/><path class="ripple" style="--dx:-7px" d="M30 198H180M210 198H320"/>
        <path class="ripple" style="--dx:7px" d="M0 212H90M120 212H260"/><path class="ripple" style="--dx:-8px" d="M60 226H220M250 226H310"/></g>
      <g class="ft shimmer"><path d="M44 180H64M48 192H60M51 204H57"/></g>
      <g class="glide">
        <g class="f wing far"><path d="M190 100C202 80 206 58 198 40C188 60 184 80 186 100"/></g>
        <path class="pf" d="M92 112C112 100 160 96 190 100C200 101 206 96 212 92C220 88 230 90 232 96L242 99L232 102C230 110 218 118 196 120C160 124 120 122 92 112Z"/>
        <path d="M92 112C112 100 160 96 190 100C200 101 206 96 212 92C220 88 230 90 232 96L242 99L232 102C230 110 218 118 196 120C160 124 120 122 92 112Z"/>
        <path d="M92 112L62 104L60 120L94 118"/><path class="f" d="M62 109L92 113M61 115L93 116"/><circle cx="223" cy="95.5" r="1.3" fill="currentColor"/>
        <path class="f" d="M196 112C180 116 160 116 140 114"/>
        <g class="t sprig"><path d="M241 100C250 104 258 106 268 103"/>${leaf(250, 103, 70, 11, 3.2, "", false)}${leaf(258, 105, -50, 11, 3.2, "", false)}${leaf(267, 103, 8, 12, 3.4, "", false)}</g>
        <g class="wing"><path class="pf" d="M178 100C186 74 176 46 152 24C134 50 124 76 140 104Z"/><path d="M178 100C186 74 176 46 152 24"/><path d="${trailing.edge}"/><path class="f" d="${trailing.shafts}"/><path class="f" d="${coverts.edge}"/></g></g>`);
    },

    // 16 · Wings as eagles (Isaiah 40:31): an eagle soaring with wings spread wide above the mountains.
    eagle: () => {
      const trailing = featherEdge([244, 86], [204, 98], [166, 96], 9, -3.6, [184, 76], .35);
      const coverts = featherEdge([236, 72], [200, 80], [168, 84], 7, -2.6);
      const wing = `<path class="pf" d="M166 76C188 66 220 60 256 62L244 86Q204 98 166 96Z"/><path d="M166 76C188 66 220 60 256 62"/><path d="${trailing.edge}"/><path class="f" d="${trailing.shafts}"/><path class="f" d="${coverts.edge}"/>
        <g class="tips">${[[254, 62, -8, 26], [253, 67, 4, 26], [251, 72, 15, 24], [248, 77, 27, 22], [244, 82, 39, 18]].map(([x, y, a, l]) => leaf(x, y, a, l, 3, "", false)).join("")}</g>`;
      return svg("Line drawing: an eagle soaring with its wings spread wide above a range of mountains", `
      <circle class="f" cx="54" cy="40" r="11"/>
      <g class="cloud f"><path d="M30 120C30 114 38 112 42 116C44 110 54 110 56 116C62 115 66 120 62 124H32C29 124 28 122 30 120Z"/></g>
      <g class="cloud slow f"><path d="M236 132C236 127 243 125 246 128C248 123 256 123 258 128C262 128 264 132 261 134H238C236 134 235 133 236 132Z"/></g>
      <path class="f" d="M0 190L40 150L64 168L100 128L130 160L160 140L196 170L230 132L262 160L290 146L320 168"/>
      <path class="f" d="M92 136L100 128L108 138M222 140L230 132L238 142"/>
      <path class="pf" d="M0 214L50 184L82 200L120 172L170 206L210 186L250 200L288 176L320 196V240H0Z"/>
      <path d="M0 214L50 184L82 200L120 172L170 206L210 186L250 200L288 176L320 196"/><path class="f" d="M112 180L120 172L128 182M280 184L288 176L296 186M44 188L50 184L58 190"/>
      
      <g class="soar">
        <g>${wing}</g><g transform="translate(320 0) scale(-1 1)">${wing}</g>
        <path class="pf" d="M160 66C154 68 152 80 154 94C156 102 164 102 166 94C168 80 166 68 160 66Z"/>
        <path d="M160 66C154 68 152 80 154 94C156 102 164 102 166 94C168 80 166 68 160 66Z"/>
        <path class="pf" d="M156 64C154 56 166 56 164 64Z"/><path d="M156 64C154 56 166 56 164 64"/><path d="M158.6 57.6L160 54L161.4 57.6"/>
        <path class="pf" d="M155 98L148 118C156 122 164 122 172 118L165 98Z"/><path d="M155 98L148 118C156 122 164 122 172 118L165 98"/><path class="f" d="M156 104L154 118M160 104V120M164 104L166 118"/></g>`);
    },
  });
})();
