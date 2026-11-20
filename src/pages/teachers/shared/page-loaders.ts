import {preloadPeopleData,preloadPeopleOpening,preloadScholarsData} from './data';
import type {Side} from './sides';
export const loadPreachersPage=()=>import('../preachers/PreachersPage');
export const loadScholarsPage=()=>import('../scholars/ScholarsPage');
/** `withLibrary` also fetches the bigger files (the scholars list's opening, about 275 KB, the rest following once the
 *  page is idle; the preachers' people.json, 400 KB): only when the
 *  visitor is switching sides, never as idle prefetch, which takes the code and the small opening files. */
export async function preloadTeacherSide(side:Side,{withLibrary=true}:{withLibrary?:boolean}={}) {
  if(side==='preachers')await Promise.all([loadPreachersPage(),preloadPeopleOpening(),withLibrary&&preloadPeopleData()]);
  else await Promise.all([loadScholarsPage(),preloadScholarsData(),preloadPeopleOpening(),withLibrary&&import('../scholars/catalogue/useLibrary').then(module=>module.preloadScholarOpening())]);
}
