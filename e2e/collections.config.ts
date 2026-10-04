import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

// A separate port for collection/navigation checks while other sessions verify the site.
export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: ["charts.spec.ts", "site.spec.ts"],
  outputDir: ".output/collections",
  use: { ...base.use, baseURL: "http://127.0.0.1:8936" },
  webServer: { ...(Array.isArray(base.webServer) ? base.webServer[0] : base.webServer!), command: "bunx vite preview --port 8936 --strictPort", url: "http://127.0.0.1:8936", cwd: ".." },
});
