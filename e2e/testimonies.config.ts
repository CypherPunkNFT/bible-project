import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "testimonies.spec.ts",
  testIgnore: [],
  outputDir: ".output/testimony-results",
  use: { ...base.use, baseURL: "http://127.0.0.1:8934" },
  webServer: { command: "bunx vite preview --port 8934 --strictPort", cwd: "..", url: "http://127.0.0.1:8934", reuseExistingServer: false, timeout: 180000 },
});
