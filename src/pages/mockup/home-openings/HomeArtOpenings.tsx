// MOCK-UP: three openings on /home_mockup4 with newly drawn art (owner, 2026-10-30: "Something new for the artworks").
// A and B are the scroll whose sheets are the hills, carrying verses of praise in Hebrew, Greek and English, under a sun
// drawn as a glory with a white cross, right of the title. A runs edge to edge; B is the same scroll at the same size,
// stopping at the page's margins, with six doorways left of it. Neither has the marquee. C, Manuscript, is a sun pieced together from torn leaves,
// with the gold marquee under it. The open Word and the sixty-six rays were taken out (owner, 2026-10-30).
import { ArrowUpRight } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { CollectionArtwork } from "@/components/home/HomeArtwork";
import { GoldMarquee, OpeningCopy, type OpeningProps } from "./HomeOpenings";
import "./home-art-openings.css";

export const ART_OPENINGS = [
  { id: "a", name: "Scroll A" },
  { id: "b", name: "Scroll B" },
  { id: "c", name: "Manuscript" },
] as const;
export type ArtOpeningId = (typeof ART_OPENINGS)[number]["id"];

/** The same numbers on every render, so the drawings never change between visits. */
const seeded = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const fixed = (value: number) => value.toFixed(1);
/** A contour of the land; the sheet's writing runs along it, so the lines of the scroll are the lines of the hills. */
const contour = (x: number, base: number, phase: number) => base + Math.sin(x / 270 + phase) * 30 + Math.sin(x / 96 + phase * 2.3) * 7;
const trace = (base: number, phase: number, length: number) => {
  const points: string[] = [];
  for (let x = 0; x < length; x += 20) points.push(`${x} ${fixed(contour(x, base, phase))}`);
  points.push(`${length} ${fixed(contour(length, base, phase))}`);
  return `M${points.join("L")}`;
};
/** The scroll's height in drawing units; the sheets fill the lower half. */
const HEIGHT = 560;
/** The verses that give God the most glory, from the site's own texts: the Hebrew (WLC, unpointed, as on the old scrolls),
 *  the Greek (Textus Receptus, in capitals without accents, as in the old codices) and the Berean Standard Bible (its
 *  quotation marks left off). Each line runs several verses, and no verse appears twice in a language (owner, 2026-10-30:
 *  "none of these lines are repeats"; "pick all the best verses which give the most glory to God"). */
