export type Witness = {
  id: string; name: string; short: string; mark: string; date: string; language: string;
  form: string; colour: string; kind: 'fragment' | 'leaf' | 'columns' | 'facing' | 'hebrew';
  title: string; introduction: string; object: string; text: string; journey: string;
  caution: string; sources: { label: string; url: string }[];
};

export const witnesses: Witness[] = [
  {
    id: 'p52', name: 'The Rylands fragment', short: 'P52', mark: '𝔓⁵²', date: 'Date debated', language: 'Greek',
    form: 'A fragment of a codex', colour: '#dab979', kind: 'fragment',
    title: 'A fragment can carry a large question.',
    introduction: 'A small surviving piece of John invites two separate questions: what can we read, and how closely can we date the handwriting?',
    object: 'P52 is also catalogued as P.Ryl. III 457. These identifiers help researchers find the same physical witness across catalogues and publications.',
    text: 'The International Greek New Testament Project provides a scholarly transcription of its surviving text of John. A transcription records what can be read; it is a different object from the papyrus itself.',
    journey: 'The witness is held at the John Rylands Library in Manchester. Its modern catalogue and the IGNTP transcription provide two different ways into the evidence: the object record and an edited reading.',
    caution: 'Handwriting comparison does not supply an exact year. Brent Nongbri’s 2020 article argues that possible dates extend into the third century; that is an attributed argument, not a settled date.',
    sources: [
      { label: 'IGNTP · transcription record', url: 'https://epapers.bham.ac.uk/id/eprint/1754/' },
      { label: 'Nongbri · the dating question', url: 'https://www.cambridge.org/core/journals/new-testament-studies/article/abs/palaeography-precision-and-publicity-further-thoughts-on-pryliii457-p52/1D4E56BF0E9D4DDDA313D0C2754E2F28' },
    ],
  },
  {
    id: 'p46', name: 'The Pauline letters codex', short: 'P46', mark: '𝔓⁴⁶', date: '3rd century¹', language: 'Greek',
    form: 'Papyrus codex', colour: '#d7b778', kind: 'leaf',
    title: 'One book. Two collections. Missing leaves.',
    introduction: 'The surviving leaves of P46 now sit on opposite sides of the Atlantic. Reading the codex means bringing those pieces back into conversation.',
    object: 'Papyrus describes its material; codex describes its book form. A leaf has two sides. Counting leaves is therefore different from counting pages, verses or complete letters.',
    text: 'This is a collection of letters, not an entire New Testament. Surviving leaves can themselves be damaged: Michigan describes lost lines along their lower edges.',
    journey: 'The manuscript reached collectors through the antiquities market. Without a documented excavation, its archaeological setting is missing. Its modern acquisition history cannot replace that context.',
    caution: '¹ The third-century date follows Michigan’s introductory guide. A date assigned to this copy is not a date for the original composition of its letters.',
    sources: [
      { label: 'Michigan · introduction', url: 'https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/index.html' },
      { label: 'Michigan · surviving leaves', url: 'https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/state.html' },
      { label: 'Michigan · acquisition history', url: 'https://apps.lib.umich.edu/files/collections/papyrus/exhibits/reading/Paul/discovery.html' },
    ],
  },
  {
    id: 'sinaiticus', name: 'Codex Sinaiticus', short: 'Sinaiticus', mark: 'א', date: '4th century', language: 'Greek',
    form: 'Parchment codex', colour: '#93b6d3', kind: 'columns',
    title: 'A complete New Testament. An incomplete Bible.',
    introduction: 'Sinaiticus preserves the whole New Testament, alongside an incomplete Old Testament and other early Christian writings.',
    object: 'The surviving codex has over 400 large parchment leaves. Its pages are material evidence of the work of scribes, correctors and the people who preserved it.',
    text: 'The New Testament books survive in a different order from many modern editions. The codex also preserves Barnabas and part of the Shepherd of Hermas. Contents and later canon boundaries require distinct questions.',
    journey: 'Its surviving pages are held in several institutions. The collaborative digital project makes them available to examine together, reconnecting an object divided by its history.',
    caution: '“Complete” needs an object: the whole New Testament survives, but large parts of the Old Testament do not. Neither description should be stretched to cover the other.',
    sources: [
      { label: 'Sinaiticus project · contents', url: 'https://codexsinaiticus.org/en/codex/content.aspx' },
      { label: 'Sinaiticus project · dating', url: 'https://codexsinaiticus.org/en/codex/date.aspx' },
      { label: 'Examine the manuscript', url: 'https://codexsinaiticus.org/en/' },
    ],
  },
  {
    id: 'bezae', name: 'Codex Bezae', short: 'Bezae', mark: 'D', date: 'Late 4th / early 5th c.', language: 'Greek · Latin',
    form: 'Bilingual codex', colour: '#bf9bc8', kind: 'facing',
    title: 'Two languages face one another.',
    introduction: 'Greek and Latin meet on facing pages. Bezae lets us examine a biblical text alongside a witness to its translation.',
    object: 'Cambridge identifies this manuscript as MS Nn.2.41; New Testament catalogues also call it D or 05. One manuscript can have several useful identifiers.',
    text: 'It preserves Gospels, Acts and a fragment of 3 John. Its distinctive Greek readings make it an important comparison with other witnesses. A Latin reading is evidence in translation, not automatically the exact Greek wording behind it.',
    journey: 'Theodore Beza presented the manuscript to Cambridge in 1581. Today the digital library brings images and scholarly transcriptions together.',
    caution: 'A manuscript’s name may commemorate a later owner. “Bezae” does not name its ancient copyist or establish where it was copied.',
    sources: [
      { label: 'Cambridge · manuscript record', url: 'https://artsandculture.google.com/asset/codex-bezae-ms-nn-2-41/sgGih9NneG7FHQ?hl=en' },
      { label: 'Cambridge · history and recovery', url: 'https://specialcollections-blog.lib.cam.ac.uk/?p=15340' },
      { label: 'Examine the manuscript', url: 'https://cudl.lib.cam.ac.uk/view/MS-NN-00002-00041/1' },
    ],
  },
  {
    id: 'alexandrinus', name: 'Codex Alexandrinus', short: 'Alexandrinus', mark: 'A', date: '5th century', language: 'Greek',
    form: 'Bible in four volumes', colour: '#c7a17e', kind: 'columns',
    title: 'Sometimes the silence is a missing page.',
    introduction: 'A substantial biblical manuscript can still have gaps. Alexandrinus makes the difference between a lost leaf and an absent reading especially visible.',
    object: 'The British Library catalogues the Bible in four volumes, Royal MSS 1 D V–VIII. Its New Testament volume is written in two columns.',
    text: 'The catalogue records 25 missing leaves at the beginning of Matthew, covering Matthew 1:1–25:6. Missing leaves also interrupt John and 2 Corinthians; the volume includes writings attributed to Clement.',
    journey: 'The manuscript reached Charles I in 1627 and entered the British Museum with the Old Royal Library in 1757. Its catalogue tracks physical contents alongside this later custody.',
    caution: 'If the leaf containing a passage has been lost, the manuscript cannot tell us directly what that leaf read. Physical loss is not evidence that the scribe omitted the passage.',
    sources: [{ label: 'British Library · contents and history', url: 'https://searcharchives.bl.uk/catalog/040-002353500' }],
  },
  {
    id: 'aleppo', name: 'The Aleppo Codex', short: 'Aleppo', mark: 'א', date: '10th century', language: 'Hebrew',
    form: 'Hebrew Bible codex', colour: '#81b6a6', kind: 'hebrew',
    title: 'A text carried by a community.',
    introduction: 'The history of biblical manuscripts includes Jewish scribes, readers and custodians. The Aleppo Codex belongs within that living history of the Hebrew Bible.',
    object: 'The Israel Museum places the production of the Aleppo Codex in the tenth century. Its age is the age of a particular physical witness, not the beginning of the Hebrew biblical text.',
    text: 'A codex brings biblical writing into book form. Studying a Hebrew witness requires attention to the written text and the traditions of reading and annotation around it.',
    journey: 'The Museum recounts how Shmuel Sabag kept a small parchment fragment after the 1947 Aleppo pogrom. His family donated it to the Ben-Zvi Institute in 2003: even a scrap can have a recoverable custodial history.',
    caution: 'The story of one recovered fragment does not establish the fate of every missing leaf. Keep the documented object and the larger unresolved history distinct.',
    sources: [
      { label: 'Israel Museum · Hebrew manuscript survival', url: 'https://www.imj.org.il/en/exhibitions/piecing-together-past' },
      { label: 'Israel Museum · a recovered fragment', url: 'https://www.imj.org.il/en/exhibitions/rescued-fire' },
    ],
  },
];

