import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LibraryWorkPage from "./LibraryWorkPage";
import { getReadingPage, getWorkRecord, type ReadingRecord } from "./shared/acquired";

vi.mock("./shared/CollectionBrowser", () => ({ CollectionBrowser: () => null }));
vi.mock("./shared/AcquiredCatalogue", () => ({ AcquiredCatalogue: () => null }));
vi.mock("./shared/acquired", async importOriginal => ({
  ...await importOriginal<typeof import("./shared/acquired")>(),
  getWorkRecord: vi.fn(), getReadingPage: vi.fn(),
}));

const record = (id = "boyce", extra: Partial<ReadingRecord> = {}): ReadingRecord => ({
  id, title: `Held ${id}`, authors: ["Recorded author"], contributors: ["recorded-contributor"],
  language: "en", genre: "Theology", source: "recorded-source", sourceId: "original-source-id",
  sourceUrl: null, licence: "Private noncommercial reading only", credit: "Recorded source credit",
  availability: "local-text", localCopy: true, sha256: "original-copy-sha", pages: 25,
  workId: null, editionId: null, reviewWarning: null, ...extra,
});
const mockRecord = vi.mocked(getWorkRecord), mockPage = vi.mocked(getReadingPage);
function HistoryControls() {
  const location = useLocation(), navigate = useNavigate();
  return <><output data-testid="position">{location.pathname}{location.search}</output>
    <button onClick={() => navigate(-1)}>Browser Back</button><button onClick={() => navigate(1)}>Browser Forward</button>
    <button onClick={() => navigate("/teachers/works/henry?page=2")}>Other work</button></>;
}
function open(url: string, embeddedId?: string) {
  return render(<MemoryRouter initialEntries={[url]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}>
    <HistoryControls /><Routes><Route path="/teachers/works/:id" element={<LibraryWorkPage workId={embeddedId} embedded={!!embeddedId} />} /></Routes>
  </MemoryRouter>);
}
const topNavigation = () => within(screen.getByRole("navigation", {name:"Reading pages"}));
async function pageVisible(id: string, page: number) { await screen.findByText(`Text ${id}, reading page ${page}`); }
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return {promise,resolve};
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRecord.mockImplementation(async id => record(id));
  mockPage.mockImplementation(async (row, page) => ({blocks:[{text:`Text ${row.id}, reading page ${page+1}`,locator:"Retained source locator"}]}));
});
afterEach(cleanup);