// Hebrew: ISA 6:3, 1CH 29:11, PSA 145:3, EXO 15:11, PSA 8:2 | PSA 148:13, PSA 72:19, PSA 57:12, PSA 113:4, DEU 10:17, PSA 86:10 | PSA 150:6, NEH 9:6, PSA 115:1, JER 10:6, PSA 29:2.
// Greek: REV 4:11, 1TI 1:17, ROM 11:36 | REV 5:12, REV 5:13 | REV 7:12, JUD 1:25, ROM 11:33 | REV 15:3, REV 15:4.
// English: REV 4:11, ISA 6:3, 1TI 1:17, ROM 11:36 | 1CH 29:11, REV 5:12, PSA 145:3 | REV 5:13, EXO 15:11, JUD 1:25 | PSA 8:1, REV 7:12, ROM 11:33, REV 15:3.
const VERSES = {
  he: [
    ["וקרא זה אל־זה ואמר קדוש קדוש קדוש יהוה צבאות מלא כל־הארץ כבודו׃", "לך יהוה הגדלה והגבורה והתפארת והנצח וההוד כי־כל בשמים ובארץ לך יהוה הממלכה והמתנשא לכל לראש׃", "גדול יהוה ומהלל מאד ולגדלתו אין חקר׃", "מי־כמכה באלם יהוה מי כמכה נאדר בקדש נורא תהלת עשה פלא׃", "יהוה אדנינו מה־אדיר שמך בכל־הארץ אשר תנה הודך על־השמים׃"],
    ["יהללו את־שם יהוה כי־נשגב שמו לבדו הודו על־ארץ ושמים׃", "וברוך שם כבודו לעולם וימלא כבודו את־כל הארץ אמן ואמן׃", "רומה על־שמים אלהים על כל־הארץ כבודך׃", "רם על־כל־גוים יהוה על השמים כבודו׃", "כי יהוה אלהיכם הוא אלהי האלהים ואדני האדנים האל הגדל הגבר והנורא אשר לא־ישא פנים ולא יקח שחד׃", "כי־גדול אתה ועשה נפלאות אתה אלהים לבדך׃"],
    ["כל הנשמה תהלל יה הללו־יה׃", "אתה־הוא יהוה לבדך את עשית את־השמים שמי השמים וכל־צבאם הארץ וכל־אשר עליה הימים וכל־אשר בהם ואתה מחיה את־כלם וצבא השמים לך משתחוים׃", "לא לנו יהוה לא לנו כי־לשמך תן כבוד על־חסדך על־אמתך׃", "מאין כמוך יהוה גדול אתה וגדול שמך בגבורה׃", "הבו ליהוה כבוד שמו השתחוו ליהוה בהדרת־קדש׃"],
  ],
  grc: [
    ["ΑΞΙΟΣ ΕΙ ΚΥΡΙΕ ΛΑΒΕΙΝ ΤΗΝ ΔΟΞΑΝ ΚΑΙ ΤΗΝ ΤΙΜΗΝ ΚΑΙ ΤΗΝ ΔΥΝΑΜΙΝ ΟΤΙ ΣΥ ΕΚΤΙΣΑΣ ΤΑ ΠΑΝΤΑ ΚΑΙ ΔΙΑ ΤΟ ΘΕΛΗΜΑ ΣΟΥ ΕΙΣΙ ΚΑΙ ΕΚΤΙΣΘΗΣΑΝ", "ΤΩ ΔΕ ΒΑΣΙΛΕΙ ΤΩΝ ΑΙΩΝΩΝ ΑΦΘΑΡΤΩ ΑΟΡΑΤΩ ΜΟΝΩ ΣΟΦΩ ΘΕΩ ΤΙΜΗ ΚΑΙ ΔΟΞΑ ΕΙΣ ΤΟΥΣ ΑΙΩΝΑΣ ΤΩΝ ΑΙΩΝΩΝ ΑΜΗΝ", "ΟΤΙ ΕΞ ΑΥΤΟΥ ΚΑΙ ΔΙ᾿ ΑΥΤΟΥ ΚΑΙ ΕΙΣ ΑΥΤΟΝ ΤΑ ΠΑΝΤΑ ΑΥΤΩ Η ΔΟΞΑ ΕΙΣ ΤΟΥΣ ΑΙΩΝΑΣ ΑΜΗΝ"],
    ["ΛΕΓΟΝΤΕΣ ΦΩΝΗ ΜΕΓΑΛΗ ΑΞΙΟΝ ΕΣΤΙ ΤΟ ΑΡΝΙΟΝ ΤΟ ΕΣΦΑΓΜΕΝΟΝ ΛΑΒΕΙΝ ΤΗΝ ΔΥΝΑΜΙΝ ΚΑΙ ΠΛΟΥΤΟΝ ΚΑΙ ΣΟΦΙΑΝ ΚΑΙ ΙΣΧΥΝ ΚΑΙ ΤΙΜΗΝ ΚΑΙ ΔΟΞΑΝ ΚΑΙ ΕΥΛΟΓΙΑΝ", "ΚΑΙ ΠΑΝ ΚΤΙΣΜΑ Ο ΕΣΤΙΝ ΕΝ ΤΩ ΟΥΡΑΝΩ ΚΑΙ ΕΝ ΤΗ ΓΗ ΚΑΙ ΥΠΟΚΑΤΩ ΤΗΣ ΓΗΣ ΚΑΙ ΕΠΙ ΤΗΣ ΘΑΛΑΣΣΗΣ Α ΕΣΤΙ ΚΑΙ ΤΑ ΕΝ ΑΥΤΟΙΣ ΠΑΝΤΑ ΗΚΟΥΣΑ ΛΕΓΟΝΤΑΣ ΤΩ ΚΑΘΗΜΕΝΩ ΕΠΙ ΤΟΥ ΘΡΟΝΟΥ ΚΑΙ ΤΩ ΑΡΝΙΩ Η ΕΥΛΟΓΙΑ ΚΑΙ Η ΤΙΜΗ ΚΑΙ Η ΔΟΞΑ ΚΑΙ ΤΟ ΚΡΑΤΟΣ ΕΙΣ ΤΟΥΣ ΑΙΩΝΑΣ ΤΩΝ ΑΙΩΝΩΝ"],
    ["ΛΕΓΟΝΤΕΣ ΑΜΗΝ Η ΕΥΛΟΓΙΑ ΚΑΙ Η ΔΟΞΑ ΚΑΙ Η ΣΟΦΙΑ ΚΑΙ Η ΕΥΧΑΡΙΣΤΙΑ ΚΑΙ Η ΤΙΜΗ ΚΑΙ Η ΔΥΝΑΜΙΣ ΚΑΙ Η ΙΣΧΥΣ ΤΩ ΘΕΩ ΗΜΩΝ ΕΙΣ ΤΟΥΣ ΑΙΩΝΑΣ ΤΩΝ ΑΙΩΝΩΝ ΑΜΗΝ", "ΜΟΝΩ ΣΟΦΩ ΘΕΩ ΣΩΤΗΡΙ ΗΜΩΝ ΔΟΞΑ ΚΑΙ ΜΕΓΑΛΩΣΥΝΗ ΚΡΑΤΟΣ ΚΑΙ ΕΞΟΥΣΙΑ ΚΑΙ ΝΥΝ ΚΑΙ ΕΙΣ ΠΑΝΤΑΣ ΤΟΥΣ ΑΙΩΝΑΣ ΑΜΗΝ", "Ω ΒΑΘΟΣ ΠΛΟΥΤΟΥ ΚΑΙ ΣΟΦΙΑΣ ΚΑΙ ΓΝΩΣΕΩΣ ΘΕΟΥ ΩΣ ΑΝΕΞΕΡΕΥΝΗΤΑ ΤΑ ΚΡΙΜΑΤΑ ΑΥΤΟΥ ΚΑΙ ΑΝΕΞΙΧΝΙΑΣΤΟΙ ΑΙ ΟΔΟΙ ΑΥΤΟΥ"],
    ["ΚΑΙ ΑΔΟΥΣΙ ΤΗΝ ΩΔΗΝ ΜΩΣΕΩΣ ΔΟΥΛΟΥ ΤΟΥ ΘΕΟΥ ΚΑΙ ΤΗΝ ΩΔΗΝ ΤΟΥ ΑΡΝΙΟΥ ΛΕΓΟΝΤΕΣ ΜΕΓΑΛΑ ΚΑΙ ΘΑΥΜΑΣΤΑ ΤΑ ΕΡΓΑ ΣΟΥ ΚΥΡΙΕ Ο ΘΕΟΣ Ο ΠΑΝΤΟΚΡΑΤΩΡ ΔΙΚΑΙΑΙ ΚΑΙ ΑΛΗΘΙΝΑΙ ΑΙ ΟΔΟΙ ΣΟΥ Ο ΒΑΣΙΛΕΥΣ ΤΩΝ ΑΓΙΩΝ", "ΤΙΣ ΟΥ ΜΗ ΦΟΒΗΘΗ ΣΕ ΚΥΡΙΕ ΚΑΙ ΔΟΞΑΣΗ ΤΟ ΟΝΟΜΑ ΣΟΥ ΟΤΙ ΜΟΝΟΣ ΟΣΙΟΣ ΟΤΙ ΠΑΝΤΑ ΤΑ ΕΘΝΗ ΗΞΟΥΣΙ ΚΑΙ ΠΡΟΣΚΥΝΗΣΟΥΣΙΝ ΕΝΩΠΙΟΝ ΣΟΥ ΟΤΙ ΤΑ ΔΙΚΑΙΩΜΑΤΑ ΣΟΥ ΕΦΑΝΕΡΩΘΗΣΑΝ"],
  ],
  en: [
    ["Worthy are You, our Lord and God, to receive glory and honor and power, for You created all things; by Your will they exist and came to be.", "And they were calling out to one another: Holy, holy, holy is the LORD of Hosts; all the earth is full of His glory.", "Now to the King eternal, immortal, and invisible, the only God, be honor and glory forever and ever. Amen.", "For from Him and through Him and to Him are all things. To Him be the glory forever! Amen."],
    ["Yours, O LORD, is the greatness and the power and the glory and the splendor and the majesty, for everything in heaven and on earth belongs to You. Yours, O LORD, is the kingdom, and You are exalted as head over all.", "In a loud voice they were saying: Worthy is the Lamb, who was slain, to receive power and riches and wisdom and strength and honor and glory and blessing!", "Great is the LORD and greatly to be praised; His greatness is unsearchable."],
    ["And I heard every creature in heaven and on earth and under the earth and in the sea, and all that is in them, saying: To Him who sits on the throne and to the Lamb be praise and honor and glory and power forever and ever!", "Who among the gods is like You, O LORD? Who is like You—majestic in holiness, revered with praises, performing wonders?", "to the only God our Savior be glory, majesty, dominion, and authority through Jesus Christ our Lord before all time, and now, and for all eternity. Amen."],
    ["O LORD, our Lord, how majestic is Your name in all the earth! You have set Your glory above the heavens.", "saying, Amen! Blessing and glory and wisdom and thanks and honor and power and strength be to our God forever and ever! Amen.", "O, the depth of the riches of the wisdom and knowledge of God! How unsearchable are His judgments, and untraceable His ways!", "and they sang the song of God’s servant Moses and of the Lamb: Great and wonderful are Your works, O Lord God Almighty! Just and true are Your ways, O King of the nations!"],
  ],
};
const SEPARATOR = { he: "   ", grc: "  ·  ", en: "  ·  " } as const;
const INSCRIPTIONS = Object.fromEntries(Object.entries(VERSES).map(([script, lines]) =>
  [script, lines.map((verses) => verses.join(SEPARATOR[script as keyof typeof SEPARATOR]))])) as Record<keyof typeof VERSES, string[]>;
