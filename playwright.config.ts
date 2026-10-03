import { defineConfig, devices } from "@playwright/test";

// Browser checks against the BUILT site on their own port (8932) — the always-on copy holds 8931.
// Uses the installed Edge (the CypherPunk NFT site found Playwright's own Chromium absent on this PC).
export default defineConfig({
  testDir: "e2e",
  // The study pages have their own config and server (e2e/study.config.ts, port 8933).
  testIgnore: "study.spec.ts",
  outputDir: "e2e/.output/results",
  reporter: [["list"]],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8932",
    reducedMotion: "reduce",
    channel: "msedge",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "msedge", viewport: { width: 1440, height: 900 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], channel: "msedge", viewport: { width: 768, height: 1024 } } },
    {
      name: "phone",
      use: { ...devices["Desktop Chrome"], channel: "msedge", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
  ],
  webServer: {
    command: "bunx vite preview --port 8932 --strictPort",
    url: "http://127.0.0.1:8932",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
