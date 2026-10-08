// H · smaller parts of the merged page: the quiet star field (the sky) at the top of each chapter, and the ten plagues as
// a grid of glyphs with small animated dots.
(() => {
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // Two layers of faint points that drift very slowly in opposite directions (dust by day, stars by night).
  window.starField = (seed) => {
    const r = rng(seed), layer = (n, cls, big) => `<g class="${cls}">${Array.from({ length: n }, () => `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 900).toFixed(0)}" r="${(big ? .9 + r() * 1.3 : .5 + r() * .8).toFixed(2)}" ${r() > .8 ? `class="tw" style="--tw:${(4 + r() * 6).toFixed(1)}s;--td:${(-r() * 8).toFixed(1)}s"` : ""}/>`).join("")}</g>`;
    return `<svg class="mg-sky" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${layer(90, "mg-sky-a", false)}${layer(34, "mg-sky-b", true)}</svg>`;
  };

  // How the dots of each plague move (css/merged.css has one animation per kind).
  const KIND = { blood: "fall", frogs: "hop", lice: "jitter", flies: "orbit", murrain: "sink", boils: "pulse", hail: "hail", locusts: "swarm", darkness: "dark", firstborn: "last" };
  const dots = (word, n) => {
    const r = rng(word.length * 97 + n), kind = KIND[word] ?? "pulse";
    return `<svg class="pd pd-${kind}" viewBox="0 0 64 64" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + r() * .4, rad = 20 + r() * 8;
      const x = kind === "orbit" ? 32 : (32 + Math.cos(a) * rad), y = kind === "orbit" ? 32 : (32 + Math.sin(a) * rad * .9);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.3 + r() * .9).toFixed(2)}" style="--i:${i};--a:${(a * 57.3).toFixed(0)}deg;--r:${rad.toFixed(1)}px"/>`;
    }).join("")}</svg>`;
  };
  window.plagueDots = () => `<div class="mg-plagues" role="group" aria-label="The ten plagues: choose one to read its verse">
      ${M.plagues.map((p) => `<button type="button" class="mg-pl" data-plague="${p.n}" aria-pressed="false" style="--k:${p.n - 1}"><span class="mg-pl-art">${dots(p.word, p.n)}${glyph(p.word, 30, 1.3)}</span><span class="mg-pl-n">${p.n}</span><b>${esc(p.word)}</b></button>`).join("")}
    </div><p class="mg-pl-line" data-plline aria-live="polite"><span class="mg-pl-hint">Exodus 7–12 · choose a plague to read its verse</span></p>`;
  window.plagueLine = (n) => { const p = M.plagues[n - 1]; return `<span class="mg-pl-ref">${p.n} of 10 · <b>${esc(p.word)}</b> · ${refLink(p.verse.ref)} · KJV</span><span class="mg-pl-text">“${esc(p.verse.text)}”</span>`; };
})();
