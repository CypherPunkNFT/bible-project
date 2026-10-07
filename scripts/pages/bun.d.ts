// The one Bun API the content extractor uses (registerSiteModules in study-lib.ts); @types/bun is not installed.
interface BunLoadResult { contents: string; loader: "ts" | "tsx" }
interface BunPluginBuild { onLoad(options: { filter: RegExp }, callback: (args: { path: string }) => BunLoadResult): void }
declare const Bun: { plugin(options: { name: string; setup(build: BunPluginBuild): void }): void };
