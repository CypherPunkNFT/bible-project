// Direction A · The desk. An object-like page: the opening is a codex leaf of Romans 5:1 under a lens, where the first
// hand's ω gives way to the corrector's ο and back, slowly, for ever. Then the layers of evidence as stacked planes,
// the comparison desk with its threads, the broken edge, GA 304, counting, the editions, and the six witnesses as a
// cabinet of objects that open their records.
window.Directions = window.Directions || {};
(() => {
  const { HERO, INTRO, LAYERS, CASES } = PM;
  const { sectionHead, figures, reasoning, closing, inkLines, choice, recButton } = PMX;
  const { byId } = MSX;

  // The opening drawing. Letters are typeset, not traced; the page is a drawing of the form.
  function heroArt() {
    const row = (x, y) => `<text class="ah-uncial" x="${x}" y="${y}" lang="grc">ειρηνηνεχ<tspan class="ah-slot-w">ω</tspan>μεν</text>`;
    return `<figure class="ah-art" aria-hidden="true"><svg viewBox="0 0 440 340">
      <defs><clipPath id="ah-lens"><circle cx="300" cy="168" r="62"/></clipPath></defs>
      <ellipse class="ms-orbit" cx="220" cy="172" rx="206" ry="140"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="220" cy="172" rx="170" ry="160" transform="rotate(-16 220 172)"/>
      <g class="ah-leaf"><g transform="rotate(-5 220 180)">
        <path class="mh-sheet" d="M86 36 Q220 26 352 38 L346 318 Q218 306 80 316Z"/>
        <path class="mh-sheet mh-sheet-front" d="M96 44 Q220 34 342 46 L338 308 Q218 298 90 306Z"/>
        <path class="ms-fold" d="M218 42V302"/>
        <g class="ah-holes">${[70, 120, 170, 220, 270].map((y) => `<circle cx="218" cy="${y}" r="1.3"/>`).join("")}</g>
        <g class="ah-pricks">${Array.from({ length: 12 }, (_, i) => `<path d="M${102} ${62 + i * 20}h3M${334} ${62 + i * 20}h3"/>`).join("")}</g>
        <path class="ah-rule" d="M110 54h96M234 54h96M110 296h96M234 296h96"/>
        <g class="ms-ink">${inkLines(112, 64, 90, 12, 9.5, 2)}${inkLines(112, 196, 90, 11, 9.5, 5)}${inkLines(236, 64, 90, 10, 9.5, 7)}${inkLines(236, 186, 90, 12, 9.5, 1)}</g>
        ${row(236, 164)}
        <path class="ah-margin" d="M352 150c10 4 10 18 0 22"/>
      </g></g>
      <g class="ah-lens-g">
        <circle class="hv-glass" cx="300" cy="168" r="62"/>
        <g clip-path="url(#ah-lens)"><g class="ah-zoom">
          <path class="ah-zoom-line" d="M200 128h220M200 214h220"/>
          <text class="ah-big" x="214" y="182" lang="grc">νεχ</text>
          <text class="ah-big ah-letter ah-w" x="281" y="182" lang="grc">ω</text>
          <text class="ah-big ah-letter ah-o" x="284" y="182" lang="grc">ο</text>
          <text class="ah-big" x="314" y="182" lang="grc">μεν</text>
          <text class="ah-corr" x="290" y="146" lang="grc">ο</text>
        </g></g>
        <circle class="hv-rim" cx="300" cy="168" r="62"/><circle class="hv-rim hv-rim-2" cx="300" cy="168" r="67"/>
        <path class="hv-handle" d="M344 212 386 254"/>
      </g>
      <g class="ah-nib"><path d="M378 92l-40 38 6 6 40-38c4-6-1-11-6-6z"/><path d="M338 130l-6 12 12-6"/><path d="M352 118l6 6"/></g>
      <path class="ms-mark" d="M30 52h10m-5-5v10M402 300h10m-5-5v10M398 40h8m-4-4v8"/>
    </svg>
    <span class="ah-tags"><span class="ah-tag ah-tag-w"><b lang="grc">ω</b><span>א* · first hand</span><small>ἔχωμεν · “let us have peace”</small></span>
    <span class="ah-tag ah-tag-o"><b lang="grc">ο</b><span>א¹ · correction</span><small>ἔχομεν · “we have peace”</small></span></span>
    <small class="ah-note">Romans 5:1 in Codex Sinaiticus · typeset letters, not a facsimile</small>
    </figure>`;
  }

  function landing(sec) {
    sec.innerHTML = `<div class="hc-intro ms-intro pm-intro">
        <div><p class="hc-crumb"><a href="/study">Study</a><span>/</span><a href="/study/academic?area=texts">The Bible: formation &amp; transmission</a><span>/</span>02</p>
          <h1>A passage through<em>the manuscripts</em></h1>
          <p class="pm-hero-lead">${esc(HERO.lead)}</p>
          <p class="hc-lede">${esc(HERO.kicker)}. Three real cases from the Greek New Testament, from a spelling to a disputed ending: sit at the desk, follow each witness to the reading it supports, and keep the object, the transcription and the edition apart.</p>
          <nav class="pm-route" aria-label="In this study"><a href="#a-desk"><span>01</span>Compare the readings</a><a href="#a-edge"><span>02</span>Investigate an ending</a><a href="#a-editions"><span>03</span>Understand the editions</a><a href="#a-close"><span>04</span>Read further</a></nav>
        </div>${heroArt()}</div>${figures()}`;
  }

  // The three layers as stacked planes, each with a leader line to its name; choosing one lifts it.
  function layers(sec, num) {
    const plane = (i, inner) => `<g class="al-plane al-p${i}" data-layer="${i}"><path class="al-sheet" d="M60 ${40 + i * 76}l150 -26 150 26 -150 26z"/>${inner}</g>`;
    const art = `<svg class="al-art" viewBox="0 0 560 256" aria-hidden="true">
      ${plane(2, `<g class="al-ink al-ink-object"><path d="M110 190l60-10M120 196l90-15M135 203l80-13" /><path class="al-tear" d="M250 174l14 6-6 8 12 6"/></g>`)}
      ${plane(1, `<g class="al-ink al-ink-trans"><path d="M110 114l60-10M120 120l66-11" /><path class="al-bracket" d="M196 108l3 8M232 100l3 8"/><circle cx="214" cy="108" r="1.5"/><circle cx="222" cy="107" r="1.5"/></g>`)}
      ${plane(0, `<g class="al-ink al-ink-ed"><path d="M110 38l90-15M120 44l96-16M135 51l96-16" /><path class="al-app" d="M150 60l70-12"/></g>`)}
      ${[0, 1, 2].map((i) => `<path class="al-lead" data-lead="${i}" d="M360 ${40 + i * 76}H556"/><circle class="al-knot" cx="360" cy="${40 + i * 76}" r="2.5"/>`).join("")}
    </svg>`;
    // Plane 0 (top) is the edition, plane 2 (bottom) the object; LAYERS runs object → edition.
    sec.innerHTML = `<div class="al-wrap"><div>${sectionHead(num, "Before comparing", "Keep the layers <em>apart.</em>", esc(INTRO))}</div>
      <div class="al-stage">${art}<ol class="al-names">${[0, 1, 2].map((row) => { const [t, d] = LAYERS[2 - row]; return `<li style="top:${(((40 + row * 76) / 256) * 100).toFixed(1)}%"><button type="button" data-layer="${row}" aria-pressed="false"><span>0${3 - row}</span><b>${esc(t)}</b><small>${esc(d)}</small></button></li>`; }).join("")}</ol></div></div>`;
    const stage = sec.querySelector(".al-stage");
    choice(stage, "button[data-layer]", (b) => {
      stage.dataset.lift = b.dataset.layer;
    });
  }

  function desk(sec, num) {
    sec.innerHTML = `${sectionHead(num, "The comparison desk", "Read across. <em>Then look beneath.</em>", "Three cases, selected evidence. Each witness’s words float on the left; a thread runs from the words that differ to the reading they support. Choose a witness to see what it is.")}
      <div class="a-desk"></div><div class="a-beneath"><div class="a-reason"></div><div class="a-close"></div></div>`;
    const reasonEl = sec.querySelector(".a-reason"), closeEl = sec.querySelector(".a-close");
    const fill = (id) => {
      reasonEl.innerHTML = `<p class="kicker">How an editor reasons · ${esc(CASES.find((c) => c.id === id).passage)}</p>${reasoning(id)}`;
      closeEl.className = "a-close"; closeEl.innerHTML = "";
      CloseReading.mount(closeEl, id);
    };
    Desk.mount(sec.querySelector(".a-desk"), { caseId: "galatians", onCase: fill });
    fill("galatians");
  }

  // The only open picture of P46: another leaf of the same codex, opening its record.
  function p46Photo() {
    const r = byId.get("Q1513469"), im = MS.images[r.im];
    return `<figure class="a-photo"><button type="button" data-open="${r.i}" aria-label="Open the record for Papyrus 46"><img src="${imgSrc(r.im)}" width="${im.w}" height="${im.h}" alt="Papyrus 46, folio 142 recto: 2 Corinthians 11:33–12:9"></button>
          <figcaption><b>The same codex, another leaf.</b> P46 folio 142r, 2 Corinthians 11:33–12:9, University of Michigan. ${esc(im.lic)} · <a href="${esc(im.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>. No open picture of its Galatians page is held here.</figcaption></figure>`;
  }
  function edge(sec, num) {
    sec.innerHTML = `${sectionHead(num, "At the broken edge", PM.EDGE.title, esc(PM.EDGE.lead))}
      <div class="a-edge"><div class="a-edge-main"></div>${p46Photo()}</div>`;
    Evidence.edge(sec.querySelector(".a-edge-main"));
  }

  function ga304(sec, num) {
    sec.innerHTML = `${sectionHead(num, "When scholarship changes the evidence", PM.GA304.title)}<div class="a-g3"></div>`;
    Evidence.ga304(sec.querySelector(".a-g3"), { loop: true });
  }

  function counting(sec, num) {
    sec.innerHTML = `${sectionHead(num, "Counting and coverage", "A count of copies <em>is not a vote.</em>", "Two traps when weighing witnesses: treating many related copies as many independent voices, and treating a lost leaf as an omission.")}
      <div class="a-count"><div class="a-copy"></div><div class="a-quiz"></div></div>`;
    Evidence.copying(sec.querySelector(".a-copy"));
    Evidence.quiz(sec.querySelector(".a-quiz"));
  }

  function editions(sec, num) {
    sec.innerHTML = `${sectionHead(num, "The work behind the printed line", PM.EDITIONS.title, esc(PM.EDITIONS.lead))}<div class="a-eds"></div>`;
    Evidence.editions(sec.querySelector(".a-eds"));
  }

  // The cabinet: the six witnesses of this study as objects, each opening its open record.
  const ROLE = {
    Q1513469: "Galatians 1:3, the spelling ὑμεῖν · Galatians 1:4, the broken edge θελ[ημα",
    Q152962: "Romans 5:1, ω in the first hand, ο in the correction · Mark ends at 16:8",
    Q209285: "Romans 5:1, the same change · Mark ends at 16:8, then a blank column",
    Q318233: "Mark continues with the Longer Ending, 16:9–20",
    Q697885: "Mark 16 does not survive here: no reading to count",
    Q6870196: "A commentary manuscript whose biblical text stops at 16:8: unfinished copying",
  };
  const SIGLA = { Q152962: "א", Q209285: "B", Q318233: "A" };
  function cabinet(sec, num) {
    const items = Object.keys(MS.key).map((id) => byId.get(id));
    sec.innerHTML = `${sectionHead(num, "The witnesses on the desk", "Six objects, <em>one study.</em>", "Every manuscript named above, from the open records. Choose one to open its record: date, material, contents, where it is now and its sources.")}
      <div class="a-cab">${items.map((r) => `<button type="button" class="a-cab-item" data-open="${r.i}">
        <span class="a-cab-fig">${r.im ? `<img src="${imgSrc(r.im)}" alt="">` : Art.draw(r)}</span>
        <span class="a-cab-sig">${esc(SIGLA[r.i] ?? r.g)}</span><b>${esc(r.n)}</b><small>${esc(r.d)}${SIGLA[r.i] ? ` · GA ${esc(r.g)}` : ""}</small>
        <span class="a-cab-role">${esc(ROLE[r.i])}</span></button>`).join("")}</div>`;
  }

  function mount(wrap) {
    const parts = [["a-landing", landing], ["a-layers", layers], ["a-desk", desk], ["a-edge", edge], ["a-g304", ga304], ["a-count", counting], ["a-editions", editions], ["a-cabinet", cabinet], ["a-close", (s, n) => { s.innerHTML = closing(n); }]];
    let n = 0;
    for (const [id, fn] of parts) {
      const sec = document.createElement("section");
      sec.id = id; sec.className = `t-sec pm-sec sec-${id}`;
      wrap.append(sec);
      try { fn(sec, id === "a-landing" ? "" : String(++n).padStart(2, "0")); } catch (error) { console.error(`Direction A: section ${id} failed`, error); sec.innerHTML = `<p class="t-failed">This section could not be drawn.</p>`; }
    }
  }
  window.Directions.a = { mount, parts: { landing, editions, cabinet, p46Photo } };
})();
