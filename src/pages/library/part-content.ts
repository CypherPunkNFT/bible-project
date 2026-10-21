import type { SectionId } from "@/lib/types";

export type PartId = Exclude<SectionId, "apocrypha">;

export interface Part {
  id: PartId;
  name: string;
  long: string;
  range: string;
  testament: "Old Testament" | "New Testament";
  about: string;
  /** years the part tells of (negative = BC); null when it is not a story in order */
  covers: [number, number] | null;
  coversFrom?: string | null;
  coversTo?: string;
  coversText: string;
  written: [number, number];
  writtenText: string;
  facts: [string, string][];
  moments: string[];
}

// The six parts of the library: what each one is, its dates and its hand-written facts.
// Counts (books, chapters, verses, words, longest chapter…) are computed from /data/stats.json (model.ts).
// Years: negative = BC. Dates follow the traditional (conservative) dating; "c." marks every estimate.
/** Each part's line icon, as one SVG path (24 × 24). */
export const PART_ICONS: Record<PartId, string> = {
  history: 'M4 21V9h4V4h3v5h3V4h3v5h3v12H4Zm6 0v-5a2 2 0 0 1 4 0v5M4 12h16',
  poetry: 'M6 4c2 1 3 3 3 5v7c0 3 6 3 6 0V9c0-2 1-4 3-5M6 4h12M6 4v12a6 6 0 0 0 12 0V4M9 8h6m-3 0v10',
  prophets: 'm4 13 12-5V4l4-2v18l-4-2v-4L4 17v-4Zm4 3 1 5h4l-2-6M2 13v4',
  gospels: 'M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z',
  epistles: 'M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5Zm-1.5 1 9 7 9-7M3 18l6-6m12 6-6-6',
  revelation: 'M12 3v6M9 6h6M4 19l-1-9 5 3 4-5 4 5 5-3-1 9zM4 21h16',
};

