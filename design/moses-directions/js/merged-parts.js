// H · smaller parts of the merged page: the quiet star field behind each chapter, the ten plagues as a grid of glyphs
// with small animated dots, and the strip that leads to the second page.
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

  // The way to the second page: three approved sections that do not fit here, as a line of quiet links.
  const MINI = {
    constellation: '<circle cx="20" cy="20" r="4"/><circle cx="20" cy="20" r="10" stroke-dasharray="2 3"/><circle cx="20" cy="20" r="17" stroke-dasharray="2 4"/><circle cx="30" cy="13" r="1.6" fill="currentColor"/><circle cx="8" cy="26" r="1.6" fill="currentColor"/><path d="M20 20 30 13"/>',
    cabinet: '<path d="M5 8h30v26H5zM5 21h30M20 8v26"/><path d="M10 17c2-4 6-4 7 0M24 30l6-6"/>',
    memory: '<path d="M3 30h34"/><circle cx="7" cy="22" r="1.3" fill="currentColor"/><circle cx="11" cy="16" r="1.3" fill="currentColor"/><circle cx="12" cy="25" r="1.3" fill="currentColor"/><circle cx="15" cy="11" r="1.3" fill="currentColor"/><circle cx="16" cy="20" r="1.3" fill="currentColor"/><circle cx="24" cy="24" r="1.3" fill="currentColor"/><circle cx="31" cy="18" r="1.3" fill="currentColor"/><circle cx="35" cy="26" r="1.3" fill="currentColor"/>',
  };
  window.MORE_PARTS = [
    { id: "constellation", name: "The constellation", line: "Everyone and everything around him, in rings: people, places, moments and words." },
    { id: "cabinet", name: "The cabinet", line: "Eleven things Scripture puts in his hands, and when each one appears." },
    { id: "memory", name: "The long memory", line: "Every verse that names him, as points of light across the 66 books." },
  ];
  window.moreStrip = () => `<nav class="mg-more" aria-label="More of Moses, on a second page"><span class="mg-kick">More of Moses · a second page</span>
      <div class="mg-more-row">${MORE_PARTS.map((p) => `<a href="#merged-more" data-more="${p.id}"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true">${MINI[p.id]}</svg><span><b>${esc(p.name)}</b><small>${esc(p.line)}</small></span>${icon("arrowRight", 16)}</a>`).join("")}</div></nav>`;
})();
