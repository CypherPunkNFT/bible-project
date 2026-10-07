import { FAMILY_STARTS, GOSPEL_NOTES, GOSPEL_URLS, JESUS, type GospelAccount } from "@/lib/genealogy-catalog";

export function FamilyStartingPoints({root,onChoose,account,onAccount,onFull,complete}:{root:string;onChoose:(id:string)=>void;account:GospelAccount;onAccount:(value:GospelAccount)=>void;onFull:()=>void;complete:boolean}) {
  return <><span className="sr-only">24 family starting points</span>{FAMILY_STARTS.slice(0,6).map(([name,id])=><button key={id} aria-pressed={root===id} onClick={()=>onChoose(id)}>{name}</button>)}
    <select aria-label="All 24 families" value={FAMILY_STARTS.some(([,id])=>id===root) ? root : ""} onChange={e=>onChoose(e.target.value)}><option value="" disabled>24 families</option>{FAMILY_STARTS.map(([name,id])=><option key={id} value={id}>{name}</option>)}</select>
    {root===JESUS && <><select aria-label="Gospel genealogy" value={account} onChange={e=>onAccount(e.target.value as GospelAccount)}><option value="matthew">Matthew 1</option><option value="luke">Luke 3</option></select><a className="genealogy-source" href={GOSPEL_URLS[account]} target="_blank" rel="noreferrer" title={GOSPEL_NOTES[account]} aria-label={`Read ${account}'s genealogy and source notes`}>KJV source ↗</a></>}
    <button onClick={onFull} aria-pressed={complete} title="Show every recorded generation in this direction">Full branch</button>
  </>;
}