export const questions = [
  { title: 'Did Alexandrinus omit the beginning of Matthew?', witness: 'alexandrinus', answer: 'The leaves are missing.', detail: 'The British Library records the loss of 25 leaves. That is a gap in the surviving object. We cannot read an omission into material that is no longer there.' },
  { title: 'Does “complete” mean the whole Bible?', witness: 'sinaiticus', answer: 'Ask: complete in what respect?', detail: 'Sinaiticus preserves the whole New Testament, while much of its Old Testament is lost. A useful description names both the survival and the loss.' },
  { title: 'Can handwriting give P52 an exact year?', witness: 'p52', answer: 'A proposed range, not a timestamp.', detail: 'Palaeographic dating compares handwriting. The breadth of the possible range is itself a subject of research; a precise-looking year would hide that uncertainty.' },
];

export const glossary = [
  ['Manuscript', 'A text written by hand. The physical copy and the work copied into it are different things.'],
  ['Codex', 'A book made of leaves gathered together. “Papyrus” and “parchment” describe materials; “codex” describes a format.'],
  ['Leaf / folio', 'One sheet in a book, with two sides. Recto and verso identify those sides.'],
  ['Lacuna', 'A gap in a surviving text. The reason for the gap matters: lost material and an unreadable surface are different problems.'],
  ['Transcription', 'An edited representation of the writing on a manuscript. Check how it marks uncertain letters, gaps and corrections.'],
  ['Provenance', 'The history of an object’s ownership and custody. A modern purchase location does not establish an ancient copying location.'],
];
