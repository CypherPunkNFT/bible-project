// What the tree draws and in what order, read by extract.mjs. Every caption is pulled from the data by reference
// (ev = David's event label in the ruler file, acc = his accession claims, other = another ruler's event, kjv = exact
// verses); "note" lines are this site's own words and only say how the text is being drawn.
// Ops are cumulative: add (appear) · ghost (named, not yet narrated) · wed / unwed (into or out of David's marriages) ·
// die · crown {israel, judah} · rival (a claimed crown) · oil (anointings) · link / unlink [a, b, kind] · move ·
// sag (a house "waxed weaker") · promise (the "for ever" thread). focus is the current step only.

const D = "david-rut-4-17", SAUL = "saul-1sa-9-2", JON = "jonathan-1sa-13-2", MICHAL = "michal-1sa-14-49";
const ABNER = "abner-1sa-14-50", ISH = "ish-bosheth-2sa-2-8", MEPH = "mephibosheth-2sa-4-4", PALTI = "palti-1sa-25-44";
const BATH = "bathsheba-2sa-11-3", SOL = "solomon-2sa-5-14", ADO = "adonijah-2sa-3-4", ABS = "absalom-2sa-3-3";
const AMNON = "amnon-2sa-3-2", JOAB = "joab-1sa-26-6", ABISHAI = "abishai-1sa-26-6", ASAHEL = "asahel-2sa-2-18";
const AMASA = "amasa-2sa-17-25", NATHAN = "nathan-2sa-7-2", ZADOK = "zadok-2sa-8-17", BENAIAH = "benaiah-2sa-8-18";
const ABIATHAR = "abiathar-1sa-22-20", URIAH = "uriah-2sa-11-3", CHILD = "bathsheba-first-son", SEVEN = "seven-of-saul";
const BATH_SONS = ["shammua-2sa-5-14", "shobab-2sa-5-14", "nathan-2sa-5-14", SOL];

