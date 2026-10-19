// Everything the study says, ported unchanged in substance from src/pages/study/passages (evidence.ts,
// PassageManuscriptsPage.tsx, CloseReadings.tsx). The three directions re-stage this; none of them adds a claim.
// `rec` ties a witness to its open record in data.js (Wikidata id), so it can open the record sheet.
(() => {
  const SOURCES = {
    houghton: ["Houghton · Unfinished Business (2023), §§3–4", "https://doi.org/10.1017/S0028688522000224"],
    eusebius: ["Eusebius · To Marinus 1, pp. 97–99", "https://archive.org/details/EusebiusGospelProblemsAndSolutions2010/page/95/mode/2up"],
    kelhoffer: ["Kelhoffer · ancient debate over Mark (2001)", "https://www.diva-portal.org/smash/get/diva2:385568/fulltext02"],
    mink: ["Gerd Mink · texts, mixture and genealogy", "https://www.uni-muenster.de/INTF/Genealogical_method.html"],
    history: ["Münster INTF · history of the editions", "https://www.uni-muenster.de/INTF/institut/geschichte/index.html"],
    split: ["ECM Mark · unresolved readings (PDF)", "https://www.uni-muenster.de/imperia/md/content/INTF/passages_with_a_split_guiding_line.pdf"],
    ecm: ["Münster INTF · Editio Critica Maior", "https://www.uni-muenster.de/INTF/forschung/ecm/index.html"],
    spelling: ["Michigan · line 5", "https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/line05.html"],
    order: ["Michigan · variant readings", "https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/variants.html"],
    transcription: ["Michigan · diplomatic transcription", "https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/wholetext.html"],
    p46: ["Michigan · P46 and its date", "https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/index.html"],
    gal: ["SBLGNT · Galatians text", "https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text/Gal.txt"],
    galApp: ["SBLGNT · Galatians apparatus", "https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgntapp/text/Gal.txt"],
    rom: ["SBLGNT · Romans text", "https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text/Rom.txt"],
    romApp: ["SBLGNT · Romans apparatus", "https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgntapp/text/Rom.txt"],
    net: ["NET · Romans 5:1, note 4 (PDF p. 9)", "https://bible.org/download/netbible/ondemand/bybook/rom.pdf#page=9"],
    sinRom: ["Sinaiticus · BL folio 262b", "https://codexsinaiticus.org/en/manuscript.aspx?book=37&chapter=5&lid=en&side=r&zoomSlider=0"],
    sinMark: ["Sinaiticus · BL folio 228", "https://codexsinaiticus.org/en/manuscript.aspx?book=34&chapter=16&verse=8&lid=en&side=r&zoomSlider=0"],
    vat: ["Vatican Library · Mark’s ending", "https://digi.vatlib.it/view/MSS_Vat.gr.1209/1307"],
    p45: ["CSNTM · P45 folio inventory (PDF)", "https://images.csntm.org/Manuscripts/GA_P45/P45_(Dublin_CBL_BP_I).pdf"],
    mark: ["SBLGNT · Mark 16", "https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text/Mark.txt"],
    head: ["Peter Head · case against (2022)", "https://textandcanon.org/a-case-against-the-longer-ending-of-mark/"],
    snapp: ["James Snapp · case for (2022)", "https://textandcanon.org/a-case-for-the-longer-ending-of-mark/"],
    irenaeus: ["Irenaeus · Against Heresies 3.10.5", "https://en.wikisource.org/wiki/Ante-Nicene_Fathers/Volume_I/IRENAEUS/Against_Heresies:_Book_III#Chapter_X"],
    method: ["Holmes · how SBLGNT was edited", "https://www.sblgnt.com/about/introduction/"],
    genealogy: ["Münster INTF · genealogical method", "https://www.uni-muenster.de/INTF/en/forschung/cbgm/index.html"],
  };

  const CASES = [
    { id: "galatians", num: "I", passage: "Galatians 1:3", title: "Spelling & order", subtitle: "Small differences. <em>Different kinds.</em>", tone: "--epistles",
      context: "Paul’s opening greeting wishes grace and peace to the churches in Galatia. Start with the spelling of “to you”, then move “our” through the sentence.",
      toggle: { label: "Compare a difference", off: "Spelling", on: "Word order" }, cites: ["transcription", "gal", "galApp"],
      caption: "Selected Greek extracts, normalized for comparison; not manuscript facsimiles. English glosses are explanatory." },
    { id: "romans", num: "II", passage: "Romans 5:1", title: "A changed vowel", subtitle: "One letter. <em>A different force.</em>", tone: "--prophets",
      context: "After speaking of justification by faith, does Paul state that “we have peace”, or urge “let us have peace”? Compare the first writing with the corrections.",
      toggle: { label: "Inspect the manuscript hands", off: "First hand", on: "Corrected" }, cites: ["net", "rom"],
      caption: "Selected Greek extracts, normalized for comparison; not manuscript facsimiles. English glosses are explanatory." },
    { id: "mark", num: "III", passage: "Mark 16:8–20", title: "A disputed ending", subtitle: "Twelve verses. <em>Several histories.</em>", tone: "--history",
      context: "The women flee the empty tomb in fear. Some witnesses end at 16:8; others continue with appearances, a commission and an ascension. First check what each object actually preserves.",
      toggle: null, note: "Presence, absence and loss are different kinds of evidence.", cites: ["sinMark", "p45", "mark"],
      caption: "Selected conclusions and coverage; not a full collation of the endings." },
  ];

  // The rows for a case. `alt` is the Galatians word-order view or the Romans corrected hands.
  function readings(id, alt) {
    if (id === "galatians") return [
      { id: "p46", rec: "Q1513469", name: "Papyrus 46", siglum: "P46", date: "Third century · Michigan’s dating", layer: "Manuscript", before: alt ? "πατρὸς " : "χάρις ", difference: alt ? "καὶ κυρίου ἡμῶν" : "ὑμεῖν", after: alt ? "" : " καὶ εἰρήνη", gloss: alt ? "… the Father and our Lord …" : "Grace to you and peace …", evidence: "Codex page 168, opening of Galatians, lines 5–6 in Michigan’s reader. This is a normalized extract from its published transcription: spacing and accents supplied; sacred-name abbreviations expanded. The ει spelling is retained here.", links: ["transcription", alt ? "order" : "spelling", "p46"] },
      { id: "sbl", name: "SBLGNT", siglum: "SBL", date: "Michael W. Holmes · 2010", layer: "Critical edition", before: alt ? "πατρὸς " : "χάρις ", difference: alt ? "καὶ κυρίου ἡμῶν" : "ὑμῖν", after: alt ? "" : " καὶ εἰρήνη", gloss: alt ? "… the Father and our Lord …" : "Grace to you and peace …", evidence: "The SBL Greek New Testament regularizes the spelling but prints the same word order as P46 in this phrase. Agreement here does not make it a transcription of that manuscript.", links: ["gal", "method"] },
      { id: "na", name: "Nestle–Aland 28", siglum: "NA28", date: "Reported in the SBLGNT apparatus", layer: "Critical edition", before: alt ? "πατρὸς " : "χάρις ", difference: alt ? "ἡμῶν καὶ κυρίου" : "ὑμῖν", after: alt ? "" : " καὶ εἰρήνη", gloss: alt ? "… our Father and the Lord …" : "Grace to you and peace …", evidence: "The SBLGNT comparative apparatus reports this order for NA28 and Westcott–Hort. This desk has not independently collated the complete NA28 apparatus. Edition abbreviations are not ancient manuscript identifiers.", links: ["galApp", "method"] },
    ];
    if (id === "romans") return [
      { id: "sin", rec: "Q152962", name: "Codex Sinaiticus", siglum: alt ? "א¹" : "א*", date: "Fourth-century codex · corrected state separately recorded", layer: "Manuscript", before: "εἰρήνην ἔχ", difference: alt ? "ο" : "ω", after: "μεν", gloss: alt ? "We have peace." : "Let us have peace.", evidence: "NET’s note reports omega in the first hand and omicron in the correction labeled א¹. The project locates the passage on BL folio 262b. This is an apparatus-based report, not a new visual collation; the correction is a second state of one object.", links: ["net", "sinRom"] },
      { id: "vat", rec: "Q209285", name: "Codex Vaticanus", siglum: alt ? "B²" : "B*", date: "Fourth-century codex · corrected state separately recorded", layer: "Manuscript", before: "εἰρήνην ἔχ", difference: alt ? "ο" : "ω", after: "μεν", gloss: alt ? "We have peace." : "Let us have peace.", evidence: "NET reports the same change in Vaticanus, with its correction labeled B². These labels follow that note; they do not imply that the two codices were corrected together or at the same date.", links: ["net"] },
      { id: "sbl", name: "SBLGNT", siglum: "SBL", date: "Michael W. Holmes · 2010", layer: "Critical edition", before: "εἰρήνην ἔχ", difference: "ο", after: "μεν", gloss: "We have peace.", evidence: "SBLGNT prints the indicative. Its comparison records NA28 and Robinson–Pierpont with this reading, but Westcott–Hort and Tregelles with the subjunctive. Modern and historical editors differ in their weighing of the evidence.", links: ["rom", "romApp"] },
    ];
    return [
      { id: "sin", rec: "Q152962", name: "Codex Sinaiticus", siglum: "א", date: "Fourth century · BL folio 228", layer: "Manuscript", before: "ἐφοβοῦντο γάρ · ", difference: "ends at 16:8", gloss: "“For they were afraid.” Then the end-title; Luke follows.", evidence: "The surviving page contains Mark 16:1–8 and Luke 1:1–18. The Gospel concludes here; this is not simply a missing final leaf in the extant object. Whether an earlier ending was lost before this copy is a different question.", links: ["sinMark", "head"] },
      { id: "vat", rec: "Q209285", name: "Codex Vaticanus", siglum: "B", date: "Fourth century · Vat.gr.1209", layer: "Manuscript", before: "ἐφοβοῦντο γάρ · ", difference: "ends at 16:8", gloss: "The ending is followed by a blank column.", evidence: "The end-title and blank column are physical evidence. The suggestion that blank space remembers another ending is an interpretation, not words written by the scribe explaining the space.", links: ["vat", "snapp", "head"] },
      { id: "alex", rec: "Q318233", name: "Codex Alexandrinus", siglum: "A", date: "Fifth century", layer: "Manuscript", before: "16:8 → ", difference: "16:9–20 present", gloss: "Continues with the Longer Ending.", evidence: "Both linked scholars identify Alexandrinus among the witnesses with the Longer Ending. This row summarizes passage coverage, not every word of its transcription. Its old British Library image link currently redirects; no fresh image collation is claimed.", links: ["snapp", "head"] },
      { id: "p45", rec: "Q697885", name: "Papyrus 45", siglum: "P45", date: "Third century · fragmentary codex", layer: "No surviving text", before: "", difference: "Mark 16 not extant", gloss: "No reading to compare at this location.", evidence: "CSNTM’s folio inventory lists surviving portions of Mark 4–9 and 11–12. The leaves for this location do not survive. P45 cannot be entered in either column of a vote about 16:9–20.", links: ["p45"] },
      { id: "sbl", name: "SBLGNT", siglum: "SBL", date: "Critical edition · digital text", layer: "Critical edition", before: "16:8 → ", difference: "⟦16:9–20⟧", gloss: "The Longer Ending is printed within double brackets.", evidence: "The digital edition also prints the unnumbered Shorter Ending in double brackets. Bracketed inclusion is an editorial presentation of disputed material, not a damaged manuscript or an unqualified endorsement of authorship. Verse numbers here summarize the passage; they are not the printed Greek text.", links: ["mark", "method"] },
    ];
  }

  const REASONING = {
    galatians: { observation: "Spelling and word order are separate variation units. The first changes the written form of “to you”; the second shifts the nearest noun qualified by “our”.",
      judgment: "SBLGNT and NA28 differ on the order. An editor can regularize spelling while retaining a less familiar phrase. Agreement among manuscripts may help trace transmission, but one shared phrase cannot establish who copied whom.",
      limit: "The comparative apparatus tells us what the editions print. It does not supply a complete local argument for Holmes’s choice, so this desk does not invent one.", links: ["spelling", "order", "galApp"] },
    romans: { observation: "Unlike the spelling in Galatians, ο / ω here distinguishes an assertion from an exhortation. Switching hands changes the recorded state of a manuscript, not the number of witnesses.",
      judgment: "NET favors “we have” from Paul’s argument, while acknowledging strong early support for “let us have”. Similar sounds could explain confusion in either direction. Context supports a judgment; it cannot turn the printed reading into observed autograph ink.",
      limit: "NET also questions UBS4’s high confidence rating. The indicative is a reasoned preference, not a unanimous result. Neither “earliest hand always wins” nor “the correction fixed it” is a sufficient rule.", links: ["net", "romApp"] },
    mark: { observation: "The absence of 16:9–20 in Sinaiticus and Vaticanus is supported by surviving conclusions. P45’s missing material supplies no conclusion at all.",
      judgment: "The prevailing critical judgment, reaffirmed in ECM Mark (2021), is that the earliest attainable text ends at 16:8. The Longer Ending’s early circulation is secure; its attachment to the Gospel by Mark himself is not. Snapp’s proposal that colleagues appended material by Mark is a minority reconstruction, not a documented event. Whether Mark intended to stop at 16:8 or an earlier ending disappeared remains a separate question.",
      limit: "Irenaeus quotes 16:19 in Against Heresies 3.10.5, showing late-second-century use. This is literary testimony, not a surviving Gospel leaf. Early use, original authorship and later canonical reception are distinct questions.", links: ["houghton", "snapp", "irenaeus"] },
  };

  const LAYERS = [
    ["The object", "Ink, a correction, an intact ending or a broken edge."],
    ["The transcription", "A scholar’s record of the marks, with conventions for loss and uncertainty."],
    ["The edition", "An editor’s chosen text, with an apparatus recording alternatives."],
  ];
  const INTRO = "Textual criticism compares surviving witnesses to investigate a text’s transmission and earlier wording. These three Greek New Testament cases range from spelling to a substantial disputed passage. No Greek is required: each extract has an English gloss.";

  // Galatians 1:3: the real SBLGNT apparatus entry, part by part.
  const APPARATUS = {
    lead: "An <em>apparatus</em> is the record of alternatives beneath an edited text. Select each part of this real entry to decode it.",
    parts: [
      { text: "καὶ κυρίου ἡμῶν", greek: true, title: "The reading printed in SBLGNT", note: "The first phrase is the editor’s text at this point: “and our Lord”. It is not a quotation from a newly discovered manuscript." },
      { text: "Treg RP", title: "Editions which agree", note: "Treg means Samuel Prideaux Tregelles; RP means Robinson–Pierpont. These abbreviations identify edited texts, not two ancient witnesses." },
      { text: "]", title: "A separator, not damaged parchment", note: "The closing bracket divides the printed reading and its support from the alternative. It does not mark a missing letter or the end of a restoration." },
      { text: "ἡμῶν καὶ κυρίου WH NA28", greek: true, title: "The alternative reading", note: "“Our” moves before “and Lord”, next to “Father”. WH (Westcott–Hort) and NA28 print this order, according to this digital apparatus." },
    ],
    limit: "This apparatus compares editions. Its silence about P46’s spelling does not mean the papyrus agrees letter for letter: Holmes deliberately excludes purely orthographic differences. Always ask what the apparatus was designed to record.",
    links: ["galApp", "method"],
  };

  // Romans 5:1: three editorial questions, each weighing both readings.
  const LENSES = {
    lead: "The difficult task is to explain both readings. Change the question and see what the evidence can—and cannot—decide.",
    items: [
      { title: "The witnesses", left: "The first hands of Sinaiticus and Vaticanus support ω. NET judges the external evidence stronger on this side.", right: "Corrected states and other witnesses support ο. A correction is evidence of another textual state, even when its source cannot be identified.", takeaway: "External evidence asks which witnesses preserve each reading, when they were copied and how their texts relate. Two famous codices alone do not exhaust the evidence." },
      { title: "The copying process", left: "A scribe could hear or recall ο and write ω.", right: "A scribe could hear or recall ω and write ο.", takeaway: "Transcriptional probability asks how one reading could become the other. Similar pronunciation offers a mechanism in both directions; it cannot decide the original vowel." },
      { title: "Paul’s argument", left: "An exhortation makes the sentence urge a response: “let us have peace”. Its fit must be argued rather than ruled out by the mood alone.", right: "Romans 5:10 describes reconciliation as accomplished. That context helps explain NET’s preference for an assertion here.", takeaway: "Intrinsic probability asks what the author was likely to write. Context matters, but an editor must avoid turning an expected theology into a rule for rewriting the evidence." },
    ],
    limit: "The printed outcome is visible above: SBLGNT chooses ο. Westcott–Hort and Tregelles choose ω. This exercise explains criteria; it assigns no invented scores or probabilities.",
    links: ["net", "rom", "romApp"],
  };

  // Mark 16: three textual forms after 16:8 (English summaries of SBLGNT's Greek).
  const ENDINGS = {
    lead: "English summaries of the Greek in SBLGNT, not quotations or facsimiles. These are textual forms; the buttons do not suggest a known sequence of authorship.",
    v7: "The young man tells the women to tell the disciples and Peter: Jesus goes ahead to Galilee; they will see him there.",
    v8: "The women flee in fear and say nothing to anyone.",
    items: [
      { id: "stop", title: "End at 16:8", tag: "END", text: "The promise of a meeting remains; the narrative does not show it.", head: "A narrative question remains open.", comment: "This is a surviving conclusion in Sinaiticus and Vaticanus. That fact alone cannot establish whether Mark intended an abrupt ending, left his work unfinished, or lost an ending before these copies." },
      { id: "short", title: "Shorter Ending", tag: "UNNUMBERED", text: "The women report to Peter’s circle; Jesus sends the proclamation of salvation from east to west.", head: "Silence gives way to a report and a mission.", comment: "The “Shorter Ending” adds words after 16:8. It is not the same thing as ending at 16:8. SBLGNT prints it separately in double brackets, as it does the Longer Ending." },
      { id: "long", title: "Longer Ending", tag: "16:9–20", text: "Jesus appears to Mary Magdalene, two travellers and the eleven; he commissions proclamation, speaks of signs, and is taken into heaven.", head: "Look at how the narrative restarts.", comment: "Verse 9 reintroduces Mary with information about seven demons, although she was already named in 16:1. The appearances do not narrate the promised Galilean meeting. Such seams support a literary argument for supplementation; they do not identify the supplement’s author." },
    ],
    links: ["mark", "head"],
    ancients: [
      { who: "Irenaeus · late second century", text: "<cite>Against Heresies</cite> 3.10.5 explicitly attributes the ascension statement in 16:19 to the end of Mark’s Gospel. The Longer Ending therefore circulated well before Alexandrinus. The date of this testimony must not be confused with the age of the surviving copies of Irenaeus’s work.", links: ["irenaeus"] },
      { who: "Eusebius · early fourth century", text: "<cite>To Marinus</cite> 1 offers two ways to reconcile Gospel resurrection accounts: set aside the disputed ending, appealing to copies ending at 16:8; or retain it and punctuate 16:9 differently. This is testimony to a textual debate, not a surviving census of all copies.", links: ["eusebius", "kelhoffer"] },
    ],
    versions: "Latin, Syriac and Coptic translations also preserve evidence about Greek textual history. Translators can paraphrase or revise, so a version’s wording must be interpreted within its own transmission. An ancient writer’s quotation likewise needs its own textual criticism.",
    versionLinks: ["ecm"],
  };

  // Galatians 1:4 in P46: θελ survives; ημα is supplied.
  const EDGE = {
    title: "A word can be restored.<br><em>The ink is still missing.</em>",
    lead: "In Galatians 1:4, Michigan’s diplomatic transcription marks lost letters in the word for “will”. Turn on the restoration and watch the boundary between evidence and reconstruction.",
    where: "P46 · Galatians 1:4 · line 8",
    off: "Three letters are recorded here. A gap is not evidence that the scribe meant to leave a shorter word.",
    on: "θέλημα · “will”. The letters ημα complete the word, but they are supplied, not surviving ink.",
    note: "Typographic close-up, not a tracing. Michigan writes θελ[ημα at the line’s end; we close the bracket for this isolated excerpt.",
    links: ["transcription"],
  };

  // GA 304: Houghton's reassessment of a "short" Mark.
  const GA304 = {
    rec: "Q6870196",
    title: "The last sentence.<br><em>Or an unfinished book?</em>",
    meta: "GA 304 · Paris, BnF grec 194 · first half of the twelfth century",
    lead: "This manuscript interleaves biblical extracts with commentary—a <em>catena</em>. Its last biblical extract ends at 16:8. It has been cited as a witness to that ending.",
    before: "The biblical text alone cannot settle the classification. Inspect what comes after it.",
    steps: [
      ["Biblical text", "Mark 16:1–8", "ἐφοβοῦντο γάρ"],
      ["Commentary follows", "A scholium on the women’s fear", ""],
      ["Blank space remains", "", ""],
      ["A closing verse, added and erased", "", ""],
    ],
    finding: "The commentary continues, but lacks the closing treatment used for Matthew. Houghton assigns an erased closing verse to another hand and connects the commentary with a tradition containing 16:9–20. He argues that this is unfinished copying, not an independent short Gospel.",
    unknown: "Whether the exemplar was defective or copying stopped for another reason. This reclassification does not overturn the broader case for an early ending at 16:8.",
    credit: "Adapted from H. A. G. Houghton, “Unfinished Business”, <cite>New Testament Studies</cite> 69 (2023), 35–42, §§3–4. CC BY 4.0. Analysis of the published study; no fresh physical collation.",
    links: ["houghton"],
  };

  // The invented counting example.
  const COPYING = {
    title: "Eight copies.<br><em>How many beginnings?</em>",
    lead: "A manuscript count tells you how many copies survived. It does not tell you how independently their readings arose.",
    tag: "Invented example · not a manuscript genealogy",
    hidden: ["8 with A · 2 with B", "A leads by number. Reveal the paths to see what that count leaves out."],
    shown: ["Two intermediate sources. An earlier text still unknown.", "In this model, eight copies repeat one inherited reading. That does not prove B correct: the source of A could preserve the better reading. Real transmission can also mix sources."],
    links: ["genealogy"],
  };

  const QUIZ = {
    title: "“P45 leaves out<br>the ending of Mark.”",
    lead: "The surviving inventory has no Mark 16. What can you conclude?",
    options: ["It supports an ending at 16:8.", "It supports the Longer Ending.", "It cannot witness this location."],
    right: 2, yes: "Yes. Missing material is not an omitted reading.", no: "Look again at what survives.",
    explain: "P45 has a gap in coverage here. By contrast, Sinaiticus preserves an actual conclusion at 16:8. “Not extant” and “absent from surviving text” must remain separate.",
    links: ["p45", "sinMark"],
  };

  // The editions, 1857 → 2021. `from`/`to` place each on a time line.
  const EDITIONS = {
    title: "An edition is an argument<br><em>that can be revised.</em>",
    lead: "The goal here is the earliest recoverable text of the Greek New Testament. It is not a survey of Hebrew Bible or Septuagint textual criticism, whose editorial histories and questions require their own close studies.",
    steps: [
      { when: "1857–1881", from: 1857, to: 1881, title: "Comparing judgments", text: "Tregelles’s edition (1857–1879) and Westcott–Hort (1881) remain visible in SBLGNT’s apparatus. They are historical editorial arguments, not additional manuscripts. Romans 5:1 shows why later editors sometimes depart from them.", links: ["method", "romApp"],
        marks: [[1857, "Tregelles"], [1881, "Westcott–Hort"]] },
      { when: "1898 → 1997", from: 1898, to: 1997, title: "From other editions back to witnesses", text: "Eberhard Nestle’s 1898 text compared earlier editions. Kurt Aland brought direct manuscript evidence into this edition’s work. Under Barbara Aland, international collaboration helped establish the larger ECM project; its first installment, James, appeared in 1997.", links: ["history"],
        marks: [[1898, "Nestle"], [1997, "ECM James"]] },
      { when: "2010", from: 2010, to: 2010, title: "A transparent comparison, with deliberate limits", text: "Michael Holmes’s SBLGNT makes editorial differences easy to inspect. Its compact apparatus is especially useful at this desk, but cannot replace an apparatus documenting manuscript support.", links: ["method"],
        marks: [[2010, "SBLGNT"]] },
      { when: "2021 →", from: 2021, to: 2021, title: "More evidence can make uncertainty clearer", text: "ECM Mark combines Greek witnesses, early translations and ancient quotations. Its published list of “split guiding lines” records places where alternatives remain unresolved. Mark 9:29 is one: the presence or absence of “and fasting”. An edition need not force a single answer at every point.", links: ["ecm", "split"],
        marks: [[2021, "ECM Mark"]] },
    ],
    cbgm: { title: "Why a computer does not simply count the copies",
      text: ["Gerd Mink’s Coherence-Based Genealogical Method (CBGM) studies relationships between textual states using decisions about individual variants. A late manuscript can preserve an early reading; scribes can combine sources. The resulting relationships are hypotheses about texts, not a recovered chain of named scribes or a family tree of physical books.",
        "That makes local judgments inspectable, not infallible. Coincidental agreement, mixed ancestry and lost witnesses complicate reconstruction. No CBGM calculation is performed by this study."],
      links: ["mink", "genealogy"] },
  };

  const READING = [
    { k: "01 / Transcribe", title: "Read a papyrus line by line", text: "Michigan places P46’s diplomatic and normalized texts beside its reading guide.", by: "University of Michigan", src: "transcription" },
    { k: "02 / Read the ancient argument", title: "Eusebius and his interpreters", text: "James Kelhoffer’s 2001 article supplies a Greek text, translation and analysis of the debate over Mark. Relevant sections consulted; the whole paper is available here.", by: "Uppsala repository · original research", src: "kelhoffer" },
    { k: "03 / Reassess a witness", title: "Unfinished Business", text: "Houghton’s 2023 article tests GA 239 and 304 through their physical and commentary contexts. It challenges an evidential claim without reversing the broad editorial conclusion.", by: "Cambridge · open-access research", src: "houghton" },
  ];
  const REMAINS = "Romans’s correction labels follow a published apparatus; the hands have not been freshly collated here. The GA 304 investigation follows Houghton’s published analysis. Full ECM volumes, the complete translated-witness evidence and Monier’s inaccessible 2019 paper remain research gaps.";
  const REGISTER = [
    "This desk is a curated introduction, not a new manuscript collation. P46 extracts follow Michigan’s published transcription; Romans hand assignments follow NET’s textual note. Manuscript viewers provide object locators. Modern edition comparisons follow SBLGNT’s text and apparatus. No complete reading of the editions’ underlying scholarly literature is claimed.",
    "<strong>Reading the labels:</strong> * means first hand; superscripts identify corrected states in the cited apparatus. “Not extant” means the relevant material does not survive. A transcription records a witness; a restoration supplies lost text; a critical edition selects readings. Always read an edition’s own key: brackets do not have one universal meaning.",
  ];
  const LICENCE = "Short Greek excerpts from <cite>The Greek New Testament: SBL Edition</cite>, edited by Michael W. Holmes, © 2010 Society of Biblical Literature and Logos Bible Software, used under <a href=\"https://creativecommons.org/licenses/by/4.0/\" target=\"_blank\" rel=\"noopener noreferrer\">CC BY 4.0</a>. Selection, spacing, highlighting and explanatory English glosses adapted for this study. No manuscript images are reproduced in the comparison itself; pictures of whole manuscripts come from Wikimedia Commons, credited where they appear. Diagram counts are explicitly hypothetical.";

  const HERO = {
    kicker: "A reader’s introduction to textual criticism",
    lead: "One passage. Several witnesses. Learn to see what changed.",
    end: "Before choosing a reading,<br><em>ask what kind of evidence you have.</em>",
  };

  window.PM = { SOURCES, CASES, readings, REASONING, LAYERS, INTRO, APPARATUS, LENSES, ENDINGS, EDGE, GA304, COPYING, QUIZ, EDITIONS, READING, REMAINS, REGISTER, LICENCE, HERO };
})();
