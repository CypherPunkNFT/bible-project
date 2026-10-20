// ChurchFamily's home-page drawing, copied from its TableArch.tsx (ChurchFamily/src/components/lineart/): an open arch
// over a shared table (bread, grapes, cup and jug) under a hanging lamp, with an olive branch at each foot.
const LEAVES: [number, number, number][] = [[-1, -22, -152], [0, -40, -28], [1, -62, -158], [4, -84, -24], [8, -106, -150], [13, -127, -34], [19, -148, -118], [24, -160, -70]];
const GRAPES: [number, number][] = [[224, 425], [232, 425], [228, 418], [236, 418], [232, 411], [240, 425]];

function Olive({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path d="M0 0C-5-52 6-112 24-162" />
      {LEAVES.map(([x, y, angle]) => (
        <g key={`${x}${y}`} transform={`translate(${x} ${y}) rotate(${angle})`}>
          <path d="M0 0C6-4 18-4.5 27 0C18 4.5 6 4 0 0Z" /><path d="M2 0H24" opacity=".45" />
        </g>
      ))}
      <ellipse cx="-9" cy="-50" rx="3" ry="4.4" transform="rotate(-20 -9 -50)" /><ellipse cx="15" cy="-96" rx="3" ry="4.4" transform="rotate(25 15 -96)" />
      <path d="M-2-46L-8-46M10-92L14-92" opacity=".6" />
    </g>
  );
}

export function TableArch() {
  return (
    <svg className="ow-cc-art" viewBox="-20 0 500 600" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M230 8L233 25L250 28L233 31L230 48L227 31L210 28L227 25Z" /><path d="M223 21L237 35M237 21L223 35" opacity=".6" />
      <path d="M150 28H200M260 28H310" opacity=".5" /><circle cx="144" cy="28" r="2" /><circle cx="316" cy="28" r="2" />
      <path d="M40 590V250A190 190 0 0 1 420 250V590M56 590V250A174 174 0 0 1 404 250V590" /><path d="M86 590V262A144 144 0 0 1 374 262V590" opacity=".5" />
      <path d="M219 54H241L237 80H223Z" /><path d="M32 246H64M32 256H64M396 246H428M396 256H428" /><path d="M36 300V560M424 300V560" opacity=".35" />
      <path d="M230 80V132" opacity=".7" />
      <g transform="translate(230 196) scale(1.4) translate(-230 -126)">
        <path d="M230 80V100M230 100L214 126M230 100L246 126" opacity=".7" /><path d="M210 126H250C248 136 240 140 230 140C220 140 212 136 210 126ZM250 128L260 123L254 132" />
        <path className="ow-cc-flame" d="M259 120C255 114 259 108 259 103C262 109 264 114 259 120Z" /><path d="M259 96V90M249 102L244 98M269 102L274 98M247 112H241M271 112H277" opacity=".45" />
      </g>
      <path d="M100 430H360M104 438H356M100 430V438M360 430V438" /><path d="M124 438L118 540M133 438L128 540M336 438L342 540M327 438L332 540" /><path d="M126 500H334" opacity=".55" />
      <g transform="translate(230 430) scale(1.2) translate(-230 -430)">
        <path d="M156 430C156 403 214 403 214 430" /><path d="M170 418L177 426M183 412L190 422M197 413L203 422" opacity=".7" />
        {GRAPES.map(([cx, cy]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="3.6" />)}
        <path d="M233 407C235 401 239 399 245 399" />
        <path d="M252 384H286C286 404 277 412 269 412C261 412 252 404 252 384ZM269 412V422M256 430C258 422 280 422 282 430" /><path d="M256 390H282" opacity=".45" />
        <path d="M300 430C292 420 292 397 302 389L304 372H318L320 389C330 397 330 420 322 430M302 372H320M323 396C335 396 335 414 325 418" /><path d="M298 404H324" opacity=".45" />
      </g>
      <path d="M20 590H440" /><path d="M86 560H374M70 575H390" opacity=".35" /><path d="M150 560L140 575M230 560V575M310 560L320 575" opacity=".25" />
      <Olive transform="translate(22 590)" /><Olive transform="translate(438 590) scale(-1 1)" />
    </svg>
  );
}
