// MOCK-UP: three openings on /home_mockup4 with newly drawn art (owner, 2026-10-30: "Something new for the artworks").
// A and B are the scroll whose sheets are the hills, carrying verses of praise in Hebrew, Greek and English: A runs edge to
// edge under the marquee, A2 is A with a rayed sun and a gray cross, B is framed. The sun, with a cross in it, sits right of
// the title. C, Manuscript, is a sun pieced together from
// torn leaves, with the gold marquee under it. The open Word and the sixty-six rays were taken out (owner, 2026-10-30).
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { GoldMarquee, OpeningCopy, type OpeningProps } from "./HomeOpenings";
import "./home-art-openings.css";

export const ART_OPENINGS = [
  { id: "a", name: "Scroll A" },
  { id: "a2", name: "Scroll A2" },
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

/** The turned handle's outline, top down: [height above the roll, half its width]. A groove is drawn at each step. */
const HANDLE: [number, number][] = [[78, 0], [77, 2.6], [75, 4.4], [72, 5.2], [69, 4.4], [67, 2.8], [65, 2.8], [63, 4], [60, 6.2], [56, 8.6], [51, 9.8], [46, 9.6], [41, 8], [37, 5.4], [34, 4], [31, 4], [30, 7], [27, 7], [26, 4], [15, 4]];
const HANDLE_GROOVES = [65, 63, 34, 30, 27];
const frontArc = (cx: number, y: number, half: number) => `M${fixed(cx - half)} ${fixed(y)}A${fixed(half)} ${fixed(half * 0.3)} 0 0 0 ${fixed(cx + half)} ${fixed(y)}`;

/** One end of the scroll, in the same flat line art as the hills: roundness comes only from lines. The wound sheet shows as a
 *  spiral on top, its writing curves round the roll, hatching darkens the side away from the sun, and the handle is turned wood. */
function Roller({ cx, inward }: { cx: number; inward: 1 | -1 }) {
  const top = 296, bottom = HEIGHT, half = 20, wrap = cx + inward * (half + 3);
  const outline = [...HANDLE.map(([up, width]) => `${fixed(cx - width)} ${top - up}`), ...[...HANDLE].reverse().map(([up, width]) => `${fixed(cx + width)} ${top - up}`)];
  const spiral = Array.from({ length: 97 }, (_, step) => { const turn = (step / 96) * Math.PI * 8, radius = 2.5 + (16.5 * step) / 96; return `${fixed(cx + Math.cos(turn) * radius)} ${fixed(top + Math.sin(turn) * radius * 0.3)}`; });
  const hatch = [0.4, 0.6, 0.74, 0.84, 0.91, 0.96].map((across) => { const x = cx - inward * half * across; return `M${fixed(x)} ${fixed(top + 6 * Math.sqrt(1 - across * across))}V${bottom}`; });
  const bulbHatch = [0.5, 0.78].map((across) => `M${fixed(cx - inward * 8.6 * across)} ${top - 57}Q${fixed(cx - inward * 9.8 * across * 1.02)} ${top - 49} ${fixed(cx - inward * 8 * across)} ${top - 41}`);
  return <g className="hm4-roller">
    <path className="hm4-roll-line" d={`M${wrap} ${fixed(contour(wrap, SHEETS[0].base, SHEETS[0].phase))}V${bottom}`} />
    <path className="hm4-roll-fill" d={`M${cx - half} ${top}V${bottom}H${cx + half}V${top}Z`} />
    {Array.from({ length: 16 }, (_, row) => <path className="hm4-roll-writing" d={frontArc(cx, top + 22 + row * 16, half - 3)} key={row} />)}
    <path className="hm4-roll-hatch" d={hatch.join("")} />
    <ellipse className="hm4-roll-cap" cx={cx} cy={top} rx={half} ry="6" />
    <path className="hm4-roll-line" d={`M${spiral.join("L")}`} />
    <rect className="hm4-roll-fill" x={cx - 4} y={top - 10} width="8" height="10" />
    <path className="hm4-roll-fill" d={`M${cx - 23} ${top - 15}V${top - 10}A23 5 0 0 0 ${cx + 23} ${top - 10}V${top - 15}Z`} />
    <ellipse className="hm4-roll-cap" cx={cx} cy={top - 15} rx="23" ry="5" />
    <ellipse className="hm4-roll-line" cx={cx} cy={top - 15} rx="12" ry="3" />
    <path className="hm4-roll-fill" d={`M${outline.join("L")}Z`} />
    <path className="hm4-roll-line" d={HANDLE_GROOVES.map((up) => frontArc(cx, top - up, HANDLE.find(([height]) => height === up)?.[1] ?? 4)).join("")} />
    <path className="hm4-roll-hatch" d={bulbHatch.join("")} />
  </g>;
}

const SUN_Y = 262, RINGS = [104, 132, 162, 196, 234];
/** Scroll A2's sun: slender tapering rays in place of the rings, long and short in turn (owner's picture, 2026-10-30). The
 *  longest reaches the outer ring's radius, so the sun is placed the same way. */
const RAY_LENGTHS = [234, 150, 196, 128, 218, 162, 180, 140];
const sunRays = (x: number, y: number) => Array.from({ length: 40 }, (_, ray) => {
  const turn = (ray / 40) * Math.PI * 2 - Math.PI / 2, inner = 102, outer = RAY_LENGTHS[ray % RAY_LENGTHS.length], half = 4.5;
  const [along, across] = [[Math.cos(turn), Math.sin(turn)], [-Math.sin(turn), Math.cos(turn)]];
  return `M${fixed(x + along[0] * inner + across[0] * half)} ${fixed(y + along[1] * inner + across[1] * half)}L${fixed(x + along[0] * outer)} ${fixed(y + along[1] * outer)}L${fixed(x + along[0] * inner - across[0] * half)} ${fixed(y + along[1] * inner - across[1] * half)}Z`;
}).join("");
/** Screen pixels kept between the sun's outer ring and the title or the copy under it. */
const RING_GAP = 28;
/** Where the sun sits, in drawing units: its outer ring on the header's right margin, moved back right only as far as it must
 *  to clear the title and the copy (owner, 2026-10-30: "put it to the left so it can be within the header margins as much as
 *  possible without touching the title"). Never further right than it was first drawn. */
function placeSun(svg: SVGSVGElement, length: number, scale: number, drawnLeft: number, drawnTop: number) {
  const first = length - 300;
  const wrap = svg.parentElement?.querySelector<HTMLElement>(".home-wrap");
  const copy = wrap?.querySelector(".home-hero-copy");
  if (!wrap || !copy) return first;
  const wrapBox = wrap.getBoundingClientRect();
  const marginRight = wrapBox.right - parseFloat(getComputedStyle(wrap).paddingRight);
  // The words themselves, not their full-width blocks.
  const words = [...copy.children].map((child) => { const range = document.createRange(); range.selectNodeContents(child); return range.getBoundingClientRect(); }).filter((box) => box.width);
  const radius = (RINGS[RINGS.length - 1] + 1) * scale, middleY = drawnTop + SUN_Y * scale;
  const clears = (x: number) => words.every((box) => Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - middleY, 0, middleY - box.bottom)) >= radius + RING_GAP);
  let x = marginRight - radius;
  const furthest = drawnLeft + first * scale;
  while (!clears(x) && x < furthest) x += 4;
  return Math.min(first, (x - drawnLeft) / scale);
}