/** Each sheet: two dotted lines under its edge, then its inscription below them, a verse to a line (owner, 2026-10-30). The
 *  sheets keep their first-drawn places; only the writing changed, so the lines sit close (owner: "I did not ask you to change
 *  anything about the scrolls. Except for the words in them"). */
const SHEETS = [
  { name: "far", base: 340, phase: 0.6, dots: [14, 27], words: [54, 76, 98], script: "he" as const },
  { name: "mid", base: 402, phase: 2.4, dots: [14, 27], words: [50, 66, 82, 98], script: "grc" as const },
  { name: "near", base: 470, phase: 4.1, dots: [14, 27], words: [54, 74, 94, 114], script: "en" as const },
];
const LINE_STARTS = [24, 90, 50, 130];
const drawSheets = (length: number) => SHEETS.map((sheet) => ({
  ...sheet,
  edge: trace(sheet.base, sheet.phase, length),
  dotted: sheet.dots.map((line) => trace(sheet.base + line, sheet.phase, length)),
  writing: sheet.words.map((line) => trace(sheet.base + line, sheet.phase, length)),
}));

/** Where each roll's top sits, in drawing units. */
const ROLL_TOP = 296;
/** The turned handle's outline, top down: [height above the roll, half its width]. A groove is drawn at each step. */
const HANDLE: [number, number][] = [[78, 0], [77, 2.6], [75, 4.4], [72, 5.2], [69, 4.4], [67, 2.8], [65, 2.8], [63, 4], [60, 6.2], [56, 8.6], [51, 9.8], [46, 9.6], [41, 8], [37, 5.4], [34, 4], [31, 4], [30, 7], [27, 7], [26, 4], [15, 4]];
const HANDLE_GROOVES = [65, 63, 34, 30, 27];
const frontArc = (cx: number, y: number, half: number) => `M${fixed(cx - half)} ${fixed(y)}A${fixed(half)} ${fixed(half * 0.3)} 0 0 0 ${fixed(cx + half)} ${fixed(y)}`;

