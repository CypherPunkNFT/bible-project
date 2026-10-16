export const sources = {
  houghton: { label: 'Houghton · Unfinished Business (2023), §§3–4', url: 'https://doi.org/10.1017/S0028688522000224' },
  eusebius: { label: 'Eusebius · To Marinus 1, pp. 97–99', url: 'https://archive.org/details/EusebiusGospelProblemsAndSolutions2010/page/95/mode/2up' },
  kelhoffer: { label: 'Kelhoffer · ancient debate over Mark (2001)', url: 'https://www.diva-portal.org/smash/get/diva2:385568/fulltext02' },
  mink: { label: 'Gerd Mink · texts, mixture and genealogy', url: 'https://www.uni-muenster.de/INTF/Genealogical_method.html' },
  history: { label: 'Münster INTF · history of the editions', url: 'https://www.uni-muenster.de/INTF/institut/geschichte/index.html' },
  split: { label: 'ECM Mark · unresolved readings (PDF)', url: 'https://www.uni-muenster.de/imperia/md/content/INTF/passages_with_a_split_guiding_line.pdf' },
  ecm: { label: 'Münster INTF · Editio Critica Maior', url: 'https://www.uni-muenster.de/INTF/forschung/ecm/index.html' },
  spelling: { label: 'Michigan · line 5', url: 'https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/line05.html' },
  order: { label: 'Michigan · variant readings', url: 'https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/variants.html' },
  transcription: { label: 'Michigan · diplomatic transcription', url: 'https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/wholetext.html' },
  p46: { label: 'Michigan · P46 and its date', url: 'https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/index.html' },
  gal: { label: 'SBLGNT · Galatians text', url: 'https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text/Gal.txt' },
  galApp: { label: 'SBLGNT · Galatians apparatus', url: 'https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgntapp/text/Gal.txt' },
  rom: { label: 'SBLGNT · Romans text', url: 'https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text/Rom.txt' },
  romApp: { label: 'SBLGNT · Romans apparatus', url: 'https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgntapp/text/Rom.txt' },
  net: { label: 'NET · Romans 5:1, note 4 (PDF p. 9)', url: 'https://bible.org/download/netbible/ondemand/bybook/rom.pdf#page=9' },
  sinRom: { label: 'Sinaiticus · BL folio 262b', url: 'https://codexsinaiticus.org/en/manuscript.aspx?book=37&chapter=5&lid=en&side=r&zoomSlider=0' },
  sinMark: { label: 'Sinaiticus · BL folio 228', url: 'https://codexsinaiticus.org/en/manuscript.aspx?book=34&chapter=16&verse=8&lid=en&side=r&zoomSlider=0' },
  vat: { label: 'Vatican Library · Mark’s ending', url: 'https://digi.vatlib.it/view/MSS_Vat.gr.1209/1307' },
  p45: { label: 'CSNTM · P45 folio inventory (PDF)', url: 'https://images.csntm.org/Manuscripts/GA_P45/P45_(Dublin_CBL_BP_I).pdf' },
  mark: { label: 'SBLGNT · Mark 16', url: 'https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text/Mark.txt' },
  head: { label: 'Peter Head · case against (2022)', url: 'https://textandcanon.org/a-case-against-the-longer-ending-of-mark/' },
  snapp: { label: 'James Snapp · case for (2022)', url: 'https://textandcanon.org/a-case-for-the-longer-ending-of-mark/' },
  irenaeus: { label: 'Irenaeus · Against Heresies 3.10.5', url: 'https://en.wikisource.org/wiki/Ante-Nicene_Fathers/Volume_I/IRENAEUS/Against_Heresies:_Book_III#Chapter_X' },
  method: { label: 'Holmes · how SBLGNT was edited', url: 'https://www.sblgnt.com/about/introduction/' },
  genealogy: { label: 'Münster INTF · genealogical method', url: 'https://www.uni-muenster.de/INTF/en/forschung/cbgm/index.html' },
} as const;
export type SourceId = keyof typeof sources;
export type CaseId = 'galatians' | 'romans' | 'mark';
export type Reading = {
  id: string; name: string; siglum: string; date: string; layer: 'Manuscript' | 'Critical edition' | 'No surviving text';
  before?: string; difference: string; after?: string; gloss: string; evidence: string; links: SourceId[];
};
export const cases: { id: CaseId; passage: string; title: string; subtitle: string; context: string }[] = [
  { id: 'galatians', passage: 'Galatians 1:3', title: 'Spelling & order', subtitle: 'Small differences. Different kinds.', context: 'Paul’s opening greeting wishes grace and peace to the churches in Galatia. Start with the spelling of “to you”, then move “our” through the sentence.' },
  { id: 'romans', passage: 'Romans 5:1', title: 'A changed vowel', subtitle: 'One letter. A different force.', context: 'After speaking of justification by faith, does Paul state that “we have peace”, or urge “let us have peace”? Compare the first writing with the corrections.' },
  { id: 'mark', passage: 'Mark 16:8–20', title: 'A disputed ending', subtitle: 'Twelve verses. Several histories.', context: 'The women flee the empty tomb in fear. Some witnesses end at 16:8; others continue with appearances, a commission and an ascension. First check what each object actually preserves.' },
];

