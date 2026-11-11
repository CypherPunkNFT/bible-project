// Shared by the "when you're..." page tests: the real catalogue and Berean files (the life-event kit's stand-ins), the
// real help directory, a router holding the feature's route inside <main id="main"> (where the page head reads the
// description), and the sympathy probe that records every address and how the router reached it.
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { LifeData } from "@/data/resources";
import { CatalogContext } from "@/lib/catalog";
import { catalog } from "@/pages/life-events/test-kit";
import { VisitProbe } from "@/pages/sympathy/visit-probe";
import WhenYourePage from "./WhenYourePage";

export { serveBerean } from "@/pages/life-events/test-kit";

export const life = JSON.parse(readFileSync("src/data/resources/life.json", "utf8")) as LifeData;

export const visits: { address: string; how: string }[] = [];

export function renderAt(path: string) {
  visits.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <VisitProbe onVisit={(visit) => visits.push(visit)} />
        <main id="main">
          <Routes>
            <Route path="/when-youre/*" element={<WhenYourePage />} />
            <Route path="*" element={<div>Elsewhere on the site</div>} />
          </Routes>
        </main>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

/** The first paragraph of 60 characters or more inside <main>: what usePageHead and the capture use as the description. */
export function descriptionParagraph(): string {
  return [...document.querySelectorAll("#main p")].map((p) => p.textContent?.trim() ?? "").find((text) => text.length >= 60) ?? "";
}