/** One end of the scroll, in the same flat line art as the hills: roundness comes only from lines. The wound sheet shows as a
 *  spiral on top, its writing curves round the roll, hatching darkens the side away from the sun, and the handle is turned wood. */
function Roller({ cx, inward }: { cx: number; inward: 1 | -1 }) {
  const top = ROLL_TOP, bottom = HEIGHT, half = 20, wrap = cx + inward * (half + 3);
  // The handle's outline at `y`, running up (-1) from the top of the roll or down (1) from its foot.
  const handle = (y: number, way: 1 | -1) => `M${[...HANDLE.map(([up, width]) => `${fixed(cx - width)} ${y + way * up}`), ...[...HANDLE].reverse().map(([up, width]) => `${fixed(cx + width)} ${y + way * up}`)].join("L")}Z`;
  const grooves = (y: number, way: 1 | -1) => HANDLE_GROOVES.map((up) => frontArc(cx, y + way * up, HANDLE.find(([height]) => height === up)?.[1] ?? 4)).join("");
  const spiral = Array.from({ length: 97 }, (_, step) => { const turn = (step / 96) * Math.PI * 8, radius = 2.5 + (16.5 * step) / 96; return `${fixed(cx + Math.cos(turn) * radius)} ${fixed(top + Math.sin(turn) * radius * 0.3)}`; });
  const hatch = [0.4, 0.6, 0.74, 0.84, 0.91, 0.96].map((across) => { const x = cx - inward * half * across; return `M${fixed(x)} ${fixed(top + 6 * Math.sqrt(1 - across * across))}V${bottom}`; });
  const bulbHatch = [0.5, 0.78].map((across) => `M${fixed(cx - inward * 8.6 * across)} ${top - 57}Q${fixed(cx - inward * 9.8 * across * 1.02)} ${top - 49} ${fixed(cx - inward * 8 * across)} ${top - 41}`);
  return <g className="hm4-roller">
    {/* The foot: the same turned handle, pointing down below the roll, under its collar (owner, 2026-10-31). */}
    <path className="hm4-roll-fill" d={handle(bottom, 1)} />
    <path className="hm4-roll-line" d={grooves(bottom, 1)} />
    <rect className="hm4-roll-fill" x={cx - 4} y={bottom} width="8" height="12" />
    <path className="hm4-roll-fill" d={`M${cx - 23} ${bottom + 10}V${bottom + 15}A23 5 0 0 0 ${cx + 23} ${bottom + 15}V${bottom + 10}Z`} />
    <ellipse className="hm4-roll-cap" cx={cx} cy={bottom + 10} rx="23" ry="5" />
    <path className="hm4-roll-line" d={`M${wrap} ${fixed(contour(wrap, SHEETS[0].base, SHEETS[0].phase))}V${bottom}`} />
    <path className="hm4-roll-fill" d={`M${cx - half} ${top}V${bottom}A${half} 6 0 0 0 ${cx + half} ${bottom}V${top}Z`} />
    {Array.from({ length: 16 }, (_, row) => <path className="hm4-roll-writing" d={frontArc(cx, top + 22 + row * 16, half - 3)} key={row} />)}
    <path className="hm4-roll-hatch" d={hatch.join("")} />
    <ellipse className="hm4-roll-cap" cx={cx} cy={top} rx={half} ry="6" />
    <path className="hm4-roll-line" d={`M${spiral.join("L")}`} />
    <rect className="hm4-roll-fill" x={cx - 4} y={top - 10} width="8" height="10" />
    <path className="hm4-roll-fill" d={`M${cx - 23} ${top - 15}V${top - 10}A23 5 0 0 0 ${cx + 23} ${top - 10}V${top - 15}Z`} />
    <ellipse className="hm4-roll-cap" cx={cx} cy={top - 15} rx="23" ry="5" />
    <ellipse className="hm4-roll-line" cx={cx} cy={top - 15} rx="12" ry="3" />
    <path className="hm4-roll-fill" d={handle(top, -1)} />
    <path className="hm4-roll-line" d={grooves(top, -1)} />
    <path className="hm4-roll-hatch" d={bulbHatch.join("")} />
  </g>;
}

