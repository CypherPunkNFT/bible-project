// Direction A · The page and its echoes.
(() => {
  const { H, esc, intro, panel, sources, switcher } = Hymn;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  main.append(wrap);
  const book = HymnSections.book("03");
  const placed = HymnSections.placed("04");

  const echoesOf = (s, l) => H.echoes.map((e, i) => ({ ...e, i })).filter((e) => e.stanza === s && e.line === l);
  const stanzas = H.stanzas.map((lines, s) => `<div class="stanza"><span class="rn" aria-hidden="true">${ROMAN[s]}</span>${lines.map((text, l) => {
    const ech = echoesOf(s, l);
    return `<span class="line ${ech.length ? "echo" : ""}" data-e="${ech.map((e) => e.i).join(" ")}"><span class="t">${esc(text)}</span>${ech.map((e) => `<span class="inline-note"><b>${esc(e.ref)}</b>${esc(e.words)}</span>`).join("")}</span>`;
  }).join("")}</div>`).join("");

  wrap.innerHTML = `${intro()}
    <section class="hy-sec" id="hymn"><div class="hy-head"><span class="hy-num">01</span><div>
      <h2>The hymn, <em>and the Scripture in it</em></h2>
      <p>All six stanzas as Newton printed them. Beside the lines that echo a verse, the verse hymnal editors attach to the hymn.
        Hover a line or a verse to join them; click to read the passage.</p></div></div>
      <div class="ec"><svg class="links" aria-hidden="true"></svg>
        <div class="stanzas">${stanzas}</div>
        <div class="margin">${H.echoes.map((e, i) => `<button type="button" class="note" data-i="${i}"><span class="ref">${esc(e.ref)}</span><span class="w">“${esc(e.words)}”</span></button>`).join("")}</div>
      </div>
      <p class="ec-key">${H.echoes.length} echoes in 24 lines.</p>
    </section>
    ${HymnSections.found("02")}
    ${book.html}
    ${placed.html}
    ${sources()}`;

  const P = panel();
  book.wire(wrap);
  placed.wire(wrap);
  switcher();

  const ec = wrap.querySelector(".ec");
  const svg = ec.querySelector("svg.links");
  const lines = [...ec.querySelectorAll(".line.echo")];
  const notes = [...ec.querySelectorAll(".note")];
  const lineFor = (i) => lines.find((l) => l.dataset.e.split(" ").includes(String(i)));

  /** Set each verse beside its line (nudged down where two would overlap) and draw the joining lines. */
  function layout() {
    if (innerWidth <= 900) return;
    const box = ec.getBoundingClientRect();
    let floor = -Infinity;
    const paths = [];
    notes.forEach((note) => {
      const i = +note.dataset.i;
      const t = lineFor(i).querySelector(".t");
      const r = t.getBoundingClientRect();
      const want = r.top - box.top + r.height / 2 - 14;
      const top = Math.max(want, floor);
      note.style.top = `${top}px`;
      floor = top + note.offsetHeight + 8;
      const n = note.getBoundingClientRect();
      const x1 = r.right - box.left + 10, y1 = r.top - box.top + r.height / 2;
      const x2 = n.left - box.left - 12, y2 = n.top - box.top + 9;
      const mid = (x1 + x2) / 2;
      paths.push(`<path data-i="${i}" d="M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}"/><circle data-i="${i}" cx="${x1}" cy="${y1}" r="2.5"/><circle data-i="${i}" cx="${x2}" cy="${y2}" r="2.5"/>`);
    });
    const marginHeight = Math.max(...notes.map((n) => n.offsetTop + n.offsetHeight));
    ec.querySelector(".margin").style.minHeight = `${marginHeight}px`;
    svg.innerHTML = paths.join("");
  }

  function focus(ids) {
    ec.classList.toggle("focus", ids.length > 0);
    notes.forEach((n) => n.classList.toggle("on", ids.includes(+n.dataset.i)));
    lines.forEach((l) => l.classList.toggle("on", l.dataset.e.split(" ").some((i) => ids.includes(+i))));
    svg.querySelectorAll("[data-i]").forEach((p) => p.classList.toggle("on", ids.includes(+p.dataset.i)));
  }
  const open = (i) => { const e = H.echoes[i]; P.open(e, H.stanzas[e.stanza][e.line], `Stanza ${ROMAN[e.stanza]} echoes`); focus([i]); };
  lines.forEach((l) => {
    const ids = l.dataset.e.split(" ").map(Number);
    l.addEventListener("mouseenter", () => focus(ids));
    l.addEventListener("mouseleave", () => focus([]));
    l.addEventListener("click", () => open(ids[0]));
  });
  notes.forEach((n) => {
    n.addEventListener("mouseenter", () => focus([+n.dataset.i]));
    n.addEventListener("mouseleave", () => focus([]));
    n.addEventListener("click", () => open(+n.dataset.i));
  });
  document.addEventListener("hy-panel-closed", () => focus([]));
  document.fonts.ready.then(layout);
  addEventListener("resize", layout);
  layout();
})();
