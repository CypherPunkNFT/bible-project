// Shared by the blessings page tests: the real catalogue and Berean files (the life-event kit's stand-ins), and a router
// holding the feature's route inside <main id="main">, where the page head reads the description.
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import { catalog } from "@/pages/life-events/test-kit";
import BlessingsPage from "./BlessingsPage";

export { serveBerean } from "@/pages/life-events/test-kit";

export function renderAt(path: string) {
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <main id="main">
          <Routes>
            <Route path="/blessings/*" element={<BlessingsPage />} />
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

/** Resolves once every verse on the page has drawn (nothing is still loading). */
export async function versesLoaded() {
  await waitFor(() => {
    if (document.querySelector(".hb-loading")) throw new Error("verses still loading");
    if (!document.querySelector("blockquote.scripture")) throw new Error("no verse drawn yet");
  }, { timeout: 5000 });
}
