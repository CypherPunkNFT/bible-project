import { SceneDrawing } from './WorldDrawings';

export function MergedDrawing({scene,view}:{scene:string;view:number}) {
  const supplement = (scene==='village' && view>1) || (['pilgrimage','household','sea'].includes(scene) && view===3);
  if (!supplement && !['synagogue','port','ephesus'].includes(scene)) return <SceneDrawing scene={scene} view={view}/>;
  const active=(i:number)=>view===i?'wj-highlight':'wj-quiet';
  return <svg viewBox="0 0 600 380" className="wj-scene-svg wj-supplement-svg" role="img" aria-label={`${scene}: ${supplement ? 'conceptual comparison' : 'highlighted evidence setting'}. Original schematic, not an excavation plan or a measured reconstruction.`}>
    {scene==='synagogue' && <>
      <g className={active(0)}><path d="M65 82h470v216H65Z M83 100h434v180H83 M100 117v146h400V117" className="wj-hypothesis"/><path d="M110 135v117h380V135M110 235h380" className="wj-rig"/><text x="65" y="58">BENCHES / SUCCESSIVE PHASES</text></g>
      <g className={active(1)}><path d="M230 156l69-26 75 26-73 29Z M230 156v51l71 28 73-28v-51M301 185v50" className="wj-wall"/><path d="M301 208v-55M270 162q0 36 31 36t31-36M279 159q0 30 22 30t22-30M288 156q0 24 13 24t13-24M293 208h16" className="wj-rig"/><text x="225" y="330">CARVED STONE</text></g>
      <g className={active(2)}><path d="M397 55h125v35H397Z M411 66h96m-96 12h75" className="wj-rig"/><text x="350" y="26">READING / COMPARISON</text></g>
    </>}
    {scene==='port' && <>
      <path d="M15 268q90-24 180 0t180 0 205 0v112H15Z" className="wj-water"/>
      <g className={active(0)}><path d="M43 89h125v129H43Z M43 89l17 23-17 20M168 164l-18 11 18 22" className="wj-wall"/><path d="M65 132h78m-78 23h65m-65 24h70" className="wj-rig"/><text x="40" y="62">DEDICATION</text><text x="40" y="242">REUSED STONE</text></g>
      <g className={active(1)}><path d="M226 182h145v55H226ZM244 182v-70h106v70m-85-69v69m30-69v69m30-69v69" className="wj-hypothesis"/><text x="225" y="63">HEARING</text><text x="220" y="266">LATER GOVERNORS</text></g>
      <g className={active(2)}><path d="M412 245q50 61 133 0l-22 46h-88Z M472 244V99m3 10 62 100h-62Z" className="wj-hull"/><text x="408" y="63">DEPARTURE</text><text x="414" y="326">UNDER GUARD</text></g>
    </>}
    {scene==='ephesus' && <>
      <path d="M30 270h540" className="wj-path"/>
      <g className={active(0)}><path d="M40 147h136v103H40Z M55 147v-28h106v28M82 250v-65h52v65" className="wj-wall"/><path d="M35 110h146" className="wj-hypothesis"/><text x="34" y="78">HOUSE / PHASES</text></g>
      <g className={active(1)}><path d="M234 207h133v40H234Z M254 207v-52h90v52m-99-52 54-35 56 35Z" className="wj-wall"/><path d="M271 166v34m27-34v34m28-34v34" className="wj-rig"/><text x="220" y="78">CRAFT / ARTEMIS</text><text x="238" y="319">LIVELIHOOD</text></g>
      <g className={active(2)}>{[55,75,95].map(r=><path key={r} d={`M${484-r} 170a${r} ${r} 0 0 0 ${r*2} 0`} className="wj-rig"/>)}<circle cx="484" cy="207" r="9" className="wj-pot"/><text x="407" y="78">CIVIC ASSEMBLY</text><text x="415" y="319">PROCEDURE</text></g>
    </>}
    {scene==='village' && view===2 && <g className="wj-highlight"><ellipse cx="220" cy="240" rx="110" ry="42" className="wj-wall"/><ellipse cx="220" cy="212" rx="110" ry="42" className="wj-roof"/><ellipse cx="220" cy="212" rx="17" ry="8" className="wj-pot"/><path d="M270 199v-60h20" className="wj-rig"/><path d="M392 255v-100q51-60 100 0v100Z M421 255v-42q20-24 42 0v42" className="wj-wall"/><text x="120" y="90">GRINDING / FOOD PREPARATION</text><text x="153" y="319">TOOLS DO NOT IDENTIFY WORKERS</text></g>}
    {scene==='village' && view===3 && <g className="wj-highlight"><path d="M40 275h520" className="wj-path"/><path d="M180 119h200v130H180Z M214 249v-74h132v74M203 175h155" className="wj-wall"/><path d="M55 248q45 28 91 0l-14 26H68Z" className="wj-hull"/><text x="162" y="76">SHORE / EXCHANGE / OFFICIALS</text><text x="127" y="322">MARK’S SETTING · NO RECOVERED TOLL BOOTH</text></g>}
    {scene==='pilgrimage' && <g className="wj-highlight"><path d="M85 108h415v180H85Z" className="wj-hypothesis"/><path d="M130 136h75v25h55v25h55v25h55v25h90" className="wj-rig"/><path d="M130 258h330v-22H370v-25H315v-25H260v-25H205v-25H130Z" className="wj-water"/><text x="83" y="75">STEPPED POOL / DOMESTIC SETTING</text><text x="104" y="326">A SECTION SCHEMATIC · NOT A SURVEYED BATH</text></g>}
    {scene==='household' && <g className="wj-highlight"><path d="M75 190h195v35H75Zm20 35v70m155-70v70" className="wj-wall"/><path d="M110 174l110-63 35 45-112 30Z" className="wj-hypothesis"/><path d="M330 122h172v128H330Zm16 25h140m-140 22h100m-100 22h122m-122 22h105" className="wj-rig"/><text x="75" y="80">CRAFT</text><text x="320" y="80">MATERIAL SUPPORT</text><text x="98" y="326">ACTS 18 / 1 CORINTHIANS 9 · NO SHOP ADDRESS</text></g>}
    {scene==='sea' && <g className="wj-highlight"><path d="M55 194q242 160 490 0l-49 84q-200 89-391 0Z" className="wj-hull"/>{[140,220,300,380,460].map(x=><path key={x} d={`M${x-8} 146h16v15q24 20 5 54h-10q-19-34 5-54Z`} className="wj-pot"/>)}<path d="M300 195V60l110 108H300" className="wj-hypothesis"/><text x="83" y="42">MADRAGUE DE GIENS · 75–60 BCE</text><text x="86" y="360">WINE CARGO ≠ THE WHEAT SHIP IN ACTS</text></g>}
  </svg>;
}
