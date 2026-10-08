// The page itself: intro and figures, the section frames each part draws into, and the profile drawer any person opens.
(() => {
  const { people } = AUTHORS;
  const { escapeHtml: esc, toneOf, plural } = PB;
  const years = (p) => (p.died ? lifeLabel(p) : `born ${p.born}`);
  PB.years = years;

  const spurgeonWorks = PB.cells.reduce((n, cell) => n + (cell.counts[PB.SPURGEON] ?? 0), 0);
  const spurgeonShare = Math.round((spurgeonWorks / PB.totalWorks) * 100);
  PB.spurgeonWorks = spurgeonWorks;

  const partHead = (num, tone, kicker, title, lead) => `
    <div class="part-head" style="--tone: var(${tone})">
      <div><p class="kicker"><span class="part-num">${num}</span>${kicker}</p><h2>${title}</h2></div>
      <p class="part-lead">${lead}</p>
    </div>`;

  function skeleton() {
    const chapterTotal = PB.cells.length;
    return `<div class="wrap">
      <section class="intro">
        <div class="intro-copy">
          <p class="kicker">Authors · Scripture in the library</p>
          <h1>The Bible, as they <em>preached</em> it.</h1>
          <p>${people.length} preachers and writers have works in the library. Many of their sermons and commentaries take one chapter of Scripture as their main text. Here is the whole Bible, lit by those works, and the people behind them.</p>
        </div>
      </section>
      <dl class="figures">
        <div><dt>Chapters with a work on them</dt><dd>${formatNumber(PB.litCount)}<small> of ${formatNumber(chapterTotal)}</small></dd></div>
        <div><dt>Works with a main Bible text</dt><dd>${formatNumber(PB.totalWorks)}</dd></div>
        <div><dt>People with Bible texts recorded</dt><dd>${PB.preachers.length}<small> of ${people.length}</small></dd></div>
        <div><dt>Of those works, Spurgeon's</dt><dd>${spurgeonShare}%</dd></div>
      </dl>
      <section class="hero" id="hero" aria-label="The whole Bible, chapter by chapter"></section>
      <section class="part" id="voices">${partHead("01", "--gospels", "Compare", "One text, many voices", "The chapters the most different people in the library took as a main text. Choose one to lay their work on it side by side.")}<div id="voices-body"></div></section>
      <section class="part" id="spurgeon">${partHead("02", "--poetry", "One preacher, complete", "Spurgeon through the Bible", "The one preacher whose every sermon text is in the library. Each spoke is a book of the Bible; its length is how often he preached from it.")}<div id="spurgeon-body"></div></section>
      <section class="part" id="quiet">${partHead("03", "--prophets", "Gaps in the library", "Quiet chapters", "Chapters with no work in the library that takes them as a main text, book by book.")}<div id="quiet-body"></div></section>
      <section class="part" id="people">${partHead("04", "--accent", "Everyone", `All ${people.length} people`, "Every preacher and writer in the library. Choose a name for their profile.")}<div id="people-body"></div></section>
    </div>
    <div class="scrim" id="scrim" hidden></div>
    <aside class="profile" id="profile" role="dialog" aria-modal="true" aria-label="Profile" inert></aside>`;
  }

  // ── Profile drawer ────────────────────────────────────────────────────────────────────────
  const bookBars = (person, width = 264, height = 34) => {
    const max = Math.max(...person.books);
    if (!max) return "";
    const step = width / 66;
    return `<svg class="book-bars" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${person.books.map((n, b) => n
      ? `<rect x="${(b * step + 0.4).toFixed(1)}" y="${(height - Math.max(2, Math.sqrt(n / max) * height)).toFixed(1)}" width="${(step - 0.8).toFixed(1)}" height="${Math.max(2, Math.sqrt(n / max) * height).toFixed(1)}" rx="0.8" fill="var(--${AUTHORS.books[b].section})"/>`
      : `<rect x="${(b * step + 0.4).toFixed(1)}" y="${height - 1}" width="${(step - 0.8).toFixed(1)}" height="1" fill="var(--line)"/>`).join("")}</svg>`;
  };
  PB.bookBars = bookBars;

  function profileHtml(person) {
    const family = familyOf(person);
    const passages = person.books.reduce((n, v) => n + v, 0);
    const bookCount = person.books.filter(Boolean).length;
    const genres = Object.entries(person.genres).sort((a, b) => b[1] - a[1]);
    const preacher = PB.preachers.some((p) => p.person.id === person.id);
    return `<div class="profile-inner" style="--tone: var(${family.tone})">
      <div class="profile-top"><p class="kicker"><i class="dot"></i>${family.label}</p>
        <button type="button" class="icon-btn" data-close aria-label="Close">${icon("x", 18)}</button></div>
      <h2>${esc(person.name)}</h2>
      <p class="profile-years">${years(person)}</p>
      <p class="profile-line">${esc(person.line)}</p>
      <h3>Lived in</h3>
      <ol class="places">${person.places.map(([place, , , year]) => `<li><b>${esc(place)}</b><span>${year}</span></li>`).join("")}</ol>
      <h3>Known for</h3>
      <ul class="known">${person.known.map((k) => `<li><span>${esc(k.t)}<small>${k.y}</small></span>${k.inLibrary ? `<em class="in">In the library</em>` : `<em>Not in the library yet</em>`}</li>`).join("")}</ul>
      <h3>In the library</h3>
      <p class="profile-works"><b>${formatNumber(person.works)}</b> ${person.works === 1 ? "work" : "works"}${genres.length ? ` · ${genres.map(([g, n]) => `${formatNumber(n)} ${g.replace(/-/g, " ")}`).join(" · ")}` : ""}</p>
      ${passages ? `<h3>Bible texts</h3><p class="profile-note">${plural(passages, "work")} with a main Bible text, across ${plural(bookCount, "book")}. One bar per book, Genesis to Revelation.</p>${bookBars(person)}` : ""}
      ${preacher ? `<button type="button" class="pill-btn" data-light="${person.id}">${icon("book", 15)}Light up the Bible for ${esc(person.short)}</button>` : ""}
    </div>`;
  }

  const drawer = () => document.getElementById("profile");
  let lastTrigger = null;
  PB.openProfile = (id, trigger) => {
    const person = personById(id);
    if (!person) throw new Error(`openProfile: no person with id "${id}" in AUTHORS.people`);
    lastTrigger = trigger ?? null;
    drawer().innerHTML = profileHtml(person);
    drawer().inert = false;
    drawer().classList.add("open");
    document.getElementById("scrim").hidden = false;
    requestAnimationFrame(() => document.getElementById("scrim").classList.add("on"));
    drawer().querySelector("[data-close]").focus({ preventScroll: true });
  };
  function closeProfile() {
    if (!drawer().classList.contains("open")) return;
    drawer().classList.remove("open");
    drawer().inert = true;
    const scrim = document.getElementById("scrim");
    scrim.classList.remove("on");
    setTimeout(() => { if (!drawer().classList.contains("open")) scrim.hidden = true; }, 320);
    lastTrigger?.focus?.({ preventScroll: true });
  }

  function wireGlobal() {
    document.addEventListener("click", (event) => {
      const who = event.target.closest("[data-person]");
      if (who) { event.preventDefault(); PB.openProfile(who.dataset.person, who); return; }
      if (event.target.closest("[data-close]") || event.target.id === "scrim") { closeProfile(); return; }
      const light = event.target.closest("[data-light]");
      if (light) {
        closeProfile();
        PB.hero.setView(light.dataset.light);
        document.getElementById("hero").scrollIntoView({ behavior: PB.reducedMotion() ? "auto" : "smooth", block: "start" });
      }
    });
    addEventListener("keydown", (event) => { if (event.key === "Escape") closeProfile(); });
  }

  const main = Frame.mount();
  main.innerHTML = skeleton();
  wireGlobal();
  PB.hero = PB.mountHero(document.getElementById("hero"));
  PB.mountVoices(document.getElementById("voices-body"));
  PB.mountSpurgeon(document.getElementById("spurgeon-body"));
  PB.mountQuiet(document.getElementById("quiet-body"));
  PB.mountDirectory(document.getElementById("people-body"));
})();
