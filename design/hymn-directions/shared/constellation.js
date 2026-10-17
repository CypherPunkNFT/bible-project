// The constellation (direction B's heart, also used by D): the six stanzas at the centre and, on an outer ring, every book
// hymnal editors tie the hymn to; bright lines from a stanza to the verse one of its lines echoes. Choosing a stanza or a
// book fills the reading column beside it. Styles in b/b.css.
(() => {
  const { H, esc } = Hymn;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

  // Geometry: a 600 × 600 stage. Books on an outer ring in Bible order, Old Testament down the left side from the top,
  // New Testament down the right; stanzas on a small inner ring.
  const C = 300, R_BOOK = 248, R_STANZA = 78;
  const NT_START = H.placed.findIndex((b) => b.book === "Matthew");
  const ot = H.placed.slice(0, NT_START), nt = H.placed.slice(NT_START);
  const angle = (i, n, side) => { const t = (i + .5) / n; return side < 0 ? Math.PI * (1.5 - .06 - t * .88) : Math.PI * (-.5 + .06 + t * .88); };
  const books = [...ot.map((b, i) => ({ ...b, a: angle(i, ot.length, -1) })), ...nt.map((b, i) => ({ ...b, a: angle(i, nt.length, 1) }))]
    .map((b) => ({ ...b, x: C + R_BOOK * Math.cos(b.a), y: C + R_BOOK * Math.sin(b.a), r: 3 + Math.sqrt(b.refs.length) * 2.4 }));
  const stanzas = ROMAN.map((label, s) => { const a = -Math.PI / 2 + (s / 6) * Math.PI * 2; return { s, label, x: C + R_STANZA * Math.cos(a), y: C + R_STANZA * Math.sin(a) }; });
  const bookOfEcho = (e) => books.find((b) => e.ref.startsWith(b.book.replace("Psalms", "Psalm")));
  const curve = (x1, y1, x2, y2, bend = .35) => { const mx = (x1 + x2) / 2 + (C - (x1 + x2) / 2) * bend, my = (y1 + y2) / 2 + (C - (y1 + y2) / 2) * bend; return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`; };

  const ties = books.map((b) => `<path class="cn-tie" data-b="${esc(b.book)}" style="--tone: var(--${b.tone})" d="${curve(C, C, b.x, b.y, 0)}"/>`).join("");
  const echoes = H.echoes.map((e, i) => { const b = bookOfEcho(e), st = stanzas[e.stanza]; return b ? `<path class="cn-echo" data-i="${i}" data-s="${e.stanza}" data-b="${esc(b.book)}" d="${curve(st.x, st.y, b.x, b.y)}"/>` : ""; }).join("");
  const bookNodes = books.map((b) => {
    const left = b.x < C, lx = b.x + (left ? -1 : 1) * (b.r + 6);
    return `<g class="cn-book" data-b="${esc(b.book)}" style="--tone: var(--${b.tone})" tabindex="0" role="button" aria-label="${esc(b.book)}, ${b.refs.length} passages">
      <circle cx="${b.x}" cy="${b.y}" r="${b.r}"/><text x="${lx}" y="${b.y + 4}" text-anchor="${left ? "end" : "start"}">${esc(b.book)}</text></g>`;
  }).join("");
  const stanzaNodes = stanzas.map((st) => `<g class="cn-stanza" data-s="${st.s}" tabindex="0" role="button" aria-label="Stanza ${st.label}"><circle cx="${st.x}" cy="${st.y}" r="17"/><text x="${st.x}" y="${st.y}">${st.label}</text></g>`).join("");

  /** The stage and its reading column. */
  function html() {
    return `<div class="cn">
        <div><div class="cn-stage"><svg viewBox="0 0 600 600" role="img" aria-label="The hymn's stanzas and the books it is tied to">
          <circle class="cn-ring" cx="${C}" cy="${C}" r="${R_BOOK}"/><circle class="cn-ring" cx="${C}" cy="${C}" r="${R_STANZA}"/>
          ${ties}${echoes}${bookNodes}${stanzaNodes}
          <g class="cn-centre"><text class="t1" x="${C}" y="${C - 4}">Amazing grace</text><text class="t2" x="${C}" y="${C + 16}">Newton · 1779</text></g>
        </svg></div>
        <p class="cn-legend"><span><i class="e"></i>a line echoes this verse</span><span><i></i>hymnal editors tie the hymn here</span></p></div>
        <div class="cn-read" aria-live="polite"></div>
      </div>`;
  }

  /** Make it live; opens passages in the panel P. */
  function wire(root, P) {
    const stage = root.querySelector(".cn-stage");
    const read = root.querySelector(".cn-read");
    const steps = () => `<div class="cn-steps" aria-label="Stanzas">${ROMAN.map((r, s) => `<button type="button" data-s="${s}">${r}</button>`).join("")}</div>`;

    function pickStanza(s) {
      stage.classList.add("picked");
      stage.querySelectorAll(".cn-stanza").forEach((g) => g.classList.toggle("on", +g.dataset.s === s));
      stage.querySelectorAll(".cn-book").forEach((g) => g.classList.toggle("on", H.echoes.some((e) => e.stanza === s && bookOfEcho(e)?.book === g.dataset.b)));
      stage.querySelectorAll(".cn-echo").forEach((p) => p.classList.toggle("on", +p.dataset.s === s));
      stage.querySelectorAll(".cn-tie").forEach((p) => p.classList.remove("on"));
      const mine = H.echoes.map((e, i) => ({ ...e, i })).filter((e) => e.stanza === s);
      read.innerHTML = `<p class="k">Stanza ${ROMAN[s]}</p><h3>${esc(H.stanzas[s][0].replace(/[,;!]$/, ""))}</h3>
        <div class="st">${H.stanzas[s].map((line, l) => { const e = mine.find((m) => m.line === l); return `<p class="${e ? "e" : ""}" ${e ? `data-i="${e.i}"` : ""}>${esc(line)}</p>`; }).join("")}</div>
        ${mine.length ? `<div class="cn-echoes">${mine.map((e) => `<button type="button" data-i="${e.i}"><b>${esc(e.ref)}</b><span>“${esc(e.words)}”</span></button>`).join("")}</div>`
          : `<p class="cn-hint">No line of this stanza quotes a verse closely; it is the hymn's own confession.</p>`}
        ${steps()}`;
      read.querySelectorAll("[data-i]").forEach((el) => el.addEventListener("click", () => { const e = H.echoes[+el.dataset.i]; P.open(e, H.stanzas[e.stanza][e.line], `Stanza ${ROMAN[e.stanza]} echoes`); }));
      wireSteps(s);
    }

    function pickBook(name) {
      const b = books.find((x) => x.book === name);
      stage.classList.add("picked");
      stage.querySelectorAll(".cn-stanza").forEach((g) => g.classList.toggle("on", H.echoes.some((e) => e.stanza === +g.dataset.s && bookOfEcho(e)?.book === name)));
      stage.querySelectorAll(".cn-book").forEach((g) => g.classList.toggle("on", g.dataset.b === name));
      stage.querySelectorAll(".cn-tie").forEach((p) => p.classList.toggle("on", p.dataset.b === name));
      stage.querySelectorAll(".cn-echo").forEach((p) => p.classList.toggle("on", p.dataset.b === name));
      const echoes = H.echoes.map((e, i) => ({ ...e, i })).filter((e) => bookOfEcho(e)?.book === name);
      read.innerHTML = `<p class="k">${b.refs.length} passage${b.refs.length > 1 ? "s" : ""} hymnals name</p><h3>${esc(name)}</h3>
        <div class="cn-refs">${b.refs.map((r) => { const m = /^(\d+)(?::([\d–-]+))?/.exec(r); return `<a href="/read/kjv/${b.code}/${m ? m[1] : 1}${m && m[2] ? `?hl=${m[2]}` : ""}">${esc(`${name.replace("Psalms", "Psalm")} ${r}`)}</a>`; }).join("")}</div>
        ${echoes.length ? `<p class="cn-hint">Echoed in the hymn:</p><div class="cn-echoes">${echoes.map((e) => `<button type="button" data-i="${e.i}"><b>${esc(e.ref)} · stanza ${ROMAN[e.stanza]}</b><span>“${esc(H.stanzas[e.stanza][e.line])}”</span></button>`).join("")}</div>` : ""}
        ${steps()}`;
      read.querySelectorAll("[data-i]").forEach((el) => el.addEventListener("click", () => { const e = H.echoes[+el.dataset.i]; P.open(e, H.stanzas[e.stanza][e.line], `Stanza ${ROMAN[e.stanza]} echoes`); }));
      wireSteps(-1);
    }

    function wireSteps(current) {
      read.querySelectorAll(".cn-steps button").forEach((btn) => { btn.classList.toggle("on", +btn.dataset.s === current); btn.addEventListener("click", () => pickStanza(+btn.dataset.s)); });
    }
    const activate = (el, fn) => { el.addEventListener("click", fn); el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } }); };
    stage.querySelectorAll(".cn-stanza").forEach((g) => activate(g, () => pickStanza(+g.dataset.s)));
    stage.querySelectorAll(".cn-book").forEach((g) => activate(g, () => pickBook(g.dataset.b)));
    pickStanza(0);
  }

  window.HymnConstellation = { html, wire };
})();
