// The closing sections, the same in every direction. "Keep going": the studies, the apologetics question and the scholars
// as the same illustrated cards the Study page uses for this subject (drawing, caption, title, line, footer). Then "Behind
// the records", its own section: how much of the manuscript tradition the open data reaches, and where it comes from.
(() => {
  const C = MS.counts;
  // [kind, title, line, address, drawing, caption, footer, tone]: wording, captions and footers as the Study page has them.
  const LINKS = [
    ["Study", "The surviving witnesses", "Examine six manuscripts, reunite the scattered leaves of a codex, and discover what the surviving evidence can tell us.", "/study/surviving-witnesses", "manuscript", "Pages · Hands · Survival", "Manuscripts · Transmission · Evidence", "--prophets"],
    ["Interactive study", "A passage through the manuscripts", "Compare actual readings, inspect corrections and distinguish missing pages from omitted words.", "/study/passage-through-manuscripts", "variants", "Readings · Corrections · Comparison", "Readings · Corrections · Comparison", "--poetry"],
    ["Study", "The Dead Sea Scrolls", "Meet ancient manuscripts, compare scribal hands and psalms, and follow the evidence behind dates, joins and scholarly debates.", "/study/dead-sea-scrolls", "scroll", "Scrolls · Hands · Dates", "Scrolls · Hands · Dates", "--epistles"],
    ["Apologetics", "Has the Bible been changed beyond recognition?", "Trust God’s preservation and examine the actual manuscript witnesses.", "/apologetics/study/manuscripts", "question", "Question · Evidence · Answer", "Questions · Reasons · Replies", "--history"],
    ["Teachers", "Meet the scholars", "The scholars who study how the text was handed down, and what they found.", "/teachers/scholars", "scholars", "Lives · Works · Fields", "Scholars · Fields · Writings", "--gospels"],
  ];
  // The Study page's own symbolic drawings (AcademicCards.tsx), as plain SVG; "question" is new, in the same hand.
  const lines = (x, y, w, n = 7) => Array.from({ length: n }, (_, i) => `<path d="M${x} ${y + i * 9}h${w - (i % 3) * 7}" opacity="${i % 3 === 0 ? 0.7 : 0.3}"/>`).join("");
  const book = (x, y, w = 70) => `<g><path d="M${x} ${y}q${w / 4} -12 ${w / 2} 0q${w / 4} -12 ${w / 2} 0v72q-${w / 4} -10 -${w / 2} 0q-${w / 4} -10 -${w / 2} 0Z M${x + w / 2} ${y}v72" fill="var(--surface)"/>${lines(x + 8, y + 15, w / 2 - 15, 5)}${lines(x + w / 2 + 8, y + 15, w / 2 - 15, 5)}</g>`;
  const ART = {
    manuscript: `<g transform="rotate(-9 172 85)"><path d="M116 22h122v127H116Z" opacity=".4"/></g><path d="m123 25 118 5-3 119-22-4-16 7-20-6-19 8-41-8Z" fill="var(--surface)"/>${lines(136, 44, 40, 10)}${lines(188, 44, 36, 10)}`,
    variants: `${[85, 209].map((x) => `<g><path d="M${x} 27h69v117h-69Z" fill="currentColor" fill-opacity=".04"/>${lines(x + 10, 44, 49, 9)}<rect x="${x + 6}" y="75" width="57" height="14" fill="currentColor" fill-opacity=".15"/></g>`).join("")}<path d="M163 81h36m-6-5 6 5-6 5"/><path d="M176 37h9m-4-4v8" opacity=".4"/>`,
    scroll: `<path d="M100 41h153q17 0 17 16v74H119V57q0-16-19-16q-16 0-16 16v14h35M119 131q0 16-17 16h148q20 0 20-16" fill="currentColor" fill-opacity=".035"/>${lines(136, 60, 114, 7)}<path d="m220 47-6 26 6 16-5 31" opacity=".2"/>`,
    question: `<path d="M180 22c22 14 44 18 62 18v46c0 35-27 54-62 66-35-12-62-31-62-66V40c18 0 40-4 62-18Z" fill="currentColor" fill-opacity=".04"/><path d="M180 36c17 10 33 14 48 15v35c0 27-20 42-48 52-28-10-48-25-48-52V51c15-1 31-5 48-15Z" opacity=".35"/><path d="M168 74q0-14 13-14t13 12q0 9-13 13v10"/><circle cx="181" cy="107" r="2.4" fill="currentColor"/>`,
    scholars: `<g transform="translate(0 -12)">${[111, 180, 249].map((x, i) => `<g opacity="${i === 1 ? 1 : 0.45}"><circle cx="${x}" cy="${48 + (i % 2) * 9}" r="17"/><path d="M${x - 28} 106q0-33 28-33t28 33"/>${book(x - 24, 111, 48)}</g>`).join("")}</g>`,
  };
  const art = (kind) => `<svg viewBox="0 0 360 180" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><ellipse cx="180" cy="150" rx="117" ry="12" opacity=".08"/>${ART[kind]}</svg>`;
  const card = ([kind, title, line, href, drawing, caption, foot, tone]) => `<a class="sc-card" href="${href}" style="--tone: var(${tone})">
      <span class="sc-kind">${esc(kind)}</span><span class="sc-art">${art(drawing)}</span><span class="sc-caption">${esc(caption)}</span>
      <b class="sc-title">${esc(title)}</b><span class="sc-line">${esc(line)}</span>
      <span class="sc-foot"><small>${esc(foot)}</small><i>${icon("arrowUp", 15)}</i></span></a>`;
  const CLASSES = [["papyrus", "Papyri"], ["majuscule", "Majuscules"], ["minuscule", "Minuscules"], ["lectionary", "Lectionaries"]];
  const pct = (a, b) => Math.round((a / b) * 100);

  function coverage() {
    const bar = (label, n, of) => `<div class="cv-row"><span>${label}</span><span class="cv-track"><i style="width:${Math.min(100, pct(n, of))}%"></i></span><b>${pct(n, of)}%</b><small>${formatNumber(n)} of about ${formatNumber(of)}</small></div>`;
    return `<div class="cv">${CLASSES.map(([k, l]) => bar(l, C.ga[k], C.liste[k])).join("")}${bar("All Greek NT", C.gaTotal, C.liste.total)}</div>
      <p>The open data holds about ${pct(C.gaTotal, C.liste.total)}% of the Greek New Testament manuscripts in the official register, but nearly all of the oldest:
        ${pct(C.ga.papyrus, C.liste.papyrus)}% of the papyri and ${pct(C.ga.majuscule, C.liste.majuscule)}% of the majuscules. Most of what is missing is mediaeval.
        Another catalogue we consulted does not allow its records to be republished, so nothing from it is shown.</p>
      <p>Only ${formatNumber(C.lxxDated)} of the ${formatNumber(C.byKind.lxx)} Greek Old Testament records carry a date; most are a catalogue number alone.
        The ${formatNumber(C.byKind.dss)} scroll records give where each was found but no present holder; ${formatNumber(C.dssDated)} of them carry a date, most of them the period of their script.</p>`;
  }
  function credits() {
    const excluded = MS.excluded.map((x) => `<li><b>${esc(x.n)}</b>: ${esc(x.why)}.</li>`).join("");
    return `<ul class="sr-list">
        <li><b>Wikidata</b>, catalogue records, CC0.</li>
        <li><b>English Wikipedia</b>, dates, materials and contents for ${formatNumber(MS.records.filter((r) => r.wp).length)} records, CC BY-SA 4.0; each record links its article.</li>
        <li><b>ETCBC Dead Sea Scrolls</b>, transcriptions by Martin G. Abegg, Jr., James E. Bowley and Edward M. Cook; Text-Fabric conversion by Jarod Jacobs, Martijn Naaijer and Dirk Roorda. CC BY-NC 4.0, non-commercial.</li>
        <li><b>Dead Sea Scroll dates</b>: Popović et al. 2025, PLOS ONE e0323185 (radiocarbon, palaeography and AI estimates), CC BY 4.0; English Wikipedia's Qumran cave lists and its radiocarbon table, CC BY-SA 4.0.</li>
        <li><b>Syriaca.org</b>, ${formatNumber(MS.records.filter((r) => r.src === "syr").length)} Syriac biblical manuscripts after William Wright's catalogue, CC BY 3.0.</li>
        <li><b>Wikimedia Commons</b>, ${C.images} pictures, each credited where it appears.</li>
        <li><b>Natural Earth</b>, the land outline of the map, public domain.</li>
      </ul>
      <details class="sr-more"><summary>Left out, and why (${MS.excluded.length})</summary><ul>${excluded}</ul>
        <p>Two values are corrected on this page and marked where they appear: the date of Codex Ephraemi and the contents of Codex Vaticanus.</p></details>`;
  }

  function mount(section, { num }) {
    section.innerHTML = `${head(num, "Keep going", `Read them <em>more closely</em>`, "Three studies on this site look closely at real manuscripts; the apologetics question and the scholars follow on from them.")}
      <nav class="sc-grid" aria-label="Go deeper">${LINKS.map(card).join("")}</nav>`;
  }
  function mountBasis(section, { num }) {
    section.innerHTML = `${head(num, "Behind the records", `What the records <em>reach, and where they come from</em>`, "How much of the manuscript tradition the open catalogues hold, and the sources behind every record on this page.")}
      <div class="bs-grid">
        <div class="on-col"><p class="on-k">How far the open data reaches</p>${coverage()}</div>
        <div class="on-col"><p class="on-k">Where this comes from</p>${credits()}</div>
      </div>`;
  }
  Sections.onward = { mount };
  Sections.basis = { mount: mountBasis };
})();
