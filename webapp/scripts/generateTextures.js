#!/usr/bin/env node
// Generates original placeholder 9-slice sprites for the MC UI builder.
// Colors are deliberately ugly so they're visually distinct from any MC asset.
// These are 100% original works — no Minecraft pixels were sampled.
//
// Zone palette (used for future MC-preset recoloring):
//   OUTER_BORDER  #FF00FF  magenta
//   INNER_LIGHT   #FFFF00  yellow   (highlight edge, top-left of bevel)
//   INNER_DARK    #FF8800  orange   (shadow edge, bottom-right of bevel)
//   FILL          #00FF88  mint     (center fill)
//   TRANSPARENT   #00000000

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ── CRC32 (standard PNG requirement) ────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG encoder ──────────────────────────────────────────────────────────────
function encodePNG(width, height, rgba) {
  // rgba: flat Uint8Array [r,g,b,a, r,g,b,a, ...] row-major

  // Raw scanlines with filter byte 0 (None) prepended to each row
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (width * 4 + 1) + 1 + x * 4;
      raw[dst]     = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      raw[dst + 3] = rgba[src + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  function chunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, "ascii");
    const payload = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(payload));
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Color constants ──────────────────────────────────────────────────────────
const T  = [0,   0,   0,   0  ]; // transparent
const OB = [255, 0,   255, 255]; // outer border — magenta
const IL = [255, 255, 0,   255]; // inner light  — yellow
const ID = [255, 136, 0,   255]; // inner dark   — orange
const FL = [0,   255, 136, 255]; // fill          — mint

// ── Sprite definitions (pixel grids) ─────────────────────────────────────────

// Panel: 7×7, 3-px slice. Chamfered (staircase) transparent corners with a
// diagonal highlight/shadow bevel wedge running through the interior.
//
//   T  T  OB OB T  T  T
//   T  OB IL IL OB T  T
//   OB IL IL IL FL OB T
//   OB IL IL FL ID ID OB
//   T  OB FL ID ID ID OB
//   T  T  OB ID ID OB T
//   T  T  T  OB OB T  T
const PANEL = [
  T,  T,  OB, OB, T,  T,  T,
  T,  OB, IL, IL, OB, T,  T,
  OB, IL, IL, IL, FL, OB, T,
  OB, IL, IL, FL, ID, ID, OB,
  T,  OB, FL, ID, ID, ID, OB,
  T,  T,  OB, ID, ID, OB, T,
  T,  T,  T,  OB, OB, T,  T,
];

// Button normal: 5×5, 2-px slice. Diagonal highlight/shadow bevel wedge
// through the 3×3 interior (measured from the real widget's diagonal bevel).
//
//   OB OB OB OB OB
//   OB IL IL FL OB
//   OB IL FL ID OB
//   OB FL ID ID OB
//   OB OB OB OB OB
const BTN_N = [
  OB, OB, OB, OB, OB,
  OB, IL, IL, FL, OB,
  OB, IL, FL, ID, OB,
  OB, FL, ID, ID, OB,
  OB, OB, OB, OB, OB,
];

// Button hover: same diagonal bevel wedge, distinct border/fill zone colors
const BH = [255, 64,  0, 255]; // burnt orange — hover border
const HF = [255, 200, 0, 255]; // golden       — hover fill
const BTN_H = [
  BH, BH, BH, BH, BH,
  BH, IL, IL, HF, BH,
  BH, IL, HF, ID, BH,
  BH, HF, ID, ID, BH,
  BH, BH, BH, BH, BH,
];

// Slider track: 5×5, recessed look — dark fill, cyan border
const CB = [0, 220, 255, 255]; // cyan border
const CF = [0, 80, 120, 255];  // dark teal fill
const TRACK = [
  CB, CB, CB, CB, CB,
  CB, CF, CF, CF, CB,
  CB, CF, CF, CF, CB,
  CB, CF, CF, CF, CB,
  CB, CB, CB, CB, CB,
];

// Slider handle: 5×5, raised — same diagonal bevel wedge as the button
// (real MC handle has a highlight/shadow bevel too, not a flat fill)
const HANDLE = [
  OB, OB, OB, OB, OB,
  OB, IL, IL, FL, OB,
  OB, IL, FL, ID, OB,
  OB, FL, ID, ID, OB,
  OB, OB, OB, OB, OB,
];

// Slot tile: 18×18, recessed inventory slot — dark top+left edge, light
// bottom+right edge, flat fill. Tiles seamlessly for slot grids.
const SLOT_TILE = (() => {
  const w = 18, h = 18;
  const grid = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0) grid.push(ID);
      else if (x === w - 1 || y === h - 1) grid.push(IL);
      else grid.push(FL);
    }
  }
  return grid;
})();

// Scrollbar handle: 12×15, raised — outer + inner bevel ring, alternating
// horizontal stripe fill (matches the real widget's striped interior).
const SA = [0,   255, 255, 255]; // stripe A — aqua
const SB = [255, 0,   200, 255]; // stripe B — magenta-pink
const SCROLLBAR_HANDLE = (() => {
  const w = 12, h = 15;
  const grid = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0) grid.push(IL);
      else if (x === w - 1 || y === h - 1) grid.push(ID);
      else if (x === 1 || y === 1) grid.push(SA);
      else if (x === w - 2 || y === h - 2) grid.push(SB);
      else grid.push((y - 2) % 2 === 0 ? SA : SB);
    }
  }
  return grid;
})();

// ── Write files ───────────────────────────────────────────────────────────────
function gridToRGBA(grid) {
  const buf = new Uint8Array(grid.length * 4);
  for (let i = 0; i < grid.length; i++) {
    buf[i * 4]     = grid[i][0];
    buf[i * 4 + 1] = grid[i][1];
    buf[i * 4 + 2] = grid[i][2];
    buf[i * 4 + 3] = grid[i][3];
  }
  return buf;
}

const OUT = path.join(__dirname, "../public/textures");
fs.mkdirSync(OUT, { recursive: true });

const sprites = [
  { name: "mc_panel_slice.png",        width: 7, height: 7, grid: PANEL  },
  { name: "mc_button_normal.png",      width: 5, height: 5, grid: BTN_N  },
  { name: "mc_button_hover.png",       width: 5, height: 5, grid: BTN_H  },
  { name: "mc_slider_track_slice.png", width: 5, height: 5, grid: TRACK  },
  { name: "mc_slider_handle_slice.png",width: 5, height: 5, grid: HANDLE },
  { name: "mc_slot_tile.png",          width: 18, height: 18, grid: SLOT_TILE },
  { name: "mc_scrollbar_handle.png",   width: 12, height: 15, grid: SCROLLBAR_HANDLE },
];

for (const { name, width, height, grid } of sprites) {
  const png = encodePNG(width, height, gridToRGBA(grid));
  fs.writeFileSync(path.join(OUT, name), png);
  console.log(`wrote ${name} (${width}×${height})`);
}
console.log("done");
