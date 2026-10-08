// The data behind "Teachers through the Bible": per teacher, their works on Bible texts filed by book, plus everyone
// summed; which teachers get a year slider (most works dated inside their working life, across ten or more years);
// and the teachers with no Bible texts recorded, for the fold-out.
import type { Book, PassageWork, PeopleData, Person } from "@/data/teachers/pages-types";
import { lifeEnd } from "../../shared/people";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface Entry { work: PassageWork; person: Person }
export interface Track {
  id: string;
  person: Person | null;
  byBook: Entry[][];
  totals: number[];
  works: number;
  /** url → how many of this teacher's works point at it: more than one means the link opens a whole volume. */
  urls: Map<string, number>;
  inLife: (work: PassageWork) => boolean;
  dated: PassageWork[];
  timeline: boolean;
  anyDate: boolean;
  datedCount: number;
  yearCount: number;
  max: number;
  bookCount: number;
  top: number;
}
export interface ThroughModel { books: Book[]; teachers: Track[]; everyone: Track; quiet: Person[]; byId: Map<string, Track> }

/** The year a work is dated to, when the date is a plain YYYY, YYYY-MM or YYYY-MM-DD. */
export const exactYear = (w: PassageWork) => (w.d && /^\d{4}(-|$)/.test(w.d) && !w.d.includes("/") ? Number(w.d.slice(0, 4)) : null);
/** Dates come as YYYY, YYYY-MM or YYYY-MM-DD; anything else (e.g. "1784/1785") is shown as written. */
export function formatDate(raw: string | null) {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(raw ?? "");
  if (!m) return raw ?? "";
  const [, y, mo, d] = m;
  return d ? `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}` : mo ? `${MONTHS[Number(mo) - 1]} ${y}` : y;
}
/** In the list, a middle name is dropped so names fit ("Charles Haddon Spurgeon" → "Charles Spurgeon"); initials stay. */
export const listName = (name: string) => { const parts = name.split(/\s+/); return parts.length > 2 && !parts[0].endsWith(".") ? `${parts[0]} ${parts[parts.length - 1]}` : name; };
export const initials = (name: string) => { const parts = name.replace(/\./g, "").split(/\s+/); return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); };
export const bookOf = (w: PassageWork) => Math.floor(w.v / 1e6) - 1;
export const chapterOf = (w: PassageWork) => Math.floor(w.v / 1e3) % 1000;

function finish(track: Omit<Track, "max" | "bookCount" | "top">): Track {
  const max = Math.max(...track.totals);
  return { ...track, max, bookCount: track.totals.filter(Boolean).length, top: track.totals.indexOf(max) };
}

function teacherTrack(person: Person, books: Book[]): Track {
  const byBook: Entry[][] = books.map(() => []);
  const urls = new Map<string, number>();
  for (const work of person.passages) {
    byBook[bookOf(work)].push({ work, person });
    if (work.u) urls.set(work.u, (urls.get(work.u) ?? 0) + 1);
  }
  const inLife = (w: PassageWork) => { const y = exactYear(w); return y !== null && y >= person.born + 14 && y <= lifeEnd(person); };
  const dated = person.passages.filter(inLife);
  const years = new Set(dated.map(exactYear));
  return finish({
    id: person.id, person, byBook, totals: byBook.map((l) => l.length), works: person.passages.length, urls, inLife, dated,
    timeline: dated.length >= person.passages.length / 2 && years.size >= 10,
    anyDate: person.passages.some((w) => w.d), datedCount: person.passages.filter((w) => w.d).length,
    yearCount: new Set(person.passages.map(exactYear).filter((y) => y !== null)).size,
  });
}

export function buildThroughModel(data: PeopleData): ThroughModel {
  const { books, people } = data;
  const teachers = people.filter((p) => p.passages.length).map((p) => teacherTrack(p, books)).sort((a, b) => b.works - a.works);
  const byBook = books.map((_, b) => teachers.flatMap((t) => t.byBook[b]).sort((x, y) => x.work.v - y.work.v || x.person.born - y.person.born));
  const everyone = finish({
    id: "all", person: null, byBook, totals: byBook.map((l) => l.length), works: teachers.reduce((n, t) => n + t.works, 0),
    urls: new Map(), inLife: () => false, dated: [], timeline: false, anyDate: true, datedCount: 0, yearCount: 0,
  });
  const quiet = people.filter((p) => !p.passages.length).sort((a, b) => a.born - b.born);
  return { books, teachers, everyone, quiet, byId: new Map([everyone, ...teachers].map((t) => [t.id, t])) };
}

export interface Timeline { first: number; last: number; all: number; cumulative: number[][] }
/** Per book, how many of the teacher's dated works fall in or before each year of their dated span. */
export function timelineOf(track: Track): Timeline | null {
  if (!track.timeline) return null;
  const years = track.dated.map((w) => exactYear(w) ?? 0);
  const first = Math.min(...years), last = Math.max(...years);
  const cumulative = track.byBook.map((entries) => {
    const perYear = new Array<number>(last - first + 1).fill(0);
    for (const { work } of entries) if (track.inLife(work)) perYear[(exactYear(work) ?? first) - first]++;
    for (let i = 1; i < perYear.length; i++) perYear[i] += perYear[i - 1];
    return perYear;
  });
  return { first, last, all: last + 1, cumulative };
}

/** The count on a book, up to `year` when the slider is held back (year < all). */
export function countAt(track: Track, timeline: Timeline | null, year: number, b: number) {
  if (!timeline || year >= timeline.all) return track.totals[b];
  if (year < timeline.first) return 0;
  return timeline.cumulative[b][Math.min(year, timeline.last) - timeline.first];
}
