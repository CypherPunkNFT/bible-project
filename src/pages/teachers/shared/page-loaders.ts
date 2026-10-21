import {preloadPeopleData,preloadScholarsData} from './data';
import type {Side} from './sides';
export const loadPreachersPage=()=>import('../preachers/PreachersPage');
export const loadScholarsPage=()=>import('../scholars/ScholarsPage');
/** `withLibrary` also fetches the scholars list (1.7 MB): only when the visitor is switching sides, never as idle prefetch. */
export async function preloadTeacherSide(side:Side,{withLibrary=true}:{withLibrary?:boolean}={}) {
  if(side==='preachers')await Promise.all([loadPreachersPage(),preloadPeopleData()]);
  else await Promise.all([loadScholarsPage(),preloadScholarsData(),withLibrary&&import('../scholars/catalogue/useLibrary').then(module=>module.preloadScholarLibrary())]);
}
