import { defineConfig, devices } from "@playwright/test";
import base from "../playwright.config";

// Memory card match layout checks (memory-match.spec.ts) on their own port, against the built site in dist/ (or the
// build folder named in MEMORY_MATCH_BUILD, for a check that must not touch dist/). One project: the spec sets its own
// phone sizes.
const outDir = process.env.MEMORY_MATCH_BUILD ?? "dist";

export default defineConfig({
  ...base, testDir: ".", testMatch: "memory-match.spec.ts", testIgnore: [], outputDir: ".output/memory-match",
  projects: [{ name: "phone", use: { ...devices["Desktop Chrome"], channel: "msedge", hasTouch: true, isMobile: true } }],
  use: { ...base.use, baseURL: "http://127.0.0.1:8961" },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --port 8961 --strictPort --outDir "${outDir}"`, cwd: "..",
    url: "http://127.0.0.1:8961", reuseExistingServer: false,
  },
});