export function readings(id: CaseId, order: boolean, corrected: boolean): Reading[] {
  if (id === 'galatians') return [
    { id: 'p46', name: 'Papyrus 46', siglum: 'P46', date: 'Third century · Michigan’s dating', layer: 'Manuscript', before: order ? 'πατρὸς ' : 'χάρις ', difference: order ? 'καὶ κυρίου ἡμῶν' : 'ὑμεῖν', after: order ? '' : ' καὶ εἰρήνη', gloss: order ? '… the Father and our Lord …' : 'Grace to you and peace …', evidence: 'Codex page 168, opening of Galatians, lines 5–6 in Michigan’s reader. This is a normalized extract from its published transcription: spacing and accents supplied; sacred-name abbreviations expanded. The ει spelling is retained here.', links: ['transcription', order ? 'order' : 'spelling', 'p46'] },
    { id: 'sbl', name: 'SBLGNT', siglum: 'SBL', date: 'Michael W. Holmes · 2010', layer: 'Critical edition', before: order ? 'πατρὸς ' : 'χάρις ', difference: order ? 'καὶ κυρίου ἡμῶν' : 'ὑμῖν', after: order ? '' : ' καὶ εἰρήνη', gloss: order ? '… the Father and our Lord …' : 'Grace to you and peace …', evidence: 'The SBL Greek New Testament regularizes the spelling but prints the same word order as P46 in this phrase. Agreement here does not make it a transcription of that manuscript.', links: ['gal', 'method'] },
    { id: 'na', name: 'Nestle–Aland 28', siglum: 'NA28', date: 'Reported in the SBLGNT apparatus', layer: 'Critical edition', before: order ? 'πατρὸς ' : 'χάρις ', difference: order ? 'ἡμῶν καὶ κυρίου' : 'ὑμῖν', after: order ? '' : ' καὶ εἰρήνη', gloss: order ? '… our Father and the Lord …' : 'Grace to you and peace …', evidence: 'The SBLGNT comparative apparatus reports this order for NA28 and Westcott–Hort. This desk has not independently collated the complete NA28 apparatus. Edition abbreviations are not ancient manuscript identifiers.', links: ['galApp', 'method'] },
  ];
  if (id === 'romans') return [
    { id: 'sin', name: 'Codex Sinaiticus', siglum: corrected ? 'א¹' : 'א*', date: 'Fourth-century codex · corrected state separately recorded', layer: 'Manuscript', before: 'εἰρήνην ἔχ', difference: corrected ? 'ο' : 'ω', after: 'μεν', gloss: corrected ? 'We have peace.' : 'Let us have peace.', evidence: 'NET’s note reports omega in the first hand and omicron in the correction labeled א¹. The project locates the passage on BL folio 262b. This is an apparatus-based report, not a new visual collation; the correction is a second state of one object.', links: ['net', 'sinRom'] },
    { id: 'vat', name: 'Codex Vaticanus', siglum: corrected ? 'B²' : 'B*', date: 'Fourth-century codex · corrected state separately recorded', layer: 'Manuscript', before: 'εἰρήνην ἔχ', difference: corrected ? 'ο' : 'ω', after: 'μεν', gloss: corrected ? 'We have peace.' : 'Let us have peace.', evidence: 'NET reports the same change in Vaticanus, with its correction labeled B². These labels follow that note; they do not imply that the two codices were corrected together or at the same date.', links: ['net'] },
    { id: 'sbl', name: 'SBLGNT', siglum: 'SBL', date: 'Michael W. Holmes · 2010', layer: 'Critical edition', before: 'εἰρήνην ἔχ', difference: 'ο', after: 'μεν', gloss: 'We have peace.', evidence: 'SBLGNT prints the indicative. Its comparison records NA28 and Robinson–Pierpont with this reading, but Westcott–Hort and Tregelles with the subjunctive. Modern and historical editors differ in their weighing of the evidence.', links: ['rom', 'romApp'] },
  ];
  return [
    { id: 'sin', name: 'Codex Sinaiticus', siglum: 'א', date: 'Fourth century · BL folio 228', layer: 'Manuscript', before: 'ἐφοβοῦντο γάρ · ', difference: 'ends at 16:8', gloss: '“For they were afraid.” Then the end-title; Luke follows.', evidence: 'The surviving page contains Mark 16:1–8 and Luke 1:1–18. The Gospel concludes here; this is not simply a missing final leaf in the extant object. Whether an earlier ending was lost before this copy is a different question.', links: ['sinMark', 'head'] },
    { id: 'vat', name: 'Codex Vaticanus', siglum: 'B', date: 'Fourth century · Vat.gr.1209', layer: 'Manuscript', before: 'ἐφοβοῦντο γάρ · ', difference: 'ends at 16:8', gloss: 'The ending is followed by a blank column.', evidence: 'The end-title and blank column are physical evidence. The suggestion that blank space remembers another ending is an interpretation, not words written by the scribe explaining the space.', links: ['vat', 'snapp', 'head'] },
    { id: 'alex', name: 'Codex Alexandrinus', siglum: 'A', date: 'Fifth century', layer: 'Manuscript', before: '16:8 → ', difference: '16:9–20 present', gloss: 'Continues with the Longer Ending.', evidence: 'Both linked scholars identify Alexandrinus among the witnesses with the Longer Ending. This row summarizes passage coverage, not every word of its transcription. Its old British Library image link currently redirects; no fresh image collation is claimed.', links: ['snapp', 'head'] },
    { id: 'p45', name: 'Papyrus 45', siglum: 'P45', date: 'Third century · fragmentary codex', layer: 'No surviving text', difference: 'Mark 16 not extant', gloss: 'No reading to compare at this location.', evidence: 'CSNTM’s folio inventory lists surviving portions of Mark 4–9 and 11–12. The leaves for this location do not survive. P45 cannot be entered in either column of a vote about 16:9–20.', links: ['p45'] },
    { id: 'sbl', name: 'SBLGNT', siglum: 'SBL', date: 'Critical edition · digital text', layer: 'Critical edition', before: '16:8 → ', difference: '⟦16:9–20⟧', gloss: 'The Longer Ending is printed within double brackets.', evidence: 'The digital edition also prints the unnumbered Shorter Ending in double brackets. Bracketed inclusion is an editorial presentation of disputed material, not a damaged manuscript or an unqualified endorsement of authorship. Verse numbers here summarize the passage; they are not the printed Greek text.', links: ['mark', 'method'] },
  ];
}

