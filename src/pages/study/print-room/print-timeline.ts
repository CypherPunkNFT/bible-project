// Every dated printed edition and translation the study discusses, placed on one line of time. Dates and notes come from
// the study's own text and dossier (content/academic-research/05-from-manuscript-to-printed-bible.json); nothing is added
// that the study does not say. Items the dossier dates only loosely ("later 16th c.", "19th-century edition") are drawn as
// faint spans or left out. The one manuscript, the Leningrad Codex, sits off the left edge with an arrow. Each item says where on the page it is discussed, and what to select there.

export interface Lane { id: string; label: string; tone: string }
export interface Go {
  /** The section to scroll to. */
  anchor: string;
  /** usePrintState keys to set first: [key, value]. */
  state?: [string, unknown][];
  /** A printed edition to open in the architecture chapter (the ?edition= parameter). */
  edition?: string;
}
export interface TimelineItem {
  id: string; lane: string; from: number; to?: number; label: string; date: string; note: string; go: Go;
  /** A span the dossier dates only loosely: drawn faint. */
  loose?: boolean;
  /** Still in progress: drawn open at the right. */
  open?: boolean;
}

export const AXIS = { from: 1450, to: 2030 };
/** The axis is fitted, not even: 1700–1880, with one edition in it, is narrowed and marked as such. [year, share of the width]. */
export const AXIS_STOPS: [number, number][] = [[1450, 0], [1700, 0.6], [1880, 0.7], [2030, 1]];
export const NARROWED = { from: 1700, to: 1880 };
export const TICKS = [1450, 1500, 1550, 1600, 1650, 1700, 1880, 1900, 1950, 2000];

/** The six chapters, in page order: the opening's row of ways in, and where the timeline says it will take you. */
export const CHAPTERS = [
  { n: '01', tone: 'var(--accent)', kind: 'Inspect', foot: 'Text · Translation · Book', anchor: 'proof-sheet', title: 'Inspect a page', text: 'One sheet of 1516, three kinds of work on it.' },
  { n: '02', tone: 'var(--prophets)', kind: 'Compare', foot: '1516 · 1519 · 1522', anchor: 'revision', title: 'Watch a revision', text: 'The same Greek, edited again in 1519 and 1522.' },
  { n: '03', tone: 'var(--history)', kind: 'Exercise', foot: 'Set · Pull · Correct', anchor: 'bookmaking', title: 'Make a book', text: 'Set type, pull a sheet, correct it, pull again.' },
  { n: '04', tone: 'var(--poetry)', kind: 'Take apart', foot: 'Pages · Polyglots · Family trees', anchor: 'page-inspection', title: 'Read the architecture', text: 'Pages, polyglots and family trees of editions.' },
  { n: '05', tone: 'var(--gospels)', kind: 'Translate', foot: 'Luther · Tyndale · King James', anchor: 'translation-desk', title: 'Translate', text: 'Luther to King James, and who did the work.' },
  { n: '06', tone: 'var(--acts)', kind: 'Look beneath', foot: 'Apparatus · Aims · Research', anchor: 'critical-desk', title: 'Look beneath the line', text: 'The apparatus, the editor’s aim, research still going.' },
] as const;

export const LANES: Lane[] = [
  { id: 'latin', label: 'First presses', tone: 'var(--history)' },
  { id: 'greek', label: 'Greek New Testament', tone: 'var(--prophets)' },
  { id: 'hebrew', label: 'Hebrew Bible', tone: 'var(--poetry)' },
  { id: 'poly', label: 'Polyglots & Greek Old Testament', tone: 'var(--epistles)' },
  { id: 'trans', label: 'Translations', tone: 'var(--gospels)' },
];

const arch = (tab: string, more: [string, unknown][] = []): Go => ({ anchor: 'page-inspection', state: [['arch-tab', tab], ...more] });
const tree = (family: number, node: string): Go => arch('trees', [['family', family], family === 0 ? ['hebrew-edition', node] : ['network-node', node]]);
const desk = (tab: string): Go => ({ anchor: 'critical-desk', state: [['desk-tab', tab]] });
const translation = (i: number): Go => ({ anchor: 'translation-desk', state: [['translation', i]] });