const SUN_Y = 262, RINGS = [104, 132, 162, 196, 234];
/** The angle of ray number `ray` of `count`, starting straight up. */
const rayTurn = (ray: number, count: number) => (ray / count) * Math.PI * 2 - Math.PI / 2;
/** One slender ray: a wedge `half` wide at `inner`, coming to a point at `outer`. */
const wedge = (x: number, y: number, turn: number, inner: number, outer: number, half: number) => {
  const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
  return `M${fixed(x + cos * inner - sin * half)} ${fixed(y + sin * inner + cos * half)}L${fixed(x + cos * outer)} ${fixed(y + sin * outer)}L${fixed(x + cos * inner + sin * half)} ${fixed(y + sin * inner - cos * half)}Z`;
};

/** The scroll's sun: the rings and the rays together as a glory, the sunburst of a monstrance (owner, 2026-10-31: "merge
 *  both ray types into something MAGNIFICENT"; first tried as A3, then made Scroll A and B's sun). The turning dashed rings lie
 *  behind; over them, solid straight rays long and short in turn, rising from the fine halo line just outside the sun, with a
 *  wavy flame between each pair that slowly glints, and a point of light beyond each longest ray. No ring of beads (owner:
 *  "I'm not sure that the dotted line should be there"). Nothing reaches past the outer ring, which the sun's placing uses. */
const HALO = 88;
const GLORY_LENGTHS = [226, 168, 204, 168];
const flame = (x: number, y: number, turn: number) => {
  const [cos, sin] = [Math.cos(turn), Math.sin(turn)], points: string[] = [];
  for (let radius = 106; radius <= 192; radius += 2) {
    const along = (radius - 106) / 86, sway = Math.sin(along * Math.PI * 5) * 5.5 * (1 - along * 0.85);
    points.push(`${fixed(x + cos * radius - sin * sway)} ${fixed(y + sin * radius + cos * sway)}`);
  }
  return `M${points.join("L")}`;
};
function Glory({ x, y }: { x: number; y: number }) {
  const turns = Array.from({ length: 24 }, (_, ray) => rayTurn(ray, 24));
  return <g className="hm4-glory">
    {RINGS.map((radius, ring) => <circle className={`hm4-scroll-ring hm4-scroll-ring-${ring % 2}`} cx={x} cy={y} r={radius} style={{ opacity: 0.42 - ring * 0.06, transformOrigin: `${x}px ${y}px` }} key={radius} />)}
    {turns.map((turn, ray) => <path className="hm4-glory-flame" d={flame(x, y, turn + Math.PI / 24)} style={{ animationDelay: `${(ray % 6) * -0.9}s` }} key={ray} />)}
    <path className="hm4-glory-ray" d={turns.map((turn, ray) => wedge(x, y, turn, HALO, GLORY_LENGTHS[ray % 4], ray % 2 ? 4 : 6)).join("")} />
    {turns.filter((_, ray) => ray % 4 === 0).map((turn) => <circle className="hm4-glory-tip" cx={fixed(x + Math.cos(turn) * 234)} cy={fixed(y + Math.sin(turn) * 234)} r="3.2" key={turn} />)}
    <circle className="hm4-glory-halo" cx={x} cy={y} r={HALO} />
  </g>;
}
/** Screen pixels kept between the sun's outer ring and the title or the copy under it. */
const RING_GAP = 28;
/** Where the sun sits, in drawing units: its outer ring on the header's right margin, moved back right only as far as it must
 *  to clear the title and the copy (owner, 2026-10-30: "put it to the left so it can be within the header margins as much as
 *  possible without touching the title"). Never further right than it was first drawn. */
