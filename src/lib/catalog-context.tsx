import { useEffect, useState, type ReactNode } from "react";
import { CatalogContext } from "./catalog";
import { loadCatalog, setStamp } from "./data";
import type { Catalog } from "./types";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then((value) => {
        setStamp(value.stamp);
        setCatalog(value);
      })
      .catch((reason: unknown) => {
        console.error("catalog failed to load", reason);
        setError(String(reason));
      });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <h1 className="font-serif text-2xl">The Bible data could not be loaded</h1>
        <p className="mt-3 text-muted">Run the data build (scripts/build-data.py), then reload. Details: {error}</p>
      </div>
    );
  }
  if (!catalog) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <span className="animate-pulse font-serif text-lg text-muted">Opening the library…</span>
      </div>
    );
  }
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}
