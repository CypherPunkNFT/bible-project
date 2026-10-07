export function genealogyFit(width:number,height:number,graphWidth:number,graphHeight:number) {
  return Math.max(.0001,Math.min(Math.max(1,width-80)/(graphWidth+160),Math.max(1,height-80)/(graphHeight+160),1));
}
/** Screen-relative panning margin lets every graph edge reach the viewport center. */
export function genealogyPan(x:number,y:number,k:number,width:number,height:number,graphWidth:number,graphHeight:number) {
  return {
    x:Math.max(width/2-(graphWidth+80)*k,Math.min(width/2+80*k,x)),
    y:Math.max(height/2-(graphHeight+80)*k,Math.min(height/2+80*k,y)),
  };
}
