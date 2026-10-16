import type {Model} from './model';
export function sourceIndexCsv(model:Model):string{
 const escape=(value:unknown)=>`"${String(value??'').replace(/"/g,'""')}"`;
 const rows=[['Site feature','Contributor / source provider','Work / source','Date label','Connection type','Source URL','Connected pages','Consultation / locator']];
 for(const {s,fs}of model.rows)rows.push([fs.map(f=>f.name).join('; '),s.creditLabel??s.name,s.works[0][0],String(s.works[0][1]),s.kind,s.sourceUrl,[...new Set(s.uses.map(u=>u.address))].join('; '),[...new Set(s.uses.map(u=>u.consultation??u.locator))].join('; ')]);
 return '\uFEFF'+rows.map(row=>row.map(escape).join(',')).join('\r\n');
}