/** The boxes of the opening's words themselves, not their full-width blocks, and Scroll B's doorways under them. */
const copyWords = (wrap: HTMLElement) => [...(wrap.querySelector(".home-hero-copy")?.children ?? [])]
  .map((child) => { const range = document.createRange(); range.selectNodeContents(child); return range.getBoundingClientRect(); })
  .concat([...wrap.querySelectorAll(".hm4-doors")].map((doors) => doors.getBoundingClientRect())).filter((box) => box.width);
function placeSun(svg: SVGSVGElement, length: number, scale: number, drawnLeft: number, drawnTop: number) {
  const first = length - 300;
  const wrap = svg.parentElement?.querySelector<HTMLElement>(".home-wrap");
  if (!wrap) return first;
  const wrapBox = wrap.getBoundingClientRect();
  const marginRight = wrapBox.right - parseFloat(getComputedStyle(wrap).paddingRight);
  const words = copyWords(wrap);
  const radius = (RINGS[RINGS.length - 1] + 1) * scale, middleY = drawnTop + SUN_Y * scale;
  const clears = (x: number) => words.every((box) => Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - middleY, 0, middleY - box.bottom)) >= radius + RING_GAP);
  let x = marginRight - radius;
  const furthest = drawnLeft + first * scale;
  while (!clears(x) && x < furthest) x += 4;
  return Math.min(first, (x - drawnLeft) / scale);
}

/** The scroll's full length in drawing units. Scroll A shows all of it from one side of the screen to the other, cropped
 *  from the left on narrow screens. */
const LENGTH = 1600;
const SHEETS_DRAWN = drawSheets(LENGTH);
/** Screen pixels kept between Scroll B's left handle and the words. */
const HANDLE_GAP = 16;
/** How far the rollers' feet hang below the bottom of the drawing, in drawing units. They hang past the first screen, seen
 *  on scrolling down, and the page below starts after them (owner, 2026-10-31). */
const FOOT = 80;

/** "edge" is Scroll A, the whole scroll from one side of the screen to the other. "margins" is Scroll B: the very same
 *  drawing at the very same size and place, only starting and stopping at the page's own margins (where the header and the
 *  text start and stop) with its handles there (owner, 2026-10-31: "I don't see why it has to change at all, except for the
 *  place that it starts and stops"). */
export function ScrollArt({ fit }: { fit: "edge" | "margins" }) {
  const frame = useRef<SVGSVGElement>(null);
  // The part of the drawing shown (from `start`, `length` long) and, for Scroll B, where on the screen it sits.
  const [view, setView] = useState({ start: 0, length: LENGTH, left: 0, width: 0 });
  const [sun, setSun] = useState(1300);
  useLayoutEffect(() => {
    const svg = frame.current, section = svg?.parentElement;
    if (!svg || !section) return;
    const measure = () => {
      const area = section.getBoundingClientRect(), box = svg.getBoundingClientRect();
      if (!box.height) return;
      // Scroll A's fitting, "xMaxYMax slice" across the whole width; Scroll B takes the same scale and the same place.
      const scale = Math.max(area.width / LENGTH, box.height / HEIGHT), drawnLeft = area.right - LENGTH * scale;
      const wrap = section.querySelector<HTMLElement>(".home-wrap");
      if (fit === "margins" && wrap) {
        const wrapBox = wrap.getBoundingClientRect(), style = getComputedStyle(wrap);
        const right = wrapBox.right - parseFloat(style.paddingRight);
        // The left end stands on the page margin, unless its handle would rise into the words above it (short, very wide
        // windows); then it moves right just past them.
        const handleTop = box.bottom - (HEIGHT - ROLL_TOP + HANDLE[0][0]) * scale - HANDLE_GAP;
        const left = Math.max(wrapBox.left + parseFloat(style.paddingLeft), ...copyWords(wrap).filter((word) => word.bottom > handleTop).map((word) => word.right + HANDLE_GAP));
        setView({ start: (left - drawnLeft) / scale, length: (right - left) / scale, left: left - area.left, width: right - left });
      }
      setSun(placeSun(svg, LENGTH, scale, drawnLeft, box.bottom - HEIGHT * scale));
      section.parentElement?.style.setProperty("--hm4-foot", `${Math.ceil(FOOT * scale)}px`);
    };
    measure();
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    return () => { observer.disconnect(); section.parentElement?.style.removeProperty("--hm4-foot"); };
  }, [fit]);
  const { start, length } = view, end = start + length, sunY = SUN_Y;
  return <svg ref={frame} className={`hm4-scroll-art hm4-scroll-${fit}`} style={fit === "margins" ? { left: view.left, width: view.width } : undefined}
    viewBox={`${fixed(start)} 0 ${fixed(length)} ${HEIGHT}`} preserveAspectRatio={fit === "edge" ? "xMaxYMax slice" : "xMinYMax slice"} aria-hidden="true">
    <defs>
      {SHEETS_DRAWN.flatMap((sheet) => sheet.writing.map((d, line) => <path id={`hm4-line-${sheet.name}-${line}`} d={d} key={`${sheet.name}-${line}`} />))}
      <clipPath id={`hm4-between-rollers-${fit}`}><rect x={fixed(start + 22)} y="0" width={fixed(length - 44)} height={HEIGHT} /></clipPath>
      {/* Scroll B's drawing stops at its handles; only its height may run past the frame, as Scroll A's does. */}
      <clipPath id={`hm4-ends-${fit}`}><rect x={fixed(start)} y={-HEIGHT} width={fixed(length)} height={HEIGHT * 3} /></clipPath>
    </defs>
    <g clipPath={`url(#hm4-ends-${fit})`}>
    <Glory x={sun} y={sunY} />
    <circle className="hm4-sun-disc hm4-sun-solid" cx={sun} cy={sunY} r="82" />
    {/* A white cross in the sun, not a dark cut-out; its foot goes a little way down behind the scroll (owner, 2026-10-30/31). */}
    <path className="hm4-sun-cross" d={`M${fixed(sun - 6)} ${sunY - 34}h12v20h20v12h-20v62h-12v-62h-20v-12h20Z`} />
    {SHEETS_DRAWN.map((sheet) => <g className={`hm4-sheet hm4-sheet-${sheet.name}`} key={sheet.name}>
      <path className="hm4-sheet-fill" d={`${sheet.edge}L${LENGTH} ${HEIGHT}L0 ${HEIGHT}Z`} /><path className="hm4-sheet-edge" d={sheet.edge} />
      {sheet.dotted.map((d) => <path className="hm4-sheet-writing" d={d} key={d} />)}
      {sheet.writing.map((d, line) => <text className={`hm4-sheet-script hm4-script-${sheet.script}`} clipPath={`url(#hm4-between-rollers-${fit})`} key={d}><textPath href={`#hm4-line-${sheet.name}-${line}`} startOffset={LINE_STARTS[line]}>{INSCRIPTIONS[sheet.script][line]}</textPath></text>)}
    </g>)}
    <path className="hm4-sheet-edge" d={`M${fixed(start + 22)} ${HEIGHT}H${fixed(end - 22)}`} />
    <Roller cx={start + 22} inward={1} /><Roller cx={end - 22} inward={-1} />
    </g>
  </svg>;
}

