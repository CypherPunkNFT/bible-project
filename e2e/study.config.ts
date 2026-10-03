import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

// The Study checks on their own port (8933), so they can run while another session's checks hold 8932.
//   bunx playwright test -c e2e/study.config.ts
export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "study.spec.ts",
  outputDir: ".output/study",
  use: { ...base.use, baseURL: "http://127.0.0.1:8933" },
  webServer: { ...(Array.isArray(base.webServer) ? base.webServer[0] : base.webServer!), command: "bunx vite preview --port 8933 --strictPort", url: "http://127.0.0.1:8933", cwd: ".." },
});