// house: saul | david | court. role decides the row; order the slot within it.
export const TREE = [
  { id: "kish-1sa-9-1", house: "saul", role: "root" },
  { id: SAUL, house: "saul", role: "king", parent: "kish-1sa-9-1" },
  { id: ABNER, house: "saul", role: "kin", order: 0 },
  { id: "rizpah-2sa-3-7", house: "saul", role: "spouse", order: 1 },
  { id: JON, house: "saul", role: "child", parent: SAUL, order: 0 },
  { id: "abinadab-1sa-14-49", house: "saul", role: "child", parent: SAUL, order: 1 },
  { id: "malchi-shua-1sa-14-49", house: "saul", role: "child", parent: SAUL, order: 2 },
  { id: ISH, house: "saul", role: "child", parent: SAUL, order: 3 },
  { id: "merab-1sa-14-49", house: "saul", role: "child", parent: SAUL, order: 4 },
  { id: MICHAL, house: "saul", role: "child", parent: SAUL, order: 5, wife: 0 },
  { id: MEPH, house: "saul", role: "grandchild", parent: JON, order: 0 },
  { id: SEVEN, house: "saul", role: "grandchild", parent: SAUL, order: 1 },
  { id: PALTI, house: "saul", role: "other", order: 0 },
  { id: "boaz-rut-2-1", house: "david", role: "root", order: 0 },
  { id: "ruth-rut-1-4", house: "david", role: "root", order: 1 },
  { id: "obed-rut-4-17", house: "david", role: "root", order: 2, parent: "boaz-rut-2-1" },
  { id: "jesse-rut-4-17", house: "david", role: "root", order: 3, parent: "obed-rut-4-17" },
  { id: "eliab-1sa-16-6", house: "david", role: "sibling", parent: "jesse-rut-4-17", order: 0 },
  { id: "abinadab-1sa-16-8", house: "david", role: "sibling", parent: "jesse-rut-4-17", order: 1 },
  { id: "shimeah-1sa-16-9", house: "david", role: "sibling", parent: "jesse-rut-4-17", order: 2 },
  { id: "nethanel-1ch-2-14", house: "david", role: "sibling", parent: "jesse-rut-4-17", order: 3 },
  { id: "raddai-1ch-2-14", house: "david", role: "sibling", parent: "jesse-rut-4-17", order: 4 },
  { id: "ozem-1ch-2-15", house: "david", role: "sibling", parent: "jesse-rut-4-17", order: 5 },
  { id: D, house: "david", role: "king", parent: "jesse-rut-4-17" },
  { id: "zeruiah-1sa-26-6", house: "david", role: "sister", parent: "jesse-rut-4-17", order: 0 },
  { id: "abigail-2sa-17-25", house: "david", role: "sister", parent: "jesse-rut-4-17", order: 1 },
  { id: JOAB, house: "david", role: "nephew", parent: "zeruiah-1sa-26-6", order: 0 },
  { id: ABISHAI, house: "david", role: "nephew", parent: "zeruiah-1sa-26-6", order: 1 },
  { id: ASAHEL, house: "david", role: "nephew", parent: "zeruiah-1sa-26-6", order: 2 },
  { id: AMASA, house: "david", role: "nephew", parent: "abigail-2sa-17-25", order: 3 },
  { id: "jonadab-2sa-13-3", house: "david", role: "nephew", parent: "shimeah-1sa-16-9", order: 4 },
  { id: "ahinoam-1sa-25-43", house: "david", role: "wife", wife: 1 },
  { id: "abigail-1sa-25-3", house: "david", role: "wife", wife: 2 },
  { id: "maacah-2sa-3-3", house: "david", role: "wife", wife: 3 },
  { id: "haggith-2sa-3-4", house: "david", role: "wife", wife: 4 },
  { id: "abital-2sa-3-4", house: "david", role: "wife", wife: 5 },
  { id: "eglah-2sa-3-5", house: "david", role: "wife", wife: 6 },
  { id: BATH, house: "david", role: "wife", wife: 7 },
  { id: "jerusalem-wives-2sa-5-13", house: "david", role: "wife", wife: 8 },
  { id: AMNON, house: "david", role: "son", parent: D, mother: "ahinoam-1sa-25-43" },
  { id: "chileab-2sa-3-3", house: "david", role: "son", parent: D, mother: "abigail-1sa-25-3" },
  { id: ABS, house: "david", role: "son", parent: D, mother: "maacah-2sa-3-3" },
  { id: "tamar-2sa-13-1", house: "david", role: "son", parent: D, mother: "maacah-2sa-3-3", daughter: true },
  { id: ADO, house: "david", role: "son", parent: D, mother: "haggith-2sa-3-4" },
  { id: "shephatiah-2sa-3-4", house: "david", role: "son", parent: D, mother: "abital-2sa-3-4" },
  { id: "ithream-2sa-3-5", house: "david", role: "son", parent: D, mother: "eglah-2sa-3-5" },
  { id: CHILD, house: "david", role: "son", parent: D, mother: BATH },
  ...BATH_SONS.map((id) => ({ id, house: "david", role: "son", parent: D, mother: BATH })),
  ...["ibhar-2sa-5-15", "elishua-2sa-5-15", "elpelet-1ch-3-6", "nogah-1ch-3-7", "nepheg-2sa-5-15", "japhia-2sa-5-15", "elishama-2sa-5-16", "eliada-2sa-5-16", "eliphelet-2sa-5-16"]
    .map((id) => ({ id, house: "david", role: "son", parent: D, mother: "jerusalem-wives-2sa-5-13" })),
  { id: "samuel-1sa-1-20", house: "court", role: "court", order: 0 },
  { id: NATHAN, house: "court", role: "court", order: 1 },
  { id: "gad-1sa-22-5", house: "court", role: "court", order: 2 },
  { id: URIAH, house: "court", role: "court", order: 3 },
  { id: ZADOK, house: "court", role: "court", order: 4 },
  { id: BENAIAH, house: "court", role: "court", order: 5 },
  { id: ABIATHAR, house: "court", role: "court", order: 6 },
];

// Group nodes with no person file of their own. Their words are KJV text.
export const CUSTOM = {
  [SEVEN]: { name: "Seven of Saul's sons", brief: "“the two sons of Rizpah … Armoni and Mephibosheth; and the five sons of Michal the daughter of Saul, whom she brought up for Adriel” (2 Samuel 21:8, KJV). Handed to the Gibeonites; “they fell all seven together” (21:9).", first: 10021008 },
  [CHILD]: { name: "The child", brief: "Bath-sheba “bare him a son” (2 Samuel 11:27); “on the seventh day … the child died” (12:18). He is not named.", first: 10011027 },
};

