import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
const python=path.join(root,'../KnowledgeBase/.venv/Scripts/python.exe');
// This private reader is local-only; public/CI builds must not require or copy it.
if(fs.existsSync(path.join(root,'.local/local-library/index.json'))&&fs.existsSync(python)){
 const result=spawnSync(python,['-X','utf8','scripts/local_library.py','--build-index'],{cwd:root,windowsHide:true,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error('Local reading catalogue reconciliation failed; retain the previous build and inspect the audit.');
}
