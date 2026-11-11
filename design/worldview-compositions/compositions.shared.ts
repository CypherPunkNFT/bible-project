// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { type World } from "../worldview-art/art";
import { islamObjects } from "./islam-objects.shared";
export const artifactSets:Record<World,{number:number;id:string;name:string}[]>={
 hinduism:[{number:1,id:'lamp',name:'Oil lamp'},{number:3,id:'bell',name:'Temple bell'},{number:21,id:'trident',name:'Trident'},{number:25,id:'garland',name:'Flower garland'},{number:26,id:'firealtar',name:'Fire altar'}],
 buddhism:[{number:10,id:'bowl',name:'Bowl & flame'},{number:14,id:'lotus',name:'Lotus'},{number:30,id:'banner',name:'Victory banner'},{number:33,id:'vajra',name:'Vajra'}],
 islam:islamObjects,
};

export const variants=[{name:'Balanced frame',detail:'Artifacts surround the centerpiece in a clear, open arrangement.'},{name:'Gathered below',detail:'Side accents lead into a lower cluster, keeping the upper silhouette open.'},{name:'Offset orbit',detail:'Alternating shapes and heights give the frame a more flowing rhythm.'}];

export function variantFor(world:World,version:number){return world==='islam'?[
 {name:'Prayer & light',detail:'Prayer beads, a fringed prayer rug and a suspended glass lamp.'},
 {name:'Reading & craft',detail:'An open Qur’an on its stand, reed pen and ink, a metal ewer and a pen box.'},
 {name:'Books & instruments',detail:'A spherical incense burner, Qur’an binding and a portable qibla compass.'},
][version]:variants[version];}

export const selectedMain={hinduism:'B · Temple',buddhism:'A · Eightfold Path',islam:'B · Mosque'};
