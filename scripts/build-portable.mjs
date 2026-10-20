import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// SWC's shared native cache rejects sandbox-user ACLs on this machine.
// Use Vite's existing esbuild transformer for production; do not weaken the cache checks.
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
await import('./check-editorial-sources.mjs');
if(process.exitCode)process.exit(process.exitCode);
await import('./build-profile-work-shelves.mjs');
await import('./refresh-local-reading-catalog.mjs');
const config=path.join(root,`.vite-portable-${Date.now()}.config.ts`);
const source=fs.readFileSync(path.join(root,'vite.config.ts'),'utf8');
if(!source.includes('react(),')||!source.includes('export default defineConfig({'))throw Error('Review the Vite configuration before applying the portable build adapter.');
const portable=source.replace(/import react from "@vitejs\/plugin-react-swc";\r?\n/,'').replace('react(),','').replace('export default defineConfig({','export default defineConfig({\n  esbuild: { jsx: "automatic" },');
fs.writeFileSync(config,portable);
try{const {build}=await import('vite');await build({configFile:config,...(process.argv.includes('--preserve-output')?{build:{emptyOutDir:false}}:{})});}
finally{fs.unlinkSync(config);}
// The scholars index ships split (list, search text, per-scholar details) so pages load only what they show.
const scholarIndex=path.join(root,'dist/content/scholar-population');
if(fs.existsSync(path.join(scholarIndex,'index.json'))){const {splitScholarIndex}=await import('./split-scholar-index.mjs');console.log('Scholars index split:',splitScholarIndex(scholarIndex));}
// The source directory ships as a summary plus its records, which load only when a visitor nears them.
const sourceDirectory=path.join(root,'dist/content/sources');
if(fs.existsSync(path.join(sourceDirectory,'directory.json'))){const {splitSourceDirectory}=await import('./split-source-directory.mjs');console.log('Source directory split:',splitSourceDirectory(sourceDirectory));}
