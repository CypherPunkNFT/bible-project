// Local preview build only. Deliberately does not run intake/index refresh hooks.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const filename=path.join(root,`.vite-scholars-population-${Date.now()}.config.ts`);
const original=fs.readFileSync(path.join(root,'vite.config.ts'),'utf8');
if(!original.includes('react(),')||!original.includes('export default defineConfig({'))throw Error('Review the current Vite config before building.');
const config=original.replace(/import react from "@vitejs\/plugin-react-swc";\r?\n/,'').replace('react(),','').replace('export default defineConfig({','export default defineConfig({\n  esbuild: { jsx: "automatic" },');
fs.writeFileSync(filename,config);
try {const {build}=await import('vite');await build({configFile:filename,build:{emptyOutDir:false}});}
finally {fs.unlinkSync(filename);}
