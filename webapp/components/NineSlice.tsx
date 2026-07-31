/**
 * Renders a 9-slice texture using background-image divs instead of border-image.
 * Chrome ignores `image-rendering: pixelated` on border-image but respects it on
 * background-image, so this gives crisp pixel-perfect rendering at any editor zoom.
 */
export function NineSlice({
  src, srcW, srcH,
  sTop, sRight = sTop, sBottom = sTop, sLeft = sRight,
  dTop, dRight = dTop, dBottom = dTop, dLeft = dRight,
  width, height, overflow = "hidden", children, style,
}: {
  src: string; srcW: number; srcH: number;
  /** Source pixel slices (the CSS border-image slice values) */
  sTop: number; sRight?: number; sBottom?: number; sLeft?: number;
  /** Destination CSS pixel widths for each border zone (already scaled) */
  dTop: number; dRight?: number; dBottom?: number; dLeft?: number;
  width: number; height: number;
  overflow?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const dCW = width - dLeft - dRight;
  const dCH = height - dTop - dBottom;
  const sCW = srcW - sLeft - sRight;
  const sCH = srcH - sTop - sBottom;

  function cell(
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number,
  ) {
    if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) return null;
    // Scale the entire source image so the [sx,sy,sw,sh] region fills the [dw,dh] cell.
    const bsW = Math.round(srcW * (dw / sw));
    const bsH = Math.round(srcH * (dh / sh));
    // Use Math.floor for the background offsets (they're negative). Math.round can
    // round toward the origin which causes the cell to start at source pixel sx-1
    // (a 1px border bleed). Math.floor always rounds away from origin, guaranteeing
    // the cell starts exactly at source pixel sx.
    const bpX = Math.floor(-(sx * (dw / sw)));
    const bpY = Math.floor(-(sy * (dh / sh)));
    // Round cell edges to integers and derive size from edge pair so adjacent cells
    // share an exact integer boundary — no sub-pixel gap between cells.
    const rdx = Math.round(dx), rdy = Math.round(dy);
    const rdx2 = Math.round(dx + dw), rdy2 = Math.round(dy + dh);
    return (
      <div key={`${sx},${sy}`} style={{
        position: "absolute",
        left: rdx, top: rdy, width: rdx2 - rdx, height: rdy2 - rdy,
        backgroundImage: `url("${src}")`,
        backgroundSize: `${bsW}px ${bsH}px`,
        backgroundPosition: `${bpX}px ${bpY}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }} />
    );
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, overflow, ...style }}>
      {/* Top row */}
      {cell(0,             0,    sLeft, sTop,  0,             0,    dLeft, dTop)}
      {cell(sLeft,         0,    sCW,   sTop,  dLeft,         0,    dCW,   dTop)}
      {cell(srcW - sRight, 0,    sRight, sTop, width - dRight, 0,   dRight, dTop)}
      {/* Middle row */}
      {cell(0,             sTop, sLeft, sCH,   0,             dTop, dLeft, dCH)}
      {cell(sLeft,         sTop, sCW,   sCH,   dLeft,         dTop, dCW,   dCH)}
      {cell(srcW - sRight, sTop, sRight, sCH,  width - dRight, dTop, dRight, dCH)}
      {/* Bottom row (skipped when sBottom === 0) */}
      {sBottom > 0 && cell(0,             srcH - sBottom, sLeft,  sBottom, 0,             height - dBottom, dLeft,  dBottom)}
      {sBottom > 0 && cell(sLeft,         srcH - sBottom, sCW,    sBottom, dLeft,         height - dBottom, dCW,    dBottom)}
      {sBottom > 0 && cell(srcW - sRight, srcH - sBottom, sRight, sBottom, width - dRight, height - dBottom, dRight, dBottom)}
      {children != null && (
        <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      )}
    </div>
  );
}
