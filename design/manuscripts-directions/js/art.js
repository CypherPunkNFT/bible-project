// Our own line drawings for a manuscript with no open picture: a scroll, a codex or a papyrus leaf, by kind.
// They are drawings of the form, never of the object, and say so wherever they stand in for a picture.
(() => {
  const lines = (x0, y0, w, n, gap, short = 0.7) => Array.from({ length: n }, (_, i) => {
    const len = w * (i % 5 === 4 ? short : 0.86 + ((i * 37) % 10) / 70);
    return `<path class="a-fine" d="M${x0} ${y0 + i * gap}h${len.toFixed(1)}"/>`;
  }).join("");

  function scroll() {
    return `<svg class="ms-art" viewBox="0 0 220 150" aria-hidden="true">
      <path class="a-ground" d="M14 132h192"/>
      <path class="a-line" d="M40 30h150M40 118h150"/>
      <ellipse class="a-line" cx="40" cy="74" rx="11" ry="44"/><ellipse class="a-fine" cx="40" cy="74" rx="5" ry="38"/>
      <path class="a-line" d="M190 30c9 0 14 20 14 44s-5 44-14 44"/><path class="a-fine" d="M190 30c-6 0-9 20-9 44s3 44 9 44"/>
      <g>${lines(60, 44, 34, 10, 7.6)}${lines(104, 44, 34, 10, 7.6)}${lines(148, 44, 26, 10, 7.6)}</g>
      <path class="a-tone" d="M98 40v70M142 40v70"/>
    </svg>`;
  }
  function codex() {
    return `<svg class="ms-art" viewBox="0 0 220 150" aria-hidden="true">
      <path class="a-ground" d="M14 132h192"/>
      <path class="a-line" d="M110 34c-18-8-46-10-80-6v92c34-4 62-2 80 6 18-8 46-10 80-6V28c-34-4-62-2-80 6z"/>
      <path class="a-line" d="M110 34v92"/><path class="a-fine" d="M30 120c34-3 60 0 80 8 20-8 46-11 80-8"/>
      <g>${lines(40, 46, 26, 9, 8)}${lines(72, 46, 26, 9, 8)}${lines(120, 46, 26, 9, 8)}${lines(152, 46, 26, 9, 8)}</g>
      <path class="a-tone" d="M40 40h8"/>
    </svg>`;
  }
  function fragment() {
    return `<svg class="ms-art" viewBox="0 0 220 150" aria-hidden="true">
      <path class="a-ground" d="M14 132h192"/>
      <path class="a-line" d="M72 26l44-6 38 10 6 26-10 18 12 30-26 18-52 2-20-22 6-26-10-28z"/>
      <path class="a-fine" d="M80 30v86M110 24v98M140 28v90" opacity=".45"/>
      <g>${lines(84, 40, 58, 9, 8.4, 0.5)}</g>
    </svg>`;
  }
  function draw(r) {
    if (r.k === "dss") return scroll();
    if (r.k === "papyrus" || r.m === "papyrus") return fragment();
    return codex();
  }
  window.Art = { draw };
})();
