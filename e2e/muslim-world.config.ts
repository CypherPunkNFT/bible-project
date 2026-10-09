import { defineConfig } from '@playwright/test';
import base from '../playwright.config';
export default defineConfig({
  ...base, testDir: '.', testMatch: 'muslim-world.spec.ts', testIgnore: [],
  outputDir: '.output/muslim-world',
  use: { ...base.use, baseURL: 'http://127.0.0.1:8967' },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --port 8967 --strictPort', url: 'http://127.0.0.1:8967', cwd: '..', reuseExistingServer: false, timeout: 180000 },
});
