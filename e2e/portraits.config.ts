import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: ["gospel-portraits.spec.ts", "study.spec.ts"],
  testIgnore: [],
  outputDir: ".output/portraits",
  use: { ...base.use, baseURL: "http://127.0.0.1:8938" },
  webServer: { ...(Array.isArray(base.webServer) ? base.webServer[0] : base.webServer!), command: "bunx vite preview --port 8938 --strictPort", url: "http://127.0.0.1:8938", cwd: ".." },
});
