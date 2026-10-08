// 02 · Teachers through the Bible: a ring of 66 spokes, one per book, each as long as the chosen teacher's works on it
// (or everyone's, summed). A teacher list on the left, the ring in the middle, and a narrow book panel on the right
// listing that teacher's works on the chosen book, each linking to the work itself. Teachers whose works are dated
// (Spurgeon) also get a year slider that grows the ring through their preaching life. Generalised from the
// preached-Bible direction's "Spurgeon through the Bible".
window.Sections = window.Sections || {};
(() => {
  const SECTION_LABEL = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
  const PLAY = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';
  const PAUSE = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const R0 = 92, R1 = 240, STEP = (Math.PI * 2) / 66, PAD = 0.012;

  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // In the list, a middle name is dropped so names fit ("Charles Haddon Spurgeon" → "Charles Spurgeon"); initials stay.
  const listName = (name) => { const parts = name.split(/\s+/); return parts.length > 2 && !parts[0].endsWith(".") ? `${parts[0]} ${parts.at(-1)}` : name; };
  const initials = (name) => { const parts = name.replace(/\./g, "").split(/\s+/); return (parts[0][0] + parts.at(-1)[0]).toUpperCase(); };
  // Dates come as YYYY, YYYY-MM or YYYY-MM-DD; anything else (e.g. "1784/1785") is shown as written.
  const formatDate = (raw) => {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(raw ?? "");
    if (!m) return raw ?? "";
    const [, y, mo, d] = m;
    return d ? `${Number(d)} ${MONTHS[mo - 1]} ${y}` : mo ? `${MONTHS[mo - 1]} ${y}` : y;
  };
  const exactYear = (w) => (w.d && /^\d{4}(-|$)/.test(w.d) && !w.d.includes("/") ? Number(w.d.slice(0, 4)) : null);

  // ── Data: per teacher, their works on Bible texts filed by book; plus everyone summed ──────────────────────────
  function buildData() {
    const { books, people } = AUTHORS;
    const bookOf = (w) => Math.floor(w.v / 1e6) - 1;
    const teachers = people.filter((p) => p.passages.length).map((person) => {
      const byBook = books.map(() => []);
      const urls = new Map();
      for (const work of person.passages) {
        byBook[bookOf(work)].push({ work, person });
        if (work.u) urls.set(work.u, (urls.get(work.u) ?? 0) + 1);
      }
      // A year slider only where most works carry a date inside the teacher's working life, across ten or more years.
      const inLife = (w) => { const y = exactYear(w); return y !== null && y >= person.born + 14 && y <= lifeEnd(person); };
      const dated = person.passages.filter(inLife);
      const years = new Set(dated.map(exactYear));
      const timeline = dated.length >= person.passages.length / 2 && years.size >= 10;
      return { id: person.id, person, byBook, totals: byBook.map((l) => l.length), works: person.passages.length, urls, inLife, dated, timeline,
        anyDate: person.passages.some((w) => w.d), datedCount: person.passages.filter((w) => w.d).length,
        yearCount: new Set(person.passages.map(exactYear).filter((y) => y !== null)).size };
    }).sort((a, b) => b.works - a.works);
    const everyone = {
      id: "all", person: null, byBook: books.map((_, b) => teachers.flatMap((t) => t.byBook[b]).sort((x, y) => x.work.v - y.work.v || x.person.born - y.person.born)),
      works: teachers.reduce((n, t) => n + t.works, 0), timeline: false, anyDate: true,
    };
    everyone.totals = everyone.byBook.map((l) => l.length);
    for (const t of [everyone, ...teachers]) { t.max = Math.max(...t.totals); t.bookCount = t.totals.filter(Boolean).length; t.top = t.totals.indexOf(t.max); }
    const quiet = people.filter((p) => !p.passages.length).sort((a, b) => a.born - b.born);
    return { books, teachers, everyone, quiet, byId: new Map([everyone, ...teachers].map((t) => [t.id, t])) };
  }

  function mount(section) {
    const D = buildData();
    const { books } = D;
    const angle = (b) => -Math.PI / 2 + b * STEP;
    const point = (r, a) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    const radiusOf = (fraction) => R0 + (R1 - R0) * fraction;
    const wedge = (b, r) => {
      const a0 = angle(b) + PAD, a1 = angle(b + 1) - PAD, outer = Math.max(R0 + 1.5, r);
      return `M${point(R0, a0)} L${point(outer, a0)} A${outer} ${outer} 0 0 1 ${point(outer, a1)} L${point(R0, a1)} A${R0} ${R0} 0 0 0 ${point(R0, a0)}Z`;
    };
    const bookName = (b, chapter) => `${books[b].name === "Psalms" && chapter ? "Psalm" : books[b].name}`;

    const railItem = (t) => {
      const p = t.person;
      const tone = p ? familyOf(p).tone : "--accent";
      const disc = p ? initials(p.name) : icon("library", 16);
      return `<button type="button" class="thr-t" data-thr-teacher="${t.id}" aria-pressed="${t.id === "all"}" style="--tone: var(${tone})">
        <span class="thr-disc">${disc}</span>
        <span class="thr-t-text"><span class="thr-full">${p ? esc(listName(p.name)) : "Everyone"}</span><span class="thr-short">${p ? esc(p.short) : "Everyone"}</span>
          <small>${p ? `${lifeLabel(p)} · ${familyOf(p).label}` : `${D.teachers.length} teachers, summed`}</small></span>
        <b>${formatNumber(t.works)}</b></button>`;
    };

    section.style.setProperty("--tone", "var(--poetry)");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">02</span><div><p class="kicker">Book by book</p>
        <h2>Teachers <em>through</em> the Bible</h2>
        <p>Choose a teacher. Each spoke is one book of the Bible, as long as the number of their works on it. Choose a spoke to read those works.</p></div></header>
      <div class="thr-layout">
        <div class="thr-side">
          <nav class="thr-rail" aria-label="Choose a teacher">
            <p class="thr-rail-head"><span>Teachers</span><span>Works on Bible texts</span></p>
            ${[D.everyone, ...D.teachers].map(railItem).join("")}
          </nav>
          <details class="thr-quiet"><summary>${D.quiet.length} more teachers have no Bible texts recorded yet</summary>
            <p>Their works in the library do not name a main Bible text, so they have no ring. Choose a name for their profile.</p>
            <div>${D.quiet.map((p) => `<button type="button" data-thr-person="${p.id}">${esc(p.name)}</button>`).join("")}</div></details>
        </div>
        <div class="thr-ringcard">
          <div class="thr-who"></div>
          <svg class="thr-ring" viewBox="-330 -330 660 660" role="img" tabindex="0" aria-label="Works by book of the Bible. Use the left and right arrow keys to move between books.">
            <g class="thr-guides"></g>
            <g class="thr-spokes">${books.map((book, b) => `<path data-thr-book="${b}" fill="var(--${book.section})" d="${wedge(b, R0)}"><title></title></path>`).join("")}</g>
            <g class="thr-labels"></g>
            <circle r="${R0 - 6}" class="thr-hole"/>
            <text class="thr-big" y="-2" text-anchor="middle"></text>
            <text class="thr-small" y="22" text-anchor="middle"></text>
          </svg>
          <div class="thr-years-slot">
            <div class="thr-years">
              <button type="button" class="thr-play" aria-label="Play through the years">${PLAY}</button>
              <input type="range" class="thr-range" step="1" aria-label="Show works up to year">
              <output class="thr-readout"></output>
            </div>
            <p class="thr-years-note"></p>
          </div>
          <p class="thr-caption"></p>
        </div>
        <aside class="thr-book">
          <div class="thr-book-head"><p class="kicker"></p><h3></h3><p class="thr-book-sub"></p>
            <div class="thr-seg" role="group" aria-label="Order"><button type="button" data-thr-order="text" aria-pressed="true">By chapter</button><button type="button" data-thr-order="date" aria-pressed="false">By date</button></div></div>
          <ol class="thr-list"></ol>
        </aside>
      </div>`;

    const $ = (selector) => section.querySelector(selector);
    const paths = [...section.querySelectorAll(".thr-spokes path")];
    const slider = $(".thr-range"), playButton = $(".thr-play"), list = $(".thr-list");
    const shown = new Float32Array(66); // spoke lengths as drawn, 0–1 of the ring; they ease toward the goal
    let current = D.everyone, selected = current.top, hover = -1, order = "text", playing = false, raf = 0;
    let year = Infinity, firstYear = 0, lastYear = 0, ALL = 0, cumulative = null;

    // ── Counts for the current teacher, optionally up to a year ───────────────────────────────────────────────
    function prepareTimeline() {
      cumulative = null;
      if (!current.timeline) return;
      const years = current.dated.map(exactYear);
      firstYear = Math.min(...years); lastYear = Math.max(...years); ALL = lastYear + 1;
      cumulative = current.byBook.map((entries) => {
        const perYear = new Array(lastYear - firstYear + 1).fill(0);
        for (const { work } of entries) if (current.inLife(work)) perYear[exactYear(work) - firstYear]++;
        for (let i = 1; i < perYear.length; i++) perYear[i] += perYear[i - 1];
        return perYear;
      });
      slider.min = String(firstYear); slider.max = String(ALL); slider.value = String(ALL);
      year = ALL;
    }
    const limited = () => cumulative && year < ALL;
    const countAt = (b) => (!limited() ? current.totals[b] : year < firstYear ? 0 : cumulative[b][Math.min(year, lastYear) - firstYear]);
    const goal = (b) => Math.sqrt(countAt(b) / current.max);

    // ── Drawing ──────────────────────────────────────────────────────────────────────────────────────────────────
    function drawSpokes() { for (let b = 0; b < 66; b++) paths[b].setAttribute("d", wedge(b, radiusOf(shown[b]))); }
    function tick() {
      let moving = false;
      for (let b = 0; b < 66; b++) {
        const diff = goal(b) - shown[b];
        if (Math.abs(diff) > 0.002) { shown[b] += diff * 0.16; moving = true; } else shown[b] = goal(b);
      }
      drawSpokes();
      raf = moving || playing ? requestAnimationFrame(tick) : 0;
    }
    function kick() {
      if (reducedMotion()) { for (let b = 0; b < 66; b++) shown[b] = goal(b); drawSpokes(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function niceStep(max) {
      for (const s of [200, 100, 50, 20, 10, 5]) if (s <= max / 3) return s;
      return 0;
    }
    function drawFrame() {
      const max = current.max, mid = niceStep(max);
      $(".thr-guides").innerHTML = [mid, max].filter(Boolean).map((v) => {
        const r = radiusOf(Math.sqrt(v / max)).toFixed(1);
        return `<circle r="${r}" class="thr-guide"/><text class="thr-guide-label" x="0" text-anchor="middle" y="${(Number(r) + 11).toFixed(1)}">${formatNumber(v)}</text>`;
      }).join("");
      const labelled = current.totals.map((t, b) => [t, b]).filter(([t]) => t).sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, b]) => b);
      $(".thr-labels").innerHTML = labelled.map((b) => {
        const a = angle(b) + STEP / 2, r = R1 + 10, deg = (a * 180) / Math.PI, flip = Math.cos(a) < 0;
        return `<text class="thr-label" transform="translate(${point(r, a).replace(" ", ",")}) rotate(${flip ? deg + 180 : deg})" text-anchor="${flip ? "end" : "start"}" dominant-baseline="middle">${esc(books[b].name)}</text>`;
      }).join("");
      paths.forEach((path, b) => {
        path.classList.toggle("thr-zero", !current.totals[b]);
        path.firstElementChild.textContent = `${books[b].name}: ${plural(current.totals[b], "work")}`;
      });
    }

    function renderWho() {
      const t = current, p = t.person;
      $(".thr-who").innerHTML = p
        ? `<p class="kicker" style="--tone: var(${familyOf(p).tone})">${familyOf(p).label} · ${lifeLabel(p)}</p>
           <h3><button type="button" class="thr-name" data-thr-person="${p.id}" style="--tone: var(${familyOf(p).tone})">${esc(p.name)}</button></h3>
           <p>${plural(t.works, "work")} on a Bible text, across ${plural(t.bookCount, "book")}.</p>`
        : `<p class="kicker">Every teacher, summed</p><h3>Everyone</h3>
           <p>${plural(t.works, "work")} on a Bible text by ${D.teachers.length} teachers, across ${plural(t.bookCount, "book")}.</p>`;
      const longest = `The longest spoke is ${books[t.top].name}, with ${plural(t.max, "work")}.`;
      let caption = `Spoke length grows with the square root of the count, so small books stay visible. ${longest}`;
      if (!p) caption += ` Spurgeon's ${formatNumber(D.byId.get("author-charles-spurgeon")?.works ?? 0)} sermons are most of these, so this ring is mostly his.`;
      if (t.timeline) {
        const undated = t.person.passages.filter((w) => !w.d).length, outside = t.person.passages.length - t.dated.length - undated;
        caption += ` The slider counts the ${formatNumber(t.dated.length)} works dated ${firstYear}–${lastYear}; ${formatNumber(undated)} have no date${outside ? ` and ${outside} carry a date outside their working life` : ""}, so they appear only at “All”.`;
      }
      $(".thr-caption").textContent = caption;
      const note = $(".thr-years-note");
      $(".thr-years").hidden = !t.timeline;
      note.hidden = t.timeline;
      if (!p) note.textContent = "Choose Spurgeon to play his sermons through the years: most of them carry the date he preached them.";
      else if (!t.anyDate) note.textContent = `${p.short}'s works here carry no dates, so there is no year playback.`;
      else if (t.datedCount < t.works / 2) note.textContent = `Only ${formatNumber(t.datedCount)} of ${p.short}'s ${formatNumber(t.works)} works here carry a date, too few to play through the years.`;
      else if (!t.timeline) note.textContent = t.yearCount === 1 ? `${p.short}'s works here all come from one year, so there is no year playback.` : `${p.short}'s works here come from only ${t.yearCount} different years, too few to play through.`;
    }

    function center() {
      const b = hover >= 0 ? hover : selected;
      $(".thr-big").textContent = formatNumber(countAt(b));
      $(".thr-small").textContent = books[b].name;
      paths.forEach((path, i) => path.classList.toggle("thr-on", i === selected));
    }
    function readout() {
      if (!current.timeline) return;
      const all = current.works;
      const soFar = limited() ? current.dated.filter((w) => exactYear(w) <= year).length : all;
      $(".thr-readout").innerHTML = !limited() ? `<b>All</b> ${formatNumber(all)} works` : `<b>${year}</b> ${formatNumber(soFar)} dated so far`;
    }

    // ── The book panel: every work of this teacher on the chosen book, each linking to the work itself ──────────
    function workItem({ work, person }) {
      const b = Math.floor(work.v / 1e6) - 1, chapter = Math.floor(work.v / 1e3) % 1000, verse = work.v % 1000;
      const owner = D.byId.get(person.id);
      const volume = work.u && (owner.urls.get(work.u) ?? 0) > 1;
      const kind = work.g.replace(/-/g, " ");
      const go = work.u ? `<a class="thr-go" href="${esc(work.u)}" target="_blank" rel="noopener">${volume ? "Read in the volume" : `Read the ${kind}`}${icon("arrowUp", 12)}</a>` : "";
      const title = work.u
        ? `<a class="thr-work" href="${esc(work.u)}" target="_blank" rel="noopener" aria-label="${esc(work.t)}, ${volume ? "read in the volume" : `read the ${kind}`} (opens a new tab)">${esc(work.t)}</a>`
        : `<span class="thr-work">${esc(work.t)}</span>`;
      const bits = [
        `<a class="thr-ref" href="/read/kjv/${books[b].code}/${chapter}${verse > 1 ? `?hl=${verse}` : ""}" title="Read ${esc(bookName(b, true))} ${chapter} on this site">${icon("book", 12)}${work.t === work.r ? `Read ${esc(bookName(b, true))} ${chapter}` : esc(work.r)}</a>`,
        work.d ? formatDate(work.d) : "",
        current.person ? "" : `<span class="thr-who-tag" style="--tone: var(${familyOf(person).tone})">${esc(person.short)}</span>`,
        work.g !== "sermon" ? kind : "",
      ].filter(Boolean);
      return `<li class="thr-item">${title}<p class="thr-meta">${bits.join('<span class="thr-sep">·</span>')}</p>${go}</li>`;
    }
    function renderList() {
      const book = books[selected];
      const entries = current.byBook[selected].filter(({ work }) => !limited() || (current.inLife(work) && exactYear(work) <= year));
      const sorted = order === "date" ? [...entries].sort((a, b) => (a.work.d ?? "9").localeCompare(b.work.d ?? "9") || a.work.v - b.work.v) : entries;
      const panel = $(".thr-book");
      panel.style.setProperty("--tone", `var(--${book.section})`);
      panel.querySelector(".kicker").textContent = SECTION_LABEL[book.section];
      panel.querySelector("h3").textContent = book.name;
      panel.querySelector(".thr-book-sub").textContent = `${plural(entries.length, "work")}${limited() ? ` by ${year}` : ""} · ${current.person ? current.person.short : "every teacher"}`;
      panel.querySelector(".thr-seg").hidden = !entries.some(({ work }) => work.d);
      let lastChapter = 0;
      list.innerHTML = sorted.length ? sorted.map((entry) => {
        const chapter = Math.floor(entry.work.v / 1e3) % 1000;
        const head = order === "text" && chapter !== lastChapter ? `<li class="thr-chapter">${esc(bookName(selected, true))} ${chapter}</li>` : "";
        lastChapter = chapter;
        return head + workItem(entry);
      }).join("") : `<li class="thr-empty">${limited() ? `No works on ${esc(book.name)} by ${year}.` : `No works on ${esc(book.name)} by ${current.person ? esc(current.person.short) : "any teacher"} in the library yet.`}</li>`;
      list.scrollTop = 0;
    }

    // ── Choosing ─────────────────────────────────────────────────────────────────────────────────────────────────
    function setTeacher(id) {
      const next = D.byId.get(id);
      if (!next) throw new Error(`through: unknown teacher "${id}"; expected "all" or the id of a teacher with Bible texts`);
      stop();
      current = next;
      if (!current.totals[selected]) selected = current.top;
      year = Infinity;
      prepareTimeline();
      for (const item of section.querySelectorAll("[data-thr-teacher]")) item.setAttribute("aria-pressed", String(item.dataset.thrTeacher === id));
      const item = section.querySelector(`[data-thr-teacher="${id}"]`), rail = item.parentElement;
      if (rail.scrollWidth > rail.clientWidth + 2) rail.scrollTo({ left: item.offsetLeft - rail.offsetLeft - rail.clientWidth / 2 + item.offsetWidth / 2, behavior: reducedMotion() ? "auto" : "smooth" });
      section.querySelector(".thr-ringcard").style.setProperty("--tone", current.person ? `var(${familyOf(current.person).tone})` : "var(--accent)");
      drawFrame(); renderWho(); readout(); center(); renderList(); kick();
    }
    function selectBook(b) { selected = (b + 66) % 66; hover = -1; center(); renderList(); }

    function setYear(next, fromSlider = false) {
      const changed = next !== year;
      year = next;
      if (!fromSlider) slider.value = String(year);
      readout(); center(); kick();
      if (changed) renderList();
    }
    function play() {
      if (playing) { stop(); return; }
      playing = true;
      playButton.classList.add("thr-on"); playButton.innerHTML = PAUSE; playButton.setAttribute("aria-label", "Pause");
      const start = performance.now(), from = year >= ALL ? firstYear : year, perYear = reducedMotion() ? 40 : 130;
      const advance = (now) => {
        if (!playing) return;
        const next = Math.min(ALL, from + Math.floor((now - start) / perYear));
        if (next !== year) setYear(next);
        if (next >= ALL) { stop(); return; }
        requestAnimationFrame(advance);
      };
      setYear(from); requestAnimationFrame(advance);
    }
    function stop() {
      if (!playing) return;
      playing = false;
      playButton.classList.remove("thr-on"); playButton.innerHTML = PLAY; playButton.setAttribute("aria-label", "Play through the years");
    }

    const spokes = $(".thr-spokes");
    spokes.addEventListener("pointerover", (event) => { const p = event.target.closest("[data-thr-book]"); if (p) { hover = Number(p.dataset.thrBook); center(); } });
    spokes.addEventListener("pointerleave", () => { hover = -1; center(); });
    spokes.addEventListener("click", (event) => { const p = event.target.closest("[data-thr-book]"); if (p) selectBook(Number(p.dataset.thrBook)); });
    $(".thr-ring").addEventListener("keydown", (event) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!move) return;
      event.preventDefault(); selectBook(selected + move);
    });
    slider.addEventListener("input", () => { stop(); setYear(Number(slider.value), true); });
    playButton.addEventListener("click", play);
    section.addEventListener("click", (event) => {
      const teacher = event.target.closest("[data-thr-teacher]");
      if (teacher) { setTeacher(teacher.dataset.thrTeacher); return; }
      const who = event.target.closest("[data-thr-person]");
      if (who) { window.Teachers?.openProfile(who.dataset.thrPerson); return; }
      const button = event.target.closest("[data-thr-order]");
      if (!button) return;
      order = button.dataset.thrOrder;
      for (const b of section.querySelectorAll("[data-thr-order]")) b.setAttribute("aria-pressed", String(b === button));
      renderList();
    });

    setTeacher("all");
    // The ring grows from nothing the first time it scrolls into view.
    shown.fill(0); drawSpokes();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    const firstGrow = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      firstGrow.disconnect(); kick();
    }, { threshold: 0.2 });
    firstGrow.observe($(".thr-ring"));
  }

  Sections.through = { mount };
})();
