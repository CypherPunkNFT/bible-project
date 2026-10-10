import { defineConfig } from '@playwright/test';
import base from './muslim-world.config';
export default defineConfig({ ...base, testMatch: 'sphere-themes.spec.ts', outputDir: '.output/sphere-themes', use: { ...base.use, baseURL: 'http://127.0.0.1:8979' }, webServer: { command: 'node node_modules/vite/bin/vite.js preview --port 8979 --strictPort', url: 'http://127.0.0.1:8979', cwd: '..', reuseExistingServer: false, timeout: 180000 } });
