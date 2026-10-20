import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StoreRoom } from "@/pages/other-work/StoreRoom";
import { TableArch } from "@/pages/other-work/TableArch";
import "@/pages/other-work/other-work.css";

interface Work { id: string; side: "left" | "right"; kicker: string; name: ReactNode; summary: string; lead: string; text: string; link: [string, string]; picture: ReactNode }

function Spark({ className = "ow-spark" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1C13 8 16 11 23 12C16 13 13 16 12 23C11 16 8 13 1 12C8 11 11 8 12 1Z" /></svg>;
}

function Heart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
    </svg>
  );
}

// RedeemerForge and ChurchFamily are worded as on the CypherPunk site's Faith page ("Faith in tech"); CypherPunkNFT takes
// Bible Project's place there. Each picture keeps its project's own colours and logo.
const WORKS: Work[] = [
  {
    id: "redeemerforge", side: "left",
    kicker: "Youth programme · Jacksonville",
    name: <><Spark /><span>Redeemer<em>Forge</em></span></>,
    summary: "A faith-based youth programme in Jacksonville.",
    lead: "Connection over isolation.",
    text: "Cooperative play and hands-on building that pull youth together instead of leaving them alone with a screen, in a Christian framework of respect, encouragement, and responsibility.",
    link: ["Visit redeemerforge.com", "https://redeemerforge.com"],
    picture: (
      <div className="ow-pic ow-rf">
        <span className="ow-rf-logo"><Spark /><span>Redeemer<b>Forge</b></span></span>
        <img src="/images/other-work/redeemerforge-pillars-tight.webp" width="1269" height="369" alt="" loading="lazy" />
        <img src="/images/other-work/redeemerforge-group-tight.webp" width="1083" height="447" alt="" loading="lazy" />
      </div>
    ),
  },
  {
    id: "churchfamily", side: "right",
    kicker: "Church members helping one another",
    name: <><span className="ow-cc-badge ow-name-badge"><Heart /></span><span>ChurchFamily</span></>,
    summary: "Church members staying connected, so they can love and help one another.",
    lead: "Love your neighbor, starting in your own church.",
    text: "Members share what they need, a ride, a meal, childcare, a hand with repairs, and fellow members answer. Only verified members of the church take part.",
    link: ["Visit churchfamily.io", "https://churchfamily.io"],
    picture: <div className="ow-pic ow-cc"><span className="ow-cc-logo"><span className="ow-cc-badge"><Heart /></span>ChurchFamily</span><TableArch /></div>,
  },
  {
    id: "cypherpunknft", side: "left",
    kicker: "Art studio · Jacksonville",
    name: <span>CypherPunk<em>NFT</em></span>,
    summary: "His art studio: digital compositions, mixed-media originals, art prints and works on metal.",
    lead: "Digital & physical crypto art.",
    text: "Glitch and geometric compositions, scientific imagery and photography, carried into airbrush, epoxy resin and aerospace metal.",
    link: ["Visit CypherPunkNFT", "#"], // the domain is not settled yet
    picture: <StoreRoom />,
  },
];

function Band({ work }: { work: Work }) {
  const [label, href] = work.link;
  const external = href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <article className={`ow-band ow-band-${work.side}`} id={work.id}>
      {work.picture}
      <div className="ow-copy">
        <p className="ow-kicker">{work.kicker}</p>
        <h2><a className="ow-name" href={href} {...external}>{work.name}<span className="ow-name-arrow"><ArrowUpRight className="h-[18px] w-[18px]" aria-hidden /></span></a></h2>
        <p className="ow-summary">{work.summary}</p>
        <p className="ow-lead">{work.lead}</p>
        <p className="ow-text">{work.text}</p>
        <a className="ow-link" href={href} {...external}>{label}<ArrowUpRight className="h-[13px] w-[13px]" aria-hidden /></a>
      </div>
    </article>
  );
}

/** "See my other work", linked from the founder's letter on the contact page: Lucas's other projects as framed bands, picture and words side by side, sides alternating (approved mock-up, 2026-10-20). */
export default function OtherWorkPage() {
  return (
    <div className="ow">
      <p className="ow-crumbs"><Link to="/contact#founder-letter"><ArrowLeft className="h-[13px] w-[13px]" aria-hidden />Back to the letter</Link></p>
      <header className="ow-head">
        <p className="ow-kicker">Lucas Campbell Saint Laurent · other work</p>
        <h1>The rest of<em>the work.</em></h1>
        <p>Besides Bible Project, Lucas builds and leads these: a youth programme, a way for a church to care for its own, and his art.</p>
      </header>
      {WORKS.map((work) => <Band key={work.id} work={work} />)}
    </div>
  );
}
