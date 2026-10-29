import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

// The virtualized lists (Scholars catalogue cards, the library's collection list), the download loader and the
// catalogue checks they touch, against the dev server on its usual port (8930): a production build copies the 5 GB
// public folder.
//   node node_modules/@playwright/test/cli.js test -c e2e/virtual-lists.config.ts
export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: ["virtual-lists.spec.ts", "download-loader.spec.ts", "teachers-full-catalogue.spec.ts", "teachers-scholars-catalogue.spec.ts"],
  testIgnore: [],
  outputDir: ".output/virtual-lists",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  projects: (base.projects ?? []).filter(p => p.name !== "tablet"),
  use: { ...base.use, baseURL: "http://127.0.0.1:8930" },
  webServer: { command: "node node_modules/vite/bin/vite.js --port 8930 --strictPort", cwd: "..", url: "http://127.0.0.1:8930", reuseExistingServer: false, timeout: 180_000 },
});
