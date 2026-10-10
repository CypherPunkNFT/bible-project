export const palettes = [
 {name:'Emerald · tangerine · cornflower',dark:['#83c98c','#efa06b','#87b5ed'],light:['#347540','#a34b18','#315f9c']},
 {name:'Sage · apricot · sky',dark:['#b0c59c','#f0b27c','#a1c6ed'],light:['#5b7040','#9e511f','#326891']},
 {name:'Forest · amber orange · cobalt',dark:['#62b781','#efa057','#80a4ee'],light:['#26733e','#995011','#3d57a3']},
 {name:'Mint · terracotta · slate blue',dark:['#9bd4b0','#de9575','#9fb6db'],light:['#37734e','#9d4e30','#4a6290']},
 {name:'Olive · copper · periwinkle',dark:['#b7c47e','#e1a078','#94abef'],light:['#64702b','#9c5427','#4c59a1']},
 {name:'Jade · peach · royal blue',dark:['#79c699','#f1b391','#859bf0'],light:['#33724b','#a0512a','#4654a1']},
 {name:'Spring · marigold · cerulean',dark:['#98cd87','#f3ab5d','#78bceb'],light:['#467538','#9d5311','#24698f']},
 {name:'Eucalyptus · burnt orange · steel',dark:['#94bea0','#dc9871','#8daed3'],light:['#4d7259','#9f5125','#42658b']},
 {name:'Pistachio · coral orange · denim',dark:['#b7d493','#ef9b7b','#86abe0'],light:['#5c742f','#a44828','#3d6099']},
 {name:'Fern · sunset · ice blue',dark:['#7bc987','#edab70','#aacbe4'],light:['#347442','#a15120','#3e6888']},
] as const;
export const worldIds=['islam','secular','buddhism','hinduism'] as const;
export type WorldId=(typeof worldIds)[number];
export const worldNames={islam:'Islam',secular:'Secular',buddhism:'Buddhism',hinduism:'Hinduism'};
export function colorsFor(index:number,theme:'light'|'dark'){
 const colors=palettes[index][theme];
 return {islam:theme==='dark'?'#59c5bd':'#18716a',secular:colors[0],buddhism:colors[1],hinduism:colors[2]};
}
