// Drawing 6: the original five loaves and two fish, with seated groups on the hills.
(() => {
  const { n, svg, tuft, weave } = window.Parts;
  /** A fish lying or swimming, its mouth at (x, y), tail to the right. */
  const fish = (x, y, a = 0, s = 1, cls = "") => `<g class="${cls}" transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
      <path class="pf" d="M0 0C8-7 26-8 36-2C38-1 38 1 36 2C26 8 8 7 0 0ZM36 0L46-6C44-2 44 2 46 6Z"/>
      <path d="M0 0C8-7 26-8 36-2C38-1 38 1 36 2C26 8 8 7 0 0Z"/><path d="M36 0L46-6C44-2 44 2 46 6Z"/>
      <circle cx="7" cy="-1" r="1" fill="currentColor"/><path class="f" d="M12-5C14-2 14 2 12 5M19-6L24-10L27-5M20 6L24 9L26 5"/></g>`;
  /** A round loaf, its base centred at (cx, base). */
  const loaf = (cx, base, w, h) => `<path class="pf" d="M${cx - w} ${base}C${cx - w} ${n(base - h * 1.3)} ${cx + w} ${n(base - h * 1.3)} ${cx + w} ${base}Z"/>
      <path d="M${cx - w} ${base}C${cx - w} ${n(base - h * 1.3)} ${cx + w} ${n(base - h * 1.3)} ${cx + w} ${base}"/>
      <path class="f" d="M${n(cx - w * .5)} ${n(base - h * .55)}C${n(cx - w * .2)} ${n(base - h * .8)} ${n(cx + w * .15)} ${n(base - h * .85)} ${n(cx + w * .4)} ${n(base - h * .72)}M${n(cx - w * .6)} ${n(base - h * .22)}C${n(cx - w * .2)} ${n(base - h * .48)} ${n(cx + w * .25)} ${n(base - h * .52)} ${n(cx + w * .6)} ${n(base - h * .36)}"/>`;

  const seated = (x,y,s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-15" r="3.2"/><path d="M-4-10Q0-13 4-10L6-3M-4-10L-6-3M-3-8L-2-3H5L9 0H-9L-5-4M3-8L2-3"/></g>`;
  window.ART.loavesCrowd = () => svg("Line drawing: five round loaves in a woven basket on the grass, two fish lying on the bread, people sitting in groups on the hills behind the basket, warmth rising from the bread", `
      <path class="f" d="M0 89C42 68 84 65 128 82C188 101 242 63 320 78"/>
      <path class="f" d="M0 116C40 104 90 100 140 108C190 116 240 102 320 106"/>
      <g class="f crowd">${[[26,82,.65],[42,78,.72],[62,75,.6],[80,75,.65],[101,78,.55],[216,81,.6],[235,76,.7],[254,73,.6],[274,73,.7],[296,76,.55],[16,114,.9],[38,108,.85],[61,106,.9],[82,105,.8],[239,109,.85],[261,107,.9],[284,107,.85],[307,108,.8]].map(([x,y,s])=>seated(x,y,s)).join("")}</g>
      <path class="f" d="M30 136C70 130 110 130 140 134M200 132C240 128 280 128 310 132"/>
      <path d="M8 202C80 198 240 198 312 202"/>
      <g class="steam ft"><path style="--i:0" d="M136 100C132 94 140 88 136 82C132 76 140 70 136 64"/><path style="--i:1" d="M160 94C156 88 164 82 160 76C156 70 164 64 160 58"/><path style="--i:2" d="M186 100C182 94 190 88 186 82C182 76 190 70 186 64"/></g>
      <path d="M88 132C90 120 130 118 160 118C190 118 230 120 232 132"/>
      ${loaf(122, 134, 20, 16)}${loaf(198, 134, 20, 16)}${loaf(160, 132, 22, 19)}${loaf(140, 141, 19, 14)}${loaf(181, 141, 19, 14)}
      <g class="t">${fish(110, 128, -14, .84)}${fish(158, 126, 12, .84)}</g>
      <path class="pf" d="M88 132C90 172 120 198 160 198C200 198 230 172 232 132C230 146 190 148 160 148C130 148 90 146 88 132Z"/>
      <path d="M88 132C90 172 120 198 160 198C200 198 230 172 232 132"/><path d="M88 132C90 146 130 148 160 148C190 148 230 146 232 132"/>
      <path class="f" d="M92 140C104 152 216 152 228 140"/><path class="f" d="${weave(160, 154, 192, 68, 38, 3, 11)}"/>
      ${tuft(50, 202)}${tuft(66, 201, .7)}${tuft(248, 201, .8)}${tuft(270, 202)}${tuft(30, 203, .6)}${tuft(292, 202, .6)}`);
})();
