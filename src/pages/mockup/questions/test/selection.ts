// What the test page draws from, read from and written to the address: the questions page's filters, a theme (?theme=)
// or a book and chapter (?ch=), how many questions (?n=) and which page option shows (?option=). A theme and a book are
// two ways to choose where, so choosing one drops the other.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { QuestionBank } from "@/lib/data";
import { facetsOf, haystackOf, readFilters, writeFilters, type Filters } from "../model";
import { DEFAULT_LENGTH, LENGTHS, chaptersOf, drawTest, type Item, type TestQuestion } from "./engine";
import { inTheme, themeById } from "./themes";

interface Address { filters: Filters; length: number; chapter: number | null; theme: string; option: string }

export function useSelection(bank: QuestionBank, options: string[]) {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const asked = Number(params.get("n"));
  const length = (LENGTHS as readonly number[]).includes(asked) ? asked : DEFAULT_LENGTH;
  const option = options.find((id) => id === params.get("option")) ?? options[0];
  const theme = themeById(params.get("theme") ?? "");
  const askedChapter = Number(params.get("ch"));
  const chapter = filters.book && askedChapter > 0 ? askedChapter : null;
  // Only questions that read well on their own: a test has no lesson around it.
  const pool = useMemo(() => bank.questions.filter((q) => q.standalone) as TestQuestion[], [bank]);
  const haystacks = useMemo(() => pool.map(haystackOf), [pool]);
  const filterKey = writeFilters(filters).toString();
  /* eslint-disable react-hooks/exhaustive-deps -- filters are read from params, which `filterKey` stands for */
  const themeRows = useMemo(() => facetsOf(pool, haystacks, { ...filters, book: "" }).rows, [pool, haystacks, filterKey]);
  const bookFacets = useMemo(() => facetsOf(pool, haystacks, filters, theme ? (i) => inTheme(theme, pool[i]) : undefined), [pool, haystacks, filterKey, theme]);
  const facets = useMemo(() => (chapter ? facetsOf(pool, haystacks, filters, (i) => chaptersOf(pool[i], filters.book).includes(chapter)) : bookFacets),
    [bookFacets, chapter, pool, haystacks, filterKey]);
  /* eslint-enable react-hooks/exhaustive-deps */
  // One draw for every option; a new one whenever what it is drawn from changes, or on "Draw again".
  const [draw, setDraw] = useState<{ items: Item[]; round: number }>({ items: [], round: 0 });
  const redraw = () => setDraw((d) => ({ items: drawTest(pool, facets.rows, length), round: d.round + 1 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a new draw only when what it is drawn from changes
  useEffect(redraw, [facets, length]);

  const now: Address = { filters, length, chapter, theme: theme?.id ?? "", option };
  const write = (change: Partial<Address>) => {
    const next = { ...now, ...change };
    const out = writeFilters(next.filters);
    if (next.length !== DEFAULT_LENGTH) out.set("n", String(next.length));
    if (next.theme) out.set("theme", next.theme);
    if (next.chapter && next.filters.book) out.set("ch", String(next.chapter));
    if (next.option !== options[0]) out.set("option", next.option);
    setParams(out, { replace: true, preventScrollReset: true });
  };
  return {
    pool, filters, length, option, chapter, theme: now.theme, facets, bookFacets, themeRows, items: draw.items, round: draw.round, redraw,
    backTo: `/study/questions${filterKey ? `?${filterKey}` : ""}`,
    update: (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch };
      const newBook = next.book !== filters.book;
      write({ filters: next, chapter: newBook ? null : chapter, theme: newBook && next.book ? "" : now.theme });
    },
    setLength: (n: number) => write({ length: n }),
    setChapter: (ch: number | null) => write({ chapter: ch }),
    setTheme: (id: string) => write({ theme: id, filters: id ? { ...filters, book: "" } : filters, chapter: null }),
    setOption: (id: string) => write({ option: id }),
  };
}
