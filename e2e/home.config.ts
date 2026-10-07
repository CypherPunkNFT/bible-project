import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

export default defineConfig({
  ...base, testDir: ".", testMatch: "home.spec.ts", testIgnore: [], outputDir: ".output/home",
  use: { ...base.use, baseURL: "http://127.0.0.1:8959" },
  webServer: { command: "node node_modules/vite/bin/vite.js preview --port 8959 --strictPort", cwd: "..", url: "http://127.0.0.1:8959", reuseExistingServer: false },
});
