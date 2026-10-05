import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "apologetics.spec.ts",
  testIgnore: [],
  outputDir: ".output/apologetics",
  use: { ...base.use, baseURL: "http://127.0.0.1:8937" },
  webServer: {
    command: "node node_modules/vite/bin/vite.js preview --port 8937 --strictPort",
    url: "http://127.0.0.1:8937", cwd: "..", reuseExistingServer: false, timeout: 180_000,
  },
});
