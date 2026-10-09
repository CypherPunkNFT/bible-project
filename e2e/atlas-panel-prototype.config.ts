import { defineConfig } from '@playwright/test';
import base from './muslim-world.config';
export default defineConfig({ ...base, testMatch: 'atlas-panel-prototype.spec.ts', outputDir: '.output/atlas-panel-prototype' });
