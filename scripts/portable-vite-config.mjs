// SWC's shared native cache rejects sandbox-user ACLs on this machine, so builds use Vite's esbuild transformer instead.
export function portableViteConfig(source) {
  if (!source.includes('react(),') || !source.includes('export default defineConfig({')) throw new Error('Review the Vite configuration before applying the portable build adapter.');
  return source.replace(/import react from "@vitejs\/plugin-react-swc";\r?\n/, '').replace('react(),', '').replace('export default defineConfig({', 'export default defineConfig({\n  esbuild: { jsx: "automatic" },');
}
