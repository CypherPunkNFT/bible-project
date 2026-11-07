// Study pages that register their own address: a study folder holding a route.ts (`export const path = "/study/…"` and
// `export const Page = lazy(() => import("./…Page"))`) is routed here, so a page can be built in its own folder without
// editing App.tsx. Only the small route.ts files load up front; each page still loads when it is opened.
import type { ComponentType, LazyExoticComponent } from "react";

interface RouteModule {
  path?: unknown;
  Page?: LazyExoticComponent<ComponentType>;
}

const modules = import.meta.glob<RouteModule>("./*/route.ts", { eager: true });

export const STUDY_PAGE_ROUTES: { path: string; Page: LazyExoticComponent<ComponentType> }[] = Object.values(modules)
  .filter((module): module is { path: string; Page: LazyExoticComponent<ComponentType> } =>
    typeof module.path === "string" && /^\/study\/[a-z0-9-]+$/.test(module.path) && Boolean(module.Page))
  .sort((a, b) => a.path.localeCompare(b.path));
