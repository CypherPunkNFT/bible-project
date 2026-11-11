// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { useEffect, useState } from 'react';
export function read(){const n=Number(new URLSearchParams(window.location.search).get('m'));return n>=1&&n<=8?n:2;}

export function useMosque(){const [n,setN]=useState(read);useEffect(()=>{const update=()=>setN(read());window.addEventListener('mosquechange',update);window.addEventListener('popstate',update);return()=>{window.removeEventListener('mosquechange',update);window.removeEventListener('popstate',update);};},[]);return n;}
