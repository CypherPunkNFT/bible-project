import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "outside-scroll.spec.ts",
  testIgnore: [],
  outputDir: ".output/outside-scroll",
  use: { ...base.use, baseURL: "http://127.0.0.1:8940", launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } },
  webServer: { command: "node node_modules/vite/bin/vite.js preview --port 8940 --strictPort", cwd: "..", url: "http://127.0.0.1:8940", reuseExistingServer: false },
});