describe("manual reading positions", () => {
  it("opens a one-based shared position and preserves source notices and copy identity", async () => {
    open("/teachers/works/boyce?page=25&author=kept");
    await pageVisible("boyce",25);
    expect(mockPage).toHaveBeenCalledWith(expect.objectContaining({id:"boyce",workId:null,editionId:null}),24,expect.any(AbortSignal));
    const nav = topNavigation();
    expect(nav.getByRole("textbox",{name:"Reading page"})).toHaveValue("25");
    expect(nav.getByRole("button",{name:"Next"})).toBeDisabled();
    expect(nav.getByRole("button",{name:"Previous"})).toBeEnabled();
    expect(screen.getByText("Recorded source credit")).toBeVisible();
    expect(screen.getByText(/Private noncommercial reading only/)).toBeVisible();
    expect(screen.getByText(/transcription accuracy has not been fully reviewed/)).toBeVisible();
    expect(screen.getAllByText("Text reading pages, not print pages.")).toHaveLength(2);
  });

  it.each(["", "0", "-1", "1.5", "words", "26", "9007199254740993"])("explains an invalid page=%s and never requests it", async value => {
    open(`/teachers/works/boyce?page=${value}`);
    await pageVisible("boyce",1);
    expect(screen.getByText(/This reading page is unavailable/)).toHaveTextContent("Showing reading page 1");
    expect(mockPage).toHaveBeenCalledTimes(1);
    expect(mockPage.mock.calls[0][1]).toBe(0);
    expect(topNavigation().getByRole("button",{name:"Previous"})).toBeDisabled();
  });

  it("keeps Go, Previous/Next, browser history and unrelated query parameters in agreement", async () => {
    open("/teachers/works/boyce?page=2&author=kept");
    await pageVisible("boyce",2);
    fireEvent.change(topNavigation().getByRole("textbox",{name:"Reading page"}),{target:{value:"25"}});
    fireEvent.click(topNavigation().getByRole("button",{name:"Go"}));
    await pageVisible("boyce",25);
    expect(screen.getByTestId("position")).toHaveTextContent("?page=25&author=kept");
    fireEvent.click(topNavigation().getByRole("button",{name:"Previous"}));
    await pageVisible("boyce",24);
    fireEvent.click(screen.getByRole("button",{name:"Browser Back"}));
    await pageVisible("boyce",25);
    fireEvent.click(screen.getByRole("button",{name:"Browser Forward"}));
    await pageVisible("boyce",24);
    fireEvent.click(topNavigation().getByRole("button",{name:"Next"}));
    await pageVisible("boyce",25);
    fireEvent.change(topNavigation().getByRole("textbox",{name:"Reading page"}),{target:{value:"1"}});
    fireEvent.submit(topNavigation().getByRole("textbox",{name:"Reading page"}).closest("form")!);
    await pageVisible("boyce",1);
    expect(screen.getByTestId("position")).toHaveTextContent("/teachers/works/boyce?author=kept");
  });

  it("rejects a bad Go input without changing the current page or URL", async () => {
    open("/teachers/works/boyce?page=3");
    await pageVisible("boyce",3);
    fireEvent.change(topNavigation().getByRole("textbox",{name:"Reading page"}),{target:{value:"26"}});
    fireEvent.click(topNavigation().getByRole("button",{name:"Go"}));
    expect(topNavigation().getByRole("alert")).toHaveTextContent("from 1 to 25");
    expect(topNavigation().getByRole("textbox",{name:"Reading page"})).toHaveAttribute("aria-invalid","true");
    expect(screen.getByTestId("position")).toHaveTextContent("?page=3");
    expect(mockPage).toHaveBeenCalledTimes(1);
  });

  it("cancels late page text when the work changes and validates the new work's requested position", async () => {
    const old = deferred<{blocks:{text:string;locator:string}[]}>();
    mockPage.mockImplementation(async (row,page) => row.id === "boyce" ? old.promise : {blocks:[{text:`Text ${row.id}, reading page ${page+1}`,locator:"New source"}]});
    open("/teachers/works/boyce?page=3");
    await waitFor(() => expect(mockPage).toHaveBeenCalledTimes(1));
    const signal = mockPage.mock.calls[0][2]!;
    fireEvent.click(screen.getByRole("button",{name:"Other work"}));
    await pageVisible("henry",2);
    expect(signal.aborted).toBe(true);
    await act(async () => old.resolve({blocks:[{text:"Late text from old work",locator:"Old"}]}));
    expect(screen.queryByText("Late text from old work")).not.toBeInTheDocument();
    expect(topNavigation().getByRole("textbox",{name:"Reading page"})).toHaveValue("2");
  });

  it("does not let a late record response replace a changed work", async () => {
    const old = deferred<ReadingRecord>();
    mockRecord.mockImplementation(async id => id === "boyce" ? old.promise : record(id,{pages:3}));
    open("/teachers/works/boyce?page=25");
    await waitFor(() => expect(mockRecord).toHaveBeenCalledTimes(1));
    const signal = mockRecord.mock.calls[0][1]!;
    fireEvent.click(screen.getByRole("button",{name:"Other work"}));
    await pageVisible("henry",2);
    await act(async () => old.resolve(record("boyce")));
    expect(signal.aborted).toBe(true);
    expect(screen.getByRole("heading",{name:"Held henry"})).toBeVisible();
    expect(mockPage.mock.calls.every(([row]) => row.id === "henry")).toBe(true);
  });

  it("checks a changed work's page count before fetching its requested page", async () => {
    mockRecord.mockImplementation(async id => record(id,{pages:id === "henry" ? 1 : 25}));
    open("/teachers/works/boyce?page=25");
    await pageVisible("boyce",25);
    fireEvent.click(screen.getByRole("button",{name:"Other work"}));
    await pageVisible("henry",1);
    expect(screen.getByText(/This reading page is unavailable/)).toHaveTextContent("from 1 to 1");
    expect(mockPage.mock.calls.filter(([row]) => row.id === "henry").map(([,page]) => page)).toEqual([0]);
  });

  it("keeps embedded navigation local and ignores the containing page's page parameter", async () => {
    const outerScroll = vi.spyOn(window,"scrollTo");
    open("/teachers/works/container?page=25&author=kept","boyce");
    await pageVisible("boyce",1);
    fireEvent.click(topNavigation().getByRole("button",{name:"Next"}));
    await pageVisible("boyce",2);
    expect(screen.getByTestId("position")).toHaveTextContent("/teachers/works/container?page=25&author=kept");
    expect(outerScroll).not.toHaveBeenCalled();
    outerScroll.mockRestore();
  });

  it("resets an embedded position for a different work without touching the parent URL", async () => {
    const tree = (id:string) => <MemoryRouter initialEntries={["/parent?page=25&author=kept"]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}>
      <HistoryControls /><LibraryWorkPage workId={id} embedded />
    </MemoryRouter>;
    const view = render(tree("boyce"));
    await pageVisible("boyce",1);
    fireEvent.click(topNavigation().getByRole("button",{name:"Next"}));
    await pageVisible("boyce",2);
    view.rerender(tree("henry"));
    await pageVisible("henry",1);
    expect(topNavigation().getByRole("textbox",{name:"Reading page"})).toHaveValue("1");
    expect(screen.getByTestId("position")).toHaveTextContent("/parent?page=25&author=kept");
  });

  it("uses the same position for a public reading copy without changing its availability", async () => {
    mockRecord.mockResolvedValue(record("fergusson",{availability:"on-site-text",localCopy:false,pages:36}));
    open("/teachers/works/fergusson?page=25");
    await pageVisible("fergusson",25);
    expect(mockPage).toHaveBeenCalledWith(expect.objectContaining({localCopy:false,availability:"on-site-text"}),24,expect.any(AbortSignal));
  });

  it("does not request text or offer navigation for a permission-required record", async () => {
    mockRecord.mockResolvedValue(record("boyce",{availability:"permission-required",localCopy:false,pages:0}));
    open("/teachers/works/boyce?page=25");
    await screen.findByText(/Public display permission is not yet established/);
    expect(mockPage).not.toHaveBeenCalled();
    expect(screen.queryByRole("navigation",{name:"Reading pages"})).not.toBeInTheDocument();
  });

  it("shows a record whose language is stored as a list (3,769 campaign records)", async () => {
    mockRecord.mockResolvedValue(record("heidelberg",{language:["en"],availability:"permission-required",localCopy:false,pages:0}));
    open("/teachers/works/heidelberg");
    expect(await screen.findByText("Theology · English")).toBeVisible();
  });
});