/** Rings of torn leaves around one bright centre; a few have not yet reached their place. */
function leafPieces() {
  const pieces: { d: string; ghost: boolean; ring: number; pattern: number; dx: number; dy: number; turn: number }[] = [];
  const rings = [[62, 148, 7], [152, 240, 12], [244, 330, 17]];
  let seed = 11;
  rings.forEach(([inner, outer, count], ring) => count && Array.from({ length: count }).forEach((_, piece) => {
    const step = (Math.PI * 2) / count, start = piece * step + ring * 0.31 + 0.022, end = start + step - 0.044;
    const edge: [number, number][] = [];
    const push = (angle: number, radius: number) => { seed += 1; const torn = radius + (seeded(seed) - 0.5) * 11, sway = angle + (seeded(seed + 500) - 0.5) * 0.018; edge.push([450 + Math.cos(sway) * torn, 400 + Math.sin(sway) * torn]); };
    for (let side = 0; side <= 5; side += 1) push(start + ((end - start) * side) / 5, outer);
    for (let across = 1; across < 3; across += 1) push(end, outer - ((outer - inner) * across) / 3);
    for (let side = 5; side >= 0; side -= 1) push(start + ((end - start) * side) / 5, inner);
    for (let across = 2; across > 0; across -= 1) push(start, outer - ((outer - inner) * across) / 3);
    const middle = (start + end) / 2, drift = 60 + seeded(seed + 900) * 130;
    const ghost = ring === 2 && piece % 5 === 2;
    pieces.push({ d: `M${edge.map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join("L")}Z`, ghost, ring, pattern: piece % 3, dx: Math.cos(middle) * drift, dy: Math.sin(middle) * drift, turn: (seeded(seed + 1300) - 0.5) * 34 });
  }));
  return pieces;
}
const LEAF_PIECES = leafPieces();
const leafStyle = (dx: number, dy: number, turn: number, delay: number) => ({ "--dx": `${fixed(dx)}px`, "--dy": `${fixed(dy)}px`, "--turn": `${fixed(turn)}deg`, animationDelay: `${delay}ms` } as CSSProperties);

