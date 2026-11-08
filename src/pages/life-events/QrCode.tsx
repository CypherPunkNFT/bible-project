// Draws the squares qr.ts made, as SVG: crisp at any print size, no image and no network.

export function QrCode({ modules, label }: { modules: { size: number; path: string }; label: string }) {
  const quiet = 2;
  const box = modules.size + quiet * 2;
  return (
    <svg className="le-qr" viewBox={`${-quiet} ${-quiet} ${box} ${box}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <path d={modules.path} fill="#1f1b16" />
    </svg>
  );
}
