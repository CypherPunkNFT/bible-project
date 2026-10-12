import {preloadPeopleData,preloadScholarsData} from './data';
import type {Side} from './sides';
export const loadPreachersPage=()=>import('../preachers/PreachersPage');
export const loadScholarsPage=()=>import('../scholars/ScholarsPage');
export async function preloadTeacherSide(side:Side) {
  if(side==='preachers')await Promise.all([loadPreachersPage(),preloadPeopleData()]);
  else await Promise.all([loadScholarsPage(),preloadScholarsData(),import('../scholars/catalogue/useLibrary').then(module=>module.preloadScholarLibrary())]);
}
