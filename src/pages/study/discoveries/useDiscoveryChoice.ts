import { useSearchParams } from 'react-router-dom';

/** Keep a reading choice through reader visits, Back and reload without scrolling the page. */
export function useDiscoveryChoice(key: string, count: number) {
  const [params,setParams]=useSearchParams();
  const raw=Number(params.get(key));
  const value=Number.isInteger(raw)&&raw>=0&&raw<count?raw:0;
  const select=(next:number)=>{const updated=new URLSearchParams(params);updated.set(key,String(next));setParams(updated,{replace:true,preventScrollReset:true});};
  return [value,select] as const;
}
