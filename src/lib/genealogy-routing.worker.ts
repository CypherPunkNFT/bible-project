import { routeFamilies } from "./genealogy-routing";
import type { familyBranch } from "./genealogy";

self.onmessage=(event:MessageEvent<ReturnType<typeof familyBranch>>)=> {
  self.postMessage(routeFamilies(event.data));
};
