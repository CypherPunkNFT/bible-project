import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const strategy=path.resolve(dir,'../../../Research/Apologetics/Islam/2026-10-09/strategy');
const marker='> **Current owner instruction — preserve the existing page:**';
const note=marker+' Keep `/apologetics/worldviews/islam` and its complete current page unchanged. The new guide links to it. Earlier renaming, extraction and route-takeover proposals are superseded. Read [the controlling preservation decision](preserve-existing-page.md) before using the earlier plan or delivery manifests.\n\n';
for(const name of ['README.md','complete-strategy.md','christianity-and-islam-strategy.md','implementation-and-delivery.md','article-catalogue.md']){
 const file=path.join(strategy,name);let text=fs.readFileSync(file,'utf8');
 if(!text.includes(marker)){const end=text.indexOf('\n')+1;text=text.slice(0,end)+'\n'+note+text.slice(end)}
 if(name==='README.md')text=text.replace('It reuses current site components and includes nine views.','It adds six proposed guide views and links directly to the complete existing Islam page.');
 fs.writeFileSync(file,text);
}
for(const name of ['routes-and-links.json','page-inventory.json','delivery-packets.json']){
 const file=path.join(strategy,name);const data=JSON.parse(fs.readFileSync(file,'utf8'));
 data.owner_revision={decision:'preserve-existing-page.md',existing_route:'/apologetics/worldviews/islam',preserve_title_layout_and_all_sections:true,new_guide_route_proposal:'/apologetics/worldviews/islam/guide',status:'Earlier rename, extraction and route-takeover entries superseded; rebase detailed manifests before implementation.'};
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
}
for(const name of ['verify.mjs','final-check.mjs']){
 const file=path.join(dir,name);const backup=path.join(dir,name.replace('.mjs','-component-reuse-v2.mjs'));
 if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
 fs.writeFileSync(file,"// Current verification: existing page stays intact and is linked directly.\nimport './verify-preservation.mjs';\n");
}
const readme=path.join(dir,'README.md');
if(!fs.existsSync(path.join(dir,'README-component-reuse-v2.md')))fs.copyFileSync(readme,path.join(dir,'README-component-reuse-v2.md'));
fs.writeFileSync(readme,`# Islam study guide — alongside the existing page

Open http://127.0.0.1:8931/mockups/christianity-islam/.

The current **Christianity & Islam** page at /apologetics/worldviews/islam stays unchanged: title, URL, layout, comparison desk, paired source reader, reading plan, globe, country panels, people groups, studies and reflections. The owner explicitly rejected replacing or changing this page.

The new guide adds Understanding Islam, Ministry, Library and article-preview pages alongside it. Both the guide landing and Ministry prominently link to **Open the existing Christianity & Islam page**. The local navigation also links to that actual page. It opens in the same tab; browser Back returns to the guide. The Worldviews card retains its existing destination.

Questions, reading and atlas shortcuts use the original page's #comparison, #reading-sources and #muslim-world anchors. Query selections are preserved. The earlier extracted and renamed comparison, separate reading view and separate atlas view have been removed. Old questions/reading/world mockup URLs resolve to the actual page.

## Local implementation

Six guide views remain: hub, understanding, ministry, library, article, worldviews. The mockup reuses the site's header, footer, theme, typography and artwork. New articles remain labelled sample outlines. Existing studies and source passages lead into their current pages.

The original page was inspected in the browser and against implementation, rather than relying on potentially stale READMEs. current-audit.json and current-*.png record that review. build.mjs exposes private artwork components in memory while bundling; production modules are not modified. Study-card save controls in the guide use a separate preview notebook. The existing page uses its normal notebook.

From Website/, run node design/christianity-islam/build.mjs. The bundle lives under the existing local /mockups/ middleware and stays outside the production app build. The old localhost:8765 address redirects here. No hosted deployment was made for these revisions.

## Verification and planning

Run node design/christianity-islam/verify-preservation.mjs (also exposed through verify.mjs). preservation-verification.json records 15 viewport/view checks, the exact canonical destination, the complete original page and all its sections, passage links, the unchanged Worldviews-card destination, browser Back, legacy mockup redirects and source fingerprints. Checks passed without page errors. Current gallery images are in design/_gallery/thumbs/.

Earlier verification.json, final-verification.json and *-component-reuse-v2 files are historical evidence for the superseded mockup. The gallery inventory check reports two unrelated unregistered folders, research-phase-2 and review; this mockup is registered.

The controlling planning correction is Research/Apologetics/Islam/2026-10-09/strategy/preserve-existing-page.md. It supersedes earlier renaming, relocation, extraction and redirect instructions. A separate /apologetics/worldviews/islam/guide route is proposed for new material; older manifests require rebasing before implementation. No production route was added.
`);
console.log('Preservation decision recorded; current verifier points to direct-page integration checks.');
