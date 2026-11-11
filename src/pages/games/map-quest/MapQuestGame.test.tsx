// The page as the hub opens it, with the map replaced by a stand-in (jsdom has no WebGL): it pins wherever a test says.
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import { PLACE_BY_ID } from "./data";

let pinAt: [number, number] = [0, 0];
vi.mock("./QuestMap", () => ({
  QuestMap: ({ onPin, onFail, reveal }: { onPin: (pin: [number, number]) => void; onFail: () => void; reveal: unknown }) => <div>
    <button type="button" disabled={!!reveal} onClick={() => onPin(pinAt)}>Stand-in map</button>
    <button type="button" onClick={onFail}>Break the map</button>
  </div>,
}));
vi.mock("@/components/Verse", () => ({ Verse: ({ id }: { id: number }) => <span>{`verse ${id}`}</span> }));

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const renderAt = async (path: string) => {
  const view = render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[path]}>
      <Suspense fallback={<p>Loading</p>}><Routes><Route path="/games/*" element={<GamesPage />} /></Routes></Suspense>
    </MemoryRouter>
  </CatalogContext.Provider>,
  );
  // Let the registry route import and React Suspense commit before querying the page.
  await act(async () => { await vi.dynamicImportSettled(); });
  return view;
};

/** Pins the place on screen exactly, confirms, and goes on. */
function answerExactly() {
  const name = screen.getByRole("heading", { level: 2 }).textContent ?? "";
  const place = [...PLACE_BY_ID.values()].find((p) => p.name === name);
  expect(place, name).toBeDefined();
  pinAt = [place!.lon, place!.lat];
  fireEvent.click(screen.getByRole("button", { name: "Stand-in map" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("map quest page", () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(2026, 10, 9, 10)); });
  afterEach(() => { vi.useRealTimers(); });

  it("opens on the game home from the hub's address", async () => {
    await renderAt("/games/map-quest");
    expect(await screen.findByRole("heading", { level: 1, name: "Map quest" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily Five" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Disputed sites" })).toBeInTheDocument();
    expect(screen.getByText(/Puzzle #3:/)).toBeInTheDocument();
  });

  it("plays a practice round: Confirm waits for a pin, an exact pin scores 1,000", async () => {
    await renderAt("/games/map-quest");
    fireEvent.click(await screen.findByRole("button", { name: "Start practice" }));
    expect(screen.getByText("Place 1 of 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    answerExactly();
    expect(screen.getByText(/0 km \(0 mi\) away, 1,000 points/)).toBeInTheDocument();
    for (let place = 2; place <= 5; place++) {
      fireEvent.click(screen.getByRole("button", { name: "Next place" }));
      expect(screen.getByText(`Place ${place} of 5`)).toBeInTheDocument();
      answerExactly();
    }
    fireEvent.click(screen.getByRole("button", { name: "See your score" }));
    expect(screen.getByRole("heading", { name: "5,000 of 5,000 points" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play again" })).toBeInTheDocument();
  });

  it("saves the Daily Five as it is played, and resumes it after a reload", async () => {
    const first = await renderAt("/games/map-quest");
    fireEvent.click(await screen.findByRole("button", { name: "Play today's puzzle" }));
    answerExactly();
    first.unmount();
    await renderAt("/games/map-quest");
    expect(await screen.findByRole("button", { name: "Resume (1 of 5)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume (1 of 5)" }));
    expect(screen.getByText("Place 2 of 5")).toBeInTheDocument();
  });

  it("finishes the Daily Five once, then shows the result and the share button on the home card", async () => {
    await renderAt("/games/map-quest?play=daily");
    await screen.findByText("Place 1 of 5");
    for (let place = 1; place <= 5; place++) {
      answerExactly();
      fireEvent.click(screen.getByRole("button", { name: place === 5 ? "See your score" : "Next place" }));
    }
    expect(screen.getByRole("heading", { name: "5,000 of 5,000 points" })).toBeInTheDocument();
    expect(screen.getByText("Streak: 1 day")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to the game home" }));
    expect(screen.getByText("Puzzle #3 done: 5,000 of 5,000 points.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("bp-map-quest")!)).toMatchObject({ played: 1, streak: 1, best: 5000, lastDone: 3 });
  });

  it("shows a retry panel when the map cannot load, and the retry brings the map back", async () => {
    await renderAt("/games/map-quest?play=disputed");
    fireEvent.click(await screen.findByRole("button", { name: "Break the map" }));
    expect(screen.getByRole("alert")).toHaveTextContent("The map couldn't load.");
    expect(within(screen.getByRole("alert")).getByRole("link", { name: "All games" })).toHaveAttribute("href", "/games");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Retry" })); });
    await waitFor(() => expect(screen.getByRole("button", { name: "Stand-in map" })).toBeInTheDocument());
  });

  it("falls back to the game home for an unknown ?play value", async () => {
    await renderAt("/games/map-quest?play=nonsense");
    expect(await screen.findByRole("heading", { name: "Daily Five" })).toBeInTheDocument();
  });
});
