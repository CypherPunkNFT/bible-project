// The printed sheets (design 9.3, "Sheets"): each layout draws only the chosen items, typed fields sit under translate="no"
// and never inside the words, an empty "[name]" leaves a line to write on, the table card draws its item twice with one copy
// turned, a set of nine cards makes three sheets, and the page margin matches the layout.
import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OLDER_TEXTS, pageBySlug, type BlessingItem } from "@/data/home-blessings";
import type { ShownSympathy } from "@/pages/sympathy/useSympathyPassages";
import { cardSize, inSheets, printText, themeOf, type PrintJob, type PrintText } from "./print-job";
import { keepDash } from "./sheets/parts";
import { JobSheets, tentPageRule } from "./sheets/Sheets";
import { pageMargin } from "./useBlessingPrint";

afterEach(cleanup);

const older = (id: keyof typeof OLDER_TEXTS): PrintText => printText({ kind: "older", id, label: "An older grace", layouts: ["cards"] }, new Map());
const forSomeone = (): PrintText => {
  const item = pageBySlug("house-blessing")!.items.find((entry) => entry.id === "for-a-new-home") as BlessingItem;
  return printText(item, new Map());
};

function job(layout: PrintJob["layout"], texts: PrintText[], fields: Partial<PrintJob> = {}): PrintJob {
  return { layout, paper: "letter", slug: "bedtime", theme: "night", texts, familyLine: "", nameHeading: "", name: "", guides: true, ...fields };
}

const sheets = () => [...document.querySelectorAll(".hbs-sheet")];

