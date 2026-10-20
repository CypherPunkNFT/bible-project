// The face of the Manuscripts page (approved mock-up B: js/landing.js): breadcrumb, the big plain-type title with one
// italic accent and a short lede beside the opening drawing, then one end-to-end row of figures, as on the Hymns page.
// Every figure is counted from the collection. Direction B has no century strip.
import { useMemo } from "react";
import { StudyTrail } from "@/components/study/StudyTrail";
import { HeroArt } from "./HeroArt";
import { formatNumber, isDated, mid } from "./model";
import { useMs } from "./context";

export function Landing() {
  const { index: { data } } = useMs();
  const figures = useMemo(() => {
    const R = data.records, C = data.counts;
    const dated = R.filter(isDated);
    const oldest = dated.reduce((a, b) => (b.e < a.e ? b : a));
    const lanes = new Set(R.flatMap((r) => r.L));
    const early = dated.filter((r) => ["papyrus", "majuscule"].includes(r.k) && mid(r) < 400).length;
    const cities = new Set(data.holders.map((h) => h.city)).size;
    const pictured = R.filter((r) => r.im).length;
    return [
      ["Records", formatNumber(C.records), "from open catalogues"],
      ["Dated", formatNumber(C.dated), `${Math.round((C.dated / C.records) * 100)}% of the records`],
      ["Oldest dated", (oldest.d ?? "").replace(" century", " c."), oldest.n],
      ["Traditions", `${lanes.size}`, "languages and families of copies"],
      ["Greek New Testament", formatNumber(C.gaTotal), `of about ${formatNumber(C.liste.total)} known · ${formatNumber(early)} before AD 400`],
      ["Libraries", formatNumber(C.holders), `in ${cities} cities, Dublin to Sinai`],
      ["Pictured", formatNumber(pictured), "with an openly licensed picture"],
    ] as const;
  }, [data]);

  return <>
    <div className="hc-intro ms-intro">
      <div>
        <StudyTrail area="texts" /><p className="ms-eyebrow">Scrolls · Codices · Papyri</p>
        <h1>Manuscripts<em>across the centuries</em></h1>
        <p className="hc-lede">The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus. Follow every dated copy
          through time, choose a book to see the copies that hold it, find where they are kept today, then browse them all.</p>
      </div>
      <HeroArt />
    </div>
    <dl className="ms-figures">
      {figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt>
        <dd>{value}{label === "Pictured" && <> <span className="ms-star" aria-hidden="true">★</span></>}</dd><small>{note}</small></div>)}
    </dl>
  </>;
}