const S_ONLY_NOTE = "The tree hangs the four on Bath-sheba because 1 Chronicles 3:5 gives them to her; 2 Samuel 5:14 lists them without a mother.";

export const STEPS = [
  // ── Before the throne: Scripture gives no ages or years here.
  { id: "two-houses", seg: "pre", title: "Two houses", kjv: ["1SA 14:49-51", "RUT 4:22", "1CH 2:13-16"],
    ops: { add: ["kish-1sa-9-1", SAUL, ABNER, JON, "malchi-shua-1sa-14-49", "merab-1sa-14-49", MICHAL, "boaz-rut-2-1", "ruth-rut-1-4", "obed-rut-4-17", "jesse-rut-4-17",
      "eliab-1sa-16-6", "abinadab-1sa-16-8", "shimeah-1sa-16-9", "nethanel-1ch-2-14", "raddai-1ch-2-14", "ozem-1ch-2-15", "zeruiah-1sa-26-6", "abigail-2sa-17-25", D], crown: { israel: SAUL } },
    focus: [SAUL, "jesse-rut-4-17"] },
  { id: "anointed", seg: "pre", title: "Anointed among his brothers", acc: [0], kjv: ["1SA 16:13"], ops: { add: ["samuel-1sa-1-20"], oil: 1 }, focus: [D, "samuel-1sa-1-20"] },
  { id: "covenant", seg: "pre", title: "Jonathan's covenant", kjv: ["1SA 18:1-3"], ops: { link: [[JON, D, "covenant"]] }, focus: [JON, D] },
  { id: "michal", seg: "pre", title: "Saul gives him Michal", kjv: ["1SA 18:19", "1SA 18:27"], ops: { wed: [MICHAL] }, focus: [MICHAL, "merab-1sa-14-49"] },
  { id: "abigail", seg: "pre", title: "Abigail and Ahinoam", kjv: ["1SA 25:42-43"], ops: { add: ["abigail-1sa-25-3", "ahinoam-1sa-25-43"], wed: ["abigail-1sa-25-3", "ahinoam-1sa-25-43"] }, focus: ["abigail-1sa-25-3", "ahinoam-1sa-25-43"] },
  { id: "phalti", seg: "pre", title: "Michal given to Phalti", kjv: ["1SA 25:44"], ops: { add: [PALTI], unwed: [MICHAL], link: [[MICHAL, PALTI, "marriage"]] }, focus: [MICHAL, PALTI] },
  { id: "gilboa", seg: "pre", title: "Gilboa", kjv: ["1SA 31:2", "1SA 31:6"], other: [[SAUL, "Death on mount Gilboa"]],
    ops: { add: ["abinadab-1sa-14-49"], die: [SAUL, JON, "abinadab-1sa-14-49", "malchi-shua-1sa-14-49"], crown: { israel: null } }, focus: [SAUL, JON, "abinadab-1sa-14-49", "malchi-shua-1sa-14-49"] },
  // ── Hebron: seven years and six months (2 Sam 2:11). Only its first year and its end are fixed.
  { id: "judah", seg: "hebron", year: 1, title: "King over Judah at Hebron", ev: ["King over Judah at Hebron"], acc: [1], ops: { crown: { judah: D }, oil: 2 }, focus: [D] },
  { id: "ishbosheth", seg: "hebron", title: "Abner makes Ish-bosheth king", kjv: ["2SA 2:8-10"], ops: { add: [ISH], crown: { israel: ISH } }, focus: [ABNER, ISH] },
  { id: "asahel", seg: "hebron", title: "Asahel falls", ev: ["War with the house of Saul"], kjv: ["2SA 2:23"], ops: { add: [JOAB, ABISHAI, ASAHEL], die: [ASAHEL] }, focus: [ABNER, ASAHEL, JOAB] },
  { id: "long-war", seg: "hebron", title: "The long war", kjv: ["2SA 3:1", "2SA 3:6-7"], ops: { add: ["rizpah-2sa-3-7"], sag: { saul: 1 } }, focus: [D, ISH, ABNER] },
  { id: "hebron-sons", seg: "hebron", title: "Sons born in Hebron", kjv: ["2SA 3:2-5"],
    ops: { add: ["maacah-2sa-3-3", "haggith-2sa-3-4", "abital-2sa-3-4", "eglah-2sa-3-5", AMNON, "chileab-2sa-3-3", ABS, ADO, "shephatiah-2sa-3-4", "ithream-2sa-3-5"], wed: ["maacah-2sa-3-3", "haggith-2sa-3-4", "abital-2sa-3-4", "eglah-2sa-3-5"] },
    focus: [AMNON, "chileab-2sa-3-3", ABS, ADO, "shephatiah-2sa-3-4", "ithream-2sa-3-5"] },
  { id: "michal-back", seg: "hebron", title: "Michal taken back", kjv: ["2SA 3:14-16"], ops: { wed: [MICHAL], unlink: [[MICHAL, PALTI]] }, focus: [MICHAL, PALTI] },
  { id: "abner", seg: "hebron", title: "Joab kills Abner", kjv: ["2SA 3:27"], ops: { die: [ABNER] }, focus: [ABNER, JOAB] },
  { id: "ish-murdered", seg: "hebron", title: "Ish-bosheth murdered", other: [[ISH, "Ish-bosheth murdered"]], kjv: ["2SA 4:4"], ops: { add: [MEPH], die: [ISH], crown: { israel: null } }, focus: [ISH, MEPH] },
  { id: "all-israel", seg: "hebron", year: 8, title: "King over all Israel", ev: ["King over all Israel"], acc: [2], kjv: ["2SA 5:4-5"], ops: { crown: { israel: D, judah: D }, oil: 3 }, focus: [D] },
  // ── Jerusalem: thirty-three years. Scripture dates almost none of these; they follow the order of the telling.
  { id: "jerusalem", seg: "jer", title: "Jerusalem taken", ev: ["Jerusalem taken"], covers: ["Hiram's embassy"], ops: {}, focus: [D] },
  { id: "jerusalem-sons", seg: "jer", title: "Wives and sons in Jerusalem", kjv: ["2SA 5:13-16"], note: S_ONLY_NOTE, noteRefs: ["1CH 3:5", "2SA 5:14"], covers: ["Philistines beaten in the valley of Rephaim"],
    ops: { add: ["jerusalem-wives-2sa-5-13", "ibhar-2sa-5-15", "elishua-2sa-5-15", "elpelet-1ch-3-6", "nogah-1ch-3-7", "nepheg-2sa-5-15", "japhia-2sa-5-15", "elishama-2sa-5-16", "eliada-2sa-5-16", "eliphelet-2sa-5-16"],
      wed: ["jerusalem-wives-2sa-5-13"], ghost: BATH_SONS }, focus: ["jerusalem-wives-2sa-5-13"] },
  { id: "ark", seg: "jer", title: "The ark comes to Jerusalem", ev: ["The ark comes to Jerusalem"], covers: ["Uzzah struck down"], kjv: ["2SA 6:23"], ops: {}, focus: [D, MICHAL] },
  { id: "promise", seg: "jer", title: "A house for ever", ev: ["Nathan's promise of a house"], kjv: ["2SA 7:16"], ops: { add: [NATHAN], promise: true }, focus: [NATHAN, D] },
  { id: "wars", seg: "jer", title: "Wars on every side", ev: ["Philistines and Moab subdued", "Zobah and Damascus"], covers: ["Toi of Hamath sends gifts", "Garrisons in Edom"], ops: {}, focus: [D, JOAB, ABISHAI] },
  { id: "mephibosheth", seg: "jer", title: "At the king's table", ev: ["Kindness to Mephibosheth"], kjv: ["2SA 9:13"], ops: { link: [[MEPH, D, "table"]], move: { [MEPH]: { toward: D, f: 0.3 } } }, focus: [MEPH, D] },
  { id: "ammon", seg: "jer", title: "Ammon and the Syrians", ev: ["Ammon and the Syrians"], ops: {}, focus: [JOAB, ABISHAI] },
  { id: "bathsheba", seg: "jer", title: "Bath-sheba and Uriah", ev: ["Bathsheba and Uriah"], kjv: ["2SA 11:3", "2SA 11:17", "2SA 11:27"],
    ops: { add: [URIAH, BATH, CHILD], wed: [BATH], die: [URIAH], link: [[BATH, URIAH, "marriage"]] }, focus: [BATH, URIAH, D] },
  { id: "the-man", seg: "jer", title: "“Thou art the man”", ev: ["“Thou art the man”"], kjv: ["2SA 12:18"], ops: { die: [CHILD] }, focus: [NATHAN, D, CHILD] },
  { id: "solomon", seg: "jer", title: "Solomon born", ev: ["Solomon born"], covers: ["Rabbah taken"], kjv: ["2SA 12:24"], note: "2 Samuel narrates Solomon's birth; the other three sons Chronicles gives to Bath-shua are listed, not narrated.", ops: { unghost: BATH_SONS }, focus: [SOL, BATH] },
  { id: "tamar", seg: "jer", title: "Amnon and Tamar", ev: ["Amnon, Tamar and Absalom"], kjv: ["2SA 13:1"], ops: { add: ["tamar-2sa-13-1", "jonadab-2sa-13-3"] }, focus: [AMNON, "tamar-2sa-13-1", ABS, "jonadab-2sa-13-3"] },
  { id: "amnon-killed", seg: "jer", title: "Amnon killed", interval: { text: "after two full years", ref: "2SA 13:23" }, kjv: ["2SA 13:23", "2SA 13:29"], ops: { die: [AMNON] }, focus: [AMNON, ABS] },
  { id: "geshur", seg: "jer", title: "Absalom in Geshur", interval: { text: "three years", ref: "2SA 13:38" }, kjv: ["2SA 13:38"], ops: { move: { [ABS]: { away: 1 } } }, focus: [ABS, "maacah-2sa-3-3"] },
  { id: "absalom-home", seg: "jer", title: "Back, but not before the king", interval: { text: "two full years", ref: "2SA 14:28" }, kjv: ["2SA 14:28"], ops: { move: { [ABS]: null } }, focus: [ABS, D] },
  { id: "revolt", seg: "jer", title: "Absalom's revolt", interval: { text: "“after forty years” (disputed)", ref: "2SA 15:7", question: "david-absalom-forty" }, ev: ["Absalom's revolt"], kjv: ["2SA 15:10", "2SA 17:25"],
    ops: { rival: ABS, add: [AMASA], link: [[AMASA, ABS, "plot"]], move: { [ABS]: { dy: -34 } } }, focus: [ABS, AMASA] },
  { id: "flight", seg: "jer", title: "Flight over the mount of Olives", ev: ["Flight over the mount of Olives"], ops: { move: { [D]: { dy: 46, dx: -26 } } }, focus: [D] },
  { id: "ephraim", seg: "jer", title: "The wood of Ephraim", ev: ["The wood of Ephraim"], kjv: ["2SA 18:14", "2SA 18:33"], ops: { die: [ABS], rival: null, unlink: [[AMASA, ABS]], move: { [ABS]: null, [D]: null } }, focus: [ABS, JOAB, D] },
  { id: "return", seg: "jer", title: "The return", ev: ["Return, and Judah and Israel quarrel"], kjv: ["2SA 19:13"], ops: {}, focus: [D, AMASA, JOAB] },
  { id: "sheba", seg: "jer", title: "Sheba son of Bichri", ev: ["Sheba son of Bichri"], kjv: ["2SA 20:10"], ops: { die: [AMASA] }, focus: [AMASA, JOAB] },
  { id: "gibeonites", seg: "jer", title: "The Gibeonites", ev: ["Famine and the Gibeonites"], kjv: ["2SA 21:7-9"], ops: { add: [SEVEN], die: [SEVEN] }, focus: [SEVEN, MEPH, "rizpah-2sa-3-7"] },
  { id: "last-words", seg: "jer", title: "Giants, a song, last words", ev: ["Philistine giants", "The song and last words"], ops: {}, focus: [D, ABISHAI] },
  { id: "census", seg: "jer", title: "The census and the altar", ev: ["The census", "Altar on Araunah's threshingfloor"], covers: ["The plague"], ops: { add: ["gad-1sa-22-5"] }, focus: [D, "gad-1sa-22-5", JOAB] },
  { id: "temple", seg: "jer", title: "Preparing for the temple", ev: ["Preparing for the temple"], ops: {}, focus: [D, SOL] },
  { id: "succession", seg: "jer", title: "Adonijah's bid; Solomon anointed", drama: true, ev: ["Adonijah's bid; Solomon anointed"],
    ops: { add: [ZADOK, BENAIAH, ABIATHAR], crown: { israel: SOL, judah: SOL } }, focus: [SOL, ADO, BATH, NATHAN] },
  { id: "death", seg: "jer", year: 40, title: "His charge, and his death", ev: ["Charge and death"], kjv: ["1KI 2:10-11"], ops: { die: [D] }, focus: [D, SOL] },
  // ── After David: the first acts of Solomon's reign close the house's story.
  { id: "adonijah-dies", seg: "after", title: "Adonijah put to death", kjv: ["1KI 2:24-25"], ops: { die: [ADO] }, focus: [ADO, BENAIAH, SOL] },
  { id: "joab-dies", seg: "after", title: "Joab at the altar", kjv: ["1KI 2:28", "1KI 2:34"], ops: { die: [JOAB] }, focus: [JOAB, BENAIAH] },
];