/** "edge" runs the scroll from one side of the screen to the other, cropped from the left on narrow screens (Scroll A).
 *  "framed" sets it inside margins and lets its length follow the shape of its space, so it fills a phone and a wide screen
 *  alike instead of shrinking to a strip (Scroll B). "rays" gives the sun rays instead of rings, with a gray cross (Scroll A2). */
function ScrollArt({ fit, rays = false }: { fit: "edge" | "framed"; rays?: boolean }) {
  const frame = useRef<SVGSVGElement>(null);
  const [length, setLength] = useState(1600);
  const [sun, setSun] = useState(1300);
  useLayoutEffect(() => {
    const svg = frame.current;
    if (!svg) return;
    const measure = () => {
      const box = svg.getBoundingClientRect();
      if (!box.height) return;
      const drawn = fit === "edge" ? 1600 : Math.round(Math.min(2200, Math.max(640, (HEIGHT * box.width) / box.height)));
      // The same fitting as preserveAspectRatio below: "xMaxYMax slice" for edge, "xMidYMax meet" for framed.
      const scale = fit === "edge" ? Math.max(box.width / drawn, box.height / HEIGHT) : Math.min(box.width / drawn, box.height / HEIGHT);
      const drawnLeft = box.left + (fit === "edge" ? box.width - drawn * scale : (box.width - drawn * scale) / 2);
      setLength(drawn);
      setSun(placeSun(svg, drawn, scale, drawnLeft, box.bottom - HEIGHT * scale));
    };
    measure();
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [fit]);
  const sheets = useMemo(() => drawSheets(length), [length]);
  const sunY = SUN_Y;
  return <svg ref={frame} className={`hm4-scroll-art hm4-scroll-${fit}`} viewBox={`0 0 ${length} ${HEIGHT}`} preserveAspectRatio={fit === "edge" ? "xMaxYMax slice" : "xMidYMax meet"} aria-hidden="true">
    <defs>
      {sheets.flatMap((sheet) => sheet.writing.map((d, line) => <path id={`hm4-line-${sheet.name}-${line}`} d={d} key={`${sheet.name}-${line}`} />))}
      <clipPath id="hm4-between-rollers"><rect x="22" y="0" width={length - 44} height={HEIGHT} /></clipPath>
    </defs>
    {rays ? <path className="hm4-sun-rays" d={sunRays(sun, sunY)} />
      : RINGS.map((radius, ring) => <circle className={`hm4-scroll-ring hm4-scroll-ring-${ring % 2}`} cx={sun} cy={sunY} r={radius} style={{ opacity: 0.62 - ring * 0.1, transformOrigin: `${sun}px ${sunY}px` }} key={radius} />)}
    <circle className="hm4-sun-disc hm4-sun-solid" cx={sun} cy={sunY} r="82" />
    {/* A cross in the sun, white (gray on A2), not a dark cut-out; set low, its foot going down behind the scroll (owner, 2026-10-30). */}
    <path className={`hm4-sun-cross${rays ? " hm4-sun-cross-gray" : ""}`} d={`M${fixed(sun - 6)} ${sunY - 24}h12v20h20v12h-20v62h-12v-62h-20v-12h20Z`} />
    {sheets.map((sheet) => <g className={`hm4-sheet hm4-sheet-${sheet.name}`} key={sheet.name}>
      <path className="hm4-sheet-fill" d={`${sheet.edge}L${length} ${HEIGHT}L0 ${HEIGHT}Z`} /><path className="hm4-sheet-edge" d={sheet.edge} />
      {sheet.dotted.map((d) => <path className="hm4-sheet-writing" d={d} key={d} />)}
      {sheet.writing.map((d, line) => <text className={`hm4-sheet-script hm4-script-${sheet.script}`} clipPath="url(#hm4-between-rollers)" key={d}><textPath href={`#hm4-line-${sheet.name}-${line}`} startOffset={LINE_STARTS[line]}>{INSCRIPTIONS[sheet.script][line]}</textPath></text>)}
    </g>)}
    <Roller cx={22} inward={1} /><Roller cx={length - 22} inward={-1} />
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

function ScrollRaysOpening(props: OpeningProps) {
  return <section className="hm4-b" aria-labelledby="home-title"><ScrollArt fit="edge" rays /><div className="home-wrap"><OpeningCopy {...props} /></div></section>;
}

function ScrollFramedOpening(props: OpeningProps) {
  return <section className="hm4-b" aria-labelledby="home-title"><ScrollArt fit="framed" /><div className="home-wrap"><OpeningCopy {...props} /></div></section>;
}

function ManuscriptOpening(props: OpeningProps) {
  return <section className="home-hero home-wrap hm4-row hm4-row-flip" aria-labelledby="home-title"><ManyPiecesArt /><OpeningCopy {...props} /></section>;
}

const VIEWS: Record<ArtOpeningId, (props: OpeningProps) => JSX.Element> = { a: ScrollEdgeOpening, a2: ScrollRaysOpening, b: ScrollFramedOpening, c: ManuscriptOpening };

export function ArtOpening({ version, ...props }: OpeningProps & { version: ArtOpeningId }) {
  const View = VIEWS[version];
  // Scroll B stands alone; Scroll A keeps the marquee it was first made with, and so does the manuscript (owner, 2026-10-30).
  return <><View {...props} />{version !== "b" && <GoldMarquee />}</>;
}
