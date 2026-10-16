import { useId } from 'react';
import type { DiscoveryStudyId } from './related-studies';

export function HistoricalLandingArt({kind}:{kind:DiscoveryStudyId}) {
  const id=useId().replace(/:/g,'');
  const description={mesha:'Illustrative basalt monument, detached piece and paper impression. Not a facsimile or reconstruction of the Mesha stele.',lachish:'Illustrative fortified hill and siege approach, framed by stone panels. Not a measured plan or reconstruction of Lachish.',cyrus:'Illustrative clay cylinder and written account with architectural forms. Not a facsimile, historical map or representation of a particular decree.'}[kind];
  return <figure className={'dh-art dh-art-'+kind}><svg viewBox="0 0 640 500" role="img" aria-label={description}><defs><linearGradient id={id+'-stone'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--dh-face)"/><stop offset="1" stopColor="var(--dh-shadow)"/></linearGradient><linearGradient id={id+'-paper'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--dh-paper)"/><stop offset="1" stopColor="var(--dh-face)"/></linearGradient></defs>
    {kind==='mesha'&&<>
      <ellipse cx="326" cy="433" rx="221" ry="30" fill="currentColor" opacity=".06"/>
      <g transform="rotate(12 444 240)" stroke="currentColor"><path d="M373 112H518L534 341 508 370 377 353Z" fill={`url(#${id}-paper)`} strokeOpacity=".3"/><path d="M391 143H496M392 162H498M393 181H499M394 200H500M395 219H501M395 238H502M396 257H503M398 276H504M399 295H505" opacity=".16"/><path d="M443 121L448 219 434 291 447 358" fill="none" opacity=".18"/></g>
      <g stroke="currentColor" strokeWidth="1.5"><path d="M182 398V163Q182 61 289 61Q396 61 396 163V397Z" fill={`url(#${id}-stone)`}/><path d="M396 163L409 153V390L396 397" fill="var(--dh-shadow)"/><path d="M182 235L238 212 277 239 304 199 395 227M277 239L254 297 272 345 257 398M254 297L183 306M304 199L323 146 303 83M272 345L334 329 396 356" fill="none" strokeWidth="2.5" opacity=".65"/><path d="M205 151Q289 107 372 151M205 170H372M205 188H372M205 261H242M288 265H370M205 283H236M291 285H370M205 367H244M293 366H372" opacity=".2"/><path d="M441 362L479 347 513 381 485 413 442 399Z" fill="var(--dh-face)"/></g>
      <path d="M111 443H529M133 454H469M154 465H409" stroke="currentColor" opacity=".15"/>
    </>}
    {kind==='lachish'&&<>
      <g fill="var(--dh-shadow)" stroke="currentColor" opacity=".2"><path d="M73 57H205V292H73Z M215 57H347V292H215Z M357 57H489V292H357Z"/><path d="M90 78H188V274H90Z M232 78H330V274H232Z M374 78H472V274H374Z" fill="none"/></g>
      <path d="M72 402L216 340 316 218 438 259 548 390 596 427 323 471Z" fill={`url(#${id}-stone)`} stroke="currentColor" strokeOpacity=".4"/><path d="M134 411L272 341 325 286 426 300 512 394M185 438L305 372 399 373 474 418" fill="none" stroke="currentColor" opacity=".18"/>
      <g stroke="currentColor" strokeWidth="1.3"><path d="M241 319V233H266V211H291V233H317V205H343V233H369V217H394V233H419V318Z" fill="var(--dh-face)"/><path d="M419 233L447 248V325L419 318" fill="var(--dh-shadow)"/><path d="M315 319V281Q330 253 345 281V319" fill="var(--dh-shadow)"/><path d="M254 259H293M254 275H293M366 259H408M366 275H408" opacity=".4"/><path d="M125 420L253 300 265 301 199 383 170 432Z" fill="var(--dh-accent)" fillOpacity=".35"/><path d="M138 417L258 305M164 419L255 331" opacity=".3"/><path d="M455 339L489 317 512 337 497 364 466 358Z" fill="var(--dh-shadow)"/></g>
      <path d="M42 423Q146 470 278 478M396 465Q507 461 589 441" fill="none" stroke="currentColor" opacity=".2"/>
    </>}
    {kind==='cyrus'&&<>
      <path d="M393 58H532L548 302 414 324Z" fill={`url(#${id}-paper)`} stroke="currentColor" strokeOpacity=".2" transform="rotate(10 470 190)"/><path d="M427 92H509M430 113H511M433 134H513M435 155H515M439 176H517M441 197H519M443 218H521" stroke="currentColor" opacity=".12"/>
      <ellipse cx="288" cy="391" rx="212" ry="32" fill="currentColor" opacity=".08"/>
      <g transform="rotate(-13 288 270)" stroke="currentColor" strokeWidth="1.4"><path d="M111 180Q286 99 472 181V321Q286 393 111 321Z" fill={`url(#${id}-stone)`}/><ellipse cx="111" cy="251" rx="34" ry="71" fill="var(--dh-shadow)"/><ellipse cx="472" cy="251" rx="28" ry="70" fill="var(--dh-face)"/><path d="M155 186Q285 130 432 185M154 212Q285 158 433 211M154 238Q285 187 433 237M154 264Q285 218 433 263M154 290Q285 250 432 289M155 316Q285 286 432 315" fill="none" opacity=".22"/><path d="M326 145L302 193 321 229 309 260" fill="none" opacity=".45"/></g>
      <g stroke="currentColor" fill="var(--dh-shadow)" opacity=".4"><path d="M405 429V374L438 351 470 374V429M414 374H461M429 429V395H446V429M480 429V392L505 378 529 392V429"/><path d="M87 433H550" fill="none"/></g>
    </>}
  </svg><figcaption>{description} Surface lines are abstract guides, not ancient writing.</figcaption></figure>;
}
