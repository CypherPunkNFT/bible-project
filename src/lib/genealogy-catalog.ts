import { familyEdges, type FamilyPerson } from "./genealogy";

export const JESUS = "jesus-isa-7-14";
export const FAMILY_STARTS = [
  ["Jesus", JESUS], ["Abraham", "abraham-gen-11-26"], ["Jacob / Israel", "israel-gen-25-26"],
  ["David", "david-rut-4-17"], ["Adam", "adam-gen-2-19"], ["Noah", "noah-gen-5-29"],
  ["Shem", "shem-gen-5-32"], ["Isaac", "isaac-gen-17-19"], ["Ishmael", "ishmael-gen-16-11"],
  ["Esau", "esau-gen-25-25"], ["Judah", "judah-gen-29-35"], ["Levi", "levi-gen-29-34"],
  ["Joseph", "joseph-gen-30-24"], ["Benjamin", "benjamin-gen-35-18"], ["Moses", "moses-exo-2-10"],
  ["Aaron", "aaron-exo-4-14"], ["Ruth", "ruth-rut-1-4"], ["Boaz", "boaz-rut-2-1"],
  ["Samuel", "samuel-1sa-1-20"], ["Saul", "saul-1sa-9-2"], ["Solomon", "solomon-2sa-5-14"],
  ["Hezekiah", "hezekiah-2ki-16-20"], ["Josiah", "josiah-1ki-13-2"], ["Zerubbabel", "zerubbabel-1ch-3-19"],
] as const;

export type GospelAccount = "matthew" | "luke";
// Ordered ancestry as listed, not an assertion that every link is an immediate
// biological generation. KJV Matthew 1:2–16; Luke 3:23–38. Labels use corpus names.
export const MATTHEW_LINE = `abraham-gen-11-26 isaac-gen-17-19 israel-gen-25-26 judah-gen-29-35 perez-gen-38-29 hezron-gen-46-12 ram-rut-4-19 amminadab-exo-6-23 nahshon-exo-6-23 salmon-rut-4-20 boaz-rut-2-1 obed-rut-4-17 jesse-rut-4-17 david-rut-4-17 solomon-2sa-5-14 rehoboam-1ki-11-43 abijah-1ki-14-31 asa-1ki-15-8 jehoshaphat-1ki-15-24 jehoram-1ki-22-50 uzziah-2ki-14-21 jotham-2ki-15-5 ahaz-2ki-15-38 hezekiah-2ki-16-20 manasseh-2ki-20-21 amon-2ki-21-18 josiah-1ki-13-2 jehoiachin-2ki-24-6 shealtiel-1ch-3-17 zerubbabel-1ch-3-19 abiud-mat-1-13 eliakim-mat-1-13 azor-mat-1-13 zadok-mat-1-14 achim-mat-1-14 eliud-mat-1-14 eleazar-mat-1-15 matthan-mat-1-15 jacob-mat-1-15 joseph-mat-1-16 jesus-isa-7-14`.split(" ");
export const LUKE_LINE = `jesus-isa-7-14 joseph-mat-1-16 heli-luk-3-23 matthat-luk-3-24 levi-luk-3-24 melchi-luk-3-24 jannai-luk-3-24 joseph-luk-3-24 mattathias-luk-3-25 amos-luk-3-25 nahum-luk-3-25 esli-luk-3-25 naggai-luk-3-25 maath-luk-3-26 mattathias-luk-3-26 semein-luk-3-26 josech-luk-3-26 joda-luk-3-26 joanan-luk-3-27 rhesa-luk-3-27 zerubbabel-luk-3-27 shealtiel-luk-3-27 neri-luk-3-27 melchi-luk-3-28 addi-luk-3-28 cosam-luk-3-28 elmadam-luk-3-28 er-luk-3-28 joshua-luk-3-29 eliezer-luk-3-29 jorim-luk-3-29 matthat-luk-3-29 levi-luk-3-29 simeon-luk-3-30 judah-luk-3-30 joseph-luk-3-30 jonam-luk-3-30 eliakim-luk-3-30 melea-luk-3-31 menna-luk-3-31 mattatha-luk-3-31 nathan-2sa-5-14 david-rut-4-17 jesse-rut-4-17 obed-rut-4-17 boaz-rut-2-1 salmon-rut-4-20 nahshon-exo-6-23 amminadab-exo-6-23 ram-rut-4-19 hezron-gen-46-12 perez-gen-38-29 judah-gen-29-35 israel-gen-25-26 isaac-gen-17-19 abraham-gen-11-26 terah-gen-11-24 nahor-gen-11-22 serug-gen-11-20 reu-gen-11-18 peleg-gen-10-25 eber-gen-10-21 shelah-gen-10-24 cainan-luk-3-36 arpachshad-gen-10-22 shem-gen-5-32 noah-gen-5-29 lamech-gen-5-25 methuselah-gen-5-21 enoch-gen-5-18 jared-gen-5-15 mahalalel-gen-5-12 kenan-gen-5-9 enosh-gen-4-26 seth-gen-4-25 adam-gen-2-19`.split(" ").reverse();

