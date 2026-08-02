#!/usr/bin/env node
/**
 * Generates synthetic, 100%-original placeholder textures for tests.
 * No Minecraft/Mojang pixels are sampled — these are original works using a
 * deliberately garish palette so pixel-diff snapshots make border/bevel bugs
 * (like border-image ignoring `image-rendering: pixelated`) obvious.
 *
 * Zone palette:
 *   OUTER_DARK   #202020  near-black  (outer 1px ring / shadow edge)
 *   INNER_LIGHT  #FFFFFF  white      (highlight edge)
 *   INNER_DARK   #FF2A2A  red        (shadow edge, opposite of highlight)
 *   FILL         #2ADE6B  green      (center fill)
 *   ACCENT_A     #2A6BFF  blue       (secondary fill / stripe A)
 *   ACCENT_B     #FFD42A  yellow     (secondary fill / stripe B)
 *
 * Run: node tests/fixtures/generate-textures.mjs
 */

import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "textures");

// ── CRC32 ────────────────────────────────────────────────────────────────────
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

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (width * 4 + 1) + 1 + x * 4;
      raw[dst] = rgba[src];
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
    return Buffer.concat([lenBuf, payload, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function gridToRGBA(grid) {
  const buf = new Uint8Array(grid.length * 4);
  for (let i = 0; i < grid.length; i++) {
    buf[i * 4] = grid[i][0];
    buf[i * 4 + 1] = grid[i][1];
    buf[i * 4 + 2] = grid[i][2];
    buf[i * 4 + 3] = grid[i][3];
  }
  return buf;
}

// ── Palette ──────────────────────────────────────────────────────────────────
const OD = [0x20, 0x20, 0x20, 255]; // outer dark
const IL = [0xff, 0xff, 0xff, 255]; // inner light
const ID = [0xff, 0x2a, 0x2a, 255]; // inner dark
const FL = [0x2a, 0xde, 0x6b, 255]; // fill
const AA = [0x2a, 0x6b, 0xff, 255]; // accent A
const AB = [0xff, 0xd4, 0x2a, 255]; // accent B

// Explicit bevel: ring 0 = outer dark, ring 1..slice-1 = light (top-left
// side) / dark (bottom-right side), center = fill. Deterministic and legible.
function slotLikeGrid(w, h, slice, fill = FL) {
  const grid = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const onOuter = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      if (onOuter) { grid.push(OD); continue; }
      const inTL = x < slice || y < slice;
      const inBR = x >= w - slice || y >= h - slice;
      if (inTL && !inBR) grid.push(IL);
      else if (inBR) grid.push(ID);
      else grid.push(fill);
    }
  }
  return grid;
}

// Raised bevel (opposite of recessed slot): light top/left, dark bottom/right —
// used for the scrollbar handle knob.
function raisedGrid(w, h) {
  const grid = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0) grid.push(IL);
      else if (x === w - 1 || y === h - 1) grid.push(OD);
      else if (x === 1 || y === 1) grid.push(AA);
      else if (x === w - 2 || y === h - 2) grid.push(AB);
      else grid.push((y - 2) % 2 === 0 ? AA : AB);
    }
  }
  return grid;
}

// Flat 9-slice sprite (fixed border ring, uniform fill, used for
// buttons/sliders/panels which don't need the raised/recessed distinction).
function flatSliceGrid(w, h, slice, fill = FL) {
  const grid = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.min(x, y, w - 1 - x, h - 1 - y);
      grid.push(d < slice ? OD : fill);
    }
  }
  return grid;
}

// Tab sprite (28×32, matches the real advancements sprite dims): border slice
// top=4 right=3 bottom=0 left=4. `active` swaps fill color so selected vs.
// unselected are visually distinct in snapshots.
function tabGrid(w, h, active) {
  const top = 4, right = 3, left = 4;
  const fill = active ? AA : FL;
  const grid = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inTop = y < top;
      const inLeft = x < left;
      const inRight = x >= w - right;
      if (inTop || inLeft || inRight) grid.push(OD);
      else grid.push(fill);
    }
  }
  return grid;
}

function checkboxGrid(size, checked, highlighted) {
  const fill = checked ? AB : (highlighted ? AA : FL);
  return slotLikeGrid(size, size, 2, fill);
}

const OUT_TASKS = [
  { name: "mc_panel_slice.png", w: 7, h: 7, grid: flatSliceGrid(7, 7, 3) },
  { name: "mc_button_normal.png", w: 5, h: 5, grid: flatSliceGrid(5, 5, 2, FL) },
  { name: "mc_button_hover.png", w: 5, h: 5, grid: flatSliceGrid(5, 5, 2, AA) },
  { name: "mc_slider_track_slice.png", w: 5, h: 5, grid: flatSliceGrid(5, 5, 2, FL) },
  { name: "mc_slider_handle_slice.png", w: 5, h: 5, grid: flatSliceGrid(5, 5, 2, AB) },
  // 18×18 slot tile with a real 1px bevel — this exact shape caused the
  // border-image + `image-rendering: pixelated` regression, so keep it real.
  { name: "mc_slot_tile.png", w: 18, h: 18, grid: slotLikeGrid(18, 18, 2, FL) },
  { name: "mc_scrollbar_handle.png", w: 12, h: 15, grid: raisedGrid(12, 15) },
  { name: "mc_checkbox.png", w: 20, h: 20, grid: checkboxGrid(20, false, false) },
  { name: "mc_checkbox_selected.png", w: 20, h: 20, grid: checkboxGrid(20, true, false) },
  { name: "mc_checkbox_highlighted.png", w: 20, h: 20, grid: checkboxGrid(20, false, true) },
  { name: "mc_checkbox_selected_highlighted.png", w: 20, h: 20, grid: checkboxGrid(20, true, true) },
  { name: "tab_selected_left.png", w: 28, h: 32, grid: tabGrid(28, 32, true) },
  { name: "tab_selected_middle.png", w: 28, h: 32, grid: tabGrid(28, 32, true) },
  { name: "tab_selected_right.png", w: 28, h: 32, grid: tabGrid(28, 32, true) },
  { name: "tab_unselected_left.png", w: 28, h: 32, grid: tabGrid(28, 32, false) },
  { name: "tab_unselected_middle.png", w: 28, h: 32, grid: tabGrid(28, 32, false) },
  { name: "tab_unselected_right.png", w: 28, h: 32, grid: tabGrid(28, 32, false) },
];

fs.mkdirSync(OUT, { recursive: true });
for (const { name, w, h, grid } of OUT_TASKS) {
  const png = encodePNG(w, h, gridToRGBA(grid));
  fs.writeFileSync(path.join(OUT, name), png);
  console.log(`wrote ${name} (${w}×${h})`);
}
console.log("done");
