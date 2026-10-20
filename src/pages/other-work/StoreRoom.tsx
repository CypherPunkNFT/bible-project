// CypherPunkNFT's picture panel: the four works on metal from its store (CypherpunkNFT/Website/src/data/products.ts and
// public/img/products), in the store's order. It opens on Brass Canvas (owner, 2026-10-20); the dots show the others, and
// nothing turns on its own.
import { useState } from "react";
import { CYPHERPUNK_WORDMARK } from "@/pages/other-work/cypherpunk-wordmark";

const STORE = [
  { file: "shop-cross", badge: "Gemstone Signatures", name: "Airbrush mixed media on titanium", position: "58% 50%", flip: true, alt: "Purple and silver geometric artwork on a titanium canvas in a sunlit room" },
  { file: "shop-glitch", badge: "Copper Canvas", name: "Airbrush mixed media on copper", position: "50% 50%", flip: false, alt: "Orange and black geometric artwork on a copper canvas beside a fireplace" },
  { file: "shop-star", badge: "Brass Canvas", name: "Airbrush mixed media on brass", position: "32% 50%", flip: false, alt: "Red and gold star artwork on a brass canvas in a dark study" },
  { file: "shop-mirror", badge: "Laser Cut & Etched", name: "Airbrush mixed media on aluminum plate", position: "85% 50%", flip: false, alt: "Colorful geometric artwork on an aluminum canvas overlooking the sea" },
];
const STORE_START = 2;

export function StoreRoom() {
  const [shown, setShown] = useState(STORE_START);
  return (
    <div className="ow-pic ow-cp">
      <span className="ow-cp-logo" role="img" aria-label="CypherPunk NFT">
        {(["line", "stacked"] as const).map((shape) => (
          <svg key={shape} className={`ow-cp-${shape}`} viewBox={CYPHERPUNK_WORDMARK[shape].viewBox} aria-hidden="true"><path d={CYPHERPUNK_WORDMARK[shape].d} fill="currentColor" /></svg>
        ))}
      </span>
      <figure className="ow-cp-room" aria-roledescription="carousel" aria-label="Works on metal from the store">
        <div className="ow-cp-slides">
          {STORE.map((piece, index) => (
            <img
              key={piece.file}
              src={`/images/other-work/${piece.file}-1400.webp`}
              srcSet={`/images/other-work/${piece.file}-700.webp 700w, /images/other-work/${piece.file}-1400.webp 1400w`}
              sizes="(max-width: 860px) 92vw, 40vw"
              width="1400" height="933" alt={piece.alt} loading="lazy"
              className={index === shown ? "is-on" : undefined}
              style={{ objectPosition: piece.position, transform: piece.flip ? "scaleX(-1)" : undefined }}
            />
          ))}
        </div>
        <figcaption><span className="ow-cp-badge">{STORE[shown].badge}</span><span className="ow-cp-what">{STORE[shown].name}</span></figcaption>
        <div className="ow-cp-dots">
          {STORE.map((piece, index) => (
            <button key={piece.file} type="button" aria-label={`Show ${piece.badge}`} aria-current={index === shown || undefined} onClick={() => setShown(index)}><span /></button>
          ))}
        </div>
      </figure>
    </div>
  );
}
