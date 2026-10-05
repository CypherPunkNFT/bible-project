// Evaluate our own typed content modules through the project's existing compiler.
// Never execute downloaded documents; only these authored, repository-owned modules.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = ['apologetics-library', 'apologetics', 'gospel-portraits', 'chart-insights', 'study-collections', 'study-sections', 'miracle-categories'];
const imports = modules.map((name, index) => `import * as m${index} from './src/data/${name}.ts';`).join('\n');
const entries = modules.map((name, index) => `['${name}', m${index}]`).join(',');
const result = await build({ stdin: {contents:`${imports}\nexport default Object.fromEntries([${entries}]);`, resolveDir:site}, bundle:true, platform:'node', format:'esm', write:false, logLevel:'silent' });
const content = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
process.stdout.write(JSON.stringify(content.default));
