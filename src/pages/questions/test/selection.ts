// What the test page draws from, read from and written to the address: the questions page's filters, a theme (?theme=)
// or a book and chapter (?ch=), how many questions (?n=). A theme and a book are
// two ways to choose where, so choosing one drops the other. How hard (?level=) and children only (?age=children)
// narrow what is drawn from (settings.ts) and are kept as they are when the book, theme or length changes.
// The pool is drawn from every row's list layer (question-store.ts); the words and passages of the questions drawn come
// before the test shows; a search (?q=) waits for every question's words and a chapter (?ch=) for every passage.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "../model";
import type { QuestionStore } from "../question-store";
import { DEFAULT_LENGTH, MAX_LENGTH, MIN_LENGTH, chaptersOf, drawTest, type Item, type TestQuestion } from "./engine";
import { fitsSettings, readSettings } from "./settings";
import { themeById } from "./themes";

interface Address { filters: Filters; length: number; chapter: number | null; theme: string }
type Keep = ((index: number) => boolean) | undefined;
const both = (a: Keep, b: Keep): Keep => (a && b ? (i) => a(i) && b(i) : a ?? b);

/** `count` of `rows` at random (the draw, test/engine.ts, then shuffles their order again). */
function pick(rows: number[], count: number): number[] {
  const picked = [...rows];
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked.slice(0, count);
}

export function useSelection(store: QuestionStore) {
  const bank = store.bank;
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const asked = Number(params.get("n"));
  const length = asked >= MIN_LENGTH && asked <= MAX_LENGTH && asked % 5 === 0 ? asked : DEFAULT_LENGTH;
  const theme = themeById(params.get("theme") ?? "");
  const askedChapter = Number(params.get("ch"));
  const chapter = filters.book && askedChapter > 0 ? askedChapter : null;
  const settings = readSettings(params);
  const settingsKey = `${settings.level?.id ?? ""}-${settings.children}`;
  // Only questions that read well on their own (a test has no lesson around it), at the level and age asked for;
  // `places` holds each one's place in the bank, by which the store keeps themes, options and words.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- settings are read from params, which `settingsKey` stands for
  const places = useMemo(() => bank.questions.flatMap((q, i) => ((q.standalone || q.lead_in) && fitsSettings(q, settings) ? [i] : [])), [bank, settingsKey]);
  const pool = useMemo(() => places.map((i) => bank.questions[i]) as TestQuestion[], [bank, places]);
  const textReady = store.ready("text"), passagesReady = store.ready("passages");
  const waitText = Boolean(filters.search) && !textReady, waitPassages = chapter !== null && !passagesReady;
  useEffect(() => { if (waitText) void store.need("text", "all"); }, [waitText, store]);
  useEffect(() => { if (waitPassages) void store.need("passages", "all"); }, [waitPassages, store]);
  const haystacks = useMemo(() => (textReady ? pool.map(haystackOf) : []), [pool, textReady]);
  const filterKey = writeFilters(filters).toString();
  // "Multiple choice only" by the store's list of questions without options, so it needs no words.
  const counted: Filters = { ...filters, search: waitText ? "" : filters.search, choices: false };
  const options: Keep = filters.choices ? (i) => !store.withoutOptions.has(places[i]) : undefined;
  const members = theme ? store.themes.get(theme.id) : undefined;
  /* eslint-disable react-hooks/exhaustive-deps -- filters are read from params, which `filterKey` stands for */
  const themeRows = useMemo(() => facetsOf(pool, haystacks, { ...counted, book: "" }, options).rows, [pool, haystacks, filterKey, waitText]);
  const bookFacets = useMemo(() => facetsOf(pool, haystacks, counted, both(options, members && ((i) => members.has(places[i])))),
    [pool, haystacks, filterKey, waitText, members]);
  const facets = useMemo(() => (chapter ? facetsOf(pool, haystacks, counted, both(options, (i) => chaptersOf(pool[i], filters.book).includes(chapter))) : bookFacets),
    [bookFacets, chapter, pool, haystacks, filterKey, waitText, passagesReady]);
  /* eslint-enable react-hooks/exhaustive-deps */
  // A new draw whenever what it is drawn from changes, or on "Draw again": the questions are picked, their words and
  // passages brought, then the test is made. Only the latest draw counts, and none is made while a search or chapter waits.
  const [draw, setDraw] = useState<{ items: Item[]; round: number }>({ items: [], round: 0 });
  const ticket = useRef(0);
  const redraw = () => {
    if (waitText || waitPassages) return;
    const mine = ++ticket.current, from = bank;
    const picked = pick(facets.rows, length), wanted = picked.map((i) => places[i]);
    void Promise.all([store.need("text", wanted), store.need("passages", wanted)]).then(() => {
      // A store that fell back to the whole bank meanwhile has new rows, and a new draw follows from them.
      if (mine !== ticket.current || store.bank !== from) return;
      setDraw((d) => ({ items: drawTest(pool, picked, length), round: d.round + 1 }));
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a new draw only when what it is drawn from changes
  useEffect(redraw, [facets, length, waitText, waitPassages]);

  const now: Address = { filters, length, chapter, theme: theme?.id ?? "" };
  const write = (change: Partial<Address>) => {
    const next = { ...now, ...change };
    const out = writeFilters(next.filters);
    for (const key of ["level", "age"]) if (params.get(key)) out.set(key, params.get(key)!);
    if (next.length !== DEFAULT_LENGTH) out.set("n", String(next.length));
    if (next.theme) out.set("theme", next.theme);
    if (next.chapter && next.filters.book) out.set("ch", String(next.chapter));
    setParams(out, { replace: true, preventScrollReset: true });
  };
  return {
    pool, filters, length, chapter, theme: now.theme, settings, facets, bookFacets, themeRows, items: draw.items, round: draw.round, redraw,
    backTo: backTo(filters, now.theme),
    update: (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch };
      const newBook = next.book !== filters.book;
      write({ filters: next, chapter: newBook ? null : chapter, theme: newBook && next.book ? "" : now.theme });
    },
    setLength: (n: number) => write({ length: n }),
    setChapter: (ch: number | null) => write({ chapter: ch }),
    setTheme: (id: string) => write({ theme: id, filters: id ? { ...filters, book: "" } : filters, chapter: null }),
  };
}

/** The questions page with the same choice, its book and filters, and the theme, which it reads from the address too. */
function backTo(filters: Filters, theme: string) {
  const out = writeFilters(filters);
  if (theme) out.set("theme", theme);
  const query = out.toString();
  return `/study/questions${query ? `?${query}` : ""}`;
}
