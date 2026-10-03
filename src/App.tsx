import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CatalogProvider } from "@/lib/catalog-context";
import LibraryPage from "@/pages/LibraryPage";

const ReaderPage = lazy(() => import("@/pages/ReaderPage"));
const ChartsPage = lazy(() => import("@/pages/ChartsPage"));
const AtlasPage = lazy(() => import("@/pages/AtlasPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const VersionsPage = lazy(() => import("@/pages/VersionsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="animate-pulse font-serif text-muted">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CatalogProvider>
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<LibraryPage />} />
              <Route path="/read" element={<ReaderPage />} />
              <Route path="/read/:slug/:book/:chapter" element={<ReaderPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/atlas" element={<AtlasPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/versions" element={<VersionsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </CatalogProvider>
    </BrowserRouter>
  );
}