function ManyPiecesArt() {
  return <figure className="hm4-pieces">
    <svg viewBox="-20 0 940 800" aria-hidden="true">
      <defs>{[-14, 6, 24].map((tilt, index) => <pattern id={`hm4-leaf-writing-${index}`} width="46" height="11" patternUnits="userSpaceOnUse" patternTransform={`rotate(${tilt})`} key={tilt}><path className="hm4-leaf-line" d="M1 5h15M20 5h7M31 5h13" /></pattern>)}</defs>
      <circle className="hm4-sun-disc hm4-sun-solid" cx="450" cy="400" r="54" />
      {LEAF_PIECES.map((piece, index) => {
        const leaf = <><path className={`hm4-leaf hm4-leaf-ring-${piece.ring}`} d={piece.d} /><path fill={`url(#hm4-leaf-writing-${piece.pattern})`} d={piece.d} /></>;
        if (!piece.ghost) return <g className="hm4-leaf-settle" style={leafStyle(piece.dx, piece.dy, piece.turn, index * 40)} key={piece.d}>{leaf}</g>;
        return <g key={piece.d}><path className="hm4-leaf-place" d={piece.d} /><g style={{ transform: `translate(${fixed(piece.dx * 0.22)}px, ${fixed(piece.dy * 0.22)}px) rotate(${fixed(piece.turn * 0.4)}deg)`, transformOrigin: "450px 400px" }}>{leaf}</g></g>;
      })}
    </svg>
    <figcaption>Many pieces. One Word.</figcaption>
  </figure>;
}

function ScrollEdgeOpening(props: OpeningProps) {
  return <section className="hm4-b" aria-labelledby="home-title"><ScrollArt fit="edge" /><div className="home-wrap"><OpeningCopy {...props} /></div></section>;
}

/** A page of text whose notes each lead to the book they come from. */
function SourcesArtwork() {
  return <svg viewBox="0 0 480 185" fill="none" aria-hidden="true">
    <path d="M130 30H232L260 58V158H130Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" /><path d="M232 30V58H260" stroke="currentColor" opacity=".5" />
    {[70, 84, 98, 112, 126, 140].map((y) => <path d={`M146 ${y}H${y === 140 ? 206 : 240}`} stroke="currentColor" opacity=".45" key={y} />)}
    {([[70, 42], [98, 94], [126, 146]] as const).map(([from, to], note) => <g key={to}>
      <circle cx="249" cy={from} r="3" fill="currentColor" /><path d={`M253 ${from}Q296 ${from} 330 ${to}`} stroke="currentColor" strokeDasharray="2 4" opacity=".6" />
      <rect x="330" y={to - 12} width="72" height="24" rx="3" fill="var(--surface)" stroke="currentColor" /><text x="342" y={to + 4} fontSize="11" fill="currentColor">{note + 1}</text><path d={`M356 ${to}H390`} stroke="currentColor" opacity=".5" />
    </g>)}
    <text x="240" y="180" fontSize="9" letterSpacing="1.5" fill="currentColor" textAnchor="middle">CITED · CHECKED</text>
  </svg>;
}
/** Scroll B's six doorways, three rows of two: the five collections and the sources (owner, 2026-10-31). */
const DOORS = [
  { title: "Bible", to: "/bible", subtitle: "Read & compare", color: "epistles" },
  { title: "Study", to: "/study", subtitle: "See the connections", color: "gospels" },
  { title: "Apologetics", to: "/apologetics", subtitle: "Explore the questions", color: "history" },
  { title: "Atlas", to: "/study/atlas", subtitle: "Enter the world", color: "poetry" },
  { title: "Resources", to: "/resources", subtitle: "Study, gather, find help", color: "resource-life" },
  { title: "Sources", to: "/sources", subtitle: "Follow every reference", color: "prophets" },
] as const;
function Doorways() {
  return <nav id="explore" className="hm4-doors" aria-label="Explore the collections">{DOORS.map((door) => <Link to={door.to} key={door.title} style={{ "--home-color": `var(--${door.color})` } as CSSProperties}>
    <div className="home-doorway-art">{door.title === "Sources" ? <SourcesArtwork /> : <CollectionArtwork kind={door.title} />}</div>
    <div className="home-doorway-copy"><span><strong>{door.title}</strong><small>{door.subtitle}</small></span><ArrowUpRight size={16} aria-hidden /></div>
  </Link>)}</nav>;
}

function ScrollMarginsOpening(props: OpeningProps) {
  return <section className="hm4-b hm4-b-margins" aria-labelledby="home-title"><ScrollArt fit="margins" /><div className="home-wrap"><OpeningCopy {...props} /><Doorways /></div></section>;
}

function ManuscriptOpening(props: OpeningProps) {
  return <section className="home-hero home-wrap hm4-row hm4-row-flip" aria-labelledby="home-title"><ManyPiecesArt /><OpeningCopy {...props} /></section>;
}

const VIEWS: Record<ArtOpeningId, (props: OpeningProps) => JSX.Element> = { a: ScrollEdgeOpening, b: ScrollMarginsOpening, c: ManuscriptOpening };

export function ArtOpening({ version, ...props }: OpeningProps & { version: ArtOpeningId }) {
  const View = VIEWS[version];
  // Only the manuscript keeps the marquee; both scrolls stand alone (owner, 2026-10-30/31).
  return <><View {...props} />{version === "c" && <GoldMarquee />}</>;
}
