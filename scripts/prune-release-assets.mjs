import fs from 'node:fs/promises';import path from 'node:path';
// Prune only obsolete hashed build outputs in an isolated release, never dist/.
export async function pruneReleaseAssets(site){
 site=path.resolve(site);if(!site.includes(path.sep+'.release'+path.sep))throw Error('Expected an isolated release directory');
 const root=path.join(site,'assets'),names=new Set((await fs.readdir(root,{withFileTypes:true})).filter(f=>f.isFile()).map(f=>f.name));
 const live=new Set(),queue=[];
 // Any extension: a fixed list once dropped the Apologetics debate transcripts (.txt) as unused (2026-10-20).
 const scan=text=>{for(const match of text.matchAll(/[A-Za-z0-9_.-]+\.[A-Za-z0-9]+/g)){const name=match[0];if(names.has(name)&&!live.has(name)){live.add(name);queue.push(name);}}};
 scan(await fs.readFile(path.join(site,'index.html'),'utf8'));
 for(let i=0;i<queue.length;i++)if(/\.(js|css)$/.test(queue[i]))scan(await fs.readFile(path.join(root,queue[i]),'utf8'));
 let removed=0;for(const name of names)if(/-[\w-]{8,}\.[\w]+$/.test(name)&&!live.has(name)){const target=path.resolve(root,name);if(!target.startsWith(root+path.sep))throw Error('Invalid asset target');await fs.unlink(target);removed++;}
 return {retained:live.size,removed};
}
