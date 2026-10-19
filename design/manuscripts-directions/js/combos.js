// Consolidated sections (owner 2026-10-18: "the page is long and the good sections are buried"). Each one is built from
// the existing sections, mounted into panes, so nothing is redrawn twice:
//   bookpill   – "Book by book" with a pill switch, as on Teachers: which copies hold each book | how close to the writing
//   shelf      – the great witnesses as one sideways shelf (Hebrew, Greek, translations in a row) with the standard pill
//   collection – the shelf on top of the catalogue: the famous copies first, then every record
//   explore    – one section whose pill switches between the page's views (time, books, closeness, places, catalogue)
// A pane is mounted the first time it is shown, so the map and the timeline measure themselves at their real size.
(() => {
  // Mounts section `key` into a fresh element placed in `into` first (so it measures itself at its real size); `bare`
  // drops its own heading and keeps only its lead line as a note.
  function part(key, into, { bare = false } = {}) {
    const el = document.createElement("div");
    el.className = `ms-part ms-part-${key}`;
    into.append(el);
    Sections[key].mount(el, { num: "" });
    if (bare) {
      const head = el.querySelector(":scope > .ms-head");
      const lead = head?.querySelector("h2 + p")?.textContent;
      head?.replaceWith(Object.assign(document.createElement("p"), { className: "ms-part-lead", textContent: lead ?? "" }));
    }
    return el;
  }

  // A pill of views over one stage; each view is mounted when first chosen.
  // `opts.pillInto` places the pill elsewhere (beside the title); `opts.onShow(key, pane)` runs after a view is shown.
  function switcher(section, views, label, opts = {}) {
    const pill = document.createElement("div");
    pill.className = "ct-sort ms-switch";
    pill.setAttribute("role", "tablist");
    pill.setAttribute("aria-label", label);
    pill.innerHTML = views.map(([key, name], i) => `<button type="button" role="tab" data-view="${key}" aria-checked="${i === 0}" aria-selected="${i === 0}">${name}</button>`).join("");
    const stage = document.createElement("div");
    stage.className = "ms-stage";
    if (opts.pillInto) { opts.pillInto.append(pill); section.append(stage); } else section.append(pill, stage);
    const panes = new Map();
    function show(key) {
      for (const b of pill.querySelectorAll("[data-view]")) { const on = b.dataset.view === key; b.setAttribute("aria-checked", String(on)); b.setAttribute("aria-selected", String(on)); }
      if (!panes.has(key)) {
        const [, , make] = views.find((v) => v[0] === key);
        try { const el = document.createElement("div"); el.className = "ms-pane"; stage.append(el); panes.set(key, el); make(el); }
        catch (error) { console.error(`Manuscripts page: the "${key}" view failed to draw`, error); const el = Object.assign(document.createElement("p"), { className: "t-failed", textContent: "This view could not be drawn." }); stage.append(el); panes.set(key, el); }
      }
      for (const [k, el] of panes) el.hidden = k !== key;
      opts.onShow?.(key, panes.get(key));
    }
    pill.addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) show(b.dataset.view); });
    show(views[0][0]);
  }

  // The standard pill turned sideways, under a row that scrolls across: a thumb with no track, mirroring the scroll.
  function sidePill(row) {
    const bar = document.createElement("div"), thumb = document.createElement("span");
    bar.className = "ms-hbar"; bar.setAttribute("aria-hidden", "true"); thumb.className = "ms-hthumb";
    bar.append(thumb); row.after(bar);
    const measure = () => {
      const range = row.scrollWidth - row.clientWidth, ratio = row.clientWidth / row.scrollWidth;
      bar.hidden = range <= 1;
      thumb.style.width = `${ratio * 100}%`;
      thumb.style.left = `${range > 0 ? (row.scrollLeft / range) * (1 - ratio) * 100 : 0}%`;
    };
    row.addEventListener("scroll", measure, { passive: true });
    new ResizeObserver(measure).observe(row);
    // A vertical wheel over the shelf moves it sideways until it reaches an end, then the page scrolls on.
    row.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = row.scrollLeft <= 0 && e.deltaY < 0, atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      row.scrollLeft += e.deltaY;
    }, { passive: false });
    thumb.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const x0 = e.clientX, left0 = row.scrollLeft, perPixel = row.scrollWidth / bar.clientWidth;
      thumb.setPointerCapture(e.pointerId);
      const move = (m) => { row.scrollLeft = left0 + (m.clientX - x0) * perPixel; };
      thumb.addEventListener("pointermove", move);
      thumb.addEventListener("pointerup", () => thumb.removeEventListener("pointermove", move), { once: true });
    });
    measure();
  }
  function shelfify(el) {
    el.classList.add("ms-shelf");
    const row = el.querySelector(".cab");
    if (row) sidePill(row);
    return el;
  }

  Sections.bookpill = {
    mount(section, { num }) {
      section.innerHTML = head(num, "Book by book", `Choose a book, <em>see its copies</em>`,
        "Which surviving copies hold each book of the Bible, and how close the oldest of them comes to when the book was written.");
      switcher(section, [["hold", "Which copies hold it", (pane) => part("books", pane, { bare: true })], ["close", "How close to the writing", (pane) => part("closeness", pane, { bare: true })]], "Book by book");
    },
  };

  // B's first section (owner 2026-10-18): the timeline and the two book views under one title, with the pill to the right
  // of the title as on Teachers; under the title, the chosen view's own description.
  Sections.timebook = {
    mount(section, { num }) {
      section.innerHTML = `<div class="ms-headrow">${head(num, "Through time · book by book", `Every dated copy, <em>by time and by book</em>`, "")}<div class="ms-headpill"></div></div>
        <p class="ms-sublead" aria-live="polite"></p>`;
      const sub = section.querySelector(".ms-sublead");
      switcher(section, [
        ["time", "Through time", (pane) => part("lanes", pane, { bare: true })],
        ["hold", "By book", (pane) => part("books", pane, { bare: true })],
        ["close", "How close", (pane) => part("closeness", pane, { bare: true })],
      ], "Through time or book by book", {
        pillInto: section.querySelector(".ms-headpill"),
        // The view's own lead moves up under the title, so each view reads as a subparagraph of the one heading.
        onShow: (key, pane) => { const lead = pane.querySelector(".ms-part-lead"); sub.textContent = lead?.textContent ?? ""; if (lead) lead.hidden = true; },
      });
    },
  };

  Sections.shelf = {
    mount(section, { num }) {
      Sections.cabinet.mount(section, { num });
      shelfify(section);
    },
  };

  Sections.collection = {
    mount(section, { num }) {
      section.innerHTML = head(num, "Every manuscript", `The great witnesses, <em>then every record</em>`,
        "The famous copies on one shelf, oldest first in each family; below them the whole catalogue, by kind, searchable.");
      shelfify(part("cabinet", section, { bare: true }));
      part("kinds", section, { bare: true });
    },
  };

  Sections.explore = {
    mount(section, { num }) {
      section.innerHTML = head(num, "Explore", `One collection, <em>five ways in</em>`,
        "Choose a way in: through time, by book, how close the copies come to the writing, where they are kept, or the whole catalogue.");
      switcher(section, [
        ["time", "Through time", (pane) => part("lanes", pane)],
        ["books", "By book", (pane) => part("books", pane)],
        ["close", "How close", (pane) => part("closeness", pane)],
        ["places", "Where they are", (pane) => part("places", pane)],
        ["all", "Every manuscript", (pane) => { shelfify(part("cabinet", pane)); part("kinds", pane); }],
      ], "Ways into the collection");
    },
  };
})();