export const reasoning: Record<CaseId, { observation: string; judgment: string; limit: string; links: SourceId[] }> = {
  galatians: {
    observation: 'Spelling and word order are separate variation units. The first changes the written form of “to you”; the second shifts the nearest noun qualified by “our”.',
    judgment: 'SBLGNT and NA28 differ on the order. An editor can regularize spelling while retaining a less familiar phrase. Agreement among manuscripts may help trace transmission, but one shared phrase cannot establish who copied whom.',
    limit: 'The comparative apparatus tells us what the editions print. It does not supply a complete local argument for Holmes’s choice, so this desk does not invent one.', links: ['spelling', 'order', 'galApp'],
  },
  romans: {
    observation: 'Unlike the spelling in Galatians, ο / ω here distinguishes an assertion from an exhortation. Switching hands changes the recorded state of a manuscript, not the number of witnesses.',
    judgment: 'NET favors “we have” from Paul’s argument, while acknowledging strong early support for “let us have”. Similar sounds could explain confusion in either direction. Context supports a judgment; it cannot turn the printed reading into observed autograph ink.',
    limit: 'NET also questions UBS4’s high confidence rating. The indicative is a reasoned preference, not a unanimous result. Neither “earliest hand always wins” nor “the correction fixed it” is a sufficient rule.', links: ['net', 'romApp'],
  },
  mark: {
    observation: 'The absence of 16:9–20 in Sinaiticus and Vaticanus is supported by surviving conclusions. P45’s missing material supplies no conclusion at all.',
    judgment: 'The prevailing critical judgment, reaffirmed in ECM Mark (2021), is that the earliest attainable text ends at 16:8. The Longer Ending’s early circulation is secure; its attachment to the Gospel by Mark himself is not. Snapp’s proposal that colleagues appended material by Mark is a minority reconstruction, not a documented event. Whether Mark intended to stop at 16:8 or an earlier ending disappeared remains a separate question.',
    limit: 'Irenaeus quotes 16:19 in Against Heresies 3.10.5, showing late-second-century use. This is literary testimony, not a surviving Gospel leaf. Early use, original authorship and later canonical reception are distinct questions.', links: ['houghton', 'snapp', 'irenaeus'],
  },
};