export const GOSPEL_NOTES = {
  matthew: "Matthew 1:1–17 · Abraham to Jesus. Listed ancestry, including the women named in the line. Joseph is Mary's husband; Jesus was born of Mary. Matthew groups the ancestry and omits some intervening generations.",
  luke: "Luke 3:23–38 · Jesus to Adam; the passage ends ‘of God’. Joseph is named ‘as was supposed’; Luke does not name Mary in this genealogy. KJV sequence: Aram in 3:33; some translations instead list Admin and Arni.",
};
export const GOSPEL_URLS = {
  matthew: "https://www.biblegateway.com/passage/?search=Matthew+1%3A1-17&version=KJV",
  luke: "https://www.biblegateway.com/passage/?search=Luke+3%3A23-38&version=KJV",
};

/** Separate source projections avoid conflating Matthew, Luke and harmonizations. */
export function gospelPeople(people: FamilyPerson[], account: GospelAccount): FamilyPerson[] {
  const line = account === "matthew" ? MATTHEW_LINE : LUKE_LINE;
  const parents = new Map<string,string[]>();
  for (let i=1;i<line.length;i++) parents.set(line[i],[line[i-1]]);
  if(account === "matthew") {
    for(const [child,mother] of [["perez-gen-38-29","tamar-gen-38-6"],["boaz-rut-2-1","rahab-jos-2-1"],["obed-rut-4-17","ruth-rut-1-4"],["solomon-2sa-5-14","bathsheba-2sa-11-3"],[JESUS,"mary-mat-1-16"]]) parents.get(child)!.push(mother);
  }
  return people.map(person=>({...person,pa:parents.get(person.id) ?? [],ch:[],sp:[],si:[],
    b:person.id===JESUS ? GOSPEL_NOTES[account] : person.id==="joseph-mat-1-16" ? (account==="matthew" ? "Matthew 1:16 names Joseph as the son of Jacob and husband of Mary, of whom Jesus was born." : "Luke 3:23 names Joseph, as Jesus's supposed father, and traces the line through Heli.") : person.b}));
}

/** Longest recorded path, computed independently of the current display depth. */
export function fullFamilyDepth(people:FamilyPerson[],root:string,direction:"ancestors"|"descendants"|"both") {
  const edges=familyEdges(people).filter(e=>e.kind==="parent");
  const measure=(reverse:boolean)=>{
    const links=new Map<string,string[]>();
    for(const e of edges) {const from=reverse ? e.to : e.from,to=reverse ? e.from : e.to;links.set(from,[...(links.get(from) ?? []),to]);}
    const memo=new Map<string,number>(),active=new Set<string>();
    const visit=(id:string):number=>{
      if(active.has(id)) throw new Error(`Parent-child cycle at ${id}`);
      if(memo.has(id)) return memo.get(id)!;
      active.add(id);const depth=Math.max(0,...(links.get(id) ?? []).map(next=>1+visit(next)));active.delete(id);memo.set(id,depth);return depth;
    };
    return visit(root);
  };
  return Math.max(1,direction!=="descendants" ? measure(true) : 0,direction!=="ancestors" ? measure(false) : 0);
}
