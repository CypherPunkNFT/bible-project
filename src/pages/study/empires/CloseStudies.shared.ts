// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { useEffect, useState } from 'react';
import research from '../../../../content/academic-research/07-empires-close-studies.json';
import './close-studies.css';
export const expandedSources = research.sources;

export function useEmpireSelection(key:string,initial:number,max:number) {
  const [value,setValue]=useState(()=>{try{const raw=sessionStorage.getItem('empire-'+key);const n=raw===null?initial:Number(raw);return Number.isInteger(n)&&n>=0&&n<=max?n:initial;}catch{return initial;}});
  useEffect(()=>{try{sessionStorage.setItem('empire-'+key,String(value));}catch{/* Storage can be disabled. */}},[key,value]);
  return [value,setValue] as const;
}
