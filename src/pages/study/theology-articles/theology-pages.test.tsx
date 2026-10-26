// The two pages actually draw, and the things the owner asked for are on screen: the Berean wording
// with a link into the reader, a disclaimer beside each analogy, and C. S. Lewis described rather
// than quoted.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ARTICLES, SOURCES, articleHref, readerHref } from "./model";
import TheologyPage from "./TheologyPage";
import TheologyArticlePage from "./TheologyArticlePage";

afterEach(cleanup);

const article = ARTICLES[0];
const openArticle = (id: string) => render(
  <MemoryRouter initialEntries={[`/study/theology-articles/${id}`]}>
    <Routes><Route path="/study/theology-articles/:id" element={<TheologyArticlePage />} /></Routes>
  </MemoryRouter>,
);

describe("the Theology landing", () => {
  it("names the section, counts what is in it and lists every source", () => {
    const screen = render(<MemoryRouter><TheologyPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("The faith,");
    const card = within(screen.getByRole("list", { name: "Articles in this section" }));
    expect(card.getByRole("heading", { level: 3 }).textContent).toContain(article.title);
    for (const section of article.sections) expect(card.getByText(section.kicker)).toBeTruthy();
    expect(screen.container.querySelector(`a[href="${articleHref(article.id)}"]`)).toBeTruthy();
    // Both figures and sources are counted from the articles, so a miscount would show here.
    expect(screen.getByText("Passages quoted in full")).toBeTruthy();
    const sources = screen.container.querySelectorAll(".th-sources-list li");
    expect(sources).toHaveLength(SOURCES.length);
  });
});

describe("the article", () => {
  it("draws every part, in order, with nothing failed", () => {
    const screen = openArticle(article.id);
    const headings = [...screen.container.querySelectorAll(".th-part-head h2")].map((h) => h.textContent);
    expect(headings).toEqual(article.sections.map((section) => section.title));
    expect(screen.container.querySelectorAll(".th-failed")).toHaveLength(0);
    expect(document.title).toContain(article.title);
  });

  it("links every Scripture quotation to the same wording in the reader", () => {
    const screen = openArticle(article.id);
    const quotations = article.sections.flatMap((section) => section.body).filter((block) => block.kind === "scripture");
    const figures = screen.container.querySelectorAll(".th-scripture");
    expect(figures).toHaveLength(quotations.length);
    for (const block of quotations) {
      const link = screen.container.querySelector(`.th-scripture a[href="${readerHref(block.book, block.chapter, block.verses)}"]`);
      expect(link, block.reference).toBeTruthy();
      expect(link?.textContent, block.reference).toContain(block.reference);
    }
  });

  it("shows each analogy's disclaimer beside it", () => {
    const screen = openArticle(article.id);
    const cautions = article.sections.flatMap((section) => section.body).filter((block) => block.kind === "caution");
    expect(screen.container.querySelectorAll(".th-caution")).toHaveLength(cautions.length);
    for (const block of cautions) expect(screen.getByText(block.title), block.title).toBeTruthy();
  });

  // The one rule that cannot be allowed to slip: a work in copyright is described, never reproduced.
  it("describes C. S. Lewis in our own words and quotes nothing of his", () => {
    const screen = openArticle(article.id);
    const summaries = [...screen.container.querySelectorAll(".th-summary")];
    expect(summaries.length).toBeGreaterThan(0);
    for (const summary of summaries) expect(summary.textContent).toContain("In our words, not his");
    expect(screen.container.querySelectorAll(".th-summary blockquote")).toHaveLength(0);
    for (const quote of screen.container.querySelectorAll(".th-quote figcaption")) {
      expect(quote.textContent).not.toMatch(/Mere Christianity|C\. S\. Lewis/);
    }
  });

  it("says so in the page when an address names no article", () => {
    const screen = openArticle("the-trinitie");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("There is no article at this address.");
    expect(screen.getByText(/the-trinitie/)).toBeTruthy();
    expect(screen.container.querySelector(`a[href="${articleHref(article.id)}"]`)).toBeTruthy();
  });
});
