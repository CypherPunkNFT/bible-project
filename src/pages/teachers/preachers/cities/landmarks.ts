// Landmark line drawings for the city cards (40×40, one stroke weight, round caps). A mark with tone "soft" or "faint"
// is drawn lighter: ground lines and detail. Ported from the approved mock-up (design/authors-directions/teachers/cities.js).

export interface PathMark { d: string; tone?: "soft" | "faint" }
export interface CircleMark { circle: [number, number, number] }
export type LandmarkMark = PathMark | CircleMark;
export interface Landmark { label: string; marks: LandmarkMark[] }

const GROUND: PathMark = { d: "M4 35.5H36", tone: "faint" };

const LANDMARKS: Record<string, Landmark> = {
  London: { label: "Elizabeth Tower (Big Ben), Westminster", marks: [
    GROUND,
    { d: "M16.5 35.5V18M23.5 35.5V18M15.5 18H24.5V11H15.5Z" },
    { circle: [20, 14.5, 2.4] },
    { d: "M20 14.5V13.1M20 14.5H21.1", tone: "soft" },
    { d: "M16.5 11V8.2H23.5V11M16.5 8.2L20 2.5L23.5 8.2" },
    { d: "M18.6 21.5V24.5M21.4 21.5V24.5M18.6 28V31M21.4 28V31", tone: "soft" },
    { d: "M23.5 26.5H33.5V35.5M27 26.5V24.8M30.5 26.5V24.8" },
    { d: "M26.5 29.5V32M30 29.5V32", tone: "soft" },
  ] },
  Princeton: { label: "Nassau Hall, Princeton University", marks: [
    GROUND,
    { d: "M5.5 35.5V20.5H34.5V35.5M4.5 20.5L7 17.5H33L35.5 20.5M17.5 17.5V13.5H22.5V17.5" },
    { d: "M17.5 13.5Q20 9.5 22.5 13.5M20 10.9V7.5" },
    { d: "M18.4 35.5V31.6Q20 29.8 21.6 31.6V35.5" },
    { d: "M15.5 20.5V35.5M24.5 20.5V35.5M8.8 23.5V25.5M12.2 23.5V25.5M27.8 23.5V25.5M31.2 23.5V25.5M8.8 29V31M12.2 29V31M27.8 29V31M31.2 29V31M20 23.5V26", tone: "soft" },
  ] },
  Cambridge: { label: "King's College Chapel", marks: [
    GROUND,
    { d: "M9 35.5V11.5M12.5 35.5V11.5M9 11.5L10.75 6.5L12.5 11.5M27.5 35.5V11.5M31 35.5V11.5M27.5 11.5L29.25 6.5L31 11.5" },
    { d: "M12.5 16.5H27.5M15 31V21.5Q20 14.5 25 21.5V31Z" },
    { d: "M18.3 31V18.3M21.7 31V18.3M15 25.5H25M10.75 4.8V6.5M29.25 4.8V6.5M9 20H12.5M27.5 20H31", tone: "soft" },
  ] },
  Philadelphia: { label: "Independence Hall", marks: [
    GROUND,
    { d: "M4.5 35.5V23.5H35.5V35.5M3.5 23.5L5.5 21.5H34.5L36.5 23.5M16.5 35.5V15.5H23.5V21.5" },
    { d: "M17.8 15.5V11H22.2V15.5M18.6 11V8.4H21.4V11M18.6 8.4Q20 6.2 21.4 8.4M20 6.8V3.5" },
    { circle: [20, 18.6, 1.5] },
    { d: "M18.6 35.5V31.8Q20 30.4 21.4 31.8V35.5M7.5 26.5V28.5M10.5 26.5V28.5M13.5 26.5V28.5M26.5 26.5V28.5M29.5 26.5V28.5M32.5 26.5V28.5M7.5 31V33M10.5 31V33M13.5 31V33M26.5 31V33M29.5 31V33M32.5 31V33", tone: "soft" },
  ] },
  Glasgow: { label: "Glasgow Cathedral", marks: [
    GROUND,
    { d: "M5 35.5V24.5M35 35.5V24.5M3.5 24.5L7 20.5H33L36.5 24.5M17 20.5V12.5H23V20.5M17 12.5L20 3L23 12.5" },
    { d: "M8.5 32V27.5M11.5 32V27.5M14.5 32V27.5M25.5 32V27.5M28.5 32V27.5M31.5 32V27.5M20 18.5V15M17 12.5V11M23 12.5V11", tone: "soft" },
  ] },
  Geneva: { label: "St Pierre Cathedral, where Calvin preached", marks: [
    GROUND,
    { d: "M6.5 35.5V15.5H13V35.5M27 35.5V15.5H33.5V35.5M6 15.5L9.75 12.5L13.5 15.5M26.5 15.5L30.25 12.5L34 15.5" },
    { d: "M13 21.5H27M18.6 21.5V13.5L20 4L21.4 13.5V21.5M13 27L20 23L27 27H13" },
    { d: "M15.2 35.5V27M18.4 35.5V27M21.6 35.5V27M24.8 35.5V27M9.75 18V21M30.25 18V21", tone: "soft" },
  ] },
  Edinburgh: { label: "Edinburgh Castle on its rock", marks: [
    { d: "M3.5 35.5L6.5 31L8.5 30.2L10.5 26.5L12.5 25H30L32 28L34.5 30L36.5 35.5" },
    { d: "M12.5 25V15.5H14V14H15.5V15.5H17V14H18.5V15.5H20V25M20 18.5H27.5V25M27.5 18.5Q30 18.3 30 20.5V25M23.5 18.5V11.5M23.5 11.5H26.3L23.5 13.3" },
    { d: "M15 19V21.5M17.5 19V21.5M22 21V22.8M25 21V22.8M8.5 33L12 30.5M27.5 33L31 30", tone: "soft" },
  ] },
  Oxford: { label: "The Radcliffe Camera", marks: [
    { d: "M6 35.5H34", tone: "faint" },
    { d: "M8.5 35.5V27.5H31.5V35.5M10 27.5V19.5H30V27.5M8.5 19.5H31.5M11 19.5Q11 9.5 20 9.5Q29 9.5 29 19.5" },
    { d: "M18 9.5V7H22V9.5M18 7Q20 4.6 22 7M20 5.2V3.5" },
    { d: "M13 26.5V20.5M17 26.5V20.5M23 26.5V20.5M27 26.5V20.5M15.5 19Q15.6 12.6 20 9.6M24.5 19Q24.4 12.6 20 9.6M18.5 35.5V31.5H21.5V35.5", tone: "soft" },
  ] },
  Franeker: { label: "The Martinikerk tower", marks: [
    GROUND,
    { d: "M8 35.5V14.5H15V35.5M8 14.5L11.5 3.5L15 14.5M15 35.5V23.5M15 23.5L18 20.5H33.5L35.5 23.5V35.5" },
    { d: "M10.5 18V21.5M12.5 18V21.5M10.5 26V29M12.5 26V29M19.5 32V26.5M23.5 32V26.5M27.5 32V26.5M31.5 32V26.5M11.5 10V12", tone: "soft" },
  ] },
  Gloucester: { label: "Gloucester Cathedral tower", marks: [
    GROUND,
    { d: "M4 35.5V25.5M36 35.5V25.5M3 25.5L5.5 22.5H34.5L37 25.5M15 22.5V9.5H25V22.5M15 9.5V5M25 9.5V5M18.3 9.5V6.5M21.7 9.5V6.5" },
    { d: "M15 9.5H25M17.8 20V13M20 20V13M22.2 20V13M8 32V28.5M11 32V28.5M29 32V28.5M32 32V28.5", tone: "soft" },
  ] },
  Northampton: { label: "A New England meeting house", marks: [
    GROUND,
    { d: "M7 35.5V24L17 18.5M23 18.5L33 24V35.5M17 35.5V14.5H23V35.5M17.5 14.5V10.5H22.5V14.5M17.5 10.5L20 2.5L22.5 10.5" },
    { d: "M18.5 35.5V31.4Q20 29.8 21.5 31.4V35.5" },
    { d: "M10.5 32V27.5M13.5 32V27.5M26.5 32V27.5M29.5 32V27.5M19.2 13V11.8Q20 11 20.8 11.8V13M20 25V27.5", tone: "soft" },
  ] },
  Liverpool: { label: "The Royal Liver Building", marks: [
    GROUND,
    { d: "M6 35.5V17.5H34V35.5M8 17.5V9.5H14V17.5M26 17.5V9.5H32V17.5M8.5 9.5Q11 5.5 13.5 9.5M26.5 9.5Q29 5.5 31.5 9.5" },
    { circle: [11, 13.4, 1.6] },
    { circle: [29, 13.4, 1.6] },
    { d: "M11 6.6V5M10 4.4Q11 3.5 12 4.4M29 6.6V5M28 4.4Q29 3.5 30 4.4" },
    { d: "M17 21V32M20 21V32M23 21V32M8.5 21V32M31.5 21V32", tone: "soft" },
  ] },
  Amsterdam: { label: "Canal houses on the water", marks: [
    { d: "M5 32.5V19H6.2V17H7.6V15H10.4V17H11.8V19H13M13 32.5V16Q14.6 15 15 12.5H18Q18.4 15 20 16V32.5M20 32.5V18H21.5V13.5H25.5V18H27V32.5M21.5 13.5L23.5 11.5L25.5 13.5M27 32.5V20L31 13.5L35 20V32.5M4 32.5H36" },
    { d: "M7.6 22V24M10.4 22V24M7.6 27V29M10.4 27V29M15.3 19.5V21.5M17.7 19.5V21.5M15.3 25V27M17.7 25V27M22.3 21V23M24.7 21V23M22.3 26V28M24.7 26V28M29.5 22V24M32.5 22V24M29.5 27V29M32.5 27V29", tone: "soft" },
    { d: "M5 36Q7.5 34.8 10 36T15 36T20 36T25 36T30 36T35 36", tone: "faint" },
  ] },
  "Grand Rapids": { label: "A bridge over the Grand River", marks: [
    { d: "M3 22.5H37M6.5 22.5L10.5 15.5H29.5L33.5 22.5M10.5 15.5L14.3 22.5L18.1 15.5L21.9 22.5L25.7 15.5L29.5 22.5M12 22.5V29.5M28 22.5V29.5" },
    { d: "M14.3 22.5V15.5M18.1 22.5V15.5M21.9 22.5V15.5M25.7 22.5V15.5", tone: "soft" },
    { d: "M4 31.5Q7 30.3 10 31.5T16 31.5T22 31.5T28 31.5T34 31.5M8 35Q11 33.8 14 35T20 35T26 35T32 35", tone: "faint" },
  ] },
  Allegheny: { label: "The Allegheny Observatory", marks: [
    GROUND,
    { d: "M6 35.5V24.5H34V35.5M5 24.5H35M12.5 24.5V20.5H27.5V24.5M13.5 20.5Q13.5 11 20 11Q26.5 11 26.5 20.5" },
    { d: "M19 11.3L21.5 11.4L22.2 20.5M19 11.3L18.6 20.5" },
    { d: "M9.5 28V32M13 28V32M27 28V32M30.5 28V32M18.5 35.5V30.5H21.5V35.5M20 11V8.5", tone: "soft" },
  ] },
};

/** Any town without its own drawing still gets a quiet one (a church among roofs), so the card never looks broken. */
const FALLBACK: Landmark = { label: "", marks: [
  GROUND,
  { d: "M6 35.5V24L11 20L16 24V35.5M16 35.5V17H24V35.5M16 17L20 9L24 17M20 9V5.5M18.6 6.8H21.4M24 35.5V25.5L29 21.5L34 25.5V35.5" },
] };

const warned = new Set<string>();
export function landmarkOf(name: string): Landmark {
  const found = LANDMARKS[name];
  if (found) return found;
  if (!warned.has(name)) {
    warned.add(name);
    console.warn(`Teachers · cities: no landmark drawing for "${name}"; using the general town drawing`);
  }
  return FALLBACK;
}
