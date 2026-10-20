// Only this held dictionary's two existing source records; no source recensus or OCR.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
export function applyWaceReview(records,data,out){
 const file=path.join(data,'Extracted/Wace-Piercy/comparison-review.json');if(!fs.existsSync(file))return null;
 const report=JSON.parse(fs.readFileSync(file)),m=report.extraction,pdf=records.find(r=>r.id===m.sourceId),txt=records.find(r=>r.id===report.originalTXT.sourceId);
 if(!pdf||!txt||pdf.group!=='Christian-Biography'||txt.group!=='Christian-Biography')throw Error('Wace source bindings changed');
 if(!report.originalTXT.matchesAcquisitionHash||!report.frenchDetailedComparison?.allSevenIndexEntriesMatch||report.bodySamples.length!==3||report.bodySamples.some(s=>s.matches.length<2))throw Error('Wace comparison checks need review');
 const source=path.join(data,'Extracted/Wace-Piercy',m.textFilename),raw=fs.readFileSync(source);if(createHash('sha256').update(raw).digest('hex')!==m.textSha256)throw Error('Wace extraction changed');
 const cleanupFile=path.join(data,'Extracted/Wace-Piercy/reading-cleanup.json'),cleanup=fs.existsSync(cleanupFile)?JSON.parse(fs.readFileSync(cleanupFile)):null;
 let readingSource=source,readingBytes=raw;
 if(cleanup){if(cleanup.sourceId!==pdf.id||cleanup.originalTextSha256!==m.textSha256)throw Error('Wace cleanup binding changed');readingSource=path.join(data,'Extracted/Wace-Piercy',cleanup.textFilename);readingBytes=fs.readFileSync(readingSource);if(createHash('sha256').update(readingBytes).digest('hex')!==cleanup.textSha256)throw Error('Wace cleaned reading text changed');}
 const textUrl=`texts/${pdf.id}.txt`;fs.copyFileSync(readingSource,path.join(out,textUrl));
 Object.assign(pdf,{textUrl,textFilename:cleanup?.textFilename||m.textFilename,textBytes:readingBytes.length,textLabel:cleanup?'Existing PDF text layer · page furniture removed':'Existing PDF text layer · page-located extraction',representationLabel:'Wace & Piercy · direct PDF text extraction',readPriority:20});
 txt.representationLabel='Original CCEL TXT · UTF-8 accents verified';txt.readPriority=5;
 const reasons=[
  'All 2,265 PDF pages were processed. Three body-page samples and all seven French index entries match the original TXT. '+(cleanup?'The reading derivative omits inserted page markers, running headers and sequential footer numbers; original extraction and page locators are preserved. Body references and line-break hyphens remain. ':'PDF page references are preserved; headers and line-break hyphens remain. ')+'Full section, footnote and script coverage has not yet been certified.',
  'The original TXT contains correct UTF-8 French and all seven French index entries. Three body-page samples match the PDF. Its index uses hyperlink labels in place of PDF page references. Full-volume coverage has not yet been certified.'
 ];
 for(const [i,record] of [pdf,txt].entries()){record.completeness={status:'INCOMPLETE',reviewState:'unverified',reason:reasons[i],steps:{saved:'done',coverage:'pending',compared:'sampled',complete:'pending'},evidenceUrl:'./wace-comparison-review.json'};record.quality=reasons[i];}
 const publishedReport={...report};if(cleanup){const {pages,removed,...summary}=cleanup;publishedReport.readingCleanup=summary;}
 fs.writeFileSync(path.join(out,'wace-comparison-review.json'),JSON.stringify(publishedReport,null,2)+'\n');
 return {updatedAt:cleanup?.createdAt||report.createdAt,scope:'Wace & Piercy: existing PDF text extracted; three body-page samples and all seven French index entries compared. '+(cleanup?'Reading derivative removes page furniture. ':'')+'Full coverage remains unverified.',pdfPages:m.pageCount,bodySamplePages:report.bodySamples.map(s=>s.pdfPage),evidenceUrl:'./wace-comparison-review.json',exportedBytes:readingBytes.length};
}
export function mergeWaceReview(summary,wace){if(!wace)return summary;return {...summary,updatedAt:new Date(summary?.updatedAt||0)>new Date(wace.updatedAt)?summary.updatedAt:wace.updatedAt,scope:'New Schaff–Herzog and Wace & Piercy have bounded text reviews; other collections remain unchecked.',waceReview:wace};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const site=path.resolve(import.meta.dirname,'..'),data=path.resolve(site,'../Data/TheologicalReferenceLibrary'),out=path.join(site,'public/data_acquisition'),file=path.join(out,'catalogue.json'),catalogue=JSON.parse(fs.readFileSync(file));
 const result=applyWaceReview(catalogue.records,data,out);catalogue.completenessReview=mergeWaceReview(catalogue.completenessReview,result);catalogue.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(catalogue,null,2)+'\n');console.log(JSON.stringify(result));
}
