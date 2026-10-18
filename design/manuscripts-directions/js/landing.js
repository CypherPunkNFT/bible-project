// The face of the Manuscripts page: breadcrumb, the big plain-type title with one italic accent, a short lede and four
// quiet figures, all counted from data.js. Direction B adds a strip of dated copies per century beneath it.
(() => {
  const { mid } = MSX;
  const C = MS.counts;
  const R = MS.records;

  const fig = (label, value, note) => `<div><dt>${label}</dt><dd>${value}</dd><small>${note}</small></div>`;
  function figuresA() {
    return [
      fig("Records", formatNumber(C.records), "from open catalogues"),
      fig("Greek New Testament", formatNumber(C.gaTotal), `of about ${formatNumber(C.liste.total)} known`),
      fig("Papyri", `${formatNumber(C.ga.papyrus)}`, `of about ${C.liste.papyrus} known`),
      fig("Judaean Desert scrolls", formatNumber(C.byKind.dss), `${formatNumber(C.dssBiblical)} with a book of the Bible`),
    ];
  }
  function figuresB() {
    const dated = R.filter((r) => "e" in r);
    const oldest = dated.reduce((a, b) => (b.e < a.e ? b : a));
    const lanes = new Set(R.flatMap((r) => r.L));
    const early = dated.filter((r) => ["papyrus", "majuscule"].includes(r.k) && mid(r) < 400).length;
    return [
      fig("Dated", formatNumber(C.dated), `of ${formatNumber(C.records)} records`),
      fig("Oldest dated", esc(oldest.d.replace(" century", " c.")), esc(oldest.n)),
      fig("Traditions", `${lanes.size} <small>of ${KINDS.length}</small>`, KINDS.length > lanes.size ? `${KINDS.filter((k) => !lanes.has(k.key)).map((k) => k.label).join(", ")} has no record yet` : "every one has records"),
      fig("Before AD 400", formatNumber(early), "Greek New Testament copies"),
    ];
  }
  function figuresC() {
    const withBooks = R.filter((r) => r.b?.length);
    const covered = new Set(withBooks.flatMap((r) => r.b)).size;
    return [
      fig("Books held", `${covered} <small>of 66</small>`, "in at least one record"),
      fig("Records with contents", formatNumber(withBooks.length), "read from the catalogues' words"),
      fig("Places", formatNumber(C.holders), "libraries, monasteries, museums"),
      fig("Records placed", formatNumber(C.placed), `of ${formatNumber(C.withHolder)} that name a holder`),
    ];
  }
  const TEXT = {
    a: ["a cabinet of witnesses", "The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus, now kept in libraries from Dublin to Sinai. Open any one to see its date, its contents and where it is today.", figuresA],
    b: ["across the centuries", "Every dated copy on one line of time, tradition by tradition, from the oldest Hebrew fragment to the last Gospels copied by hand. Then, book by book, how close the surviving copies come to the writing.", figuresB],
    d: ["across the centuries", "The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus. Open the great witnesses case by case, follow every dated copy through time, choose a book to see the copies that hold it, and find where they are kept today.", figuresB],
    c: ["book by book", "Choose a book of the Bible to see the surviving copies that hold it, oldest first, then follow the manuscripts to the libraries and monasteries that keep them today.", figuresC],
  };

  // B only: how many dated copies survive from each century, as a quiet strip; pointing at a century names it below.
  function centuries() {
    const buckets = new Map();
    for (const r of R) if ("e" in r) { const c = Math.floor((mid(r) - 1) / 100); buckets.set(c, (buckets.get(c) ?? 0) + 1); }
    const keys = [...buckets.keys()].sort((a, b) => a - b), max = Math.max(...buckets.values());
    const label = (c) => (c < 0 ? `${ordinal(-c)} century BC` : `${ordinal(c + 1)} century`);
    const bars = [];
    for (let c = keys[0]; c <= keys.at(-1); c++) {
      const n = buckets.get(c) ?? 0;
      bars.push(`<button type="button" class="cs-bar" data-c="${esc(label(c))}" data-n="${n}" style="--h:${(Math.sqrt(n / max) * 100).toFixed(1)}%"><i></i><span>${c === keys[0] ? esc(label(c).replace(" century", " c.")) : (c + 1) % 5 === 0 && c > 0 ? (c + 1) * 100 : ""}</span></button>`);
    }
    return `<div class="cs"><p class="cs-say" aria-live="polite">Dated copies per century. Point at a century.</p><div class="cs-bars" role="group" aria-label="Dated copies per century">${bars.join("")}</div></div>`;
  }

  function mount(section, { d }) {
    const [accent, lede, figures] = TEXT[d];
    section.innerHTML = `
      <div class="hc-intro">
        <div>
          <p class="hc-crumb"><a href="/study">Study</a><span>/</span><a href="/study">The Bible: formation &amp; transmission</a><span>/</span>Manuscripts</p>
          <h1>Manuscripts<em>${accent}</em></h1>
          <p class="hc-lede">${lede}</p>
        </div>
        <dl class="hc-figures">${figures().join("")}</dl>
      </div>${d === "b" || d === "d" ? centuries() : ""}`;
    if (d === "b" || d === "d") {
      const say = section.querySelector(".cs-say"), base = say.textContent;
      const show = (bar) => { say.innerHTML = bar ? `<b>${esc(bar.dataset.c)}</b> · ${plural(Number(bar.dataset.n), "dated copy", "dated copies")}` : base; };
      section.querySelector(".cs-bars").addEventListener("pointerover", (e) => show(e.target.closest(".cs-bar")));
      section.querySelector(".cs-bars").addEventListener("focusin", (e) => show(e.target.closest(".cs-bar")));
      section.querySelector(".cs-bars").addEventListener("pointerleave", () => show(null));
      section.querySelector(".cs-bars").addEventListener("click", (e) => { const bar = e.target.closest(".cs-bar"); if (bar) document.getElementById("lanes")?.scrollIntoView({ behavior: "smooth" }); });
    }
  }
  Sections.landing = { mount };
})();
