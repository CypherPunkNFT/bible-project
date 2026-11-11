// Shared by the word counter's page tests: the real catalogue and Berean files (the life-event kit's stand-ins), and a
// router holding the counter's route that records the address it is at.
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { catalog } from "@/pages/life-events/test-kit";
import WordCounterPage, { WORD_COUNTER_PATH } from "./WordCounterPage";

export { serveBerean } from "@/pages/life-events/test-kit";

/** Every file read in a test file stays read for the rest of it (src/lib/data.ts), so an offline test needs a file of its own. */
export const seen = { address: "" };

export const renderAt = (path: string) => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[path]}>
      <AddressProbe onSeen={(address) => { seen.address = address; }} />
      <Routes><Route path={WORD_COUNTER_PATH} element={<WordCounterPage />} /></Routes>
    </MemoryRouter>
  </CatalogContext.Provider>,
);

/** The number under a summary label ("Times", "Verses", …). */
export const stat = (label: string) => screen.getByText(label, { selector: "dt" }).nextElementSibling?.textContent;
