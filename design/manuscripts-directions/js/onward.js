// The closing section, the same in every direction: where to go next (the three manuscript studies, the apologetics
// question and the scholars, as words on a line rather than boxes), how complete the open data is, and its sources.
(() => {
  const C = MS.counts;
  const LINKS = [
    ["Study", "The surviving witnesses", "Examine six manuscripts, reunite the scattered leaves of a codex, and see what the evidence can tell us.", "/study/surviving-witnesses"],
    ["Interactive study", "A passage through the manuscripts", "Compare actual readings, inspect corrections and tell missing pages from omitted words.", "/study/passage-through-manuscripts"],
    ["Study", "The Dead Sea Scrolls", "Meet the scrolls, compare scribal hands and follow the evidence behind dates and joins.", "/study/dead-sea-scrolls"],
    ["Question", "Has the Bible been changed beyond recognition?", "The apologetics question these manuscripts answer.", "/apologetics/study/manuscripts"],
    ["People", "Meet the historians", "The scholars who study how the text was handed down.", "/teachers/scholars"],
  ];
  const CLASSES = [["papyrus", "Papyri"], ["majuscule", "Majuscules"], ["minuscule", "Minuscules"], ["lectionary", "Lectionaries"]];
  const pct = (a, b) => Math.round((a / b) * 100);

  function coverage() {
    const bar = (label, n, of) => `<div class="cv-row"><span>${label}</span><span class="cv-track"><i style="width:${Math.min(100, pct(n, of))}%"></i></span><b>${pct(n, of)}%</b><small>${formatNumber(n)} of about ${formatNumber(of)}</small></div>`;
    return `<div class="cv">${CLASSES.map(([k, l]) => bar(l, C.ga[k], C.liste[k])).join("")}${bar("All Greek NT", C.gaTotal, C.liste.total)}</div>
      <p>The open data holds about ${pct(C.gaTotal, C.liste.total)}% of the Greek New Testament manuscripts in the official register, but nearly all of the oldest:
        ${pct(C.ga.papyrus, C.liste.papyrus)}% of the papyri and ${pct(C.ga.majuscule, C.liste.majuscule)}% of the majuscules. Most of what is missing is mediaeval.
        Another catalogue we consulted does not allow its records to be republished, so nothing from it is shown.</p>
      <p>Only ${formatNumber(C.lxxDated)} of the ${formatNumber(C.byKind.lxx)} Greek Old Testament records carry a date; most are a catalogue number alone.
        The ${formatNumber(C.byKind.dss)} scroll records give where each was found, but no date or present holder.</p>`;
  }
  function credits() {
    const excluded = MS.excluded.map((x) => `<li><b>${esc(x.n)}</b>: ${esc(x.why)}.</li>`).join("");
    return `<ul class="sr-list">
        <li><b>Wikidata</b>, catalogue records, CC0.</li>
        <li><b>English Wikipedia</b>, dates, materials and contents for ${formatNumber(MS.records.filter((r) => r.wp).length)} records, CC BY-SA 4.0; each record links its article.</li>
        <li><b>ETCBC Dead Sea Scrolls</b>, transcriptions by Martin G. Abegg, Jr., James E. Bowley and Edward M. Cook; Text-Fabric conversion by Jarod Jacobs, Martijn Naaijer and Dirk Roorda. CC BY-NC 4.0, non-commercial.</li>
        <li><b>Wikimedia Commons</b>, ${C.images} pictures, each credited where it appears.</li>
        <li><b>Natural Earth</b>, the land outline of the map, public domain.</li>
      </ul>
      <details class="sr-more"><summary>Left out, and why (${MS.excluded.length})</summary><ul>${excluded}</ul>
        <p>Two values are corrected on this page and marked where they appear: the date of Codex Ephraemi and the contents of Codex Vaticanus.</p></details>`;
  }

  function mount(section, { num }) {
    section.innerHTML = `${head(num, "Keep going", `Read them <em>more closely</em>`, "")}
      <div class="on-grid">
        <nav class="on-links" aria-label="Go deeper">${LINKS.map(([k, t, line, href]) => `<a href="${href}"><small>${k}</small><b>${esc(t)}</b><span>${esc(line)}</span></a>`).join("")}</nav>
        <div class="on-col"><p class="on-k">How complete is this?</p>${coverage()}</div>
        <div class="on-col"><p class="on-k">Where this comes from</p>${credits()}</div>
      </div>`;
  }
  Sections.onward = { mount };
})();
