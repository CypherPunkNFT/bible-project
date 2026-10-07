import { expect,it } from "vitest";
import { genealogyFit,genealogyPan } from "./genealogy-camera";

it("fits a wide tree completely instead of clipping at a fixed minimum zoom",()=>{
  const width=1200,height=600,graphWidth=100000,graphHeight=18000;
  const scale=genealogyFit(width,height,graphWidth,graphHeight);
  expect(scale).toBeLessThan(.04);
  expect(graphWidth*scale).toBeLessThanOrEqual(width-80);
  expect(graphHeight*scale).toBeLessThanOrEqual(height-80);
});
it("lets every edge and the root reach the center at all supported zoom levels",()=>{
  const width=1200,height=650,graphWidth=90000,graphHeight=8000;
  for(const k of [.0001,.005,.02,.29,1,4]) for(const x of [0,graphWidth/2,graphWidth]) for(const y of [0,graphHeight/2,graphHeight]) {
    const desired={x:width/2-x*k,y:height/2-y*k};
    expect(genealogyPan(desired.x,desired.y,k,width,height,graphWidth,graphHeight)).toEqual(desired);
    const clamped=genealogyPan(1e9,-1e9,k,width,height,graphWidth,graphHeight);
    expect(clamped.x).toBeLessThan(1e9);expect(clamped.y).toBeGreaterThan(-1e9);
  }
});
