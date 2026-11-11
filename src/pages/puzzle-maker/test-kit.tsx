// Shared by the puzzle maker's page tests: the real catalogue and Berean files (the life-event kit's stand-ins), and a
// router holding the maker's route that records the address it is at.
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { catalog } from "@/pages/life-events/test-kit";
import PuzzleMakerPage, { PUZZLE_MAKER_PATH } from "./PuzzleMakerPage";

export { serveBerean } from "@/pages/life-events/test-kit";

/** Every file read in a test file stays read for the rest of it (src/lib/data.ts), so an offline test needs a file of its own. */
export const seen = { address: "" };

export const renderAt = (path: string) => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[path]}>
      <AddressProbe onSeen={(address) => { seen.address = address; }} />
      <Routes><Route path={PUZZLE_MAKER_PATH} element={<PuzzleMakerPage />} /></Routes>
    </MemoryRouter>
  </CatalogContext.Provider>,
);

/** The address's settings, read back. */
export const addressParams = () => new URLSearchParams(seen.address.split("?")[1] ?? "");
