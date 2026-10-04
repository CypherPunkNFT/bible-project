import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "testimonies.spec.ts",
  testIgnore: [],
  outputDir: ".output/testimony-results",
  use: { ...base.use, baseURL: "http://127.0.0.1:8934" },
  webServer: { command: "node --experimental-strip-types scripts/serve-testimonies-tests.ts", cwd: "..", url: "http://127.0.0.1:8934", reuseExistingServer: false, timeout: 180000 },
});