// The succession crisis (1 Kings 1) as a drama on the tree. Played from the state before the "succession" step.
export const DRAMA = [
  { title: "Old and stricken in years", kjv: ["1KI 1:1"], ops: { move: { [D]: { dy: 30, shrink: 1 } } }, focus: [D] },
  { title: "“I will be king”", kjv: ["1KI 1:5"], ops: { rival: ADO, move: { [ADO]: { dy: -48 } } }, focus: [ADO] },
  { title: "Joab and Abiathar follow him", kjv: ["1KI 1:7"], ops: { add: [ABIATHAR], link: [[JOAB, ADO, "plot"], [ABIATHAR, ADO, "plot"]], move: { [JOAB]: { toward: ADO, f: 0.55 }, [ABIATHAR]: { toward: ADO, f: 0.7 } } }, focus: [ADO, JOAB, ABIATHAR] },
  { title: "Not with Adonijah", kjv: ["1KI 1:8", "1KI 1:10"], ops: { add: [ZADOK, BENAIAH], link: [[ZADOK, SOL, "loyal"], [BENAIAH, SOL, "loyal"], [NATHAN, SOL, "loyal"]] }, focus: [ZADOK, BENAIAH, NATHAN, SOL] },
  { title: "Nathan goes to Bath-sheba", kjv: ["1KI 1:11-13"], ops: { move: { [NATHAN]: { toward: BATH, f: 0.8 } } }, focus: [NATHAN, BATH] },
  { title: "Bath-sheba goes in to the king", kjv: ["1KI 1:15-18", "1KI 1:22-24"], ops: { move: { [BATH]: { toward: D, f: 0.62 }, [NATHAN]: { toward: D, f: 0.55 } } }, focus: [BATH, NATHAN, D] },
  { title: "The king's oath", kjv: ["1KI 1:29-30"], ops: {}, focus: [D, BATH] },
  { title: "“God save king Solomon”", kjv: ["1KI 1:38-39"], ops: { crown: { israel: SOL, judah: SOL }, move: { [SOL]: { dy: -40 }, [ZADOK]: { toward: SOL, f: 0.6 }, [NATHAN]: { toward: SOL, f: 0.6 }, [BATH]: null } }, focus: [SOL, ZADOK, NATHAN, BENAIAH] },
  { title: "Every man his way", kjv: ["1KI 1:49-50"], ops: { rival: null, unlink: [[JOAB, ADO], [ABIATHAR, ADO]], move: { [ADO]: { away: 1 }, [JOAB]: null, [ABIATHAR]: null } }, focus: [ADO, JOAB, ABIATHAR] },
];

// The two lists of David's sons. Samuel is the default; Chronicles relabels and adds the names it alone gives.
export const CHRONICLES = {
  samuelLabels: { "eliphelet-2sa-5-16": "Eliphalet", [BATH]: "Bath-sheba", "shimeah-1sa-16-9": "Shimeah" },
  labels: { "chileab-2sa-3-3": "Daniel", "shammua-2sa-5-14": "Shimea", [BATH]: "Bath-shua", "elishua-2sa-5-15": "Elishama", "elpelet-1ch-3-6": "Eliphelet", "shimeah-1sa-16-9": "Shimma", "nethanel-1ch-2-14": "Nethaneel" },
  chroniclesOnly: ["elpelet-1ch-3-6", "nogah-1ch-3-7", "nethanel-1ch-2-14", "raddai-1ch-2-14", "ozem-1ch-2-15"],
  verses: [{ list: "samuel", ref: "1SA 17:12" }, { list: "samuel", ref: "2SA 3:2-5" }, { list: "samuel", ref: "2SA 5:14-16" },
    { list: "chronicles", ref: "1CH 2:13-15" }, { list: "chronicles", ref: "1CH 3:1-9" }],
};
