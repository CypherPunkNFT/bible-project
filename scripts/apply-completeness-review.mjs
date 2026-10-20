import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function validateCompletenessReview(review){for(const r of review.representations){if(!['COMPLETE','INCOMPLETE'].includes(r.status))throw Error('Invalid completeness verdict');if(r.status==='COMPLETE'&&(r.reviewState!=='verified'||!['saved','coverage','compared','complete'].every(k=>r.steps?.[k]==='done')))throw Error('COMPLETE requires all coverage gates and a verified review');}}
export function applyCompletenessReview(records,data,out){
 const file=path.join(data,'Extracted/Schaff-Herzog/completeness-review.json');if(!fs.existsSync(file))return null;
 const review=JSON.parse(fs.readFileSync(file)),byId=new Map(review.representations.map(r=>[r.sourceId,r]));let bytes=0;
 validateCompletenessReview(review);
 for(const record of records){
  const r=byId.get(record.id);if(!r)continue;if(record.group!=='Schaff-Herzog')throw Error('Review outside Schaff scope');
  record.completeness={status:r.status,reviewState:r.reviewState,reason:r.reason,steps:r.steps,metrics:r.metrics||null,evidenceUrl:'./schaff-completeness-review.json'};
  record.quality=r.reason;
  if(r.bibliographicNote){record.acquisitionNoteInherited??=record.note;record.note=r.bibliographicNote;}
  record.readPriority=r.readPriority||0;if(r.representationLabel)record.representationLabel=r.representationLabel;
  if(r.acquisition)Object.assign(record,r.acquisition);
  if(r.readingFile){
   const source=path.resolve(data,r.readingFile);if(!source.startsWith(path.resolve(data)+path.sep))throw Error('Invalid review text path');
   const textUrl=`texts/${record.id}.txt`;fs.copyFileSync(source,path.join(out,textUrl));
   Object.assign(record,{textUrl,textFilename:r.textFilename,textBytes:fs.statSync(source).size,textLabel:r.textLabel});bytes+=record.textBytes;
  }
  if(r.readingFile&&r.acquisition)record.shortText=false;
 }
 const evidenceUrl='./schaff-completeness-review.json';fs.copyFileSync(file,path.join(out,'schaff-completeness-review.json'));
 return {updatedAt:review.updatedAt,scope:review.scope,policy:review.policy,evidenceUrl,summary:review.summary,exportedBytes:bytes};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const site=path.resolve(import.meta.dirname,'..'),data=path.resolve(site,'../Data/TheologicalReferenceLibrary'),out=path.join(site,'public/data_acquisition'),file=path.join(out,'catalogue.json');
 const catalogue=JSON.parse(fs.readFileSync(file));catalogue.completenessReview=applyCompletenessReview(catalogue.records,data,out);catalogue.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(catalogue,null,2)+'\n');console.log(JSON.stringify(catalogue.completenessReview));
}
