import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

// Works whose language is stored as a list, checked on the public build (e2e/serve-public-build.mjs, port 8935),
// at desktop and phone widths. The build takes about a minute before the first check.
//   node node_modules/@playwright/test/cli.js test -c e2e/language-lists.config.ts
export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: ["language-lists.spec.ts"],
  testIgnore: [],
  outputDir: ".output/language-lists",
  timeout: 600_000,
  expect: { timeout: 20_000 },
  projects: (base.projects ?? []).filter(p => p.name !== "tablet"),
  use: { ...base.use, baseURL: "http://127.0.0.1:8935" },
  webServer: { command: "node e2e/serve-public-build.mjs", cwd: "..", url: "http://127.0.0.1:8935", reuseExistingServer: false, timeout: 900_000 },
});
