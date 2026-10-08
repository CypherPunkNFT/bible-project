// H · the dense part of each Roman-numeral chapter, under its sideways scenes: every event of the period in order, each
// with its verse, then the people, signs, words, what came of the word, the world stage, outside records and the dates,
// as typographic columns (no boxes). What goes in each chapter is listed in data/merged.json (chapters[]), as keys into
// data/moses.json; the verse texts come from the KJV files through merged.json (kjv).
(() => {
  const SIGN_GLYPH = ["staff", "darkness", "waves", "drop", "sun", "staff"];
  const vtext = (X, ref) => X.kjv[ref[0] === ref[1] ? String(ref[0]) : `${ref[0]}-${ref[1]}`] ?? "";
  const src = (ref, extra = "") => `<span class="lg-src">${refLink(ref)}<span class="lg-kjv">KJV</span>${extra}</span>`;
  const head = (title, g, note = "") => `<h4 class="lg-h">${g ? glyph(g, 22, 1.2) : ""}<span>${esc(title)}</span>${note ? `<small>${esc(note)}</small>` : ""}</h4>`;
  const block = (title, g, body, cls = "") => body ? `<section class="lg-b ${cls}">${head(title, g)}${body}</section>` : "";

  // One line of the timeline: a verse (title by this site, words from the KJV), an event of the leader page (its claim,
  // label and verses), a stop on the road (its verse and how sure the Atlas is of the place), the plagues, or a jump.
  function entry(e, X) {
    const age = e.age ? `<span class="lg-age"><b>${e.age}</b>years old</span>` : "";
    if (e.k === "gap") return `<li class="lg-gap"><a href="#mg-${e.go}" data-goch="${e.go}"><span>${esc(e.title)}</span><small>told in the next chapter</small>${icon("arrowRight", 14)}</a></li>`;
    if (e.k === "plagues") return `<li class="lg-ev"><b>${esc(e.title)}</b><span class="lg-plg">${M.plagues.map((p) => `<i title="${p.n}. ${esc(p.word)}">${glyph(p.word, 20, 1.3)}<small>${esc(p.word)}</small></i>`).join("")}</span>${src(e.ref, '<span class="lg-note">each verse on the plagues scene above</span>')}</li>`;
    if (e.k === "v") return `<li class="lg-ev ${e.age ? "has-age" : ""}">${age}<b>${esc(e.title)}</b><q>${esc(vtext(X, e.ref))}</q>${src(e.ref)}</li>`;
    if (e.k === "s") {
      const s = M.map.route[e.i];
      return `<li class="lg-ev is-stop">${age}<b>${icon("map", 13)}${esc(e.title)}</b><q>${esc(s.verse.text)}</q>${src(s.verse.ref, `<span class="lg-note">${esc(s.name)}: the Atlas is ${Math.round(s.confidence * 100)}% sure of the spot</span>`)}</li>`;
    }
    const ev = M.leader.events.find((x) => x.label === e.key), year = e.year ?? ev.year;
    return `<li class="lg-ev is-claim ${e.age ? "has-age" : ""}">${age}<b>${esc(ev.label)}${year && !e.age ? `<small>Year ${year} of the forty</small>` : ""}</b><p>${esc(ev.claim.text)}</p><span class="lg-src">${chip(ev.claim.layer)}${refList(ev.claim.refs)}</span></li>`;
  }

  // The people of the chapter, hanging off one fine line: name, how they stand to him, and what Scripture says.
  function people(c, X) {
    const all = peopleList();
    return `<ul class="lg-people">${c.people.map((id) => {
      const p = all.find((x) => x.id === id); if (!p) return "";
      const verses = (X.family[id] ?? []).slice(0, 1).map((r) => `<q>${esc(vtext(X, r))}</q>${src(r)}`).join("");
      const body = p.claim ? `<p>${esc(p.claim.text)}</p><span class="lg-src">${chip(p.claim.layer)}${refList(p.claim.refs)}</span>` : verses || `<p class="lg-muted">Named as his ${esc(p.role)} in the family list (TIPNR, STEP Bible).</p>`;
      const role = p.group === "family" ? (p.role === "brother or sister" ? (/miriam/.test(id) ? "sister" : "brother") : p.role) : p.role;
      return `<li style="--tone:${p.group === "family" ? "var(--egypt)" : p.group === "with" ? "var(--wild)" : "var(--midian)"}"><b>${esc(p.name.replace(/, one of five kings of Midian/, " (Midian)"))}</b><small>${esc(role)}</small>${body}</li>`;
    }).join("")}</ul>`;
  }
  const signs = (c) => (c.signs ?? []).map((l) => { const i = M.word.signs.findIndex((s) => s.label === l), s = M.word.signs[i];
    return `<div class="lg-sign">${glyph(SIGN_GLYPH[i] ?? "sparkle", 30, 1.2)}<div><b>${esc(s.label)}</b>${claim(s.claim)}</div></div>`; }).join("");
  const words = (c) => (c.words ?? []).map((t) => { const w = M.word.words.find((x) => x.to === t);
    return `<div class="lg-word"><small>To ${esc(w.to)}</small><blockquote>“${esc(w.quote.text)}”</blockquote>${src(w.quote.span)}${w.claim ? claim(w.claim) : ""}</div>`; }).join("");
  const message = (c) => (c.message ?? []).map((t) => { const m = M.word.message.find((x) => x.theme === t);
    return `<div class="lg-msg"><b>${esc(m.theme)}</b>${m.quotes.map((q) => `<blockquote>“${esc(q.text)}”</blockquote>${src(q.span)}`).join("")}${claim(m.claim)}</div>`; }).join("");
  const fulfil = (c) => (c.fulfil ?? []).map((i) => { const f = M.word.fulfilment[i];
    return `<div class="lg-ful"><div><small>The word</small>${claim(f.word)}</div><i aria-hidden="true">${icon("arrowRight", 14)}</i><div><small>What Scripture reports</small>${claim(f.reported)}</div></div>`; }).join("");
  const world = (c) => (c.world ?? []).map((t) => { const w = M.leader.worldStage.find((x) => x.power === t);
    return `<div class="lg-power"><b>${esc(w.power)}</b>${w.rulers.length ? `<small>${esc(w.rulers.map((r) => r.name).join(", "))}</small>` : ""}${claim(w.claim)}</div>`; }).join("");
  const call = (c) => (c.call ?? []).map((i, k) => { const s = M.word.call[i];
    return `<div class="lg-call"><span>${k + 1}</span><div><b>${esc(s.label)}</b><blockquote>“${esc(s.quote.text)}”</blockquote>${src(s.quote.span)}${claim(s.claim)}</div></div>`; }).join("");
  // The dates as views: Scripture's own numbers, then the two reconstructions on one axis of years BC.
  function dates() {
    const D = M.leader.dates, lo = 1500, hi = 1150, x = (y) => ((lo - y) / (lo - hi)) * 100;
    const marks = D.filter((d) => d.from).map((d, i) => `<span class="lg-dmark ${d.to ? "is-span" : ""} ${x(d.from) > 55 ? "is-flip" : ""}" style="--x:${x(d.from).toFixed(1)}%;--w:${d.to ? (x(d.to) - x(d.from)).toFixed(1) : 0}%;--row:${i}"><i></i><b>${d.approx ? "c. " : ""}${d.from}${d.to ? `–${d.to}` : ""} BC</b></span>`).join("");
    const ticks = [1500, 1400, 1300, 1200].map((y) => `<span style="--x:${x(y)}%">${y}</span>`).join("");
    return `<div class="lg-dates"><p class="lg-muted">${esc(D[0].note)}</p><div class="lg-axis">${marks}<div class="lg-ticks">${ticks}</div></div>
      ${D.filter((d) => d.from).map((d) => `<div class="lg-dview"><b>${esc(d.label)}</b><p>${esc(d.note)}</p><span class="lg-src">${chip("scholars")}${cites(d.cites)}</span></div>`).join("")}</div>`;
  }
  const nation = () => Object.entries({ worship: "Worship", building: "Building", alliances: "Alliances", people: "The people" })
    .map(([k, t]) => `<div class="lg-nat"><small>${t}</small>${M.leader.nation[k].map((c) => claim(c)).join("")}</div>`).join("");
  const two = () => M.leader.twoAccounts.map((t) => `<div class="lg-two"><b>${esc(t.topic)}</b><div>${claim(t.first)}${claim(t.second)}</div></div>`).join("");
  const ending = () => `${M.ending.scripture.map((c) => claim(c)).join("")}${quoteSpan({ text: M.leader.record.burial.text, span: M.leader.record.burial.span })}<div class="lg-trad">${M.ending.tradition.map((c) => claim(c)).join("")}</div>`;


  // The events band scrolls sideways inside itself, so the page scrolls straight past it. A slim pill under it shows
  // where you are: drag it, click the track, or use the arrows; trackpads and shift + wheel scroll it too.
  function wireScroller(box) {
    if (box.dataset.wired) return;
    box.dataset.wired = "1";
    const list = box.querySelector(".lg-time"), track = box.querySelector(".lg-track"), pill = box.querySelector(".lg-pill");
    const pos = box.querySelector(".lg-pos"), items = [...list.querySelectorAll(".lg-ev")];
    const update = () => {
      const max = list.scrollWidth - list.clientWidth, ratio = list.clientWidth / Math.max(list.scrollWidth, 1);
      box.classList.toggle("is-static", max < 4);
      const w = Math.max(ratio * 100, 8), at = max > 0 ? list.scrollLeft / max : 0;
      pill.style.width = `${w}%`; pill.style.left = `${at * (100 - w)}%`;
      box.style.setProperty("--fade-l", list.scrollLeft > 4 ? "3.5rem" : "0rem");
      box.style.setProperty("--fade-r", list.scrollLeft < max - 4 ? "3.5rem" : "0rem");
      const view = list.getBoundingClientRect();
      const shown = items.map((li, i) => [li.getBoundingClientRect(), i]).filter(([r]) => (r.left + r.right) / 2 > view.left && (r.left + r.right) / 2 < view.right).map(([, i]) => i + 1);
      pos.textContent = shown.length ? `${shown[0]}–${shown[shown.length - 1]} of ${items.length}` : "";
    };
    list.addEventListener("scroll", update, { passive: true });
    new ResizeObserver(update).observe(list);
    box.querySelectorAll(".lg-step").forEach((b) => b.addEventListener("click", () => list.scrollBy({ left: Number(b.dataset.step) * list.clientWidth * 0.85, behavior: "smooth" })));
    const seek = (clientX) => {
      const r = track.getBoundingClientRect(), w = pill.getBoundingClientRect().width;
      const at = Math.min(Math.max((clientX - r.left - w / 2) / Math.max(r.width - w, 1), 0), 1);
      list.scrollLeft = at * (list.scrollWidth - list.clientWidth);
    };
    track.addEventListener("pointerdown", (e) => {
      e.preventDefault(); track.setPointerCapture(e.pointerId); box.classList.add("is-dragging"); seek(e.clientX);
      const move = (ev) => seek(ev.clientX);
      const up = () => { box.classList.remove("is-dragging"); track.removeEventListener("pointermove", move); track.removeEventListener("pointerup", up); track.removeEventListener("pointercancel", up); };
      track.addEventListener("pointermove", move); track.addEventListener("pointerup", up); track.addEventListener("pointercancel", up);
    });
    list.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); list.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * list.clientWidth * 0.85, behavior: "smooth" }); }
    });
    update();
  }
  const wireAll = (root) => root.querySelectorAll?.(".lg-scroll").forEach(wireScroller);
  new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.matches?.(".lg-scroll")) wireScroller(n); wireAll(n); } })))
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => wireAll(document));

  window.MergedLedger = {
    html(c, X) {
      const blocks = [
        block("People of this chapter", "users", people(c, X), "lg-span"),
        c.call ? block("The call", "flame", call(c)) : "",
        block("Signs and wonders", "sparkle", signs(c)),
        block("Words he spoke", "message", words(c)),
        block("The message", "scroll", message(c)),
        c.accession ? block("Refused, then sent", "crown", c.accession.map((i) => claim(M.leader.accession[i])).join("")) : "",
        block("What came of the word", "arrowRight", fulfil(c)),
        c.nation ? block("The nation under him", "tent", nation()) : "",
        c.twoAccounts ? block("Two accounts, side by side", "layers", two()) : "",
        block("The world stage", "crown", world(c)),
        c.outside ? block("Outside the Bible", "scroll", M.leader.outside.map((o) => `<div class="lg-power"><b>${esc(o.name)}</b><small>${esc(o.date)}</small>${claim(o.claim)}</div>`).join("")) : "",
        c.dates ? block("When? The dates, as views", "hourglass", dates()) : "",
        c.verdict ? block("Where it went ill", "drop", M.leader.verdictNotes.map((v) => claim(v)).join("")) : "",
        c.ending ? block("His end", "eye", ending(), "lg-span") : "",
        c.notSaid ? block("What Scripture does not say", "help", `<ul class="lg-not">${c.notSaid.map((i) => `<li>${esc(M.notSaid[i])}</li>`).join("")}</ul>`) : "",
      ].join("");
      const n = c.timeline.filter((e) => e.k !== "gap").length;
      return `<div class="lg">
        <div class="lg-tl">${head("The events, in order", "route", `${n} · each with its verse`)}<div class="lg-scroll"><ol class="lg-time" tabindex="0" aria-label="The events, in order: scrolls sideways">${c.timeline.map((e) => entry(e, X)).join("")}</ol><div class="lg-bar"><button type="button" class="lg-step" data-step="-1" aria-label="Earlier events">${icon("arrowRight", 14)}</button><span class="lg-track"><span class="lg-pill"></span></span><span class="lg-pos"></span><button type="button" class="lg-step" data-step="1" aria-label="Later events">${icon("arrowRight", 14)}</button></div></div></div>
        <div class="lg-blocks">${blocks}</div></div>`;
    },
  };
})();
