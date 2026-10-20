// The six printed editions of chapter 04, drawn as translucent line art. Coordinates follow the live page's schematic
// (Architecture.tsx PageModel, a 360 × 450 sheet), so the mock-up can replace it one for one. Lines mark text blocks,
// never transcribed readings.
export const TONES = ['var(--accent)', 'var(--poetry)', 'var(--prophets)'];

export const EDITIONS = [
  { id: 'gutenberg', pill: '1455 · Gutenberg', name: 'The 42-line Bible', date: 'c. 1455', place: 'Mainz', langs: 'Latin',
    people: 'Johannes Gutenberg’s workshop; financier Johann Fust; Peter Schoeffer; rubricators and binders.',
    layers: [
      { label: 'Printed text', title: 'The press repeats a setting', text: 'Movable metal type carried a Latin Vulgate text. Two columns resemble manuscript book design. “42-line” names the usual column length, not every page. Printing multiplied an edited exemplar; it did not return directly to the biblical authors.',
        blocks: [[55, 76, 114, 40, 7.6, 1], [191, 76, 114, 40, 7.6, 1]] },
      { label: 'Hand finishing', title: 'An individual copy emerges', text: 'Illuminators added decorated initials after printing. Cambridge’s copy preserves this mixture of mechanical reproduction and manual work. Turn this layer off to see why a printed sheet was not necessarily a finished page.',
        glyphs: [['I', 70, 104, 44], ['¶', 196, 186, 26]], rules: ['M47 111V60h45'] },
      { label: 'Page furniture', title: 'Instructions could travel with the sheets', text: 'The Bavarian copy preserves a printed rubrication guide. Rubrics are headings or directions, not a separate biblical witness. This model marks their function without reproducing a particular leaf.',
        labels: [['LIBER', 180, 49]], rules: ['M56 61h75m60 0h67'] },
    ] },
  { id: 'complutensian', pill: '1514 · Complutensian', name: 'The Complutensian Polyglot', date: '1514–17', place: 'Alcalá de Henares', langs: 'Hebrew, Greek, Latin & Aramaic',
    people: 'Cardinal Francisco Jiménez de Cisneros, patron; Arnao Guillén de Brocar, printer; Demetrius Ducas and Hebrew scholars including Pablo Coronel and Alfonso de Zamora.',
    layers: [
      { label: 'Hebrew & Greek', title: 'Two textual traditions in view', text: 'The Old Testament places Hebrew beside the Greek Septuagint. The latter is an ancient translation tradition with its own manuscript history. The columns were edited, not simply photographed from ancient books.',
        blocks: [[51, 96, 75, 24, 8, 1], [237, 96, 73, 24, 8, 1]], labels: [['Greek', 88, 74], ['Hebrew', 273, 74]] },
      { label: 'Latin aids', title: 'Latin serves more than one purpose', text: 'The central Vulgate is separate from the Latin aid attached to the Greek. Page design helps a Latin-reading scholar compare languages, but placement also conveys an editorial hierarchy.',
        blocks: [[145, 96, 70, 24, 8]], labels: [['Vulgate', 180, 74]] },
      { label: 'Targum', title: 'A Pentateuch-specific lower register', text: 'In the Pentateuch, the Aramaic Targum Onkelos appears with a Latin translation below the main columns. That layout should not be projected onto every biblical book.',
        blocks: [[51, 341, 115, 8, 7], [188, 341, 122, 8, 7]], rules: ['M51 304H310'], labels: [['Aramaic', 108, 326], ['Latin aid', 249, 326]] },
    ] },
  { id: 'erasmus', pill: '1516 · Erasmus', name: 'Novum Instrumentum omne', date: '1516', place: 'Basel', langs: 'Greek & Latin',
    people: 'Desiderius Erasmus, editor and Latin translator; Johann Froben, printer.',
    layers: [
      { label: 'Greek', title: 'An edited source-language text', text: 'Erasmus’s edition made a complete Greek New Testament publicly available in 1516. A limited manuscript supply and rapid production constrained the work. It was revised repeatedly; “Erasmus’s text” is not a single unchanging object.',
        blocks: [[53, 89, 112, 30, 7.5, 1]], labels: [['Greek', 109, 68]] },
      { label: 'Latin', title: 'A new rendering for readers', text: 'The accompanying Latin version expresses Erasmus’s translation decisions. Agreement between two columns on the same printed page is not automatically independent manuscript support.',
        blocks: [[192, 89, 112, 30, 7.5]], labels: [['Latin', 248, 68]] },
      { label: 'Annotations', title: 'An argument beyond the opening', text: 'Erasmus explained decisions in his Annotationes. The band in this diagram represents the separate annotations in the volume, not footnotes physically beneath each Greek page.',
        blocks: [[60, 375, 240, 4, 6]], rules: ['M51 336H307'], dashedRules: true, labels: [['Separate annotationes', 180, 358]] },
    ] },
  { id: 'bomberg', pill: '1524 · Ben Hayyim', name: 'The Second Rabbinic Bible', date: '1524/25', place: 'Venice', langs: 'Hebrew & Aramaic',
    people: 'Jacob ben Hayyim ibn Adonijah, editor; Daniel Bomberg, printer and publisher.',
    layers: [
      { label: 'Biblical text', title: 'A selected Masoretic text', text: 'Ben Hayyim’s edition established an influential printed form of the Hebrew Bible. Hebrew printing was already decades old: the Soncino press had issued a complete Hebrew Bible in 1488.',
        blocks: [[119, 117, 123, 17, 8, 1]], labels: [['Hebrew text', 180, 104]] },
      { label: 'Masorah', title: 'Notes about transmission', text: 'Masoretic notes preserve information about the text’s wording and forms. They are distinct from an explanatory commentary and from a modern apparatus that compares witnesses.',
        blocks: [[121, 75, 116, 4, 6], [100, 126, 8, 20, 6], [252, 126, 8, 20, 6], [119, 272, 123, 5, 5]] },
      { label: 'Targum & commentary', title: 'Translation and interpretation alongside', text: 'Aramaic targum and rabbinic commentary surround the biblical text. These are different kinds of writing, not extra Hebrew verses. The schematic groups functions rather than reproducing one book’s exact layout.',
        blocks: [[53, 115, 38, 37, 7], [272, 115, 33, 37, 7], [109, 321, 145, 9, 7]], labels: [['Targum · commentary', 180, 400]] },
    ] },
  { id: 'bhq', pill: '2004 · BHQ', name: 'Biblia Hebraica Quinta', date: 'from 2004', place: 'Stuttgart', langs: 'Hebrew',
    people: 'An international editorial team; German Bible Society. Adrian Schenker led the project’s earlier phase.',
    layers: [
      { label: 'Base text', title: 'Print a particular witness', text: 'BHQ presents the Leningrad Codex (EBP. I B 19a) as its base. “Diplomatic” means representing that witness; it does not mean declaring every reading the earliest recoverable form.',
        blocks: [[80, 103, 196, 23, 7.5, 1]], labels: [['Hebrew base text', 180, 90]] },
      { label: 'Masorah', title: 'Retain the scribal apparatus', text: 'Both the small and large Masorah belong to the manuscript tradition being edited. Keeping them visible preserves information a bare consonantal text would lose.',
        blocks: [[292, 105, 16, 25, 6], [78, 49, 199, 3, 6], [79, 286, 198, 3, 6]] },
      { label: 'Critical apparatus', title: 'Compare beyond the base', text: 'Other Hebrew witnesses and ancient versions enter the apparatus and commentary. An editor can discuss a preferable reading without silently replacing the manuscript text printed above.',
        blocks: [[55, 358, 250, 8, 6]], rules: ['M55 321H308'], labels: [['Critical apparatus', 180, 341]] },
    ] },
  { id: 'na28', pill: '2012 · NA28', name: 'Novum Testamentum Graece', date: '2012 · NA28', place: 'Stuttgart / Münster', langs: 'Greek',
    people: 'The Nestle–Aland editorial tradition, INTF researchers and an international committee; German Bible Society.',
    layers: [
      { label: 'Edited text', title: 'Reconstruct across witnesses', text: 'The Greek reading text results from comparing evidence. Unlike BHQ’s base-text policy, it is not a diplomatic reproduction of one manuscript. Neither approach removes the need for judgment.',
        blocks: [[80, 103, 196, 23, 7.5, 1]], labels: [['Edited Greek text', 180, 84]] },
      { label: 'References', title: 'Connections are not variants', text: 'Marginal references lead to related passages. They perform a different job from the apparatus below the text: a cross-reference is not a vote for a textual reading.',
        blocks: [[292, 105, 16, 25, 6]] },
      { label: 'Critical apparatus', title: 'Make alternatives inspectable', text: 'NA28 incorporated ECM decisions in the Catholic Letters, James through Jude. The publisher identifies Jude 5 among meaningful textual changes. Even a mature printed edition can revise its main text.',
        blocks: [[55, 358, 250, 8, 6]], rules: ['M55 321H308'], labels: [['Critical apparatus', 180, 341]] },
    ] },
];

