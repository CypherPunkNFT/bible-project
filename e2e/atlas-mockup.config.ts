import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "atlas-mockup.spec.ts",
  testIgnore: [],
  outputDir: ".output/atlas-mockup",
  use: { ...base.use, baseURL: "http://127.0.0.1:8958", launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } },
  webServer: { command: "node node_modules/vite/bin/vite.js preview --port 8958 --strictPort", cwd: "..", url: "http://127.0.0.1:8958", reuseExistingServer: false },
});
