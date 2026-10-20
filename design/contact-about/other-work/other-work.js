// "See my other work" from the founder's letter (F): Lucas's other projects as framed bands, picture and words side by
// side, sides alternating; the layout of "Faith in tech" on the CypherPunk site's Faith page (FaithTechStudiesPage.tsx,
// study 03B). RedeemerForge and ChurchFamily are worded as there; CypherPunkNFT takes Bible Project's place.
(() => {
  const main = ContactMock.mount("merged");
  const spark = '<svg class="ow-spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1C13 8 16 11 23 12C16 13 13 16 12 23C11 16 8 13 1 12C8 11 11 8 12 1Z"/></svg>';
  const heart = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>';

  // ChurchFamily's home-page drawing, copied from its TableArch.tsx (ChurchFamily/src/components/lineart/): an open arch
  // over a shared table (bread, grapes, cup and jug) under a hanging lamp, with an olive branch at each foot.
  const tableArch = () => {
    const leaves = [[-1, -22, -152], [0, -40, -28], [1, -62, -158], [4, -84, -24], [8, -106, -150], [13, -127, -34], [19, -148, -118], [24, -160, -70]];
    const olive = (transform) => `<g transform="${transform}"><path d="M0 0C-5-52 6-112 24-162"/>${leaves.map(([x, y, angle]) =>
      `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M0 0C6-4 18-4.5 27 0C18 4.5 6 4 0 0Z"/><path d="M2 0H24" opacity=".45"/></g>`).join("")}
      <ellipse cx="-9" cy="-50" rx="3" ry="4.4" transform="rotate(-20 -9 -50)"/><ellipse cx="15" cy="-96" rx="3" ry="4.4" transform="rotate(25 15 -96)"/><path d="M-2-46L-8-46M10-92L14-92" opacity=".6"/></g>`;
    const grapes = [[224, 425], [232, 425], [228, 418], [236, 418], [232, 411], [240, 425]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3.6"/>`).join("");
    return `<svg class="ow-cc-art" viewBox="-20 0 500 600" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M230 8L233 25L250 28L233 31L230 48L227 31L210 28L227 25Z"/><path d="M223 21L237 35M237 21L223 35" opacity=".6"/><path d="M150 28H200M260 28H310" opacity=".5"/><circle cx="144" cy="28" r="2"/><circle cx="316" cy="28" r="2"/>
      <path d="M40 590V250A190 190 0 0 1 420 250V590M56 590V250A174 174 0 0 1 404 250V590"/><path d="M86 590V262A144 144 0 0 1 374 262V590" opacity=".5"/><path d="M219 54H241L237 80H223Z"/><path d="M32 246H64M32 256H64M396 246H428M396 256H428"/><path d="M36 300V560M424 300V560" opacity=".35"/>
      <path d="M230 80V132" opacity=".7"/><g transform="translate(230 196) scale(1.4) translate(-230 -126)"><path d="M230 80V100M230 100L214 126M230 100L246 126" opacity=".7"/><path d="M210 126H250C248 136 240 140 230 140C220 140 212 136 210 126ZM250 128L260 123L254 132"/><path class="ow-cc-flame" d="M259 120C255 114 259 108 259 103C262 109 264 114 259 120Z"/><path d="M259 96V90M249 102L244 98M269 102L274 98M247 112H241M271 112H277" opacity=".45"/></g>
      <path d="M100 430H360M104 438H356M100 430V438M360 430V438"/><path d="M124 438L118 540M133 438L128 540M336 438L342 540M327 438L332 540"/><path d="M126 500H334" opacity=".55"/>
      <g transform="translate(230 430) scale(1.2) translate(-230 -430)"><path d="M156 430C156 403 214 403 214 430"/><path d="M170 418L177 426M183 412L190 422M197 413L203 422" opacity=".7"/>${grapes}<path d="M233 407C235 401 239 399 245 399"/>
        <path d="M252 384H286C286 404 277 412 269 412C261 412 252 404 252 384ZM269 412V422M256 430C258 422 280 422 282 430"/><path d="M256 390H282" opacity=".45"/>
        <path d="M300 430C292 420 292 397 302 389L304 372H318L320 389C330 397 330 420 322 430M302 372H320M323 396C335 396 335 414 325 418"/><path d="M298 404H324" opacity=".45"/></g>
      <path d="M20 590H440"/><path d="M86 560H374M70 575H390" opacity=".35"/><path d="M150 560L140 575M230 560V575M310 560L320 575" opacity=".25"/>
      ${olive("translate(22 590)")}${olive("translate(438 590) scale(-1 1)")}
    </svg>`;
  };

  // The four works on metal in the CypherPunk store (its src/data/products.ts and public/img/products), in the store's
  // order; the panel opens on Brass Canvas (owner, 2026-10-20) and the dots show the others.
  const STORE = [
    { file: "shop-cross", badge: "Gemstone Signatures", name: "Airbrush mixed media on titanium", position: "58% 50%", flip: true, alt: "Purple and silver geometric artwork on a titanium canvas in a sunlit room" },
    { file: "shop-glitch", badge: "Copper Canvas", name: "Airbrush mixed media on copper", position: "50% 50%", alt: "Orange and black geometric artwork on a copper canvas beside a fireplace" },
    { file: "shop-star", badge: "Brass Canvas", name: "Airbrush mixed media on brass", position: "32% 50%", alt: "Red and gold star artwork on a brass canvas in a dark study" },
    { file: "shop-mirror", badge: "Laser Cut & Etched", name: "Airbrush mixed media on aluminum plate", position: "85% 50%", alt: "Colorful geometric artwork on an aluminum canvas overlooking the sea" },
  ];
  const STORE_START = 2;

  const WORKS = [
    {
      id: "redeemerforge", side: "left",
      kicker: "Youth programme · Jacksonville",
      name: `${spark}<span>Redeemer<em>Forge</em></span>`,
      summary: "A faith-based youth programme in Jacksonville.",
      lead: "Connection over isolation.",
      text: "Cooperative play and hands-on building that pull youth together instead of leaving them alone with a screen, in a Christian framework of respect, encouragement, and responsibility.",
      link: ["Visit redeemerforge.com", "https://redeemerforge.com"],
      picture: `<div class="ow-pic ow-rf"><span class="ow-rf-logo">${spark}<span>Redeemer<b>Forge</b></span></span>
        <img src="img/redeemerforge-pillars-tight.png" width="1269" height="369" alt="">
        <img src="img/redeemerforge-group-tight.png" width="1083" height="447" alt=""></div>`,
    },
    {
      id: "churchfamily", side: "right",
      kicker: "Church members helping one another",
      name: `<span class="ow-cc-badge ow-name-badge">${heart}</span><span>ChurchFamily</span>`,
      summary: "Church members staying connected, so they can love and help one another.",
      lead: "Love your neighbor, starting in your own church.",
      text: "Members share what they need, a ride, a meal, childcare, a hand with repairs, and fellow members answer. Only verified members of the church take part.",
      link: ["Visit churchfamily.io", "https://churchfamily.io"],
      picture: `<div class="ow-pic ow-cc"><span class="ow-cc-logo"><span class="ow-cc-badge">${heart}</span>ChurchFamily</span>${tableArch()}</div>`,
    },
    {
      id: "cypherpunknft", side: "left",
      kicker: "Art studio · Jacksonville",
      name: "<span>CypherPunk<em>NFT</em></span>",
      summary: "His art studio: digital compositions, mixed-media originals, art prints and works on metal.",
      lead: "Digital & physical crypto art.",
      text: "Glitch and geometric compositions, scientific imagery and photography, carried into airbrush, epoxy resin and aerospace metal.",
      link: ["Visit CypherPunkNFT", "#"], // the domain is not settled yet
      picture: `<div class="ow-pic ow-cp">
        <span class="ow-cp-logo" role="img" aria-label="CypherPunk NFT">${["line", "stacked"].map((shape) =>
          `<svg class="ow-cp-${shape}" viewBox="${CP_WORDMARK[shape].viewBox}" aria-hidden="true"><path d="${CP_WORDMARK[shape].d}" fill="currentColor"/></svg>`).join("")}</span>
        <figure class="ow-cp-room" aria-roledescription="carousel" aria-label="Works on metal from the store">
          <div class="ow-cp-slides">${STORE.map((piece, index) => `<img src="img/${piece.file}.png" width="1000" height="666" alt="${piece.alt}"
            style="object-position: ${piece.position}${piece.flip ? "; transform: scaleX(-1)" : ""}"${index === STORE_START ? ' class="is-on"' : ""} loading="lazy">`).join("")}</div>
          <figcaption><span class="ow-cp-badge">${STORE[STORE_START].badge}</span><span class="ow-cp-what">${STORE[STORE_START].name}</span></figcaption>
          <div class="ow-cp-dots">${STORE.map((piece, index) => `<button type="button" aria-label="Show ${piece.badge}"${index === STORE_START ? ' aria-current="true"' : ""}><span></span></button>`).join("")}</div>
        </figure></div>`,
    },
  ];

  const band = (work) => {
    const external = work.link[1].startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<article class="ow-band ow-band-${work.side}" id="${work.id}">
      ${work.picture}
      <div class="ow-copy">
        <p class="ow-kicker">${work.kicker}</p>
        <h2><a class="ow-name" href="${work.link[1]}"${external}>${work.name}<span class="ow-name-arrow">${icon("arrowUp", 18)}</span></a></h2>
        <p class="ow-summary">${work.summary}</p>
        <p class="ow-lead">${work.lead}</p>
        <p class="ow-text">${work.text}</p>
        <a class="ow-link" href="${work.link[1]}"${external}>${work.link[0]}${icon("arrowUp", 13)}</a>
      </div>
    </article>`;
  };

  main.insertAdjacentHTML("beforeend", `<div class="ow">
    <p class="ss-crumbs ow-crumbs"><a href="../merged/#mg-letter">${icon("arrowLeft", 13)}Back to the letter</a></p>
    <header class="ow-head">
      <p class="ow-kicker">${ABOUT.name} · other work</p>
      <h1>The rest of<em>the work.</em></h1>
      <p>Besides Bible Project, ${ABOUT.first} builds and leads these: a youth programme, a way for a church to care for its own, and his art.</p>
    </header>
    ${WORKS.map(band).join("")}
  </div>`);

  // The store dots: each shows its picture and caption; nothing turns on its own.
  const room = main.querySelector(".ow-cp-room");
  const dots = [...room.querySelectorAll(".ow-cp-dots button")];
  dots.forEach((dot, index) => dot.addEventListener("click", () => {
    room.querySelectorAll(".ow-cp-slides img").forEach((slide, i) => slide.classList.toggle("is-on", i === index));
    dots.forEach((other, i) => other.toggleAttribute("aria-current", i === index));
    room.querySelector(".ow-cp-badge").textContent = STORE[index].badge;
    room.querySelector(".ow-cp-what").textContent = STORE[index].name;
  }));
})();