/** A line of "words": short strokes with gaps, the same every time for the same position. */
function wordLine(x, y, width, seed) {
  let d = '', at = 0, s = seed;
  while (at < width - 4) {
    s = (s * 9301 + 49297) % 233280;
    const word = Math.min(4 + (s / 233280) * 18, width - at);
    d += `M${(x + at).toFixed(1)} ${y}h${word.toFixed(1)}`;
    at += word + 3.2;
  }
  return d;
}

function blockSvg([x, y, w, n, gap, heavy]) {
  const h = (n - 1) * gap;
  const pad = w < 20 ? 3 : 6;
  let lines = '';
  for (let i = 0; i < n; i++) {
    const width = i % 5 === 4 ? w * .72 : w;
    lines += wordLine(x, +(y + i * gap).toFixed(1), width, Math.round(x * 7 + y * 3 + i * 31));
  }
  return `<rect class="pa-region" x="${x - pad}" y="${y - pad - 2}" width="${w + pad * 2}" height="${h + pad * 2 + 4}" rx="4"/>`
    + `<path class="pa-words${heavy ? ' pa-heavy' : ''}" d="${lines}"/>`;
}

/** One layer's marks, in its own colour. */
export function layerSvg(layer, index) {
  let out = (layer.blocks || []).map(blockSvg).join('');
  out += (layer.rules || []).map(d => `<path class="pa-rule${layer.dashedRules ? ' pa-dashed' : ''}" d="${d}"/>`).join('');
  out += (layer.glyphs || []).map(([c, x, y, size]) => `<text class="pa-glyph" x="${x}" y="${y}" font-size="${size}">${c}</text>`).join('');
  out += (layer.labels || []).map(([t, x, y]) => `<text class="pa-label" x="${x}" y="${y}">${t}</text>`).join('');
  return `<g class="pa-layer" data-layer="${index}" style="--tone:${TONES[index]}">${out}</g>`;
}

/** The sheet itself: a glassy leaf with faint margin guides and registration crosses. */
export function sheetSvg(inner = '', back = true) {
  return `<svg class="pa-sheet" viewBox="0 0 360 450" aria-hidden="true">
    ${back ? '<path class="pa-back" d="M33 25l318 -8v420l-318 8z"/>' : ''}
    <rect class="pa-leaf" x="23" y="13" width="314" height="420" rx="3"/>
    <path class="pa-guide" d="M15 35H345M15 410H345M43 5V441M317 5V441"/>
    <path class="pa-cross" d="M8 13h10M13 8v10M342 428h10M347 423v10"/>
    ${inner}
  </svg>`;
}

export const flatPage = (edition, visible = [1, 1, 1]) =>
  sheetSvg(edition.layers.map((l, i) => visible[i] ? layerSvg(l, i) : '').join(''));
