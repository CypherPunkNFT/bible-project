// Small shared pieces for the three directions: source links, the record button, section heads, the quiet row of
// figures (all counted from data.js), the reasoning thread and the closing section with sources and links.
(() => {
  const { SOURCES, CASES, readings, REASONING, READING, REMAINS, REGISTER, LICENCE, HERO } = PM;
  const { byId, mid } = MSX;

  // Source links: words with a small arrow, never boxes.
  const cite = (ids) => `<p class="pm-cites">${ids.map((id) => {
    const s = SOURCES[id];
    if (!s) { console.error(`cite: unknown source "${id}"`); return ""; }
    return `<a href="${esc(s[1])}" target="_blank" rel="noopener noreferrer">${esc(s[0])}<span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
  }).join("")}</p>`;

  // A button that opens a manuscript's record sheet (only for witnesses with an open record).
  const recButton = (rec, label = "Open the record") => (rec && byId.has(rec)
    ? `<button type="button" class="pm-rec" data-open="${esc(rec)}">${esc(label)}<span aria-hidden="true">→</span></button>` : "");

  const sectionHead = (num, kicker, title, lead = "") => `<header class="pm-head"><p class="kicker">${num ? `<span class="ms-num">${num}</span><span class="ms-dot" aria-hidden="true">·</span>` : ""}${kicker}</p><h2>${title}</h2>${lead ? `<p class="pm-lead">${lead}</p>` : ""}</header>`;

  // The oldest dated copy of a book, ignoring dates that span more than two centuries (two records are dated
  // "2nd–10th" and "5th–9th century"; their middle is not an age anyone has claimed).
  function oldestOf(book) {
    const rs = MS.records.filter((r) => r.b?.includes(book) && "e" in r && r.l - r.e <= 200);
    return rs.reduce((a, b) => (b.e < a.e ? b : a));
  }
  // The gap between when a book was written (an approximate editorial range) and its oldest dated copy.
  function gapOf(book) {
    const [w0, w1] = MS.written[String(book)], o = oldestOf(book);
    return { oldest: o, from: Math.max(0, o.e - w1), to: Math.max(0, o.l - w0), written: [w0, w1] };
  }
  const caseBook = (id) => MS.bookOf[id];
  const rowCount = () => CASES.reduce((n, c) => n + readings(c.id, false).length, 0);

  // The quiet row of figures under every opening, counted from data.js and content.js.
  function figures(which = "all") {
    const fig = (label, value, note) => `<div><dt>${label}</dt><dd>${value}</dd><small>${note}</small></div>`;
    const g = gapOf(caseBook("galatians")), m = gapOf(caseBook("mark"));
    const dated = MS.records.filter((r) => "e" in r).length;
    const pictured = MS.records.filter((r) => r.im).length;
    const items = [
      fig("Passages", "3", "Galatians 1:3 · Romans 5:1 · Mark 16"),
      fig("Witnesses compared", String(rowCount()), "manuscripts, editions and one gap"),
      fig("Open records", formatNumber(MS.total), `hold one of the three books · ${formatNumber(dated)} dated`),
      fig("Oldest copy", esc(g.oldest.d.replace("c. ", "c. ")), `${esc(g.oldest.n)}, of Galatians and Romans`),
      fig("Written to copied", `${g.from}–${g.to} <small>yrs</small>`, "Galatians to P46 · approximate"),
      fig("Mark’s oldest", esc(m.oldest.d), `${esc(m.oldest.n)} · Mark 16 itself lost`),
      fig("Sources", String(Object.keys(SOURCES).length), `cited · ${pictured} open pictures`),
    ];
    return `<dl class="ms-figures pm-figures">${(which === "short" ? items.slice(0, 5) : items).join("")}</dl>`;
  }

  // Observation, judgment and limit as three statements, each with its own icon (no boxes, no connecting thread).
  const REASON_ICONS = {
    reveal: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/><path d="M8 11h6M11 8v6"/>',
    reason: '<path d="M12 3v18M5 21h14"/><path d="M3 7h18"/><path d="m6 7-3 7a3 3 0 0 0 6 0z"/><path d="m18 7-3 7a3 3 0 0 0 6 0z"/>',
    certain: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-5"/><circle cx="12" cy="18" r="1"/>',
  };
  const reasonIcon = (key) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${REASON_ICONS[key]}</svg>`;
  function reasoning(id) {
    const a = REASONING[id];
    const step = (key, title, body, extra = "", cls = "") => `<div class="pm-reason-step${cls}"><span class="pm-reason-icon">${reasonIcon(key)}</span><div><h4>${title}</h4><p>${esc(body)}</p>${extra}</div></div>`;
    return `<div class="pm-reason">
      ${step("reveal", "What the comparison reveals", a.observation)}
      ${step("reason", "How an editor reasons", a.judgment)}
      ${step("certain", "How certain is this?", a.limit, cite(a.links), " is-limit")}
    </div>`;
  }

  // The close of every direction: further reading as words on a line, what remains to be checked, the register, links.
  function closing(num) {
    const paths = READING.map((p) => `<a href="${esc(SOURCES[p.src][1])}" target="_blank" rel="noopener noreferrer"><small>${esc(p.k)}</small><b>${esc(p.title)}</b><span>${esc(p.text)}</span><em>${esc(p.by)} ↗</em></a>`).join("");
    const studies = [
      ["/study/manuscripts", "Study", "Manuscripts", "Over five thousand open records: through time, by book and where they are kept."],
      ["/study/surviving-witnesses", "Study · 01", "The surviving witnesses", "Six manuscripts examined as objects: what remains, where it travelled."],
      ["/study/academic?area=texts", "Academic studies", "The Bible: formation & transmission", "Return to the collection of studies."],
    ].map(([href, k, t, line]) => `<a href="${href}"><small>${esc(k)}</small><b>${esc(t)}</b><span>${esc(line)}</span></a>`).join("");
    return `${sectionHead(num, "Keep investigating", "Follow the evidence <em>further.</em>")}
      <div class="pm-close">
        <div><p class="on-k">Read further</p><nav class="on-links pm-paths" aria-label="Further reading">${paths}</nav></div>
        <div><p class="on-k">On this site</p><nav class="on-links" aria-label="Related studies">${studies}</nav></div>
        <div class="pm-remains"><p class="on-k">What remains to be checked</p><p>${esc(REMAINS)}</p>
          <details class="sr-more pm-register"><summary>Source register &amp; reading conventions</summary>${REGISTER.map((p) => `<p>${p}</p>`).join("")}${cite(Object.keys(SOURCES))}<p>${LICENCE}</p>
            <p>Manuscript records: the open Manuscripts collection (Wikidata CC0, with English Wikipedia CC BY-SA 4.0; Syriaca.org CC BY 3.0), ${formatNumber(MS.total)} records holding Galatians, Romans or Mark. Dates and contents are the catalogues’ own; each record sheet names its source.</p></details>
        </div>
      </div>
      <p class="pm-end">${HERO.end}</p>`;
  }

  // Line-drawing helpers shared by the opening drawings.
  const inkLines = (x, y, w, rows, gap, seed = 0, dash = "6 2 3 1.5") => Array.from({ length: rows }, (_, r) => {
    const len = w - ((r * 7 + seed) % 11);
    return `<path d="M${x} ${(y + r * gap).toFixed(1)}h${len}" stroke-dasharray="${dash}" opacity="${(0.32 + (r % 4) * 0.12).toFixed(2)}"/>`;
  }).join("");

  // One delegated handler for two-state and choice groups: [data-group] buttons set aria-pressed and call back.
  function choice(root, selector, onPick) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest(selector);
      if (!b || !root.contains(b)) return;
      const group = b.closest('[role="group"], ol, ul') ?? root;
      group.querySelectorAll(selector).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      onPick(b);
    });
  }

  window.PMX = { cite, recButton, sectionHead, figures, reasoning, closing, inkLines, choice, oldestOf, gapOf, caseBook, mid };
})();
