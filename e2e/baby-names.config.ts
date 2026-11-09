import { defineConfig, devices } from "@playwright/test";

// Recovery acceptance uses the owner's original preview; never starts another listener.
export default defineConfig({
  testDir: ".",
  testMatch: "baby-names.spec.ts",
  outputDir: process.env.BABY_NAMES_EVIDENCE_DIR ?? ".output/baby-names",
  reporter: "list",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:8931", channel: "msedge", reducedMotion: "reduce", screenshot: "on" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
