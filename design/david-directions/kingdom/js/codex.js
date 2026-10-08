// The codex: the reference part of David's reign page, one entry at a time, chosen from a side menu of big icons.
// Each entry is drawn rather than boxed: the verdict as one large quotation, the two accounts as a ribbon, the prophets
// as medallions, the powers placed round Israel, outside records on their own sand ground, the dating schemes on one
// scale, the open questions as floating words, and every passage as the long memory (codex-draw.js draws those three).
(() => {
  const BOOK = { samuel: "1–2 Samuel", kings: "1 Kings", chronicles: "1 Chronicles" };
  const toMap = (turn) => `<button type="button" class="on-map" data-go-turn="${turn}">${icon("map", 15)}Show on the map</button>`;
  const head = (title, lead) => `<header class="cx-head"><h3>${title}</h3>${lead ? `<p>${lead}</p>` : ""}</header>`;

  const E = {
    verdict: { name: "The verdict", icon: "scale", html: () => {
      const k = DV.records.find((r) => r.book === "kings").verdict;
      const row = (label, f) => `<div class="cx-row"><span>${label}</span>${DV.records.map((r) => `<p>${f(r) ?? '<em class="cx-none">Not given</em>'}</p>`).join("")}</div>`;
      const q = (x) => (x ? `“${esc(x.text)}” ${refLink(x.span)}` : null);
      return `${head("The verdict", "Kings' own words. The page adds no verdict of its own.")}
        <figure class="cx-verdict"><span class="cx-mark">${icon("check", 30, 1.6)}<small>Right in the eyes of the LORD</small></span>
          <blockquote>“${esc(k.text)}”</blockquote><figcaption>${refLink(k.span)} · KJV ${chip("scripture")}</figcaption></figure>
        <div class="cx-lines">${DV.verdictNotes.map((c) => claim(c)).join("")}</div>
        <h4 class="cx-sub">What each book records</h4>
        <div class="cx-books"><div class="cx-row cx-row-h"><span></span>${DV.records.map((r) => `<p>${BOOK[r.book] ?? r.book}</p>`).join("")}</div>
          ${row("Age at accession", (r) => r.age && `${r.age.years} · ${refLink(r.age.span)}`)}
          ${row("Length of reign", (r) => r.length && `${r.length.years} years · ${refLink(r.length.span)}`)}
          ${row("Capital", (r) => r.capital && `${esc(r.capital.name)} · ${refLink(r.capital.span)}`)}
          ${row("Death", (r) => r.death && `${esc(r.death.text)} ${refList(r.death.refs)}`)}
          ${row("Burial", (r) => q(r.burial))}
          ${row("Sources it names", (r) => q(r.sourcesCited))}</div>
        <p class="cx-small">${esc(DV.reign.text)} ${refList(DV.reign.refs)}</p>`;
    } },
    accounts: { name: "Samuel–Kings and Chronicles", icon: "split", html: () => `${head("Samuel and Kings beside Chronicles", `${DV.twoAccounts.length} places where the two accounts of David's reign differ. Both are shown as written, and never merged.`)}
        <div class="ribbon-head"><span>Samuel · Kings</span><span>Chronicles</span></div>
        <ol class="ribbons">${DV.twoAccounts.map((a, i) => `<li><p class="rb-topic"><b>${String(i + 1).padStart(2, "0")}</b>${esc(a.topic)}</p><div class="ribbon"><div class="rb-a">${claim(a.first)}</div><div class="rb-b">${claim(a.second)}</div></div></li>`).join("")}</ol>` },
    prophets: { name: "Samuel, Gad and Nathan", icon: "scroll", html: () => {
      const turnFor = { Samuel: 0, Gad: 22, Nathan: 10 };
      return `${head("The prophets beside him", "Samuel anointed him, Gad was “David's seer”, and Nathan brought both the promise and the rebuke.")}
        <div class="medals">${DV.prophets.map((p) => `<article class="medallion"><span class="md-ring"><span>${esc(p.person.name[0])}</span></span><h4>${esc(p.person.name)}</h4>
          <blockquote>“${esc(p.quote.text)}”<footer>${refLink(p.quote.span)} · KJV</footer></blockquote>${claim(p.claim)}<div class="md-foot">${toMap(turnFor[p.person.name] ?? 0)}<a class="ref" href="/people/${esc(p.person.personId)}">Person page</a></div></article>`).join("")}</div>`;
    } },
    world: { name: "The world stage", icon: "globe", html: () => `${head("On the world stage", "The powers of David's day, placed round Israel by the direction and distance of their cities from Jerusalem (from the Atlas positions). Touch one to read it.")}${CodexDraw.world()}` },
    outside: { name: "Outside the Bible", icon: "landmark", html: () => `${head("Outside the Bible", "Records from outside Scripture, kept apart from it, each with its date.")}
        <div class="sand">${DV.outside.map((o) => `<article class="sand-rec"><p class="sand-date">${icon("calendar", 13)}${esc(o.date)}</p><h4>${esc(o.name)}</h4>${claim(o.claim)}</article>`).join("")}</div>
        <p class="cx-small">Whether the Tel Dan stele names the house of David is one of the open questions.</p>` },
    dates: { name: "Dating views", icon: "calendar", html: () => {
      const A = 1070, B = 950, x = (y) => ((A - y) / (A - B)) * 100;
      const rows = DV.dates.map((d) => {
        const bar = d.from && d.to ? `<i class="dt-bar" style="left:${x(d.from)}%;width:${x(d.to) - x(d.from)}%"><b>${d.from}–${d.to} BC</b></i>`
          : d.to ? `<i class="dt-bar is-end" style="left:${x(d.to)}%;width:0"><b>died about ${d.to} BC</b></i>`
          : `<i class="dt-bar is-free" style="left:${x(1040)}%;width:${(40.5 / (A - B)) * 100}%"><b>30 at accession · 7 y 6 m + 33 y · no BC date</b></i>`;
        return `<li><div class="dt-l"><b>${esc(d.label)}</b><small>${esc(d.note)}</small>${d.cites ? `<span class="refs">${cites(d.cites)}</span>` : ""}</div><div class="dt-axis">${bar}</div></li>`;
      }).join("");
      const ticks = [1060, 1040, 1020, 1000, 980, 960].map((y) => `<span style="left:${x(y)}%">${y}</span>`).join("");
      return `${head("Dating views", "Each scheme with who holds it, on one scale of years before Christ. This page does not choose between them.")}
        <div class="dt"><div class="dt-ticks">${ticks}</div><ol class="dt-rows">${rows}</ol></div>
        <p class="cx-small">Bars run from the start of the reign to David's death. Scripture's own numbers give a length, not a date, so they float free of the scale.</p>`;
    } },
    questions: { name: "Open questions", icon: "help", html: () => `${head("What readers still ask", "Each question with its views and who holds them. Touch a view to read its argument; the page takes no side.")}${CodexDraw.questions()}` },
    notsaid: { name: "What Scripture does not say", icon: "eyeOff", html: () => `${head("What Scripture does not say", "")}<ol class="unsaid">${DV.notSaid.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>` },
    story: { name: "His story", icon: "book", html: () => `${head("His story", esc(DV.person.short))}
        <ol class="story">${DV.story.map((p, i) => `<li><span class="st-n">${String(i + 1).padStart(2, "0")}</span>${claim(p)}</li>`).join("")}</ol>
        <h4 class="cx-sub">A note on the family data</h4>${DV.identifications.map((c) => claim(c)).join("")}` },
    memory: { name: "Every passage", icon: "sparkle", html: () => `${head("The long memory", "Every verse that names David, as a point of light across the books of the Bible, sized by their chapters. Hover a point for its reference; touch it to open that book's chapters.")}
        <div class="gm" id="gm"><p class="cx-small">Gathering every verse…</p></div>
        <h4 class="cx-sub">The passages of the reign</h4><p class="cx-passages">${DV.passages.map((p) => refLink(p)).join(' <span class="ref-sep">·</span> ')}</p>` },
    sources: { name: "Sources", icon: "library", html: () => `${head("Sources", "")}
        <ol class="srcs">${DV.citations.map((c) => `<li><b>${esc(c.author)}</b> (${esc(c.year)}). <a href="${esc(c.url)}" target="_blank" rel="noreferrer">${esc(c.title)}</a>. <small>${esc(c.where)}</small></li>`).join("")}</ol>
        <div class="credits"><p>${esc(DV.credit.people)}</p><p>${esc(DV.credit.map)}</p><p>Scripture: King James Version, from the reader's own text. Crystals, icons and line art: drawn for this page.</p></div>` },
  };

  window.Codex = {
    mount(root) {
      const ids = Object.keys(E);
      root.innerHTML = `${sectionHead("04", `${icon("layers", 14)}The codex`, "Everything else on the page", "The verdict, the two accounts, the prophets, the powers, the records outside Scripture, the dates, the open questions and every passage, one at a time.", "codex-h")}
        <div class="cx"><nav class="cx-rail" aria-label="Codex entries">${ids.map((id, i) => `<button type="button" data-cx="${id}" aria-current="${i === 0}"><span class="cx-ico">${icon(E[id].icon, 26, 1.4)}</span><span>${E[id].name}</span></button>`).join("")}</nav>
        <div class="cx-panel"></div></div>`;
      const panel = root.querySelector(".cx-panel");
      let cur = null;
      function show(id, dir = 1) {
        if (!E[id]) return;
        cur = id;
        root.querySelectorAll("[data-cx]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.cx === id)));
        panel.innerHTML = `<section class="cx-sec" data-sec="${id}">${E[id].html()}</section>`;
        panel.style.setProperty("--dir", dir);
        panel.classList.remove("cx-enter"); void panel.offsetWidth; panel.classList.add("cx-enter");
        CodexDraw.after(id, panel);
      }
      root.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cx]");
        if (b) { const next = ids.indexOf(b.dataset.cx), prev = ids.indexOf(cur); show(b.dataset.cx, next >= prev ? 1 : -1); return; }
        const t = e.target.closest("[data-go-turn]");
        if (t) { Land.goTurn(Number(t.dataset.goTurn)); return; }
        if (e.target.closest(".cx-panel")) CodexDraw.onClick(e, panel);
      });
      panel.addEventListener("keydown", (e) => CodexDraw.onKey(e, panel));
      document.addEventListener("click", (e) => {
        const a = e.target.closest("[data-codex]");
        if (!a) return;
        e.preventDefault();
        show(a.dataset.codex);
        root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      });
      show(ids[0]);
      Codex.show = show;
    },
  };
})();
