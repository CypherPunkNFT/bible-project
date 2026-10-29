// The app's loading mark, recreated for the web (owner, 2026-10-29; the app's version is
// App/src/components/book-loader.tsx): the open Bible on its gold tile, a page turning around the spine, the cross
// rising behind and the star twinkling where its arms meet. Same shapes on the same 1254-unit square; the motion is
// CSS (download.css), and stops for readers who ask for reduced motion. Decorative: the panel around it says what
// is happening.
import type { CSSProperties } from "react";
import "./download.css";

const MARK = {
  tile: "#f2bd40",
  ink: "#1f1d1a",
  cross: "#d39e17",
  leftCover: "M240 524H278L172 802C330 776 540 800 602 958C470 860 270 836 86 870Z",
  rightCover: "M1014 524H976L1082 802C924 776 714 800 652 958C784 860 984 836 1168 870Z",
  leftPage: "M328 459H365C470 459 590 505 602 578V888C510 790 360 750 212 767Z",
  rightPage: "M926 459H889C784 459 664 505 652 578V888C744 790 894 750 1042 767Z",
  star: "M627 182Q662 292 767 326Q662 360 627 469Q592 360 487 326Q592 292 627 182Z",
  outline: "M328 459H365L560 497Q600 530 627 578Q654 530 694 497L889 459H926L976 524H1014L1168 870C984 836 784 860 652 958V970L627 990L602 970V958C470 860 270 836 86 870L240 524H278Z",
  crossShape: "M561 68H693V278H935V373H693V1044H561V373H318V278H561Z",
};

/** Black shapes over their gold outlines (sharp: the star's outline runs to points, like its tips). */
function MarkShapes({ shapes, sharp }: { shapes: string[]; sharp?: boolean }) {
  return <>
    {shapes.map(d => <path key={`outline ${d}`} d={d} fill={MARK.tile} stroke={MARK.tile} strokeWidth={18} strokeLinejoin={sharp ? "miter" : "round"} strokeMiterlimit={8} />)}
    {shapes.map(d => <path key={d} d={d} fill={MARK.ink} />)}
  </>;
}

/** The animated mark, `size` px square. */
export function BookLoader({ size = 56 }: { size?: number }) {
  return <span className="bl" aria-hidden="true" style={{ "--bl-size": `${size}px` } as CSSProperties}>
    <svg className="bl-cross" viewBox="0 0 1254 1254"><path d={MARK.crossShape} fill={MARK.cross} /></svg>
    <svg className="bl-book" viewBox="0 0 1254 1254">
      <path d={MARK.outline} fill={MARK.tile} />
      <MarkShapes shapes={[MARK.leftCover, MARK.rightCover, MARK.leftPage, MARK.rightPage]} />
    </svg>
    <span className="bl-page"><svg viewBox="627 0 627 1254"><MarkShapes shapes={[MARK.rightPage]} /></svg></span>
    <span className="bl-halo" />
    <svg className="bl-star" viewBox="447 146 360 360"><MarkShapes shapes={[MARK.star]} sharp /></svg>
  </span>;
}