export const ITEMS: TimelineItem[] = [
  { id: 'gutenberg', lane: 'latin', from: 1455, label: 'Gutenberg', date: 'c. 1455 · Mainz', note: 'The 42-line Bible. A printed book that still needed hands to finish it: rubricators added initials, binders made the volume.', go: { ...arch('pages'), edition: 'gutenberg' } },
  { id: 'eggestein', lane: 'latin', from: 1469, to: 1470, label: 'Eggestein', date: 'late 1469 / early 1470 · Strasbourg', note: 'Cambridge’s Gutenberg copy was used as setting copy for Heinrich Eggestein’s third Latin Bible: a printed book became the next printer’s exemplar.', go: { anchor: 'bookmaking' } },

  { id: 'erasmus', lane: 'greek', from: 1516, to: 1535, label: 'Erasmus', date: '1516–1535 · Basel', note: 'Erasmus’s Greek with his Latin, printed by Froben, revised over five editions. The heavenly witnesses clause is absent in 1516 and 1519, present in 1522.', go: { anchor: 'revision' } },
  { id: 'stephanus', lane: 'greek', from: 1550, label: 'Stephanus', date: '1550', note: 'Robert Estienne’s influential edition, with variants in its margin; it built on Erasmus and the Complutensian.', go: tree(1, 'st') },
  { id: 'beza', lane: 'greek', from: 1556, to: 1600, loose: true, label: 'Beza', date: 'later 16th century', note: 'Theodore Beza’s editions, which used the variants collected by Robert and Henri Estienne.', go: tree(1, 'be') },
  { id: 'mill', lane: 'greek', from: 1707, label: 'Mill', date: '1707', note: 'John Mill gathered variants after decades of work: evidence accumulated beneath an inherited printed text.', go: desk('research') },
  { id: 'wh', lane: 'greek', from: 1881, label: 'Westcott & Hort', date: '1881', note: 'One of the editions Eberhard Nestle compared to make his text.', go: tree(2, 'wh') },
  { id: 'nestle', lane: 'greek', from: 1898, label: 'Nestle', date: '1898', note: 'Eberhard Nestle chose the reading shared by two of three scholarly editions.', go: tree(2, 'n') },
  { id: 'nestle27', lane: 'greek', from: 1927, label: 'E. Nestle', date: '1927', note: 'Erwin Nestle expanded the apparatus; Kurt Aland’s work later brought systematic manuscript checking.', go: desk('research') },
  { id: 'na28', lane: 'greek', from: 2012, label: 'NA28', date: '2012 · Stuttgart / Münster', note: 'Novum Testamentum Graece, 28th edition, incorporating the Editio Critica Maior’s decisions in James to Jude. NA29 is in preparation.', go: { ...arch('pages'), edition: 'na28' } },

  { id: 'leningrad', lane: 'hebrew', from: 1008, to: 1009, label: 'Leningrad Codex', date: '1008/09 · a manuscript', note: 'Not a printed book: the manuscript chosen as the base text of BHK 3, BHS and BHQ, copied over four centuries before the press.', go: tree(0, 'bh3') },
  { id: 'bomberg', lane: 'hebrew', from: 1524, to: 1525, label: 'Ben Hayyim', date: '1524/25 · Venice', note: 'The Second Rabbinic Bible, edited by Jacob ben Hayyim for Daniel Bomberg: Hebrew text with Masorah, targum and commentary.', go: { ...arch('pages'), edition: 'bomberg' } },
  { id: 'bhk12', lane: 'hebrew', from: 1906, to: 1913, label: 'BHK 1–2', date: '1906 / 1913', note: 'Kittel’s first two Biblia Hebraica editions, based on Ben Hayyim’s printed text.', go: tree(0, 'bh12') },
  { id: 'bhk3', lane: 'hebrew', from: 1937, label: 'BHK 3', date: '1937', note: 'The third edition turned to the Leningrad Codex (1008/09) as its base, under Paul Kahle’s influence.', go: tree(0, 'bh3') },
  { id: 'bhs', lane: 'hebrew', from: 1967, to: 1977, label: 'BHS', date: '1967–77', note: 'Biblia Hebraica Stuttgartensia, continuing with the Leningrad Codex.', go: tree(0, 'bhs') },
  { id: 'bhq', lane: 'hebrew', from: 2004, to: 2026, open: true, label: 'BHQ', date: 'from 2004, in fascicles', note: 'Biblia Hebraica Quinta: a new apparatus and commentary, still on the Leningrad Codex, still appearing book by book.', go: { ...arch('pages'), edition: 'bhq' } },

  { id: 'complutensian', lane: 'poly', from: 1514, to: 1522, label: 'Complutensian', date: 'printed 1514–17 · authorized 1520', note: 'The Complutensian Polyglot. Its New Testament was printed in January 1514, before Erasmus, but circulated only around 1522.', go: { ...arch('pages'), edition: 'complutensian' } },
  { id: 'walton', lane: 'poly', from: 1654, to: 1657, label: 'Walton', date: '1654–57 · London', note: 'Walton’s London Polyglot, paid for by subscriptions, with a wider range of versions.', go: arch('polyglot') },
  { id: 'rahlfs', lane: 'poly', from: 1935, label: 'Rahlfs', date: '1935', note: 'Rahlfs’s compact Septuagint: the Greek Old Testament also needed its own editing.', go: arch('polyglot') },
  { id: 'hanhart', lane: 'poly', from: 2006, label: 'Hanhart', date: '2006', note: 'Robert Hanhart’s revision of Rahlfs’s Septuagint.', go: arch('polyglot') },

  { id: 'luther', lane: 'trans', from: 1522, label: 'Luther', date: '1522 · Wittenberg', note: 'Luther’s September Testament, translated from Erasmus’s Greek into idiomatic German.', go: translation(0) },
  { id: 'tyndale', lane: 'trans', from: 1526, to: 1534, label: 'Tyndale', date: '1526; revised 1534', note: 'Tyndale’s English New Testament: begun at Cologne and interrupted, printed complete at Worms, then revised.', go: translation(1) },
  { id: 'coverdale', lane: 'trans', from: 1535, label: 'Coverdale', date: '1535', note: 'The first complete printed English Bible, made largely from German and Latin translations and printed at Antwerp.', go: translation(2) },
  { id: 'rheims', lane: 'trans', from: 1582, label: 'Rheims', date: '1582', note: 'Gregory Martin’s Catholic English rendering of the Latin Vulgate, printed by John Fogny at Rheims.', go: translation(3) },
  { id: 'kjv', lane: 'trans', from: 1611, label: 'King James', date: '1611 · London', note: 'Six companies revised the Bishops’ Bible; Robert Barker printed it. Its preface defends alternatives in the margin: “variety of Translations is profitable”.', go: translation(4) },
  { id: 'eliot', lane: 'trans', from: 1663, to: 1685, label: 'Massachusett', date: '1663; revised 1685', note: 'The Massachusett Bible, made with Job Nesutan’s translation and James Printer’s typesetting, in Cambridge, Massachusetts.', go: { anchor: 'translation-desk' } },
];