describe("blessing sheets", () => {
  it("draws the wall print with only its item, the family line and name heading kept out of translation", () => {
    render(<JobSheets job={job("wall", [older("guiterman-house")], { slug: "house-blessing", theme: "house", familyLine: "The Okafor home · 2026", nameHeading: "For Grace" })} />);
    expect(sheets()).toHaveLength(1);
    const sheet = sheets()[0];
    expect(sheet.getAttribute("data-layout")).toBe("wall");
    expect([...sheet.querySelectorAll(".hbs-line")].map((line) => line.textContent)).toEqual(OLDER_TEXTS["guiterman-house"].lines);
    expect(sheet.querySelector(".hbs-words")?.getAttribute("lang")).toBe("en");
    expect(sheet.querySelector(".hbs-family")?.getAttribute("translate")).toBe("no");
    expect(sheet.querySelector(".hbs-family")?.textContent).toBe("The Okafor home · 2026");
    expect(sheet.querySelector(".hbs-name-heading")?.getAttribute("translate")).toBe("no");
    expect(sheet.querySelector(".hbs-credit")?.textContent).toBe("Arthur Guiterman, 1918");
    expect(sheet.textContent).toContain("bibleguide.io/blessings/house-blessing");
    expect(sheet.getAttribute("style")).toContain("--sheet-width: 8.5in");
  });

  it("leaves a line to write on where no name was typed, and fills the typed name under translate=\"no\" where one was", () => {
    const { unmount } = render(<JobSheets job={job("cards", [forSomeone()], { slug: "house-blessing" })} />);
    expect(document.querySelector(".hbs-blank")).not.toBeNull();
    expect(document.body.textContent).not.toContain("[name]");
    unmount();
    render(<JobSheets job={job("cards", [forSomeone()], { slug: "house-blessing", name: "  Joy  " })} />);
    expect(document.querySelector(".hbs-blank")).toBeNull();
    const name = document.querySelector(".hbs-name")!;
    expect(name.textContent).toBe("Joy");
    expect(name.getAttribute("translate")).toBe("no");
    expect(name.getAttribute("dir")).toBe("auto");
  });

  it("prints typed markup as text", () => {
    render(<JobSheets job={job("wall", [older("wesley-gentle")], { nameHeading: "<b>Sam</b>" })} />);
    expect(document.querySelector(".hbs-name-heading")?.textContent).toBe("<b>Sam</b>");
    expect(document.querySelector(".hbs-name-heading b")).toBeNull();
  });

  it("keeps a dash after a word on that word's printed line, without changing the stored words", () => {
    expect(keepDash("All this day Thy hand has led me,—")).toBe("All this day Thy hand has led me,\u2060\u2014");
    expect(keepDash("a — b")).toBe("a — b");
    render(<JobSheets job={job("colouring", [older("duncan-shepherd")])} />);
    expect(document.querySelector(".hbs-words")?.textContent).toContain("led me,\u2060\u2014");
    expect(OLDER_TEXTS["duncan-shepherd"].lines[5]).toBe("All this day Thy hand has led me,—");
  });

  it("draws the table card's item twice on one landscape sheet, the top copy turned", () => {
    render(<JobSheets job={job("table-card", [older("selkirk")], { paper: "a4", slug: "before-meals", theme: "table" })} />);
    expect(sheets()).toHaveLength(1);
    const faces = [...document.querySelectorAll(".hbs-tent-face")];
    expect(faces.map((face) => face.getAttribute("data-face"))).toEqual(["turned", "upright"]);
    expect(faces[0].classList.contains("hbs-turned")).toBe(true);
    expect(faces[0].querySelector(".hbs-words")?.textContent).toBe(faces[1].querySelector(".hbs-words")?.textContent);
    expect(sheets()[0].classList.contains("hbs-paper-a4")).toBe(true);
    expect(sheets()[0].getAttribute("style")).toContain("--sheet-width: 297mm");
  });

  it("makes three sheets from a set of nine cards, in order, with cut guides only when chosen", () => {
    const nine = (["come-lord-jesus", "cennick-table", "cennick-blood", "god-is-great", "leatham-world", "selkirk", "doxology", "wesley-gentle", "ken-evening"] as const).map(older);
    const { unmount } = render(<JobSheets job={job("cards", nine)} />);
    expect(sheets()).toHaveLength(3);
    expect(sheets().map((sheet) => sheet.querySelectorAll(".hbs-card").length)).toEqual([4, 4, 1]);
    expect([...document.querySelectorAll("[data-card]")].map((card) => card.getAttribute("data-card"))).toEqual(nine.map((text) => text.id));
    expect(sheets()[0].classList.contains("hbs-guides")).toBe(true);
    unmount();
    render(<JobSheets job={job("cards", nine, { guides: false })} />);
    expect(sheets()[0].classList.contains("hbs-guides")).toBe(false);
    expect(inSheets([1, 2, 3, 4, 5, 6, 7, 8, 9]).map((sheet) => sheet.length)).toEqual([4, 4, 1]);
  });

  it("sets a short grace at 18 pt and Duncan's two verses at 14 pt", () => {
    expect(cardSize(older("wesley-gentle"))).toBe("large");
    expect(cardSize(older("selkirk"))).toBe("large");
    expect(cardSize(older("duncan-shepherd"))).toBe("regular");
    render(<JobSheets job={job("cards", [older("wesley-gentle"), older("duncan-shepherd")])} />);
    expect([...document.querySelectorAll(".hbs-card")].map((card) => card.className)).toEqual(["hbs-card hbs-card-large", "hbs-card hbs-card-regular"]);
  });

  it("draws the colouring page with line art in the page's theme and nothing filled in colour", () => {
    render(<JobSheets job={job("colouring", [older("duncan-shepherd")])} />);
    const sheet = sheets()[0];
    expect(sheet.getAttribute("data-layout")).toBe("colouring");
    const motifs = sheet.querySelectorAll("svg.hbs-motif");
    expect(motifs.length).toBeGreaterThanOrEqual(8);
    for (const motif of motifs) expect(motif.getAttribute("fill")).toBe("none");
    expect(sheet.querySelector(".hbs-words")?.textContent).not.toContain("when I die");
  });

  it("prints Scripture in italic with the Berean line, and draws the fill-in card's prompts with lines to write on", () => {
    const blessing = pageBySlug("scripture-blessings")!.items[0];
    if (blessing.kind !== "scripture") throw new Error(`expected Numbers 6 first, got ${blessing.kind}`);
    const verse = { text: "The LORD bless you and keep you; the LORD make His face shine upon you", reference: "Numbers 6:24–26" } as unknown as ShownSympathy;
    const scripture = printText(blessing, new Map([[blessing.passage, verse]]));
    const { unmount } = render(<JobSheets job={job("wall", [scripture], { slug: "scripture-blessings", theme: "house" })} />);
    expect(document.querySelector(".hbs-words")?.classList.contains("hbs-scripture")).toBe(true);
    expect(document.querySelector(".hbs-footer")?.textContent).toContain("Berean Standard Bible");
    unmount();
    const fillIn = pageBySlug("bedtime")!.items.find((item) => item.kind === "fill-in")!;
    render(<JobSheets job={job("cards", [printText(fillIn, new Map())])} />);
    expect(document.querySelectorAll(".hbs-prompts li")).toHaveLength(fillIn.kind === "fill-in" ? fillIn.prompts.length : 0);
    expect(document.querySelectorAll(".hbs-write").length).toBeGreaterThan(0);
  });

  it("gives fixed sheets no page margin and the flowing order an ordinary one", () => {
    expect(pageMargin({ layout: "wall", paper: "letter" })).toBe("0");
    expect(pageMargin({ layout: "table-card", paper: "a4" })).toBe("0");
    expect(pageMargin({ layout: "order", paper: "letter" })).toBe("0.75in");
    expect(pageMargin({ layout: "order", paper: "a4" })).toBe("19mm");
  });

  it("gives the table card a landscape page beside its sheet, and the order its page numbers in the sheet CSS", () => {
    expect(tentPageRule("letter")).toBe("@page { size: 11in 8.5in; margin: 0; }");
    expect(tentPageRule("a4")).toBe("@page { size: 297mm 210mm; margin: 0; }");
    render(<JobSheets job={job("table-card", [older("selkirk")], { paper: "a4" })} />);
    expect(document.querySelector("style")?.textContent).toBe(tentPageRule("a4"));
    const css = readFileSync("src/pages/home-blessings/sheets/home-blessings-sheet.css", "utf8");
    expect(css).toMatch(/@page hb-order \{[^}]*counter\(page\)/);
  });

  it("chooses the colouring theme from the page", () => {
    expect(themeOf(pageBySlug("bedtime")!)).toBe("night");
    expect(themeOf(pageBySlug("graces-for-kids")!)).toBe("table");
    expect(themeOf(pageBySlug("before-meals")!)).toBe("table");
    expect(themeOf(pageBySlug("house-blessing")!)).toBe("house");
  });
});
