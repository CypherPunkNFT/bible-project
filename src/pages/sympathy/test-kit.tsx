// Shared by the sympathy page tests: the real catalogue and the Berean files served from disk (the life-event test kit's
// stand-ins, reused), a router holding both the sympathy and life-event routes, and a probe that records every address
// and how the router got there (PUSH, REPLACE), so tests can prove what reaches the address bar.
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import LifeEventsPage from "@/pages/life-events/LifeEventsPage";
import { catalog } from "@/pages/life-events/test-kit";
import SympathyPage from "./SympathyPage";
import { VisitProbe } from "./visit-probe";

export { removeFonts, serveBerean, standInFonts } from "@/pages/life-events/test-kit";

/** Every address the page has been at since the last renderAt, with how the router got there. */
export const visits: { address: string; how: string }[] = [];

export function renderAt(path: string) {
  visits.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <VisitProbe onVisit={(visit) => visits.push(visit)} />
        <Routes>
          <Route path="/sympathy/*" element={<SympathyPage />} />
          <Route path="/life-events/*" element={<LifeEventsPage />} />
        </Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}
