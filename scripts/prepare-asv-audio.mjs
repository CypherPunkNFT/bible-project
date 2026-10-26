// Build a small playback catalogue from the verified intake, leaving the MP3s in place.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const audioRoot=path.resolve(root,'../Research/Audio');
const index=JSON.parse(fs.readFileSync(path.join(audioRoot,'chapter-index.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const books=catalog.books.filter(book=>book.num<=66);
const source=index.sources['librivox-asv-altman'];
const archive=JSON.parse(fs.readFileSync(path.join(audioRoot,'raw/_catalogue/librivox-asv-altman.archive-metadata.json'),'utf8'));
// Small 32 kbps AAC copies on the download site, made by Research/Audio/tools/encode_aac.py and build_download_site.py.
const downloads=JSON.parse(fs.readFileSync(path.join(audioRoot,'encoded/downloads.json'),'utf8'));
assert(/^[a-z0-9.-]+\.archive\.org$/.test(archive.d1)&&archive.dir==='/0/items/bible_asv_complete_2112_librivox');
assert(source.complete&&source.books_covered===66&&source.chapters_covered===1189);
const tracks=Object.values(index.files).filter(file=>file.source==='librivox-asv-altman').sort((a,b)=>a.section_number-b.section_number).map(file=>{
 assert.equal(file.spans.length,1,'Mixed-book recordings need their full ranges displayed.');
 const span=file.spans[0],book=books.find(book=>book.code===span.code);
 assert(book&&file.on_disk);
 assert(downloads[path.basename(file.path)]?.url.startsWith('https://')&&downloads[path.basename(file.path)].bytes>0,`No download for ${file.path}`);
 assert.equal(fs.statSync(path.join(audioRoot,file.path)).size,file.bytes);
 const original=new URL(file.listen_url);
 assert(['archive.org','www.archive.org'].includes(original.hostname)&&original.pathname.startsWith('/download/bible_asv_complete_2112_librivox/'));
 return {id:file.section_number,title:file.section_title.replace(/(\d)-(\d)/g,'$1–$2'),book:book.name,code:book.code,category:book.section,firstChapter:span.first_chapter,lastChapter:span.last_chapter,duration:file.duration_seconds,src:`/data_intake/files/audio_bible/${file.path}`,publicSrc:`https://archive.org${original.pathname}`,fallbackSrc:`https://${archive.d1}${archive.dir}/${path.basename(file.path)}`,download:downloads[path.basename(file.path)]};
});
assert.equal(tracks.length,129);
for(const book of index.books){
 const chapters=new Set(tracks.filter(t=>t.code===book.code).flatMap(t=>Array.from({length:t.lastChapter-t.firstChapter+1},(_,i)=>t.firstChapter+i)));
 assert.equal(chapters.size,book.chapters,`Incomplete ${book.name}`);
}
const result={translation:'American Standard Version',abbreviation:'ASV',year:1901,reader:source.reader,bookCount:66,chapterCount:1189,runtime:source.runtime_seconds,source:'LibriVox',sourceUrl:'https://librivox.org/holy-bible-complete-american-standard-version/',archiveUrl:'https://archive.org/details/bible_asv_complete_2112_librivox',licence:'Public domain: 1901 text and LibriVox recording dedication.',tracks};
fs.writeFileSync(path.join(root,'src/data/listen/asv.json'),JSON.stringify(result,null,2)+'\n');
console.log(`Prepared ${tracks.length} ASV tracks; verified all 66 books, 1,189 chapters and local file sizes.`);
