import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Keep the real suite, setup and aliases. Only the JSX transformer differs when
// SWC correctly refuses a native cache owned by another Windows identity.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(path.join(root, 'vitest.config.ts'), 'utf8');
const importLine = 'import react from "@vitejs/plugin-react-swc";';
const pluginLine = 'plugins: [react()],';
const configLine = 'export default defineConfig({';
if (!source.includes(importLine) || !source.includes(pluginLine) || !source.includes(configLine) || /\besbuild\s*:/.test(source)) {
  throw new Error('Review the Vitest configuration before using the portable transformer.');
}
const adapted = source.replace(importLine, '').replace(pluginLine, 'plugins: [],')
  .replace(configLine, `${configLine}\n  esbuild: { jsx: "automatic" },`);
const config = path.join(root, `.vitest-portable-${process.pid}-${Date.now()}.config.ts`);
fs.writeFileSync(config, adapted, { flag: 'wx' });
try {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/vitest/vitest.mjs'),
    'run', '--config', config, ...process.argv.slice(2)], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  fs.unlinkSync(config);
}
