// Banner mock-ups: each part's banner exactly as the homepage shows it, full width, once for each of its three emblem
// designs, so the owner can choose one per part. Not linked from the site; reached only at /banner-emblems.
import type { ComponentProps } from "react";
import { SectionBanner } from "@/components/home/HomeBanner";
import { DESIGNS } from "@/components/home/emblem-designs";
import "@/components/home/home-hub.css";
import "@/components/home/home-emblems.css";

type Banner = Omit<ComponentProps<typeof SectionBanner>, "variant">;

/** The same four banners as HomePage.tsx. */
const BANNERS: Banner[] = [
  { number: "01", name: "The Bible", line: "One Word, read, heard and explored", tone: "epistles", verse: "“The grass withereth, the flower fadeth: but the word of our God shall stand for ever.”", reference: "Isaiah 40:8", to: "/read/kjv/ISA/40?hl=8", page: "/bible", emblem: "word", glint: ["read", "heard", "explored"] },
  { number: "02", name: "Study", line: "The passage, and the world behind it", tone: "gospels", verse: "“Search the scriptures… they are they which testify of me.”", reference: "John 5:39", to: "/read/kjv/JHN/5?hl=39", page: "/study", emblem: "lens" },
  { number: "03", name: "Apologetics", line: "Faith seeking understanding", tone: "accent", verse: "“Be ready always to give an answer to every man that asketh you a reason of the hope that is in you.”", reference: "1 Peter 3:15", to: "/read/kjv/1PE/3?hl=15", page: "/apologetics", emblem: "scales" },
  { number: "04", name: "Resources", line: "Help for the road", tone: "resource-life", verse: "“Bear ye one another’s burdens, and so fulfil the law of Christ.”", reference: "Galatians 6:2", to: "/read/kjv/GAL/6?hl=2", page: "/resources", emblem: "lamp" },
];

export default function EmblemMockupsPage() {
  return <div className="home-hub hm-banners">
    <header className="home-wrap hm-banners-head"><h1>Banner emblems: <em>three choices for each part</em></h1>
      <p>Each banner is shown exactly as it sits on the homepage. Tell me the letter you want for each part.</p></header>
    {BANNERS.map((banner) => <section key={banner.number} className="hm-banner-part">
      {DESIGNS[banner.emblem].map((design, i) => <div key={design.name} className="hm-banner-option">
        <p className="home-wrap hm-banner-label"><strong>{banner.name} · option {"ABC"[i]}: {design.name}</strong><span>Around the ring: {design.source}</span></p>
        <SectionBanner {...banner} variant={i} />
      </div>)}
    </section>)}
  </div>;
}
