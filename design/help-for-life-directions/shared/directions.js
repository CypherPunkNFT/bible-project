// The four ways to show the national lines. Each returns { html, wire, city } where city holds the options for the
// shared city section. The crisis lines keep their call/text buttons on the closed row in every direction.
(() => {
  const { LIFE, esc, plural, cat, tone, rowHtml, wireRows, setOpen, groupStats, sectionHead, subtitle, firstSentence, detailHtml, quickHtml, WAY_WORD } = window.Life;
  // 911 and 988 already lead the page in the crisis strip, so the Crisis list leaves them out (owner, 2026-10-08).
  const IN_STRIP = new Set(["emergency-911", "988-lifeline"]);
  const groups = LIFE.groups.map((g) => (g.id === "crisis" ? { ...g, entries: g.entries.filter((e) => !IN_STRIP.has(e.id)) } : g));
  const waysWords = (s) => s.ways.map((w) => WAY_WORD[w]).join(" · ");
  const roundClock = (s) => (s.always === s.n ? (s.n === 1 ? "Answers around the clock" : "All around the clock") : s.always ? `${s.always} around the clock` : "Set hours");
  const rowsFor = (g, extra = {}) => g.entries.map((e) => rowHtml(e, { cat: g.id, quick: g.id === "crisis" || extra.quickAll, quickMax: extra.quickAll && g.id !== "crisis" ? 1 : 2, ...extra })).join("");

  // ── A · Index: seven tinted cards as tabs, the chosen kind's lines in two columns ────────────────────────────
  const A = {
    title: "Index",
    html() {
      return `<section class="nat nat-a">
        ${sectionHead("01", "National lines", "Seven kinds of help. Choose one: each line shows how to reach it and what it costs, and opens for every number.")}
        <div class="cards-a" role="group" aria-label="Kind of help">${groups.map((g, i) => {
          const s = groupStats(g), c = cat(g.id);
          return `<button type="button" class="card-a" data-g="${g.id}" aria-pressed="${i === 0}" style="--c:${tone(g.id)}">
            <span class="ic">${icon(c.icon, 22)}</span><span class="t">${esc(c.short)}</span>
            <span class="m"><b>${s.n}</b> ${s.n === 1 ? "line" : "lines"}</span><span class="w">${esc(roundClock(s))}</span></button>`;
        }).join("")}</div>
        <div class="pane-a">${groups.map((g, i) => `<div class="pane" data-g="${g.id}"${i ? " hidden" : ""} style="--c:${tone(g.id)}">
          <p class="pane-title"><span>${esc(g.title)}</span><small>${plural(g.entries.length, "line")} · ${esc(waysWords(groupStats(g)))}</small></p>
          
          <ol class="rows two-col">${g.id === "crisis" ? g.entries.map((e) => Life.consolidatedRowHtml(e, { cat: g.id })).join("") : rowsFor(g)}</ol></div>`).join("")}</div>
      </section>`;
    },
    wire(root) {
      const cards = root.querySelectorAll(".card-a");
      cards.forEach((b) => b.addEventListener("click", () => {
        cards.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        root.querySelectorAll(".pane-a .pane").forEach((p) => { p.hidden = p.dataset.g !== b.dataset.g; });
      }));
      wireRows(root.querySelector(".pane-a"));
    },
    city: {},
  };

  // ── B · Directory: a column of solid-colour kinds beside a dense list; every line has its call button ───────
  const B = {
    title: "Directory",
    html() {
      return `<section class="nat nat-b">
        ${sectionHead("01", "National lines", "Pick a kind of help on the left. Every line has its first call or text button ready on the closed row; open it for everything else.")}
        <div class="dir-b">
          <div class="kinds-b" role="group" aria-label="Kind of help">${groups.map((g, i) => {
            const s = groupStats(g), c = cat(g.id);
            return `<button type="button" class="kind-b" data-g="${g.id}" aria-pressed="${i === 0}" style="--c:${tone(g.id)}">
              <span class="disc">${icon(c.icon, 18)}</span><span class="t">${esc(g.title.replace(/ — .*/, ""))}</span>
              <span class="n">${s.n}</span><span class="w">${esc(roundClock(s))} · ${esc(waysWords(s) || "Website")}</span></button>`;
          }).join("")}</div>
          <div class="list-b">${groups.map((g, i) => `<div class="pane" data-g="${g.id}"${i ? " hidden" : ""} style="--c:${tone(g.id)}">
            <p class="pane-title"><span>${esc(g.title)}</span><small>${plural(g.entries.length, "line")}</small></p>
            <ol class="rows">${rowsFor(g, { quickAll: true })}</ol></div>`).join("")}</div>
        </div>
      </section>`;
    },
    wire(root) {
      const kinds = root.querySelectorAll(".kind-b");
      kinds.forEach((b) => b.addEventListener("click", () => {
        kinds.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        root.querySelectorAll(".list-b .pane").forEach((p) => { p.hidden = p.dataset.g !== b.dataset.g; });
      }));
      wireRows(root.querySelector(".list-b"), { single: true });
    },
    city: { quickAll: true },
  };

  // ── C · Mosaic: every kind visible at once as tinted tiles; a line opens in a sheet that slides in beside ───
  const C = {
    title: "Mosaic",
    html() {
      const item = (e, g) => `<li class="item-c${g.id === "crisis" ? " crisis-item" : ""}" style="--c:${tone(g.id)}">
        <button type="button" class="item-head" data-id="${esc(e.id)}" aria-haspopup="dialog">
          <span class="row-name">${esc(e.name)}</span>
          <span class="meta-c"><span class="row-sub">${esc(subtitle(e))}</span><span class="row-cost${e.cost ? "" : " none"}">${e.cost ? `<b>${esc(e.cost)}</b>` : "Cost not stated"}${e.faith === true ? '<i class="faith">Faith-based</i>' : ""}</span></span>
          <span class="row-sum">${esc(firstSentence(e.summary))}</span></button>
        ${g.id === "crisis" ? `<div class="row-quick">${quickHtml(e, 2)}</div>` : ""}</li>`;
      const tile = (g) => {
        const s = groupStats(g), c = cat(g.id);
        return `<article class="tile-c" data-g="${g.id}" style="--c:${tone(g.id)}">
          <header><span class="ic">${icon(c.icon, 20)}</span><h3>${esc(g.title)}</h3><small>${plural(s.n, "line")} · ${esc(roundClock(s))}</small></header>
          <ul>${g.entries.map((e) => item(e, g)).join("")}</ul></article>`;
      };
      return `<section class="nat nat-c">
        ${sectionHead("01", "National lines", "All seven kinds of help at once. Tap a line to open its numbers, chat, hours and source beside the list; crisis lines can be called or texted straight from here.")}
        <div class="mosaic"><div class="left-c">${tile(groups[0])}<div class="stack-c">${groups.filter((g) => g.id === "grief" || g.id === "recovery").map(tile).join("")}</div></div>
          <div class="stack-c">${groups.slice(1).filter((g) => g.id !== "grief" && g.id !== "recovery").map(tile).join("")}</div></div>
        <aside class="sheet" role="dialog" aria-modal="false" aria-label="Line details" inert><div class="sheet-in"></div></aside>
      </section>`;
    },
    wire(root) {
      const sheet = root.querySelector(".sheet"), inner = sheet.querySelector(".sheet-in");
      const all = groups.flatMap((g) => g.entries.map((e) => [e.id, { e, g }]));
      const byId = new Map(all);
      let current = null;
      const close = () => { sheet.removeAttribute("data-open"); sheet.inert = true; current?.removeAttribute("aria-current"); current = null; };
      root.querySelectorAll(".item-head").forEach((b) => b.addEventListener("click", () => {
        if (current === b) return close();
        const { e, g } = byId.get(b.dataset.id);
        current?.removeAttribute("aria-current");
        current = b; b.setAttribute("aria-current", "true");
        sheet.style.setProperty("--c", tone(g.id));
        inner.innerHTML = `<button type="button" class="sheet-x" aria-label="Close">${icon("x", 18)}</button>
          <p class="kick">${esc(g.title)}</p><h3>${esc(e.name)}</h3><p class="row-sub">${esc(subtitle(e))}</p>
          <p class="sheet-sum">${esc(firstSentence(e.summary))}</p>
          <p class="row-cost${e.cost ? "" : " none"}">${e.cost ? `<b>${esc(e.cost)}</b>` : "Cost not stated on its page"}</p>
          ${quickHtml(e, 2) ? `<div class="row-quick">${quickHtml(e, 2)}</div>` : ""}${detailHtml(e)}`;
        inner.querySelector(".sheet-x").addEventListener("click", close);
        sheet.setAttribute("data-open", ""); sheet.inert = false;
      }));
      addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
      document.addEventListener("pointerdown", (ev) => { if (current && !sheet.contains(ev.target) && !ev.target.closest(".item-head")) close(); });
    },
    city: {},
  };

  // ── D · Open in place: each kind is a strip that opens where it is, as the Atlas's city cards do ───────────
  const D = {
    title: "Open in place",
    html() {
      return `<section class="nat nat-d">
        ${sectionHead("01", "National lines", "Seven kinds of help, each opening where it is. Crisis is open; the others show who is inside before you open them.")}
        <div class="strips">${groups.map((g, i) => {
          const s = groupStats(g), c = cat(g.id);
          const names = g.entries.map((e) => e.name.replace(/ \(.*\)$/, "").replace(/ — .*/, ""));
          return `<section class="strip-d" data-g="${g.id}" style="--c:${tone(g.id)}"${i === 0 ? " data-open" : ""}>
            <button type="button" class="strip-head" aria-expanded="${i === 0}">
              <span class="no">${String(i + 1).padStart(2, "0")}</span><span class="ic">${icon(c.icon, 22)}</span>
              <span class="t">${esc(g.title)}</span>
              <span class="m">${plural(s.n, "line")} · ${esc(roundClock(s))}${s.ways.length ? ` · ${esc(waysWords(s))}` : ""}</span>
              <span class="names">${esc(names.join(" · "))}</span>
              <span class="chev" aria-hidden="true">${icon("chevron", 20)}</span></button>
            <div class="strip-body"${i === 0 ? "" : " inert"}><div><ol class="rows three-col">${rowsFor(g)}</ol></div></div>
          </section>`;
        }).join("")}</div>
      </section>`;
    },
    wire(root) {
      root.querySelectorAll(".strip-head").forEach((b) => b.addEventListener("click", () => {
        const strip = b.closest(".strip-d"), open = !strip.hasAttribute("data-open");
        strip.toggleAttribute("data-open", open); b.setAttribute("aria-expanded", String(open));
        strip.querySelector(".strip-body").inert = !open;
      }));
      wireRows(root.querySelector(".strips"));
    },
    city: {},
  };

  // E: B improved (owner, 2026-10-08): the words under the title, still-waters art beside them, no section links.
  const E = { ...B, title: "Directory, improved", heroArt: true, noCrumbs: true };
  window.Directions = { a: A, b: B, c: C, d: D, e: E };
})();