export const PARTS: Part[] = [
  {
    id: 'history', name: 'History', long: 'The historical books', range: 'Genesis – Esther', testament: 'Old Testament',
    about: 'The story of God and his people, told in order: creation and the patriarchs, the exodus and the law given at Sinai, the conquest of Canaan, the judges and the kings, the exile and the return. The first five books, the Law of Moses, lay the foundation that everything after them builds on.',
    covers: [-2100, -430], coversFrom: 'from creation', coversText: 'from creation and Abraham (c. 2100 BC) to Nehemiah (c. 430 BC)',
    written: [-1446, -400], writtenText: 'c. 1446–400 BC',
    facts: [
      ['Writers', 'Moses for the Law (Mark 12:26), then prophets and scribes, many unnamed'],
      ['Language', 'Hebrew, with Aramaic in Ezra 4:8–6:18 and 7:12–26'],
      ['Forms', 'Law, narrative, genealogy'],
    ],
    moments: ['Creation', 'Abraham', 'The exodus', 'Sinai', 'The conquest', 'The judges', 'The kingdom', 'The division', 'The exile', 'The return'],
  },
  {
    id: 'poetry', name: 'Poetry', long: 'The poetical books', range: 'Job – Song of Songs', testament: 'Old Testament',
    about: 'The Bible’s songs and wisdom. Job wrestles with suffering, the Psalms pray and praise through every circumstance, Proverbs teaches skill for living, Ecclesiastes weighs life under the sun, and the Song of Songs celebrates love. Hebrew poetry rhymes ideas rather than sounds: one line answers another.',
    covers: null, coversText: 'not a story in order: these books speak from within Israel’s history',
    written: [-1440, -450], writtenText: 'c. 1440–450 BC, most from David and Solomon (c. 1000–930 BC)',
    facts: [
      ['Writers', 'David (73 psalms by their titles), Solomon, Asaph, the sons of Korah, Moses (Psalm 90) and others'],
      ['Language', 'Hebrew'],
      ['Forms', 'Lament, praise, proverb, dialogue, love poetry'],
    ],
    moments: ['Job’s trial', 'The Lord is my shepherd', 'Psalm 119', 'The fear of the LORD', 'Vanity of vanities', 'The Song'],
  },
  {
    id: 'prophets', name: 'Prophets', long: 'The prophetical books', range: 'Isaiah – Malachi', testament: 'Old Testament',
    about: 'Messengers sent to Israel, to Judah and to the nations, calling God’s people back to the covenant, warning of judgment, and promising a coming King and a new covenant. Five longer books (the Major Prophets) and twelve shorter ones (the Minor Prophets), named for their length, not their importance.',
    covers: [-800, -430], coversText: 'the prophets’ ministries, c. 800–430 BC, before, during and after the exile',
    written: [-800, -430], writtenText: 'c. 800–430 BC (Joel and Obadiah are dated variously)',
    facts: [
      ['Writers', 'Isaiah, Jeremiah, Ezekiel, Daniel and the twelve'],
      ['Language', 'Hebrew, with Aramaic in Daniel 2:4–7:28 and Jeremiah 10:11'],
      ['Forms', 'Oracle, vision, lament, symbolic act'],
    ],
    moments: ['5 Major Prophets', '12 Minor Prophets', 'Before the exile', 'In Babylon', 'After the return', 'Then about 400 years of silence'],
  },
  {
    id: 'gospels', name: 'Gospels & Acts', long: 'The Gospels and Acts', range: 'Matthew – Acts', testament: 'New Testament',
    about: 'Four accounts of one life: the birth, teaching, miracles, death and resurrection of Jesus Christ. Matthew, Mark and Luke tell it side by side (the Synoptic Gospels); John tells it in his own way. Acts, Luke’s second volume, follows the apostles from Jerusalem to Rome.',
    covers: [-6, 62], coversText: 'from the birth of Jesus (c. 6–4 BC) to Paul in Rome (c. AD 62)',
    written: [50, 95], writtenText: 'c. AD 50–95, John last',
    facts: [
      ['Writers', 'Matthew, Mark, Luke and John; Luke also wrote Acts (Acts 1:1)'],
      ['Language', 'Greek'],
      ['Forms', 'Gospel, history, parable, sermon'],
    ],
    moments: ['The birth', 'The Sermon on the Mount', 'The parables', 'The cross', 'The empty tomb', 'Pentecost', 'To Rome'],
  },
  {
    id: 'epistles', name: 'Epistles', long: 'The letters', range: 'Romans – Jude', testament: 'New Testament',
    about: 'Twenty-one letters to churches and to individuals, teaching what the gospel means and how to live it. They answer real questions from real congregations, from Rome and Corinth to the churches of Asia Minor.',
    covers: [48, 95], coversText: 'the churches of their own day, c. AD 48–95',
    written: [48, 95], writtenText: 'c. AD 48–95',
    facts: [
      ['Writers', 'Paul (13 letters), James, Peter, John and Jude; the writer of Hebrews is not named'],
      ['Language', 'Greek'],
      ['Forms', 'Letter, doctrine, instruction, greeting'],
    ],
    moments: ['Justified by faith', 'The body of Christ', 'Love is patient', 'Better than the angels', 'Faith and works', 'God is love'],
  },
  {
    id: 'revelation', name: 'Revelation', long: 'The Revelation', range: 'Revelation', testament: 'New Testament',
    about: 'The Bible’s final book: a prophecy given to John on Patmos (Revelation 1:9). Letters to seven churches, visions of the throne of God and of the Lamb, judgments in sevens, and the new heaven and the new earth. It draws deeply on Daniel, Ezekiel, Isaiah and Zechariah.',
    covers: [95, 110], coversFrom: null, coversTo: 'to the new creation', coversText: 'the churches of John’s day, and the end of all things',
    written: [95, 95], writtenText: 'c. AD 95 (traditional dating)',
    facts: [
      ['Writer', 'John (Revelation 1:1, 4, 9)'],
      ['Language', 'Greek'],
      ['Forms', 'Prophecy, apocalyptic vision, letter'],
    ],
    moments: ['Seven churches', 'The throne', 'Seven seals', 'Seven trumpets', 'Seven bowls', 'The new Jerusalem'],
  },
];
