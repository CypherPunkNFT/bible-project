import { useEffect, useState } from "react";
import type { PeopleData, ScholarsData } from "@/data/teachers/pages-types";
// Successful imports survive route changes; failed imports remain retryable.
function resource<T>(load:()=>Promise<{default:unknown}>) {
  let value:T|null=null, pending:Promise<T>|null=null;
  return {read:()=>value,load:()=>pending??(pending=load().then(module=>value=module.default as T).catch(error=>{pending=null;throw error;}))};
}
const people=resource<PeopleData>(()=>import("@/data/teachers/people.json"));
const scholars=resource<ScholarsData>(()=>import("@/data/teachers/scholars.json"));
function useLoaded<T>(source:{read:()=>T|null;load:()=>Promise<T>}) {
  const [data,setData]=useState(source.read),[error,setError]=useState<Error|null>(null);
  useEffect(()=>{
    let live=true;
    source.load().then(value=>{if(live)setData(value);},error=>{if(live)setError(error instanceof Error?error:new Error(String(error)));});
    return()=>{live=false;};
  },[source]);
  return {data,error};
}
export const preloadPeopleData=people.load;
export const preloadScholarsData=scholars.load;
export const usePeopleData=()=>useLoaded(people);
export const useScholarsData=()=>useLoaded(scholars);
