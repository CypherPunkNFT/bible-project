// Scheduled preview launcher: no PowerShell, npm wrapper, or antivirus exclusions.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const logs=path.join(root,'.logs');
fs.mkdirSync(logs,{recursive:true});
const log=message=>fs.appendFileSync(path.join(logs,'preview-startup.log'),`[${new Date().toISOString()}] ${message}\n`);
const listening=port=>new Promise(resolve=>{
 const socket=net.createConnection({host:'127.0.0.1',port});
 socket.once('connect',()=>{socket.destroy();resolve(true);});
 socket.once('error',()=>resolve(false));
 socket.setTimeout(1500,()=>{socket.destroy();resolve(false);});
});
if(!await listening(8941)){
 const redirect=spawn(process.execPath,[path.join(root,'scripts/preview-redirect.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:'ignore'});
 redirect.unref();
}
if(await listening(8931)){log('port 8931 already listening; keeping the existing preview');}
else{
 if(!fs.existsSync(path.join(root,'dist/index.html')))throw Error('Build dist with node scripts/build-portable.mjs before starting the preview.');
 process.chdir(root);
 const config=path.join(root,`.vite-preview-${process.pid}.config.ts`);
 const source=fs.readFileSync(path.join(root,'vite.config.ts'),'utf8');
 if(!source.includes('react(),'))throw Error('Review changed Vite configuration.');
 fs.writeFileSync(config,source.replace(/import react from "@vitejs\/plugin-react-swc";\r?\n/,'').replace('react(),',''));
 const removeConfig=()=>{try{fs.unlinkSync(config);}catch{}};
 process.once('exit',removeConfig);
 try{
  const {preview}=await import('vite');
  const server=await preview({configFile:config});
  log('serving current dist on http://127.0.0.1:8931 through Node');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.httpServer.close(()=>process.exit(0)));
 }catch(error){removeConfig();throw error;}
}
